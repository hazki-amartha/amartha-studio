'use client'

// OPTIONAL — delete this file if your prototype is a plain click-through
// (screens + go(), the default per CLAUDE.md §3). Most prototypes don't need it.
//
// Keep it ONLY when a value must survive navigation: screens remount on every
// go()/back(), so useState inside a screen is lost. Flow-level values (entered
// amounts, selections) live here and are read via the useSyncExternalStore hook
// below.
//
// Rename FlowState/useFlowState and the fields to fit your flow. See
// projects/apartner-homepage-ia/lib/store.ts for a complete example.

import { useSyncExternalStore } from 'react'

export interface FlowState {
  // e.g. amount: number; selectedId: string
  example: string
}

const initial: FlowState = { example: '' }

let state: FlowState = initial

const listeners = new Set<() => void>()

export const store = {
  get: () => state,
  set(patch: Partial<FlowState>) {
    state = { ...state, ...patch }
    listeners.forEach((l) => l())
  },
  reset() {
    state = initial
    listeners.forEach((l) => l())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export function useFlowState(): FlowState {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
