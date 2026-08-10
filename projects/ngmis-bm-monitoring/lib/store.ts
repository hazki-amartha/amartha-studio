'use client'

// Which cut of the Pembayaran page is on screen.
//
// This is the only cross-screen value the project has, and it exists so the two
// cuts can be reached from the STATES panel beside the device rather than from
// a toggle drawn inside the prototype. A control that only exists to demo the
// prototype does not belong in the prototype.

import { useSyncExternalStore } from 'react'

export type Variant = 'mvp' | 'end'

let variant: Variant = 'mvp'
const listeners = new Set<() => void>()

export const store = {
  set(next: Variant) {
    if (next === variant) return
    variant = next
    listeners.forEach((l) => l())
  },
  get: () => variant,
  subscribe(l: () => void) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}

export function useVariant(): Variant {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
