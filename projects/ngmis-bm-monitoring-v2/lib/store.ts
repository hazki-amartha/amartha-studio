'use client'

// Flow-level state that must survive navigation (CLAUDE.md §3). Screens remount
// on every go()/back(), so these three facts can't live in a screen's useState:
//
//  - `tab`      which dashboard tab to land on. A briefing is launched from the
//               Briefings tab; without this, submitting one and returning would
//               bounce the BM back to Monitoring.
//  - `submitted` whether today's morning / evening briefing has been sent, so the
//               Briefings tab shows "Terkirim" after the form is submitted.
//  - `viewing`  which briefing the read-only detail screen should show — set when
//               a history row (or a just-submitted briefing) is opened.

import { useSyncExternalStore } from 'react'
import type { BriefingKind, Orientation } from './data'

export type DashboardTab = 'monitoring' | 'briefings'

export interface ViewingBriefing {
  kind: BriefingKind
  date: string
  /** A just-submitted briefing is the BM's own; a past one names its author. */
  own: boolean
}

export interface FlowState {
  tab: DashboardTab
  submitted: Record<BriefingKind, boolean>
  viewing: ViewingBriefing | null
  /** Scorecard layout, shared across every page that shows it. */
  orientation: Orientation
}

const initial: FlowState = {
  tab: 'monitoring',
  submitted: { morning: false, evening: false },
  viewing: null,
  orientation: 'bp-rows',
}

let state: FlowState = initial

const listeners = new Set<() => void>()

export const store = {
  get: () => state,
  set(patch: Partial<FlowState>) {
    state = { ...state, ...patch }
    listeners.forEach((l) => l())
  },
  markSubmitted(kind: BriefingKind) {
    state = { ...state, submitted: { ...state.submitted, [kind]: true } }
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
