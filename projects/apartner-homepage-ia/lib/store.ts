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
  type Comm,
  type KindFilter,
  type MetricKey,
  type Notif,
  type Task,
  type TaskType,
  type WhenFilter,
} from './data'

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
  /** Id of the task driving the active Kunjungan Rumah flow screen. */
  hvTaskId: string | null
}

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
