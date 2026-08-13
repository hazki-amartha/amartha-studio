'use client'

// Flow state for the AmarthaLink agent dashboard. Three things survive a
// navigation / drive the studio's state chips:
//
//   period  — the sales-summary window (Hari ini / 7 Hari / 30 Hari). Real
//             product control, toggled in-screen.
//   layout  — which of the three sales-summary layouts is shown. A discussion
//             control, driven by the desktop state chips (see index.ts).
//   qris    — whether the agent is a QRIS acquirer. Off hides the QRIS income
//             block, and surfaces the "activate QRIS" promo + opportunity.
//
//   sheet   — the "Pemasukan dari QRIS" info bottom sheet.
//   periodSheet — the period-picker bottom sheet (opened from the calendar input).

import { useSyncExternalStore } from 'react'

export type Period = 'hari' | 'minggu' | 'bulan'
export type Layout = 1 | 2 | 3
export type Qris = 'active' | 'inactive'

export interface FlowState {
  period: Period
  layout: Layout
  qris: Qris
  sheet: boolean
  periodSheet: boolean
}

const initial: FlowState = {
  period: 'minggu',
  layout: 2,
  qris: 'active',
  sheet: false,
  periodSheet: false,
}

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
