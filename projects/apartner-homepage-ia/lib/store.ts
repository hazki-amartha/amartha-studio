'use client'

// Project-local store. The platform runtime remounts a screen on every
// navigation, so anything that must survive a go()/back() lives here rather
// than in component state: notification/comms read state, the KPI deep-link
// task filter, which majelis/mitra/comm a detail screen is showing, and which
// task is driving the active Kunjungan Rumah flow.
//
// This mirrors the useState pile in the source draft's <App> shell — that shell
// held tabs + overlays in one tree, whereas here each screen stands alone.
// Ephemeral, screen-local state (period pickers, in-progress form drafts) stays
// as plain useState in the screen that owns it — it's meant to reset on remount.

import { useSyncExternalStore } from 'react'
import {
  COMMS_SEED,
  MAJELIS,
  MITRA,
  NOTIFS_SEED,
  TASKS,
  mitraLoanInfo,
  type Comm,
  type KindFilter,
  type MetricKey,
  type Mitra,
  type Notif,
  type Task,
  type TaskType,
  type WhenFilter,
} from './data'

// --- Visit records ---------------------------------------------------------
// The Majelis-visit and Home-visit flows are multi-screen, and the platform
// remounts a screen on every navigation, so what a visit records has to live
// here rather than in a screen's useState.

export type Attendance = 'hadir' | 'tidak'

/** Who answered the door on a home visit. */
export type MetWith = 'mitra' | 'pj' | 'nobody'

/** Where a mitra stands on this week's instalment.
 *  - `belum`    — nothing recorded yet.
 *  - `sebagian` — paid part; the shortfall carries a reason + PTP, like `tidak`.
 *  - `lunas`    — settled (dpd 0 mitra are seeded here).
 *  - `tidak`    — recorded no, with a reason and maybe a PTP. */
export type PaymentStatus = 'belum' | 'sebagian' | 'lunas' | 'tidak'

/** The inline payment mode a home visit picks. */
export type PayMode = 'penuh' | 'sebagian' | 'tidak'

export type OfferResult = 'tertarik' | 'tidak'

/** Why she isn't paying, and when she says she will. */
export interface NonPayment {
  reason: string
  ptp: string | null
}

export interface TaskFilter {
  maj: string | null
  type: TaskType | null
  when: WhenFilter
  kind: KindFilter
  /** Set when Home was opened from a KPI parameter — drives the context strip. */
  from: string | null
}

export interface MajelisSort {
  m: MetricKey
  dir: 'asc' | 'desc'
}

export interface AppState {
  notifs: Notif[]
  comms: Comm[]
  tasks: Task[]
  filter: TaskFilter
  majSort: MajelisSort | null
  majLoan: string | null
  /** Majelis name the detail screen (and the Kunjungan Rumah flow's context) renders. */
  selMajelis: string
  /** Mitra name the mitra-detail screen (and the Kunjungan Rumah flow) renders. */
  selMitra: string
  selCommId: string | null
  /** Id of the task driving the active home-visit flow screen. */
  hvTaskId: string | null

  // --- Visit state (mitra keyed by name `n`) ---
  /** mitraName → hadir/tidak. Absent = not marked yet. */
  attendance: Record<string, Attendance>
  /** mitraName → rupiah recorded this visit. Seeded for dpd-0 mitra. */
  payments: Record<string, number>
  /** mitraName → why she isn't paying (also the shortfall reason on a part-payment). */
  nonPayments: Record<string, NonPayment>
  /** mitraName → what she said to a cross-sell offer. */
  offerResults: Record<string, OfferResult>
  /** mitraName → the payment mode picked inline on the home visit. */
  payMode: Record<string, PayMode>
  /** mitraName → who answered the door on the home visit. */
  metWith: Record<string, MetWith>
  /** mitraName → her new address, when the reason is "Pindah rumah". */
  newAddress: Record<string, string>
  /** Final step — proof photo captured. Gates submission. */
  photo: boolean
  /** Final step — location recorded. Gates submission alongside the photo. */
  geo: boolean
}

// dpd-0 mitra have already paid this week's instalment — seed them as lunas so
// the visit queue is only the mitra a BP actually has to collect from.
const seedPayments: Record<string, number> = {}
MITRA.forEach((m) => {
  if (!m.pending && m.dpd === 0) seedPayments[m.n] = mitraLoanInfo(m).weekly
})

const DEFAULT_FILTER: TaskFilter = {
  maj: null,
  type: null,
  when: 'today',
  kind: 'wajib',
  from: null,
}

