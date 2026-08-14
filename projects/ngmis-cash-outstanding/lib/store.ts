// A tiny module store carrying the BP whose detail page is open. Screens remount
// on navigation, so a plain useState in the table can't reach the User details
// screen — the selected name rides here instead (CLAUDE.md §3 cross-screen state).

import { useSyncExternalStore } from 'react'

const DEFAULT_NOW = '2026-08-13T16:00:00'

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

// --- BPs marked "mangkir" ----------------------------------------------------
// Kept here rather than in a screen's useState because marking a BP mangkir
// navigates to the User details page and back, and the mark has to survive that.

let mangkir: Record<string, boolean> = {}
const mangkirListeners = new Set<() => void>()

export function markMangkir(id: string) {
  mangkir = { ...mangkir, [id]: true }
  mangkirListeners.forEach((l) => l())
}

export function useMangkir(): Record<string, boolean> {
  return useSyncExternalStore(
    (cb) => {
      mangkirListeners.add(cb)
      return () => mangkirListeners.delete(cb)
    },
    () => mangkir,
    () => mangkir,
  )
}

// --- Nominal corrections -----------------------------------------------------
// Keyed `${row.id}:${item}:${member}`. In the store (not a screen's useState) so
// a correction survives the round-trip to the User details page.

let corrections: Record<string, number> = {}
const correctionListeners = new Set<() => void>()

export function correctNominal(key: string, amount: number) {
  corrections = { ...corrections, [key]: amount }
  correctionListeners.forEach((l) => l())
}

export function useCorrections(): Record<string, number> {
  return useSyncExternalStore(
    (cb) => {
      correctionListeners.add(cb)
      return () => correctionListeners.delete(cb)
    },
    () => corrections,
    () => corrections,
  )
}

// --- Acknowledged lateness ---------------------------------------------------
// Keyed by row id, kept here so the "Telat diakui" confirmation persists across
// navigation the same way the mangkir mark does.

let acknowledged: Record<string, boolean> = {}
const ackListeners = new Set<() => void>()

export function acknowledgeTelat(id: string) {
  acknowledged = { ...acknowledged, [id]: true }
  ackListeners.forEach((l) => l())
}

export function useAcknowledged(): Record<string, boolean> {
  return useSyncExternalStore(
    (cb) => {
      ackListeners.add(cb)
      return () => ackListeners.delete(cb)
    },
    () => acknowledged,
    () => acknowledged,
  )
}

// --- Current time ------------------------------------------------------------
// Driven by the states selector so a state can jump the report earlier in the
// day (before the 16.00 deadline) and change who reads as late.

let now = DEFAULT_NOW
const nowListeners = new Set<() => void>()

export function setNow(iso: string) {
  now = iso
  nowListeners.forEach((l) => l())
}

export function useNow(): string {
  return useSyncExternalStore(
    (cb) => {
      nowListeners.add(cb)
      return () => nowListeners.delete(cb)
    },
    () => now,
    () => now,
  )
}

// --- Reset ------------------------------------------------------------------
// Clears every action + restores the default time, for the "no actions taken"
// state and as the baseline the other states build on.

export function resetDemo() {
  mangkir = {}
  corrections = {}
  acknowledged = {}
  now = DEFAULT_NOW
  mangkirListeners.forEach((l) => l())
  correctionListeners.forEach((l) => l())
  ackListeners.forEach((l) => l())
  nowListeners.forEach((l) => l())
}
