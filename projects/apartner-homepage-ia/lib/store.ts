'use client'

// Project-local store. The platform runtime remounts a screen on every
// navigation, so anything that must survive a go()/back() lives here rather
// than in component state: the notification read state, the KPI deep-link
// filters, and which majelis/mitra/banner a detail screen is showing.
//
// This mirrors the useState pile in the source draft's <App> shell — that shell
// held tabs + overlays in one tree, whereas here each screen stands alone.

import { useSyncExternalStore } from 'react'
import {
  MAJELIS,
  MITRA,
  NOTIFS_SEED,
  TASKS,
  type Banner,
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
  /** Set when Home was opened from a KPI group — drives the context strip. */
  from: string | null
}

export interface MajelisSort {
  m: MetricKey
  dir: 'asc' | 'desc'
  /** Set when Majelis was opened from a KPI group — drives the context strip. */
  from: string | null
}

export interface AppState {
  notifs: Notif[]
  tasks: Task[]
  filter: TaskFilter
  majSort: MajelisSort | null
  majLoan: string | null
  /** Majelis name the detail screen renders. */
  selMajelis: string
  /** Mitra name the (currently unreachable) mitra detail screen renders. */
  selMitra: string
  selBanner: Banner | null
  kpiPeriod: string
  kpiMajelis: string | null
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
  tasks: TASKS,
  filter: DEFAULT_FILTER,
  majSort: null,
  majLoan: null,
  selMajelis: MAJELIS[0].n,
  // Rury Ramadhita — ketua, autodebit, PIC, celengan. The richest record, so the
  // parked mitra-detail screen still renders every section when opened directly.
  selMitra: MITRA[0].n,
  selBanner: null,
  kpiPeriod: 'Juli 2026',
  kpiMajelis: null,
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

  /** KPI → Tugas, carrying the group's KPI type as a pre-applied filter. */
  goTasksFrom(groupName: string, type: TaskType) {
    store.set({ filter: { maj: null, type, when: 'today', kind: 'all', from: groupName } })
  },
  /** KPI → Majelis, ranked worst-first on that group's metric. */
  goMajelisFrom(groupName: string, metric: MetricKey) {
    store.set({ majSort: { m: metric, dir: 'asc', from: groupName }, majLoan: null })
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
