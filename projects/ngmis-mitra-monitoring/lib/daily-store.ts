'use client'

// Ported from ngmis-bm-monitoring-v2 for Progres harian's briefing flow — a
// separate module store from lib/store.ts, since the two track unrelated facts
// (which Pembayaran variant is on screen vs. which briefing is scheduled/sent).
//
// Flow-level state that must survive navigation (CLAUDE.md §3). Screens remount
// on every go()/back(), so these facts can't live in a screen's useState:
//
//  - `submitted` whether today's morning / evening briefing has been sent, so the
//               Riwayat Briefing screen shows "Terkirim" after the form is sent.
//  - `viewing`  which briefing the read-only view should show — set when a history
//               row (or a just-submitted briefing) is opened.
//  - `drafts`   each briefing's in-progress content, so leaving the form and
//               coming back resumes it (the dashboard offers "Lanjutkan …").

import { useSyncExternalStore } from 'react'
import type { BriefingKind, CommentStyle } from './daily-data'

export interface ViewingBriefing {
  kind: BriefingKind
  date: string
  /** A just-submitted briefing is the BM's own; a past one names its author. */
  own: boolean
}

/** A briefing's saved-in-progress content. `attendance` is per-BP present/absent
 *  — unset means present (attendance is auto-checked). */
export interface BriefingDraft {
  attendance: Record<string, boolean>
  discussed: Record<string, boolean>
  /** Morning-only "what to do" checklist — per-item done state. */
  checklist: Record<string, boolean>
  notes: Record<string, string>
  /** Evening-only "Laporan BM" overall report. */
  report: string
  overall: string
  photoAttached: boolean
  recordings: number
}

export function emptyDraft(): BriefingDraft {
  return {
    attendance: {},
    discussed: {},
    checklist: {},
    notes: {},
    report: '',
    overall: '',
    photoAttached: false,
    recordings: 0,
  }
}

/** Whether a draft has any content — drives the "Lanjutkan" vs "Mulai" CTA. */
export function isDraftStarted(d: BriefingDraft): boolean {
  return (
    Object.values(d.attendance).some((present) => !present) ||
    Object.values(d.discussed).some(Boolean) ||
    Object.values(d.checklist).some(Boolean) ||
    Object.values(d.notes).some((n) => n.trim().length > 0) ||
    d.report.trim().length > 0 ||
    d.overall.trim().length > 0 ||
    d.photoAttached ||
    d.recordings > 0
  )
}

export interface FlowState {
  submitted: Record<BriefingKind, boolean>
  viewing: ViewingBriefing | null
  /** Which briefing is scheduled to start right now — the one the dashboard
   *  banner prompts. Set by the `states` controls beside the device. */
  scheduled: BriefingKind
  /** Each briefing's in-progress content, kept across navigation. */
  drafts: Record<BriefingKind, BriefingDraft>
  /** Unused since the briefing-panel redesign; kept for the `states` demo funcs. */
  commentStyle: CommentStyle
}

const initial: FlowState = {
  submitted: { morning: false, evening: false },
  viewing: null,
  scheduled: 'evening',
  drafts: { morning: emptyDraft(), evening: emptyDraft() },
  commentStyle: 'inline',
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
  setDraft(kind: BriefingKind, patch: Partial<BriefingDraft>) {
    state = {
      ...state,
      drafts: { ...state.drafts, [kind]: { ...state.drafts[kind], ...patch } },
    }
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
