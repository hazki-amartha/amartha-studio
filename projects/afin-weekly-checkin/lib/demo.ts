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
})
