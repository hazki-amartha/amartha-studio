'use client'

// Group Formation tasks for the Tugas page. A new majelis becomes one of these
// once more than five of its new members are approved (UK passed): the majelis
// can hold its "first MV" — pick a ketua, run the oath, make the first
// disbursement. Kept to one representative task at on-screen scale (§3) rather
// than seeding six approved leads to derive it.

import { useSyncExternalStore } from 'react'

export interface GroupFormationTask {
  id: string
  majelisName: string
  /** How many new members are approved (the >5 that triggers formation). */
  memberCount: number
  /** The scheduled time on the task card. */
  time: string
}

export const GROUP_FORMATION_TASKS: GroupFormationTask[] = [
  { id: 'gf-batu-sangkar', majelisName: 'Batu Sangkar', memberCount: 6, time: '10.00' },
]

// Which task the group-formation detail is about — set right before navigating,
// read once on mount (screens take no props and remount on navigation).
let selected: GroupFormationTask = GROUP_FORMATION_TASKS[0]

export function setGroupTask(task: GroupFormationTask) {
  selected = task
}

export function getGroupTask(): GroupFormationTask {
  return selected
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
