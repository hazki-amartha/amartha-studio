// Seed functions for the states selector beside the device (CLAUDE.md §3). Each
// resets the demo to the "no actions taken" baseline, then sets one condition —
// so the states are independent, one click each.

import { acknowledgeTelat, markMangkir, resetDemo, setNow } from './store'

/** Today, 16.00 — past the deadline, no actions taken yet. */
export function stateDefault() {
  resetDemo()
}

/** A BP (Diski) already marked mangkir — the row leaves the table and the totals. */
export function stateMangkir() {
  resetDemo()
  markMangkir('bp-b')
}

/** A BP (Sukma) whose lateness is already acknowledged — button disabled, badge on the name. */
export function stateTelat() {
  resetDemo()
  acknowledgeTelat('bp-a')
}

/** Earlier in the day (14.30), before the 16.00 deadline — only genuinely overdue
 *  BPs read as late; the rest are plain. */
export function stateEarlier() {
  resetDemo()
  setNow('2026-08-13T14:30:00')
}
