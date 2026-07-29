'use client'

// The homepage is one screen with two shipped states, and the two differ in
// exactly two places: whether the Mitra has an active Modal loan, and whether
// they run an AmarthaLink agency. Everything else on the page is identical.
//
// They are separate flags rather than one `variant` string because that is what
// they actually are in production — two independent product activations that
// happen to be shown here in their two common combinations.

import { useSyncExternalStore } from 'react'

export interface HomeState {
  /** An active Modal loan replaces the PPOB row's neighbour with the limit card. */
  modalActive: boolean
  /** An active AmarthaLink agency expands the PPOB row into the agent widget. */
  amarthaLinkActive: boolean
}

const initial: HomeState = { modalActive: true, amarthaLinkActive: false }

let state: HomeState = initial

const listeners = new Set<() => void>()

export const store = {
  get: () => state,
  set(patch: Partial<HomeState>) {
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

export function useHomeState(): HomeState {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
