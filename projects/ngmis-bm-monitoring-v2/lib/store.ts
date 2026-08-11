'use client'

// Flow-level state that must survive navigation (CLAUDE.md §3). Screens remount
// on every go()/back(), so these facts can't live in a screen's useState:
//
//  - `submitted` whether today's morning / evening briefing has been sent, so the
//               Riwayat Briefing screen shows "Terkirim" after the form is sent.
//  - `viewing`  which briefing the read-only detail screen should show — set when
//               a history row (or a just-submitted briefing) is opened.

import { useSyncExternalStore } from 'react'
import type { BriefingKind, CommentStyle, ScorecardLayout } from './data'

export interface ViewingBriefing {
  kind: BriefingKind
  date: string
  /** A just-submitted briefing is the BM's own; a past one names its author. */
  own: boolean
}

export interface FlowState {
  submitted: Record<BriefingKind, boolean>
  viewing: ViewingBriefing | null
  /** Which commentary layout the briefing forms use — set by the `states`
   *  controls beside the device. */
  commentStyle: CommentStyle
  /** Which scorecard orientation the Monitoring screen draws. */
  scorecardLayout: ScorecardLayout
}

const initial: FlowState = {
  submitted: { morning: false, evening: false },
  viewing: null,
  commentStyle: 'inline',
  scorecardLayout: 'matrix',
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
