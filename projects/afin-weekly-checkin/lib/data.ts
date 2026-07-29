// The rules of the check-in, and the derivations every screen reads.
//
// A "chapter" is the stretch between two milestones: four GOOD weeks, not four
// calendar weeks. Missing a week delays the milestone rather than cancelling it,
// so a chapter with one missed week is five tiles long — the row grows, the
// reward at its end does not move.

import type { AppState } from './store'

export const TOTAL_WEEKS = 48
/** Good weeks between one milestone and the next. */
export const CHAPTER_LENGTH = 4
/** Chapters in the whole tenor: 12. */
export const TOTAL_CHAPTERS = TOTAL_WEEKS / CHAPTER_LENGTH

export const MILESTONE_REWARD = 500_000
export const FINAL_LIMIT = 7_000_000
export const CURRENT_LIMIT = 5_000_000
export const LIMIT_INCREASE = FINAL_LIMIT - CURRENT_LIMIT

// --- The tier (option B) ---------------------------------------------------
// B replaces the rupiah headline with a named status. The reason is not
// decoration: a figure has to be hedged (`s/d Rp8jt`, dropping to Rp7jt when
// the majelis falls out) because it is the sum of two requirements that land at
// different times. A name is not the sum of anything, so the same journey can
// be stated once and never corrected — the amounts move down into the tier's
// benefits, where a range is normal and nobody is being promised a number.

export const TIER_DEFAULT = 'Mitra'
export const TIER_GOAL = 'Mitra Juara'

/**
 * What arriving is worth. Deliberately three lines with no figures on home —
 * the exact limit is a detail-page concern (see LIMIT_INCREASE / GROUP_BONUS).
 *
 * The majelis is NOT a gate on the tier: she earns Juara with her own 48 weeks,
 * and the group makes one benefit bigger. A mitra with a perfect record is
 * never told she failed because of her neighbours — the group note rides along
 * on the limit line instead.
 */
export const TIER_BENEFITS = [
  {
    title: 'Limit lebih tinggi',
    note: 'Lebih tinggi lagi kalau kelompok Ibu juga tercapai',
  },
  { title: 'Pencairan lebih fleksibel' },
  { title: 'Pilihan tenor lebih banyak' },
] as const

// --- The two currencies ----------------------------------------------------
// Keeping these apart is what makes the whole thing explainable: the POT is
// what Ibu can take out at the next disbursement window, the LIMIT is how big
// her next loan can be. Four good weeks add to the pot. Week 48 and the majelis
// move the limit.
//
// The four-week reward is NOT cash and never lands in her hand on the day: it
// is an increment on what the next window will disburse. Three good chapters
// inside a window means Rp1,5jt at that window; miss one and the window pays
// Rp1jt. That is why nothing in this prototype says "hadiah cair sekarang".

/** Weeks between withdrawal windows — every three months. */
export const WINDOW_EVERY = 12
/** Good chapters that fit inside one window: 3, so a full window pays Rp1,5jt. */
export const CHAPTERS_PER_WINDOW = WINDOW_EVERY / CHAPTER_LENGTH
/** The most one window can disburse when no week is missed. */
export const WINDOW_CEILING = CHAPTERS_PER_WINDOW * MILESTONE_REWARD

// --- The majelis lever -----------------------------------------------------
// 90% of the tenor must be weeks where the WHOLE group was complete: 43 of 48,
// so the group can afford five broken weeks. That budget is never shown — see
// groupStatus below for why.

export const GROUP_SIZE = 15
export const GROUP_BONUS = 1_000_000
export const GROUP_THRESHOLD_WEEKS = 43
export const GROUP_SLACK = TOTAL_WEEKS - GROUP_THRESHOLD_WEEKS
/** How far back the displayed status looks. Recent, so it can be recovered. */
export const GROUP_RECENT_WEEKS = 8

/** Inclusive integer range — the weeks already behind her. */
export function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

/** Short rupiah, the way the amount is spoken: Rp500rb, Rp2jt. */
export function short(amount: number): string {
  if (amount >= 1_000_000) {
    const jt = amount / 1_000_000
    return `Rp${Number.isInteger(jt) ? jt : jt.toFixed(1).replace('.', ',')}jt`
  }
  return `Rp${Math.round(amount / 1_000)}rb`
}

/** Full rupiah, for the places that state an exact figure. */
export function rupiah(amount: number): string {
  return `Rp${amount.toLocaleString('id-ID')}`
}

export type CellStatus = 'done' | 'missed' | 'active' | 'future'

export interface WeekCell {
  week: number
  status: CellStatus
}

// --- Derivations -----------------------------------------------------------

/** Good weeks banked so far, across the whole journey. */
export function goodWeeks(s: AppState): number {
  return s.done.length
}

/** How far along the 48 weeks she is, 0–100. Drives the destination bar. */
export function journeyPercent(s: AppState): number {
  return Math.round((goodWeeks(s) / TOTAL_WEEKS) * 100)
}

/**
 * Is she already Mitra Juara? Two ways in: she finished the 48 weeks in this
 * tenor, or she arrived in an earlier one and carried the status over — which
 * is the whole point of a tier over a one-off limit increase. A limit rise
 * happens once; a standing is something the next 48 weeks maintain.
 */
