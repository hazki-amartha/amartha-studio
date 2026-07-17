'use client'

// Project-local module store. Screens remount on every go()/back(), so the
// things that must survive navigation live here: which tasks the BP has
// finished (drives which task is "now" on the schedule), and — per mitra — the
// two things a majelis visit records: attendance and payment.
//
// Payment is an AMOUNT, not a flag: a mitra can pay part of the instalment, so
// a boolean would lose the field's most common outcome.

import { useSyncExternalStore } from 'react'
import { PREPAID_MITRA, TASKS, type Mitra, type Task } from './data'

export type Attendance = 'hadir' | 'tidak'

/**
 * Where a mitra stands on this week's instalment.
 * - `belum`    — nothing recorded yet; the BP hasn't got to her.
 * - `sebagian` — paid part of it.
 * - `lunas`    — settled (or overpaid; the excess is marked later).
 * - `tidak`    — recorded as not paying, with a reason and maybe a PTP. This is
 *                an OUTCOME, not an absence of one: "she said no, here's why,
 *                here's when" is a result the BP can close and ops can chase.
 */
export type PaymentStatus = 'belum' | 'sebagian' | 'lunas' | 'tidak'

/** Why she isn't paying, and when she says she will. */
export interface NonPayment {
  reason: string
  /** Promise to pay. Null = no promise given; not every no has a next date. */
  ptp: string | null
}

/**
 * The outcome of a pitch. "Offered" alone is not an outcome — it records that
 * the BP spoke, which nobody downstream can act on. What the mitra said is the
 * part worth capturing, so step 2's action closes its own loop.
 */
export type OfferResult = 'tertarik' | 'tidak'

export interface AppState {
  /** Task ids the BP has completed today. */
  doneTasks: string[]
  /** mitraId → rupiah recorded this visit. Absent = nothing recorded yet. */
  payments: Record<string, number>
  /** mitraId → why she isn't paying. Absent = no such outcome recorded. */
  nonPayments: Record<string, NonPayment>
  /** mitraId → hadir/tidak. Absent = the BP hasn't marked them yet. */
  attendance: Record<string, Attendance>
  /** mitraId → what the mitra said. Absent = not pitched yet. */
  offerResults: Record<string, OfferResult>
  /** Which majelis the visit screen renders. */
  openMajelis: string
  /** Step 3 — whether the proof photo has been captured. Gates submission. */
  photo: boolean
}

// The 15 who settled before the visit opened: present, paid in full.
const seedPayments: Record<string, number> = {}
const seedAttendance: Record<string, Attendance> = {}
PREPAID_MITRA.forEach((m) => {
  seedPayments[m.id] = m.due
  seedAttendance[m.id] = 'hadir'
})

const initial: AppState = {
  doneTasks: [],
  payments: seedPayments,
  nonPayments: {},
  attendance: seedAttendance,
  offerResults: {},
  openMajelis: 'mawar',
  photo: false,
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

  openVisit(majelisId: string) {
    // A visit always starts at step 1 with no proof yet.
    store.set({ openMajelis: majelisId, photo: false })
  },
  setPhoto(photo: boolean) {
    store.set({ photo })
  },
  setAttendance(mitraId: string, value: Attendance) {
    store.set({ attendance: { ...state.attendance, [mitraId]: value } })
  },
  /**
   * Records the rupiah actually handed over — full, partial, or corrected.
   * Money clears any "tidak bayar" on file: she paid, so the reason she gave
   * for not paying is no longer true and must not linger.
   */
  setPayment(mitraId: string, amount: number) {
    const nonPayments = { ...state.nonPayments }
    delete nonPayments[mitraId]
    store.set({ payments: { ...state.payments, [mitraId]: amount }, nonPayments })
  },
  /** Records a no with its reason and, if given, when she promises to pay. */
  setNonPayment(mitraId: string, value: NonPayment) {
    store.set({ nonPayments: { ...state.nonPayments, [mitraId]: value } })
  },
  /** Records what the mitra said, not merely that she was asked. */
  setOfferResult(mitraId: string, result: OfferResult) {
    store.set({ offerResults: { ...state.offerResults, [mitraId]: result } })
  },
  finishTask(taskId: string) {
    if (state.doneTasks.includes(taskId)) return
    store.set({ doneTasks: [...state.doneTasks, taskId] })
  },
}

export function useApp(): AppState {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}

// --- Payment derivations ---------------------------------------------------

export const paidOf = (s: AppState, mitra: Mitra): number => s.payments[mitra.id] ?? 0

export const remainingOf = (s: AppState, mitra: Mitra): number =>
  Math.max(0, mitra.due - paidOf(s, mitra))

export function paymentStatus(s: AppState, mitra: Mitra): PaymentStatus {
  const paid = paidOf(s, mitra)
  // Money wins over a recorded no — setPayment clears the no, but read it in
  // the same order so the two can never disagree.
  if (paid > 0) return paid >= mitra.due ? 'lunas' : 'sebagian'
  return s.nonPayments[mitra.id] ? 'tidak' : 'belum'
}

/** The queue: anyone who still owes something, in roster order. */
// Step 1's job is to RECORD an outcome for every mitra, not to make everyone
// lunas. So the split is recorded / not recorded — grouping on `lunas` would
// strand a mitra recorded as "tidak bayar" (reason and PTP captured, work done)
// in the queue forever, and the page could never reach zero.

/** Nobody has touched her yet — the queue. */
export const pendingMembers = (s: AppState, members: Mitra[]): Mitra[] =>
  members.filter((m) => paymentStatus(s, m) === 'belum')

/** An outcome is on file: lunas, sebagian, or tidak bayar. */
export const recordedMembers = (s: AppState, members: Mitra[]): Mitra[] =>
  members.filter((m) => paymentStatus(s, m) !== 'belum')

// --- Schedule derivations --------------------------------------------------
// The schedule screen asks one question — "what do I do now?" — so the answer
// is computed here rather than assembled in the view.

/** The first task the BP hasn't finished. Undefined once the day is done. */
export const nowTask = (s: AppState): Task | undefined =>
  TASKS.find((t) => !s.doneTasks.includes(t.id))

/** Everything after the active task, in clock order. */
export const laterTasks = (s: AppState): Task[] => {
  const now = nowTask(s)
  if (!now) return []
  return TASKS.slice(TASKS.indexOf(now) + 1)
}

export const doneTasks = (s: AppState): Task[] => TASKS.filter((t) => s.doneTasks.includes(t.id))

/** The task that opens a given majelis — lets the visit screen close itself out. */
export const taskForMajelis = (majelisId: string): Task | undefined =>
  TASKS.find((t) => t.majelisId === majelisId)
