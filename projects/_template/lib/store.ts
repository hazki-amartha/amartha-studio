'use client'

// Project-local module store — the pattern for state that must survive
// navigation. Screens remount on every go()/back(), so useState inside a
// screen is lost; keep flow-level values (entered amounts, selections) here
// and read them via the useSyncExternalStore hook below.
//
// Rename FlowState/useFlowState and the fields to fit your flow. See
// projects/celengan-topup/lib/store.ts for a complete example.

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
