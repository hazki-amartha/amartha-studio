'use client'

import { useSyncExternalStore } from 'react'

/** How a closed 12-week streak of the majelis ended. */
export type MilestoneOutcome = 'siap' | 'cair' | 'lewat'

export interface AppState {
  /** Weeks already behind her, 0–48. */
  weeksDone: number
  /** Weeks she paid after their due date. */
  late: number[]
  /** Weeks she missed kumpulan. */
  absent: number[]
  /** Members of the majelis not yet paid this week. */
  groupShort: number
  /** Closed majelis milestones, index 0 = week 12. */
  milestones: MilestoneOutcome[]
}

export const initial: AppState = {
  weeksDone: 10,
  late: [],
  absent: [],
  groupShort: 0,
  milestones: [],
}

let state: AppState = initial
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export const store = {
  get: () => state,
  seed(next: AppState) {
    state = next
    emit()
  },
  /** Takes the extra disbursement of milestone `index` (1-based). */
  cairkan(index: number) {
    const milestones = [...state.milestones]
    milestones[index - 1] = 'cair'
    state = { ...state, milestones }
    emit()
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export function useApp(): AppState {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
