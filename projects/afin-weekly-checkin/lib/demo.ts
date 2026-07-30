'use client'

// Seeds for the state controls beside the device. The conditions worth showing,
// most of which cannot be reached by tapping: a reward already ripe, a week
// already missed, a journey already eleven months old, and three majelis
// conditions that take weeks of group behaviour to arrive at.

import { range } from './data'
import { store, type AppState } from './store'

/** The ordinary week, reused as the base every other seed varies from. */
const base: AppState = {
  week: 19,
  chapterStart: 17,
  done: range(1, 18),
  missed: [],
  paid: false,
  attended: false,
  withdrawnMilestones: 0,
  groupBroken: [],
  groupShort: 0,
  // Week 19 sits in window 2, so window 1 is behind her and closed clean —
  // which under B's model means she already HOLDS the standing.
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

// --- Her own journey -------------------------------------------------------

/** Two good weeks banked, two still owed. */
export const midChapter = seed({})

/** The fourth good week has just landed — Rp500rb is in the pot. */
export const rewardReady = seed({
  week: 21,
  chapterStart: 17,
  done: range(1, 20),
})

/** Week 18 went by unfinished. The row grew by one; the reward did not move. */
export const missedWeek = seed({
  week: 20,
  chapterStart: 17,
  done: [...range(1, 16), 17, 19],
  missed: [18],
})

/** Two weeks from the limit increase, with one window's worth already taken. */
export const nearFinal = seed({
  week: 47,
  chapterStart: 45,
  done: range(1, 46),
  withdrawnMilestones: 9,
  windowLog: ['full', 'full', 'full'],
})

/**
 * All three verdicts on one board, for the repayment tracker: weeks 1–4 clean,
 * week 7 paid late, week 8 never paid. Which makes block 2 the only one on the
 * page that adds nothing — the state the tracker's whole arithmetic is for, and
 * one nobody can tap their way to.
 */
export const mixedRepayments = seed({
  week: 15,
  chapterStart: 13,
  done: [...range(1, 6), ...range(9, 14)],
  late: [7],
  unpaid: [8],
  tier: 'mitra',
  windowLog: [],
})

// --- The standing, window by window (option B) ------------------------------
// B's states are about the 12-week window, and four of the five cannot be
// tapped to: at-risk needs a week to have gone by unpaid, dropped needs a
// window to have closed against her, and recovering needs both to have happened
// already. This is exactly what the state controls are for.

/**
 * The first window, week 6 — she has never held the standing. Under the old
 * 48-week model this was the whole prototype; now it is the exception, which is
 * the clearest single sign the model changed.
 */
export const firstWindow = seed({
  week: 6,
  chapterStart: 5,
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
  chapterStart: 17,
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
  chapterStart: 21,
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
  chapterStart: 25,
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
  chapterStart: 25,
  done: [...range(1, 21), 22, 23, 24, 25, 26, 27],
  tier: 'mitra',
  late: [22],
  windowLog: ['full', 'failed'],
})

/**
 * Standing on week 24 with everything clean — one tap from the window closing
 * in full. The only one of B's states that can also be reached by tapping, kept
 * because getting to it otherwise costs nine weeks of taps.
 */
export const windowEve = seed({
  week: 24,
  chapterStart: 21,
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
  chapterStart: 29,
  done: range(1, 29),
  withdrawnMilestones: 5,
  groupBroken: [4, 9, 11, 17, 22, 26],
  windowLog: ['full', 'full'],
})
