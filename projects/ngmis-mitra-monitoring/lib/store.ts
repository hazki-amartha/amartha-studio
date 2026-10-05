'use client'

// Who is looking at the dashboard. Driven from the STATES panel beside the
// device rather than a control inside the prototype (see lib/demo.ts).

import { useSyncExternalStore } from 'react'

/** HMB (higher field officer) can suggest a write-off; a regular FO cannot. */
export type Role = 'hmb' | 'fo'

let role: Role = 'hmb'
const listeners = new Set<() => void>()

export const store = {
  setRole(next: Role) {
    if (next === role) return
    role = next
    listeners.forEach((l) => l())
  },
  get: () => role,
  subscribe(l: () => void) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}

export function useRole(): Role {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
