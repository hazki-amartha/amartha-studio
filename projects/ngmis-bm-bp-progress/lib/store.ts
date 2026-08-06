'use client'

// Which BP the board opened, and which of her tasks. Screens remount on every
// navigation, so these two ids cannot live in useState — the whole prototype is
// a drill-down, and the drill-down is exactly the thing useState forgets.

import { useSyncExternalStore } from 'react'

interface State {
  bpId: string | null
  taskId: string | null
}

let state: State = { bpId: null, taskId: null }
const listeners = new Set<() => void>()

function set(next: Partial<State>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

export const openBp = (bpId: string) => set({ bpId, taskId: null })
export const openTask = (taskId: string) => set({ taskId })

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
