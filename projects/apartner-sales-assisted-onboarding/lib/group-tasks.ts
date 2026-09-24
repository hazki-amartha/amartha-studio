'use client'

// Tugas-page task types + the reschedule store. The tasks themselves are DERIVED
// from the real majelis directory + pipeline in the Tugas screen (so they always
// point at a majelis that actually exists, by its status):
//
//   Group Formation — a draft majelis with enough members to form (Kenari, Teratai)
//   Penerimaan Anggota — an active majelis with newly-approved members to accept
//                        (Mawar, Melati)

import { useSyncExternalStore } from 'react'

export interface GroupFormationTask {
  id: string
  majelisId: string
  /** Full directory name, e.g. "Majelis Teratai". */
  majelisName: string
  /** Members gathered so far (the draft's directory count). */
  memberCount: number
  /** The scheduled time on the task card (the majelis' kumpulan slot). */
  time: string
}

export interface PenerimaanTask {
  id: string
  majelisId: string
  majelisName: string
  /** The newly-approved members waiting to be accepted. */
  memberIds: string[]
  memberNames: string[]
  time: string
}

// --- Task state (rescheduled) ----------------------------------------------
// "Belum, lewati tugas" on the gate reschedules the task to next week. A tiny
// reactive store so the Tugas page reflects it after navigating away and back.

interface GroupTaskState {
  /** task id → the next-week date it was rescheduled to. */
  rescheduled: Record<string, string>
}

let state: GroupTaskState = { rescheduled: {} }
const listeners = new Set<() => void>()

export const groupTaskStore = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  reschedule(id: string, dateLabel: string) {
    state = { rescheduled: { ...state.rescheduled, [id]: dateLabel } }
    listeners.forEach((l) => l())
  },
}

export function useGroupTasks(): GroupTaskState {
  return useSyncExternalStore(groupTaskStore.subscribe, groupTaskStore.get, groupTaskStore.get)
}
