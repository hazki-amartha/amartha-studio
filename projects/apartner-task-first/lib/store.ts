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
 * Who the BP actually spoke to at the door.
 * - `mitra`  — the borrower herself.
 * - `pj`     — family or the penanggung jawab. Money and promises still count;
 *              only who handed them over differs, which is why this is a tag on
 *              the same outcome rather than a separate branch of questions.
 * - `nobody` — no one. No payment is possible, so the only outcome is a reason
 *              and a date to come back.
 */
export type MetWith = 'mitra' | 'pj' | 'nobody'

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
  /**
   * mitraId → who actually answered the door. A home visit's first fact, and
   * the one question that replaces three nested ones (met mitra? → met PJ? →
   * met neighbour?): they are all asking who the BP talked to, so it is asked
   * once with three answers instead of three times with two.
   */
  metWith: Record<string, MetWith>
  /** mitraId → Peldis submitted to the BM. The one offer a home visit makes. */
  peldis: string[]
  /** mitraId → what the mitra said. Absent = not pitched yet. */
  offerResults: Record<string, OfferResult>
  /** Which majelis the visit screen renders. */
  openMajelis: string
  /** Which home-visit task the home-visit screens render (a Task id). */
  openHome: string
  /** Which mitra the mitra page renders (a Mitra id). */
  openMitra: string
  /**
   * mitraId → action ids the BP has taken from the mitra page. Taking a
   * follow-up is a RECORD, not a navigation, so it has to survive leaving the
   * page — otherwise the BP re-reads the same recommendation on every visit and
   * cannot tell what she already did about it.
   */
  followUps: Record<string, string[]>
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
  metWith: {},
  peldis: [],
  offerResults: {},
  openMajelis: 'mawar',
  openHome: 't3',
  openMitra: 'm1',
  followUps: {},
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
  openHomeVisit(taskId: string) {
    // Same contract as a majelis visit: start at step 1 with no proof yet.
    store.set({ openHome: taskId, photo: false })
  },
  /** Opens the mitra page on one borrower, from whichever screen asked. */
  openMitraPage(mitraId: string) {
    store.set({ openMitra: mitraId })
  },
  /** Records that the BP acted on a recommendation. Idempotent. */
  addFollowUp(mitraId: string, actionId: string) {
    const taken = state.followUps[mitraId] ?? []
    if (taken.includes(actionId)) return
    store.set({ followUps: { ...state.followUps, [mitraId]: [...taken, actionId] } })
  },
  setPhoto(photo: boolean) {
    store.set({ photo })
  },
  /** Who answered the door. Choosing "nobody" clears any payment on file —
   *  you cannot have collected from someone you did not meet. */
  setMetWith(mitraId: string, value: MetWith) {
    if (value !== 'nobody') {
      store.set({ metWith: { ...state.metWith, [mitraId]: value } })
      return
    }
    const payments = { ...state.payments }
    delete payments[mitraId]
    store.set({ metWith: { ...state.metWith, [mitraId]: value }, payments })
  },
  /** Peldis submitted to the BM — a settlement route, not a sale. */
  submitPeldis(mitraId: string) {
    if (state.peldis.includes(mitraId)) return
    store.set({ peldis: [...state.peldis, mitraId] })
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
