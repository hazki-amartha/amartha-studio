'use client'

// Which BP the board opened, which of her tasks, and which clock the board is
// reading on. Screens remount on every navigation, so none of this can live in
// useState — the whole prototype is a drill-down, and the drill-down is exactly
// the thing useState forgets. The board view is here for the same reason: a BM
// who opened the weekly view, went into a BP and came back should still be in
// the weekly view.

import { useSyncExternalStore } from 'react'

/** The two clocks the board reads on, one at a time. Weekly is the default
 *  because it is the sheet's own grain — a day is a sample of it. */
export type BoardView = 'minggu' | 'hari'

interface State {
  bpId: string | null
  taskId: string | null
  boardView: BoardView
}

let state: State = { bpId: null, taskId: null, boardView: 'minggu' }
const listeners = new Set<() => void>()

function set(next: Partial<State>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

export const openBp = (bpId: string) => set({ bpId, taskId: null })
export const openTask = (taskId: string) => set({ taskId })
export const setBoardView = (boardView: BoardView) => set({ boardView })

export function useSelection() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
    () => state,
  )
}
