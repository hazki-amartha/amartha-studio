'use client'

// Project-local module store. Screens remount on every go()/back(), so anything
// that must survive navigation lives here — and in this direction that is nearly
// everything, because collecting from one mitra is a three-screen round trip
// (list → her page → collect → success → back to the list) rather than a bottom
// sheet that holds its own state.
//
// Payment is an AMOUNT, not a flag: a mitra can hand over part of what she owes,
// which is the outcome this whole direction is built to record properly.

import { useSyncExternalStore } from 'react'
import { MAJELIS, PREPAID, outstandingOf, type Mitra } from './data'

export type Attendance = 'hadir' | 'tidak'

/**
 * Where a mitra stands on this visit.
 * - `belum`    — nothing recorded; the BP hasn't reached her.
 * - `sebagian` — she paid part of what she owes.
 * - `lunas`    — everything outstanding is settled.
 * - `tidak`    — recorded as not paying, with a reason and maybe a promise. An
 *                OUTCOME, not the absence of one: "she said no, here's why,
 *                here's when" is a result the BP can close and ops can chase.
 */
export type CollectStatus = 'belum' | 'sebagian' | 'lunas' | 'tidak'

/** Why she isn't paying, and when she says she will. */
export interface NonPayment {
  reason: string
  /** Promise to pay. Null = none given; not every no comes with a next date. */
  ptp: string | null
}

/** What the mitra said to a growth offer. */
export type GrowthResult = 'ya' | 'tidak'

/**
 * What the success screen reads back. It is written at the moment of collection
 * rather than recomputed on arrival, because by then the store has already
 * absorbed the payment and "sisa sebelum ini" would no longer be recoverable.
 */
export interface LastCollect {
  mitraId: string
  /** What she owed when the BP opened the page. */
  owed: number
  /** What she just handed over. */
  paid: number
}

export interface AppState {
  /** mitraId → hadir/tidak. Absent = not marked yet. */
  attendance: Record<string, Attendance>
  /** mitraId → rupiah collected this visit. Absent = nothing recorded. */
  payments: Record<string, number>
  /** mitraId → why she isn't paying. Absent = no such outcome recorded. */
  nonPayments: Record<string, NonPayment>
  /** mitraId → what she said to her growth offer. Absent = not pitched. */
  growthResults: Record<string, GrowthResult>
  /** Which mitra the mitra page and collect page render. */
  openMitra: string
  /** The receipt the success screen prints. Null before any collection. */
  lastCollect: LastCollect | null
  /** Proof photo captured. Gates submission. */
  photo: boolean
  /**
   * Location recorded. Gates submission alongside the photo: a photo proves
   * something happened, a location proves it happened HERE, and only the pair
   * makes a visit verifiable after the fact.
   */
  geo: boolean
}

// The 15 who settled before the visit opened: present, and paid in full.
const seedPayments: Record<string, number> = {}
const seedAttendance: Record<string, Attendance> = {}
PREPAID.forEach((m) => {
  seedPayments[m.id] = outstandingOf(m).total
  seedAttendance[m.id] = 'hadir'
})

const initial: AppState = {
  attendance: seedAttendance,
  payments: seedPayments,
  nonPayments: {},
  growthResults: {},
  openMitra: 'm1',
  lastCollect: null,
  photo: false,
  geo: false,
}

let state: AppState = initial

const listeners = new Set<() => void>()

function emit() {
  // forEach (not for..of) — the repo's tsconfig target predates Set iteration.
  listeners.forEach((l) => l())
}