const initial: AppState = {
  notifs: NOTIFS_SEED,
  comms: COMMS_SEED,
  tasks: TASKS,
  filter: DEFAULT_FILTER,
  majSort: null,
  majLoan: null,
  selMajelis: MAJELIS[0].n,
  // Rury Ramadhita — ketua, autodebit, PIC, celengan. The richest record, so
  // opening mitra-detail directly still renders every section.
  selMitra: MITRA[0].n,
  selCommId: null,
  hvTaskId: null,
  attendance: {},
  payments: seedPayments,
  nonPayments: {},
  offerResults: {},
  payMode: {},
  metWith: {},
  newAddress: {},
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

  // --- Notifications
  readOne(id: string) {
    store.set({ notifs: state.notifs.map((n) => (n.id === id ? { ...n, read: true } : n)) })
  },
  readAll() {
    store.set({ notifs: state.notifs.map((n) => ({ ...n, read: true })) })
  },

  // --- Comms
  markCommRead(id: string) {
    store.set({ comms: state.comms.map((c) => (c.id === id ? { ...c, read: true } : c)) })
  },
  openBanner(c: Comm) {
    store.markCommRead(c.id)
    store.set({ selCommId: c.id })
  },

  // --- Tasks
  addTask(t: Task) {
    store.set({ tasks: [...state.tasks, t] })
  },

  // --- Filters
  setFilter(f: Partial<TaskFilter>) {
    // A hand-edited filter drops the KPI provenance strip, matching the source's
    // setTaskFilter, which cleared `from` on every user-driven change.
    store.set({ filter: { ...state.filter, ...f, from: null } })
  },
  resetFilter() {
    store.set({ filter: DEFAULT_FILTER })
  },
  /** KPI parameter → Tugas, carrying the mapped task type as a pre-applied filter. */
  goTasksFrom(paramKey: string, type: TaskType) {
    store.set({ filter: { maj: null, type, when: 'today', kind: 'all', from: paramKey } })
  },
  resetMajelisFilters() {
    store.set({ majSort: null, majLoan: null })
  },

  // --- Visits
  /** Open the majelis visit on a group; a visit always starts with no proof. */
  openMajelisVisit(majelisName: string) {
    store.set({ selMajelis: majelisName, photo: false, geo: false })
  },
  /** Open the home visit on a task + its mitra; starts with no proof. */
  openHomeVisit(taskId: string, mitraName: string) {
    store.set({ hvTaskId: taskId, selMitra: mitraName, photo: false, geo: false })
  },
  setPhoto(photo: boolean) {
    store.set({ photo })
  },
  setGeo(geo: boolean) {
    store.set({ geo })
  },
  setAttendance(name: string, value: Attendance) {
    store.set({ attendance: { ...state.attendance, [name]: value } })
  },
  /** Records rupiah handed over. Money clears any "tidak bayar" on file. */
  setPayment(name: string, amount: number) {
    const nonPayments = { ...state.nonPayments }
    delete nonPayments[name]
    store.set({ payments: { ...state.payments, [name]: amount }, nonPayments })
  },
  /** Records a part-payment AND why the rest is unpaid — the shortfall keeps a
   *  reason, unlike a full payment. Callers route here only when short. */
  setPartialPayment(name: string, amount: number, value: NonPayment) {
    store.set({
      payments: { ...state.payments, [name]: amount },
      nonPayments: { ...state.nonPayments, [name]: value },
    })
  },
  setNonPayment(name: string, value: NonPayment) {
    store.set({ nonPayments: { ...state.nonPayments, [name]: value } })
  },
  setOfferResult(name: string, result: OfferResult) {
    store.set({ offerResults: { ...state.offerResults, [name]: result } })
  },
  /** Home visit: picking a mode. "nobody met" cannot pay, so clear any payment. */
  setPayMode(name: string, value: PayMode) {
    const payments = { ...state.payments }
    const nonPayments = { ...state.nonPayments }
    delete payments[name]
    delete nonPayments[name]
    store.set({ payments, nonPayments, payMode: { ...state.payMode, [name]: value } })
  },
  setMetWith(name: string, value: MetWith) {
    // Crossing between "kenapa tidak di rumah" and "alasan belum bayar" retires
    // the reason on file — the two ask different questions with different lists.
    const nonPayments = { ...state.nonPayments }
    const payMode = { ...state.payMode }
    const payments = { ...state.payments }
    delete nonPayments[name]
    if (value === 'nobody') {
      delete payments[name]
      payMode[name] = 'tidak'
    } else {
      delete payMode[name]
    }
    store.set({ metWith: { ...state.metWith, [name]: value }, nonPayments, payMode, payments })
  },
  setNewAddress(name: string, value: string) {
    store.set({ newAddress: { ...state.newAddress, [name]: value } })
  },
  /** Drop a finished task from the list so it leaves Beranda. */
  finishTask(taskId: string) {
    store.set({ tasks: state.tasks.filter((t) => t.id !== taskId) })
  },
}

export function useApp(): AppState {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}

export const unreadCount = (notifs: Notif[]) => notifs.filter((n) => !n.read).length

export const selectedMajelis = (s: AppState) =>
  MAJELIS.find((g) => g.n === s.selMajelis) ?? MAJELIS[0]

export const selectedMitra = (s: AppState) => MITRA.find((m) => m.n === s.selMitra) ?? MITRA[0]

export const selectedComm = (s: AppState) =>
  s.comms.find((c) => c.id === s.selCommId) ?? s.comms[0]

// --- Visit derivations -----------------------------------------------------
// "Due" is the weekly instalment; a mitra's payment is keyed by her name.

export const weeklyOf = (m: Mitra) => mitraLoanInfo(m).weekly

export const paidOf = (s: AppState, m: Mitra) => s.payments[m.n] ?? 0

export const remainingOf = (s: AppState, m: Mitra) => Math.max(0, weeklyOf(m) - paidOf(s, m))

export function paymentStatus(s: AppState, m: Mitra): PaymentStatus {
  const paid = paidOf(s, m)
  if (paid > 0) return paid >= weeklyOf(m) ? 'lunas' : 'sebagian'
  return s.nonPayments[m.n] ? 'tidak' : 'belum'
}

/** The active roster of a majelis — pending (pengajuan) mitra have no bill. */
export const activeMembers = (majelisName: string) =>
  MITRA.filter((m) => m.m === majelisName && !m.pending)

/** Still to collect: nobody has recorded an outcome yet. */
export const pendingMembers = (s: AppState, members: Mitra[]) =>
  members.filter((m) => paymentStatus(s, m) === 'belum')

/** An outcome is on file: lunas, sebagian, or tidak bayar. */
export const recordedMembers = (s: AppState, members: Mitra[]) =>
  members.filter((m) => paymentStatus(s, m) !== 'belum')
