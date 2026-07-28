'use client'

// Seeds for the state controls beside the device. Four conditions worth
// showing, three of which cannot be reached by tapping: a reward already ripe,
// a week already missed, and a journey already eleven months old.

import { range } from './data'
import { store, type AppState } from './store'

function seed(next: AppState) {
  return () => store.seed(next)
}

/** Two good weeks banked, two still owed. The ordinary week. */
export const midChapter = seed({
  week: 15,
  chapterStart: 13,
  done: range(1, 14),
  missed: [],
  paid: false,
  attended: false,
})

/** The fourth good week has just landed — the reward is open, unclaimed. */
export const rewardReady = seed({
  week: 17,
  chapterStart: 13,
  done: range(1, 16),
  missed: [],
  paid: false,
  attended: false,
})

/** Week 14 went by unfinished. The row grew by one; the reward did not move. */
export const missedWeek = seed({
  week: 16,
  chapterStart: 13,
  done: [...range(1, 12), 13, 15],
  missed: [14],
  paid: false,
  attended: false,
})

/** Two weeks from the limit increase, so the destination line is nearly full. */
export const nearFinal = seed({
  week: 47,
  chapterStart: 45,
  done: range(1, 46),
  missed: [],
  paid: false,
  attended: false,
})