export const store = {
  get: () => state,
  set(patch: Partial<AppState>) {
    state = { ...state, ...patch }
    emit()
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  /** Starts the visit over — the roster's "Mulai Pelayanan". */
  startVisit() {
    store.set({
      attendance: seedAttendance,
      payments: seedPayments,
      nonPayments: {},
      growthResults: {},
      lastCollect: null,
      photo: false,
      geo: false,
    })
  },
  openMitraPage(mitraId: string) {
    store.set({ openMitra: mitraId })
  },
  setAttendance(mitraId: string, value: Attendance) {
    store.set({ attendance: { ...state.attendance, [mitraId]: value } })
  },
  /**
   * Records the rupiah actually handed over. Money clears any "tidak bayar" on
   * file: she paid, so the reason she gave for not paying is no longer true and
   * must not linger under her name in the recap.
   */
  collect(mitra: Mitra, amount: number) {
    const nonPayments = { ...state.nonPayments }
    delete nonPayments[mitra.id]
    store.set({
      payments: { ...state.payments, [mitra.id]: amount },
      nonPayments,
      lastCollect: { mitraId: mitra.id, owed: outstandingOf(mitra).total, paid: amount },
    })
  },
  /** Records a no with its reason and, if given, when she promises to pay. */
  setNonPayment(mitra: Mitra, value: NonPayment) {
    // A refusal and a payment are mutually exclusive outcomes, so recording one
    // has to retract the other — otherwise correcting a mis-tapped payment would
    // leave the money on file under a mitra the recap lists as refusing.
    const payments = { ...state.payments }
    delete payments[mitra.id]
    store.set({
      payments,
      nonPayments: { ...state.nonPayments, [mitra.id]: value },
      lastCollect: null,
    })
  },
  /** Records what the mitra said to an offer, not merely that she was asked. */
  setGrowthResult(mitraId: string, result: GrowthResult) {
    store.set({ growthResults: { ...state.growthResults, [mitraId]: result } })
  },
  setPhoto(photo: boolean) {
    store.set({ photo })
  },
  setGeo(geo: boolean) {
    store.set({ geo })
  },
}

export function useApp(): AppState {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}

// --- Derivations -----------------------------------------------------------

export const paidOf = (s: AppState, mitra: Mitra): number => s.payments[mitra.id] ?? 0

export const remainingOf = (s: AppState, mitra: Mitra): number =>
  Math.max(0, outstandingOf(mitra).total - paidOf(s, mitra))

export function collectStatus(s: AppState, mitra: Mitra): CollectStatus {
  const paid = paidOf(s, mitra)
  // Money wins over a recorded no — `collect` clears the no, but read it in the
  // same order so the two can never disagree.
  if (paid > 0) return paid >= outstandingOf(mitra).total ? 'lunas' : 'sebagian'
  return s.nonPayments[mitra.id] ? 'tidak' : 'belum'
}

// --- Stage 1: attendance ---------------------------------------------------

export const markedCount = (s: AppState): number =>
  MAJELIS.members.filter((m) => s.attendance[m.id]).length

export const presentCount = (s: AppState): number =>
  MAJELIS.members.filter((m) => s.attendance[m.id] === 'hadir').length

/**
 * The gate. Collection does not open until every mitra has been marked one way
 * or the other — the reference direction is explicit that attendance is
 * completed first, and a half-marked register is the thing that makes a majelis
 * record unauditable later.
 */
export const attendanceComplete = (s: AppState): boolean =>
  markedCount(s) === MAJELIS.members.length

// --- Stage 2: collection ---------------------------------------------------

/** Nobody has recorded an outcome for her yet — the queue. */
export const pendingMembers = (s: AppState): Mitra[] =>
  MAJELIS.members.filter((m) => collectStatus(s, m) === 'belum')

/** An outcome is on file: lunas, sebagian, or tidak bayar. */
export const recordedMembers = (s: AppState): Mitra[] =>
  MAJELIS.members.filter((m) => collectStatus(s, m) !== 'belum')

/** Everything owed across the majelis this visit. */
export const billableTotal = (): number =>
  MAJELIS.members.reduce((sum, m) => sum + outstandingOf(m).total, 0)

/** Everything actually collected so far. */
export const collectedTotal = (s: AppState): number =>
  MAJELIS.members.reduce((sum, m) => sum + paidOf(s, m), 0)

// --- Stage 3: growth -------------------------------------------------------

export const growthDoneCount = (s: AppState): number =>
  Object.keys(s.growthResults).length
