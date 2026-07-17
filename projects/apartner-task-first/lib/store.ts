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

/** Where a mitra stands on this week's instalment. */
export type PaymentStatus = 'belum' | 'sebagian' | 'lunas'

export interface AppState {
  /** Task ids the BP has completed today. */
  doneTasks: string[]
  /** mitraId → rupiah recorded this visit. Absent = nothing recorded yet. */
  payments: Record<string, number>
  /** mitraId → hadir/tidak. Absent = the BP hasn't marked them yet. */
  attendance: Record<string, Attendance>
  /** Mitra ids the BP has already pitched to on this visit. */
  offered: string[]
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
  attendance: seedAttendance,
  offered: [],
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
  /** Records the rupiah actually handed over — full, partial, or corrected. */
  setPayment(mitraId: string, amount: number) {
    store.set({ payments: { ...state.payments, [mitraId]: amount } })
  },
  markOffered(mitraId: string) {
    if (state.offered.includes(mitraId)) return
    store.set({ offered: [...state.offered, mitraId] })
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
  if (paid <= 0) return 'belum'
  return paid >= mitra.due ? 'lunas' : 'sebagian'
}

/** The queue: anyone who still owes something, in roster order. */
export const outstandingMembers = (s: AppState, members: Mitra[]): Mitra[] =>
  members.filter((m) => paymentStatus(s, m) !== 'lunas')

export const settledMembers = (s: AppState, members: Mitra[]): Mitra[] =>
  members.filter((m) => paymentStatus(s, m) === 'lunas')

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
