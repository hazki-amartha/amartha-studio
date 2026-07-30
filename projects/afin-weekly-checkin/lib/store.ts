'use client'

// The week the mitra is in, and everything already behind her. It lives here
// rather than in a screen because all three home options, the ladder and the
// celebration read the same journey — and because the state controls seed it
// from outside any screen.

import { useSyncExternalStore } from 'react'
import { CHAPTER_LENGTH, cycles, outcomeOf, range, windowOf, type WindowOutcome } from './data'

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
  /**
   * The standing she holds right now (option B). It is earned by the first
   * clean window and lost when one closes with a week unpaid — so it is a
   * value that moves during a tenor, not a starting condition.
   */
  tier: 'mitra' | 'juara'
  /**
   * Weeks paid after their own week had passed, but before the window closed
   * (option B). The standing survives these; the amount does not.
   */
  late: number[]
  /**
   * Weeks with no instalment yet. While the window is open these are
   * recoverable — that is the whole at-risk state. One still sitting here when
   * the window closes drops the standing.
   */
  unpaid: number[]
  /** Kumpulan missed. Two per window are affordable; the third drops it. */
  absent: number[]
  /** How each CLOSED window ended (option B). Index 0 is window 1. */
  windowLog: WindowOutcome[]
  /**
   * Windows already taken out (option B). Kept apart from
   * `withdrawnMilestones`, which counts A's four-week blocks — the two options
   * disburse in different units and must not share a counter.
   */
  disbursedWindows: number
}

// Week 15 — the third week of window 2, with window 1 closed clean behind her.
// B's default is a mitra who ALREADY HOLDS the standing, because that is the
// state the concept lives or dies in: a tier earned at week 12 is held for the
// remaining 36, so "keeping it" is the normal reading and "chasing it" is the
// exception.
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
  tier: 'juara',
  late: [],
  unpaid: [],
  absent: [],
  windowLog: ['full'],
  // Window 1 closed clean at week 12 and she has not taken it out yet — which
  // is the ordinary case, not an edge one: nobody disburses on the day.
  disbursedWindows: 0,
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
  /**
   * The disbursement is taken. Every closed four-week block is now marked as
   * disbursed, so the amount drops to zero and the button on the tracker
   * disables itself — the "nothing to take yet" side of that button is as much
   * of the design as the enabled one, and this is how a demo reaches it.
   */
  withdraw() {
    const closed = cycles(state).filter((c) => c.status === 'closed').length
    store.set({ withdrawnMilestones: closed })
  },
  /**
   * The late-payment path, and the only way out of at-risk (option B). Clearing
   * the oldest outstanding week moves it from `unpaid` to `late`: the standing
   * is safe again, and the amount she can disburse is not.
   */
  payOutstanding() {
    const [oldest, ...rest] = state.unpaid
    if (oldest === undefined) return
    store.set({ unpaid: rest, late: [...state.late, oldest] })
  },
  /**
   * The window closes and the decision is made (option B). Called after the
   * last week of a window has stamped, so it reads the window the week BEFORE
   * the cursor belongs to.
   *
   * This is the only place `tier` moves. Failing sets it back to 'mitra' — and
   * `windowLog` keeps the failure, which is what makes the tenor-end limit
   * lower for the rest of the tenor even after she recovers.
   */
  closeWindow(): WindowOutcome {
    const index = windowOf(state.week - 1)
    const outcome = outcomeOf(state, index)
    const log = [...state.windowLog]
    log[index - 1] = outcome
    state = { ...state, windowLog: log, tier: outcome === 'failed' ? 'mitra' : 'juara' }
    emit()
    return outcome
  },
  /**
   * She takes the disbursement (option B). Every closed window is now marked as
   * taken, so the amount drops to zero and the button flattens — the empty side
   * of that button is as much of the design as the live one.
   */
  disburse() {
    store.set({ disbursedWindows: state.windowLog.length })
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export function useApp(): AppState {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
