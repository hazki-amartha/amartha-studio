'use client'

// The week the mitra is in, and everything already behind her. It lives here
// rather than in a screen because all three home options, the ladder and the
// celebration read the same journey — and because the state controls seed it
// from outside any screen.

import { useSyncExternalStore } from 'react'
import { CHAPTER_LENGTH, range } from './data'

export interface AppState {
  /** The week now in progress, 1–48. */
  week: number
  /** First week of the chapter now in progress. */
  chapterStart: number
  /** Every week banked as good — instalment paid AND majelis attended. */
  done: number[]
  /** Weeks that went by unfinished. They delay the reward; they never cancel it. */
  missed: number[]
  /** Has this week's instalment posted? */
  paid: boolean
  /** Has this week's attendance posted? */
  attended: boolean
  /** Milestones already taken out at a past window — the pot is the rest. */
  withdrawnMilestones: number
  /** Weeks the majelis did NOT finish complete. Five of these are affordable. */
  groupBroken: number[]
  /** Members still short this week. A count, never names. */
  groupShort: number
}

const initial: AppState = {
  week: 15,
  chapterStart: 13,
  done: range(1, 14),
  missed: [],
  paid: false,
  attended: false,
  withdrawnMilestones: 0,
  groupBroken: [],
  groupShort: 0,
}

let state: AppState = initial

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export const store = {
  get: () => state,
  set(patch: Partial<AppState>) {
    state = { ...state, ...patch }
    emit()
  },
  /** Used by the demo seeds — replaces the journey wholesale. */
  seed(next: AppState) {
    state = next
    emit()
  },
  /** The instalment posts. Nothing stamps until the majelis lands too. */
  pay() {
    store.set({ paid: true })
  },
  /** Attendance posts. */
  attend() {
    store.set({ attended: true })
  },
  /**
   * Both halves are in, so the week stamps itself — there is no claim tap.
   * Returns true when that stamp completed a chapter, which is the caller's cue
   * to show the celebration.
   */
  stampWeek(): boolean {
    const done = [...state.done, state.week]
    const banked = done.filter((w) => w >= state.chapterStart).length
    const complete = banked >= CHAPTER_LENGTH
    state = {
      ...state,
      done,
      week: state.week + 1,
      chapterStart: complete ? state.week + 1 : state.chapterStart,
      paid: false,
      attended: false,
    }
    emit()
    return complete
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export function useApp(): AppState {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
