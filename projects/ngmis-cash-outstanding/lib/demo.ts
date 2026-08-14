// Seed functions for the states selector beside the device (CLAUDE.md §3). Each
// resets the demo to the "no actions taken" baseline, then sets one condition —
// so the states are independent, one click each.

import { SEMUA } from './data'
import { acknowledgeTelat, markMangkir, resetDemo, setFilters, setNow } from './store'

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

// The four zoom levels of the same report, each one filter step wider. Every
// level left on "Semua" becomes a grouping, so the tables and the headers follow
// the filter rather than being four separate screens.

/** One branch — the roster the report opens on. */
export function stateBranchView() {
  resetDemo()
  setFilters({ region: 'Jawa', provinsi: 'Jawa Barat', kota: 'Cirebon', branch: 'Belawa' })
}

/** Every branch in one kota. */
export function stateAreaView() {
  resetDemo()
  setFilters({ region: 'Jawa', provinsi: 'Jawa Barat', kota: 'Cirebon', branch: SEMUA })
}

/** Every branch in one provinsi. */
export function stateRegionView() {
  resetDemo()
  setFilters({ region: 'Jawa', provinsi: 'Jawa Barat', kota: SEMUA, branch: SEMUA })
}

/** Every branch on the island. */
export function stateIslandView() {
  resetDemo()
  setFilters({ region: 'Jawa', provinsi: SEMUA, kota: SEMUA, branch: SEMUA })
}
