'use client'

// Flow-level state for Setor tunai's journey (CLAUDE.md §3), ported from
// ngmis-cash-outstanding's lib/store.ts. Screens remount on navigation, so
// these facts can't live in a screen's useState:
//
//  - `mangkir`      which BPs have been marked mangkir — marking one navigates
//                   to the User details screen and back, and the mark has to
//                   survive that round trip.
//  - `corrections`  nominal corrections, keyed `${bpId}:${itemIndex}:${memberIndex}`.
//  - `acknowledged` which BPs' lateness has been signed off, and the optional
//                   reason given.
//  - `selectedBp`   which BP's name the User details screen shows.

import { useSyncExternalStore } from 'react'

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

/** `true` when the BM gave no reason, the reason itself when they typed one. */
export type Acknowledgement = true | string

let acknowledged: Record<string, Acknowledgement> = {}
const ackListeners = new Set<() => void>()

export function acknowledgeTelat(id: string, reason?: string) {
  const trimmed = reason?.trim()
  acknowledged = { ...acknowledged, [id]: trimmed ? trimmed : true }
  ackListeners.forEach((l) => l())
}

export function useAcknowledged(): Record<string, Acknowledgement> {
  return useSyncExternalStore(
    (cb) => {
      ackListeners.add(cb)
      return () => ackListeners.delete(cb)
    },
    () => acknowledged,
    () => acknowledged,
  )
}

let selectedBpName = ''
const selectedListeners = new Set<() => void>()

export function setSelectedBp(name: string) {
  selectedBpName = name
  selectedListeners.forEach((l) => l())
}

export function useSelectedBp(): string {
  return useSyncExternalStore(
    (cb) => {
      selectedListeners.add(cb)
      return () => selectedListeners.delete(cb)
    },
    () => selectedBpName,
    () => selectedBpName,
  )
}