export function isJuara(s: AppState): boolean {
  return s.tier === 'juara' || goodWeeks(s) >= TOTAL_WEEKS
}

/** Milestones already reached. */
export function milestonesEarned(s: AppState): number {
  return Math.floor(goodWeeks(s) / CHAPTER_LENGTH)
}

/** The tiles of the chapter now in progress — four, plus one per missed week. */
export function chapterCells(s: AppState): WeekCell[] {
  const missed = s.missed.filter((w) => w >= s.chapterStart)
  const length = CHAPTER_LENGTH + missed.length
  const cells: WeekCell[] = []
  for (let i = 0; i < length; i++) {
    const week = s.chapterStart + i
    cells.push({ week, status: cellStatus(s, week) })
  }
  return cells
}

function cellStatus(s: AppState, week: number): CellStatus {
  if (s.done.includes(week)) return 'done'
  if (s.missed.includes(week)) return 'missed'
  if (week === s.week) return 'active'
  return 'future'
}

/** Good weeks banked inside the current chapter. */
export function chapterProgress(s: AppState): number {
  return s.done.filter((w) => w >= s.chapterStart).length
}

/** Good weeks still owed before the next reward opens. */
export function weeksToReward(s: AppState): number {
  return Math.max(0, CHAPTER_LENGTH - chapterProgress(s))
}

/** True the moment the chapter's fourth good week lands. */
export function rewardReady(s: AppState): boolean {
  return chapterProgress(s) >= CHAPTER_LENGTH
}

/** Is the current chapter the last one — the limit increase rather than a payout? */
export function onFinalChapter(s: AppState): boolean {
  return milestonesEarned(s) >= TOTAL_CHAPTERS - 1
}

// --- The pot and its window ------------------------------------------------

/** Everything the milestones have banked and she has not taken out yet. */
export function pot(s: AppState): number {
  return (milestonesEarned(s) - s.withdrawnMilestones) * MILESTONE_REWARD
}

/** The next week a withdrawal is actually possible. */
export function nextWindow(s: AppState): number {
  return Math.min(Math.ceil(s.week / WINDOW_EVERY) * WINDOW_EVERY, TOTAL_WEEKS)
}

export function weeksToWindow(s: AppState): number {
  return Math.max(0, nextWindow(s) - s.week)
}

// --- The majelis -----------------------------------------------------------

export type GroupStatus = 'baik' | 'jaga' | 'lewat'

/**
 * What the mitra is shown about her group — and deliberately NOT a countdown.
 *
 * A visible allowance ("5 kesempatan left") turns a safety margin into a budget
 * people feel free to spend, and makes every miss a countable public event in a
 * group that meets face to face. So the status is qualitative, it is driven by
 * RECENT weeks rather than by the lifetime budget — which is what lets a group
 * earn its way back to "Baik", and what makes "pertahankan" literally true —
 * and it never has a bad-sounding third state.
 *
 * `lewat` is not a grade. It means the 90% is arithmetically out of reach, and
 * the block stays on screen saying so plainly rather than vanishing.
 */
export function groupStatus(s: AppState): GroupStatus {
  if (s.groupBroken.length > GROUP_SLACK) return 'lewat'
  const recent = s.groupBroken.filter((w) => w > s.week - GROUP_RECENT_WEEKS)
  if (s.groupShort > 0 || recent.length > 0) return 'jaga'
  return 'baik'
}

/** Weeks the whole majelis completed. The real figure, for the detail page. */
export function groupGoodWeeks(s: AppState): number {
  return s.week - 1 - s.groupBroken.length
}

/** The limit increase still on the table: hers alone, or hers plus the group's. */
export function limitOnOffer(s: AppState): number {
  return groupStatus(s) === 'lewat' ? LIMIT_INCREASE : LIMIT_INCREASE + GROUP_BONUS
}

// --- The full ladder, for the progress page --------------------------------

export type ChapterStatus = 'done' | 'current' | 'locked'

export interface Chapter {
  index: number
  status: ChapterStatus
  cells: WeekCell[]
  /** The last chapter pays a limit increase instead of a disbursement. */
  final: boolean
}

/**
 * All twelve chapters. Past ones are the weeks she actually banked; the current
 * one is live; future ones are nominal — they assume no further missed weeks,
 * because there is no honest way to predict one.
 */
export function ladder(s: AppState): Chapter[] {
  const earned = milestonesEarned(s)
  const banked = [...s.done].sort((a, b) => a - b)
  const live = chapterCells(s)
  const out: Chapter[] = []

  for (let i = 0; i < TOTAL_CHAPTERS; i++) {
    const final = i === TOTAL_CHAPTERS - 1
    if (i < earned) {
      out.push({
        index: i,
        status: 'done',
        cells: banked
          .slice(i * CHAPTER_LENGTH, (i + 1) * CHAPTER_LENGTH)
          .map((week) => ({ week, status: 'done' as const })),
        final,
      })
    } else if (i === earned) {
      out.push({ index: i, status: 'current', cells: live, final })
    } else {
      const start = live[live.length - 1].week + 1 + (i - earned - 1) * CHAPTER_LENGTH
      out.push({
        index: i,
        status: 'locked',
        cells: Array.from({ length: CHAPTER_LENGTH }, (_, k) => ({
          week: start + k,
          status: 'future' as const,
        })),
        final,
      })
    }
  }

  return out
}
