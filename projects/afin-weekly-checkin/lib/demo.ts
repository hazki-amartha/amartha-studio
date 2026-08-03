'use client'

// Seeds for the state controls beside the device. The conditions worth showing,
// most of which cannot be reached by tapping: a week already gone by unpaid,
// twelve weeks already graded against her, and three majelis conditions that
// take weeks of group behaviour to arrive at.

import { range } from './data'
import { store, type AppState } from './store'

/** The ordinary week, reused as the base every other seed varies from. */
const base: AppState = {
  week: 19,
  done: range(1, 18),
  paid: false,
  attended: false,
  groupBroken: [],
  groupShort: 0,
  // Week 19 sits in window 2, so window 1 is behind her and closed clean —
  // which means she already holds a clean standing.
  tier: 'juara',
  late: [],
  unpaid: [],
  absent: [],
  windowLog: ['full'],
  disbursedWindows: 0,
}

function seed(patch: Partial<AppState>) {
  return () => store.seed({ ...base, ...patch })
}

// --- The standing, window by window -----------------------------------------
// The states are about the 12-week window, and four of them cannot be tapped
// to: at-risk needs a week to have gone by unpaid, dropped needs a window to
// have closed against her, and recovering needs both to have happened already.
// This is exactly what the state controls are for.

/**
 * The first window, week 6 — nothing has been graded yet. The status still
 * exists (a grade is held from week 1), but no addition has landed.
 */
export const firstWindow = seed({
  week: 6,
  done: range(1, 5),
  tier: 'mitra',
  windowLog: [],
})

/**
 * Week 17 went by with no instalment and the window is still open. The standing
 * is intact but recoverable-only — the one state that puts an extra row on
 * home, and the one the whole late-payment path exists for.
 */
export const atRisk = seed({
  week: 20,
  done: [...range(1, 16), 18, 19],
  unpaid: [17],
})

/**
 * She caught two weeks up late. Nothing is owed, so the standing is safe — and
 * the amount at week 24 is reduced, which home states as a direction and never
 * as a figure.
 */
export const lateCaught = seed({
  week: 22,
  done: range(1, 21),
  late: [17, 18],
})

/**
 * Window 2 closed with week 22 still unpaid: no disbursement at week 24, and
 * the standing dropped. The state the concept most needs to survive without
 * scolding her.
 */
export const dropped = seed({
  week: 26,
  done: [...range(1, 21), 23, 24, 25],
  tier: 'mitra',
  unpaid: [22],
  windowLog: ['full', 'failed'],
})

/**
 * The way back. The outstanding is cleared, so the standing is back and access
 * returns at week 36 — the window that already closed stays closed, and the
 * tenor-end limit is lower than it would have been.
 */
export const recovered = seed({
  week: 28,
  done: [...range(1, 21), 22, 23, 24, 25, 26, 27],
  tier: 'mitra',
  late: [22],
  windowLog: ['full', 'failed'],
})

/**
 * Standing on week 24 with everything clean — one tap from the window closing
 * in full. The only one of these states that can also be reached by tapping,
 * kept because getting to it otherwise costs nine weeks of taps.
 */
export const windowEve = seed({
  week: 24,
  done: range(1, 23),
})

// --- Her majelis -----------------------------------------------------------

/** Everyone current, nothing broken recently. The status the design defaults to. */
export const groupGood = seed({})

/** Two members short this week — the only state that shows a count. */
export const groupWatch = seed({ groupShort: 2 })

/**
 * Six broken weeks against a budget of five: the 90% is out of reach. Kept
 * visible rather than removed, and worded as a fact rather than a grade.
 */
export const groupLost = seed({
  week: 30,
  done: range(1, 29),
  groupBroken: [4, 9, 11, 17, 22, 26],
  windowLog: ['full', 'full'],
})
