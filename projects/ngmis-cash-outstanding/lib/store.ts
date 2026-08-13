// A tiny module store carrying the BP whose detail page is open. Screens remount
// on navigation, so a plain useState in the table can't reach the User details
// screen — the selected name rides here instead (CLAUDE.md §3 cross-screen state).

import { useSyncExternalStore } from 'react'

let selectedBpName = 'Nabila Siregar'
const listeners = new Set<() => void>()

export function setSelectedBp(name: string) {
  selectedBpName = name
  listeners.forEach((l) => l())
}

export function useSelectedBp(): string {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => selectedBpName,
    () => selectedBpName,
  )
}
