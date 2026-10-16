'use client'

// Two facts about who is looking and when. Both are driven from the STATES
// panel beside the device rather than a control inside the prototype (see
// lib/demo.ts).

import { useSyncExternalStore } from 'react'

/** HMB (higher field officer) can suggest a write-off; a regular FO cannot. */
export type Role = 'hmb' | 'fo'

interface State {
  role: Role
  /** False while the day is running — a task nobody has reported is "not yet
   *  done". True once the day has closed — the system rejects it. */
  dayClosed: boolean
}

let state: State = { role: 'hmb', dayClosed: false }
const listeners = new Set<() => void>()

function set(next: State) {
  state = next
  listeners.forEach((l) => l())
}

export const store = {
  setRole(role: Role) {
    if (role !== state.role) set({ ...state, role })
  },
  setDayClosed(dayClosed: boolean) {
    if (dayClosed !== state.dayClosed) set({ ...state, dayClosed })
  },
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}

function useStore(): State {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}

export const useRole = (): Role => useStore().role
export const useDayClosed = (): boolean => useStore().dayClosed
