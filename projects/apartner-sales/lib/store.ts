'use client'

// The little that is left of the BP app's day state, once the day is gone.
//
// In `apartner-majelis-view` this file is the whole field day — attendance,
// collection, deposits, proof — and the Sales screens touch four things in it:
// which sosialisasi is open, whether the screen was entered from a rostered
// task, how many times that task has been moved, and the three verbs that close
// it. This prototype is the Sales module on its own, so that is all this file
// is. Everything the pipeline itself owns lives in `pipeline-store.ts`.
//
// The task verbs are kept rather than deleted: the reschedule sheet is a real
// part of the follow-up and sosialisasi screens, and it needs a count to gate
// its reject option on. Here they record the move and nothing else — there is
// no schedule behind them to tick.

import { useSyncExternalStore } from 'react'
import { findEvent, type SosialisasiEvent } from './events'

export interface AppState {
  /** The sosialisasi the POI screen is about — an `EVENTS` id. */
  openEvent: string
  /**
   * Which face the POI screen shows: the brief (`detail`) or the running list
   * of captured leads (`leads`). "Start add leads" flips it; opening a fresh POI
   * resets it to the brief.
   */
  poiStage: 'detail' | 'leads'
  /** The rostered task a screen was opened from, if any. */
  activeTask: string | null
  /** taskId → how many times it has been moved, and why last. */
  reschedules: Record<string, { count: number; reason: string; date: string }>
  /** taskId → the reason it was closed for good. */
  rejects: Record<string, string>
}

const initial: AppState = {
  openEvent: 'e1',
  poiStage: 'detail',
  activeTask: 't3',
  reschedules: {},
  rejects: {},
}

let state: AppState = initial
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export const store = {
  set(patch: Partial<AppState>) {
    state = { ...state, ...patch }
    emit()
  },
  reset() {
    state = initial
    emit()
  },
  /** Opens a POI on its brief. Used from Sales and by the demo states. */
  openSosialisasi(eventId: string, taskId: string | null = 't3') {
    store.set({ openEvent: eventId, activeTask: taskId, poiStage: 'detail' })
  },
  /** "Start add leads" — flip the POI screen to its running leads list. */
  startPoiLeads() {
    store.set({ poiStage: 'leads' })
  },
  /** Opens a follow-up from the schedule — the rostered call. */
  startFollowUp(taskId: string) {
    store.set({ activeTask: taskId })
  },
  /** Closes the task the screen was opened from. */
  finishTask(taskId?: string) {
    void taskId
    store.set({ activeTask: null })
  },
  rescheduleTask(taskId: string, reason: string, date: string) {
    const count = (state.reschedules[taskId]?.count ?? 0) + 1
    store.set({
      reschedules: { ...state.reschedules, [taskId]: { count, reason, date } },
      activeTask: null,
    })
  },
  rejectTask(taskId: string, reason: string) {
    store.set({ rejects: { ...state.rejects, [taskId]: reason }, activeTask: null })
  },
}

export function useApp(): AppState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
    () => initial,
  )
}

/** How many times a task has been moved. Gates the reject option at 3. */
export const rescheduleCount = (s: AppState, taskId: string): number =>
  s.reschedules[taskId]?.count ?? 0

/** After how many reschedules the BP may reject a task instead of moving it. */
export const REJECT_AFTER = 3

export const openEvent = (s: AppState): SosialisasiEvent => findEvent(s.openEvent)
