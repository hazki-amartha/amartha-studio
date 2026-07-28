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
