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

// --- The status (option B) -------------------------------------------------
// B used to name a TIER — a club she joined at week 12 and could be thrown out
// of. That was wrong about its own mechanics: the thing moves down mid-tenor
// and recovers, which is a reading of how the loan is going, not a membership.
// So it is a GRADE now, on the financing rather than on her: Status Modal.
//
// Three things fall out of the rename, and they are why it is a simplification
// rather than a re-skin:
//
//   · There is no "earning" state. A tier had to be won before it could be
//     shown, so B's first twelve weeks displayed an empty promise. A grade
//     exists from week 1 — a new mitra is already Baik — so the card is never
//     about something she does not have.
//   · Nothing to compare. The Mitra-versus-Mitra-Juara table is gone: there is
//     one loan, and the four grades below are the whole of its scale.
//   · Losing it reads as "this stretch was not clean", not as demotion. In a
//     majelis that meets face to face, that difference is the whole design.
//
// The MAJELIS is deliberately not one of the criteria. Her grade must only ever
// be moved by things she can do on Thursday — she can pay all 48 weeks herself
// and still have three members fall short, and a grade she cannot act on is a
// punishment, not a signal. The group keeps the one benefit it actually moves:
// the size of the limit rise at week 48. See LIMIT_CEILING.

export const STATUS_NAME = 'Status Modal'

/** The scale, best first. Four names, and two of them pay differently. */
export type Grade = 'sangat-baik' | 'baik' | 'perlu-ditingkatkan' | 'tidak-lancar'

export interface GradeInfo {
  id: Grade
  label: string
  /** What earns it, in her own terms. */
  earned: string
}

/**
 * The ladder. Only the top two add anything, and they add different amounts —
 * which is the one place in B where a grade has a price attached, and the
 * reason the scale is worth naming at all. A grade with no consequence is
 * decoration and invites gaming.
 *
 * The bottom two are one outcome (nothing is added) wearing two names, because
 * they are two different situations for HER: one is this stretch going wrong
 * and still savable, the other is arrears that outlived a close.
 */
export const GRADES: GradeInfo[] = [
  {
    id: 'sangat-baik',
    label: 'Sangat Baik',
    earned: 'Semua angsuran tepat waktu',
  },
  {
    id: 'baik',
    label: 'Baik',
    earned: 'Semua angsuran lunas, ada yang terlambat',
  },
  {
    id: 'perlu-ditingkatkan',
    label: 'Perlu Ditingkatkan',
    earned: 'Ada angsuran yang belum dibayar, atau kumpulan kurang',
  },
  {
    id: 'tidak-lancar',
    label: 'Tidak Lancar',
    earned: 'Tunggakan terbawa sampai 12 minggu berikutnya',
  },
]

export function gradeInfo(id: Grade): GradeInfo {
  return GRADES.find((g) => g.id === id) ?? GRADES[0]
}

// ===========================================================================
// Option B — the window model
// ===========================================================================
//
// Everything from here to the next banner belongs to B alone. A is FROZEN: it
// keeps the chapter/pot arithmetic below, which frames four good weeks as
// banking Rp500rb toward the next disbursement. That framing is wrong about
// what a disbursement IS, and B is the correction.
//
// What a disbursement actually is: she re-borrows principal she has already
// repaid. Nothing is banked on her behalf, so nothing can be forfeited — and
// holding a window shut is a credit decision, not a withheld reward. Which is
// why B computes no payout arithmetic at all. The risk engine owns the figure;
// this model owns the standing and the direction.
//
// The rule of numbers B is built to, and the reason the constants below are so
// thin:
//
//   · QUOTED figures are fine — her limit, her instalment, the amount actually
//     offered at a window. They are engine output, shown as fact at the moment
//     it is true.
//   · FORMULAS are not. Nothing here lets a mitra compute a future amount.
//     Predicting a figure the engine may not honour is worse than saying
//     nothing.
//   · RULES ABOUT HER OWN BEHAVIOUR stay concrete. "Pay every week, be at 10 of
//     12 kumpulan" is not a money promise, it is the ask. The vagueness belongs
//     on the payout, never on what is expected of her.

/** The disbursement window: 12 weeks, four to a tenor. B's whole cadence. */
export const WINDOW_LENGTH = 12
export const WINDOWS_IN_TENOR = TOTAL_WEEKS / WINDOW_LENGTH

/**
 * Attendance is the one lever with slack, measured per window rather than
 * across the tenor — the window is the unit of the standing, and a tenor-wide
 * budget would let her bank every absence early and coast.
 *
 * The asymmetry with payment is deliberate and defensible: paying is the
 * contract, so a single unpaid week drops the standing; the kumpulan can be
 * blocked by illness or harvest, so it gets two.
 */
export const KUMPULAN_REQUIRED = 10
export const ABSENCE_BUDGET = WINDOW_LENGTH - KUMPULAN_REQUIRED

/**
 * The three rules, in the mitra's own terms. Concrete because they are about
 * her behaviour, not about our money — this is the one list in B allowed to
 * carry a number, and the reason the rest of B can afford to be vague.
 *
 * All three are hers alone. The majelis is not here on purpose (see the status
 * banner at the top of this file); it is named once, under the limit benefit,
 * where it actually does something.
 */
export const STATUS_RULES = [
  {
    rule: 'Bayar angsuran setiap minggu',
    note: `Satu minggu belum dibayar sampai minggu ke-${WINDOW_LENGTH} membuat status turun`,
  },
  {
    rule: 'Telat masih boleh',
    note: 'Status tetap aman, tapi jumlah yang ditambahkan berkurang',
  },
  {
    rule: `Hadir minimal ${KUMPULAN_REQUIRED} dari ${WINDOW_LENGTH} kumpulan`,
    note: `Boleh tidak hadir ${WINDOW_LENGTH - KUMPULAN_REQUIRED} kali dalam ${WINDOW_LENGTH} minggu`,
  },
] as const

/**
 * What one window ADDS. The distinction is the whole model, and the copy on
 * every screen has to keep it: twelve clean weeks do not open a door that shuts
 * again, they raise a balance. That balance never expires and is hers to take
 * whenever she wants it — all of it, or part of it, at week 12 or at week 29.
 * It is the same shape as option A; A just increments every four weeks instead
 * of every twelve.
 *
 * So "pencairan terbuka" is the wrong verb everywhere: the behaviour gates the
 * INCREMENT, never the withdrawal.
 *
 * The figure itself: a quarter of her limit, because over the 48
 * weeks she repays the whole of it and the window is a quarter of the tenor.
 *
 * This one figure is safe to print ahead of time, and the distinction matters:
 * it is arithmetic on HER OWN contract — the principal she will have repaid by
 * week 12, 24, 36, 48 — not a prediction of what the engine will approve. The
 * engine owns two things only: whether the window opens at all, and whether the
 * amount is trimmed. So the milestone track can carry this number honestly,
 * while nothing anywhere may carry the trim as a formula.
 */
export const WINDOW_DISBURSEMENT = CURRENT_LIMIT / WINDOWS_IN_TENOR

/** The ceiling, quoted when twelve weeks came in on time. */
export const QUOTE_FULL = WINDOW_DISBURSEMENT
/**
 * The trimmed quote. NOT derived and never presented as derivable — there is no
 * rate and no per-week penalty connecting it to the figure above, because that
 * connection is the engine's and not ours to hand over.
 */
export const QUOTE_REDUCED = 900_000

/** What a closed window ended up releasing. */
export function windowQuote(outcome: WindowOutcome): number {
  if (outcome === 'failed') return 0
  return outcome === 'reduced' ? QUOTE_REDUCED : QUOTE_FULL
}

/**
 * Everything a closed window released and she has not taken out yet. Windows do
 * not expire — a mitra who leaves week 12's disbursement alone for a month
 * still has it — so this sums every unclaimed one rather than only the last.
 */
export function disbursable(s: AppState): number {
  return s.windowLog.reduce(
    (sum, outcome, i) => (i + 1 > s.disbursedWindows ? sum + windowQuote(outcome) : sum),
    0,
  )
}

/** How a window that has already closed ended. */
export type WindowOutcome = 'full' | 'reduced' | 'failed'

/** 1-based: which window the given week falls inside. */
export function windowOf(week: number): number {
  return Math.min(Math.ceil(week / WINDOW_LENGTH), WINDOWS_IN_TENOR)
}

export function windowStart(index: number): number {
  return (index - 1) * WINDOW_LENGTH + 1
}

export function windowEnd(index: number): number {
  return index * WINDOW_LENGTH
}

/** The window now in progress. */
export function currentWindow(s: AppState): number {
  return windowOf(s.week)
}

/** Weeks of the open window already behind her, including the one in progress. */
export function weeksIntoWindow(s: AppState): number {
  return s.week - windowStart(currentWindow(s)) + 1
}

/** Progress through the open window, 0–100. B's bar counts 12, never 48. */
export function windowPercent(s: AppState): number {
  return Math.round(((weeksIntoWindow(s) - 1) / WINDOW_LENGTH) * 100)
}

/** Weeks left before the window closes and the decision is made. */
export function weeksLeftInWindow(s: AppState): number {
  return windowEnd(currentWindow(s)) - s.week
}

function inWindow(weeks: number[], index: number): number[] {
  return weeks.filter((w) => w >= windowStart(index) && w <= windowEnd(index))
}

/** Weeks still owed inside a window — the thing that drops the standing. */
export function outstandingIn(s: AppState, index: number): number[] {
  return inWindow(s.unpaid, index)
}

/** Weeks paid, but after their own week had passed. These grade the amount. */
export function lateIn(s: AppState, index: number): number[] {
  return inWindow(s.late, index)
}

/** Kumpulan missed inside a window. Two are affordable; the third drops it. */
export function absencesIn(s: AppState, index: number): number[] {
  return inWindow(s.absent, index)
}

/** Absences she can still afford in the open window. */
export function absencesLeft(s: AppState): number {
  return Math.max(0, ABSENCE_BUDGET - absencesIn(s, currentWindow(s)).length)
}

/** Has attendance already fallen through the floor in this window? */
export function attendanceLost(s: AppState): boolean {
  return absencesIn(s, currentWindow(s)).length > ABSENCE_BUDGET
}

/**
 * The grade right now — the one derivation every B screen reads.
 *
 * It is a reading of the stretch she is INSIDE, not of the whole tenor: twelve
 * weeks is the unit the increment is paid on, so it is the unit the status is
 * judged on. The single exception is `tidak-lancar`, which is the only grade
 * that can be inherited from a stretch already closed — arrears that outlived a
 * close are still arrears.
 *
 * Attendance inside its budget does NOT cost her the top grade. Two absences
 * are explicitly allowed, and a rule that is allowed but still penalised is a
 * trap.
 */
export function gradeOf(s: AppState): Grade {
  const now = currentWindow(s)
  const carriedFailure = s.windowLog.includes('failed') && s.tier === 'mitra'

  if (carriedFailure && s.unpaid.length > 0) return 'tidak-lancar'
  if (outstandingIn(s, now).length > 0 || attendanceLost(s)) return 'perlu-ditingkatkan'
  // Recovered from a failure, or paid everything but paid some of it late.
  if (carriedFailure || lateIn(s, now).length > 0) return 'baik'
  return 'sangat-baik'
}

/**
 * What twelve weeks at a grade add to what she can disburse. The whole point of
 * having four names: the top two pay differently, so climbing from Baik to
 * Sangat Baik is worth a stated figure rather than a compliment.
 */
export function gradeIncrement(id: Grade): number {
  if (id === 'sangat-baik') return QUOTE_FULL
  if (id === 'baik') return QUOTE_REDUCED
  return 0
}

/** The grade a closed window was graded at, from how it ended. */
export function gradeOfOutcome(outcome: WindowOutcome): Grade {
  if (outcome === 'full') return 'sangat-baik'
  return outcome === 'reduced' ? 'baik' : 'tidak-lancar'
}

/** How a single criterion is standing right now. */
export type CriterionState = 'met' | 'warn' | 'fail'

export interface Criterion {
  label: string
  note: string
  state: CriterionState
}

/**
 * What holds the grade up, as two rows she can read against her own week. Both
 * are things she does herself — the majelis is not on this list, because a
 * criterion she cannot act on is a punishment rather than a signal.
 */
export function criteria(s: AppState): Criterion[] {
  const now = currentWindow(s)
  const unpaid = outstandingIn(s, now).length
  const late = lateIn(s, now).length
  const absent = absencesIn(s, now).length

  return [
    {
      label: 'Bayar angsuran tepat waktu',
      note:
        unpaid > 0
          ? `${unpaid} minggu belum dibayar`
          : late > 0
            ? `${late} minggu dibayar terlambat`
            : 'Semua tepat waktu sejauh ini',
      state: unpaid > 0 ? 'fail' : late > 0 ? 'warn' : 'met',
    },
    {
      label: `Datang kumpulan minimal ${KUMPULAN_REQUIRED} dari ${WINDOW_LENGTH}`,
      note:
        absent > ABSENCE_BUDGET
          ? `Tidak hadir ${absent} kali di 12 minggu ini`
          : absent > 0
            ? `Sisa ${absencesLeft(s)} kali tidak hadir`
            : 'Hadir terus sejauh ini',
      state: absent > ABSENCE_BUDGET ? 'fail' : absent > 0 ? 'warn' : 'met',
    },
  ]
}

/**
 * The week a disbursement can next be expected. Always the end of the open
 * window — a dropped standing does not push the date out, it just has to be
 * recovered before that date arrives.
 */
export function accessWeek(s: AppState): number {
  return windowEnd(currentWindow(s))
}

/**
 * Full or reduced — direction only, and the ONE thing about the amount this
 * model is willing to state ahead of the window. A late week means less; the
 * figure itself waits for the engine.
 */
export function amountDirection(s: AppState): 'full' | 'reduced' {
  return lateIn(s, currentWindow(s)).length > 0 ? 'reduced' : 'full'
}

/** How the window containing `week` closed, or would close right now. */
export function outcomeOf(s: AppState, index: number): WindowOutcome {
  if (outstandingIn(s, index).length > 0 || absencesIn(s, index).length > ABSENCE_BUDGET) {
    return 'failed'
  }
  return lateIn(s, index).length > 0 ? 'reduced' : 'full'
}

export type WindowStatus = 'closed' | 'open' | 'future'

export interface WindowRow {
  index: number
  from: number
  to: number
  status: WindowStatus
  /** Only meaningful once the window has closed, or for the open one's forecast. */
  outcome: WindowOutcome
  /** The last window is the one that decides the tenor-end limit. */
  final: boolean
}

/**
 * The four beats of the tenor: earn, hold, hold, graduate. This strip is B's
 * spine and replaces the 48-tile ladder — under this model four weeks buys
 * rhythm and nothing else, so the chapter has no place on B's pages.
 */
/** full < reduced < failed. A window is only ever graded down, never up. */
const OUTCOME_RANK: Record<WindowOutcome, number> = { full: 0, reduced: 1, failed: 2 }

/**
 * The worse of what the log says and what the weeks say. A logged outcome can
 * only be MORE severe than the weeks — arrears cleared after a close leave a
 * window that stays failed with nothing owed — but it must never be kinder:
 * a window whose own boxes show an unpaid week cannot print a full increment
 * because the seed happened not to log it.
 */
function gradedOutcome(s: AppState, index: number): WindowOutcome {
  const logged = s.windowLog[index - 1]
  const fromWeeks = outcomeOf(s, index)
  if (!logged) return fromWeeks
  return OUTCOME_RANK[logged] >= OUTCOME_RANK[fromWeeks] ? logged : fromWeeks
}

export function windowRows(s: AppState): WindowRow[] {
  const now = currentWindow(s)
  return Array.from({ length: WINDOWS_IN_TENOR }, (_, i) => {
    const index = i + 1
    const status: WindowStatus = index < now ? 'closed' : index === now ? 'open' : 'future'
    return {
      index,
      from: windowStart(index),
      to: windowEnd(index),
      status,
      outcome: status === 'closed' ? gradedOutcome(s, index) : outcomeOf(s, index),
      final: index === WINDOWS_IN_TENOR,
    }
  })
}

/**
 * The twelve weeks of one window, each with its own verdict. B's detail page
 * draws a stretch the way A draws a chapter — as the weeks it is made of —
 * because a grade with no visible weeks behind it is the same unsupported
 * opinion the home band would be without its count.
 */
export function windowCells(s: AppState, index: number): WeekCell[] {
  return range(windowStart(index), windowEnd(index)).map((week) => ({
    week,
    status: paymentStatus(s, week),
  }))
}

/** True on the last week of a window — the week that triggers the decision. */
export function closesWindow(s: AppState): boolean {
  return s.week === windowEnd(currentWindow(s))
}

// ===========================================================================
// Option A — frozen
// ===========================================================================

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

/**
 * The ceiling on the week-48 rise, and the ONE place the majelis shows up in
 * the status model. Her own record decides whether the limit rises at all;
 * the group decides whether it stops at FINAL_LIMIT or reaches this — which is
 * why the benefit has to be quoted as "hingga", and why the group can never be
 * one of her status criteria.
 */
export const LIMIT_CEILING = FINAL_LIMIT + GROUP_BONUS
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
  // Nothing is spoken as "Rp0rb" — an empty pot is a flat Rp0.
  if (amount < 1_000) return 'Rp0'
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

/**
 * What a week is worth once it is behind her.
 *
 * `done` is paid on time, `late` is paid after its own week had passed, and
 * `missed` is never paid at all. Three verdicts, not two, because the middle one
 * is the whole reason the increase can come out smaller than Rp500rb instead of
 * simply not coming.
 */
export type CellStatus = 'done' | 'late' | 'missed' | 'active' | 'future'

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

// ===========================================================================
// The repayment tracker — what the detail page actually is
// ===========================================================================
//
// The 48 weeks read as the repayment schedule they are. Every week behind her
// carries one of three verdicts — paid, paid late, not paid — and every FOUR
// weeks those verdicts settle into one figure: what that block added to the
// amount she can disburse.
//
//   · four clean weeks     → +Rp500rb
//   · a late week          → a quarter off, per late week
//   · a week never paid    → the block adds nothing at all
//
// A block is four CALENDAR weeks, not four good ones. That is the difference
// from `ladder` above, and it is deliberate: the schedule does not grow to make
// room for a week she skipped, because the due dates did not move either. Which
// is also why every row on the page is exactly four boxes wide.

/** What one late week costs the block: a quarter of the increase. */
export const LATE_REDUCTION = MILESTONE_REWARD / CHAPTER_LENGTH

export type CycleStatus = 'closed' | 'open' | 'future'

export interface Cycle {
  /** 1-based, 1–12. */
  index: number
  from: number
  to: number
  status: CycleStatus
  /** Always exactly CHAPTER_LENGTH cells. */
  cells: WeekCell[]
  late: number
  unpaid: number
  /** What these four weeks add to what she can disburse. */
  increment: number
}

/** The verdict on a single week. Order matters: unpaid beats late beats paid. */
export function paymentStatus(s: AppState, week: number): CellStatus {
  if (s.unpaid.includes(week) || s.missed.includes(week)) return 'missed'
  if (s.late.includes(week)) return 'late'
  if (s.done.includes(week)) return 'done'
  if (week === s.week) return 'active'
  return 'future'
}

/** The one rule of the tracker, in one line. */
export function cycleIncrement(late: number, unpaid: number): number {
  if (unpaid > 0) return 0
  return Math.max(0, MILESTONE_REWARD - late * LATE_REDUCTION)
}

/** The twelve four-week blocks of the tenor. */
export function cycles(s: AppState): Cycle[] {
  return Array.from({ length: TOTAL_CHAPTERS }, (_, i) => {
    const from = i * CHAPTER_LENGTH + 1
    const to = from + CHAPTER_LENGTH - 1
    const cells = range(from, to).map((week) => ({ week, status: paymentStatus(s, week) }))
    const late = cells.filter((c) => c.status === 'late').length
    const unpaid = cells.filter((c) => c.status === 'missed').length

    return {
      index: i + 1,
      from,
      to,
      status: to < s.week ? 'closed' : from <= s.week ? 'open' : 'future',
      cells,
      late,
      unpaid,
      increment: cycleIncrement(late, unpaid),
    }
  })
}

/**
 * What she can take out right now: everything the CLOSED blocks added and she
 * has not disbursed yet. `withdrawnMilestones` counts the blocks already taken,
 * so an open block never contributes — a figure the four weeks have not
 * finished earning is not hers to see as available.
 */
export function withdrawable(s: AppState): number {
  return cycles(s)
    .filter((c) => c.status === 'closed' && c.index > s.withdrawnMilestones)
    .reduce((total, c) => total + c.increment, 0)
}

/** The week the open block closes — when the amount can next move. */
export function disbursementWeek(s: AppState): number {
  return Math.min(Math.ceil(s.week / CHAPTER_LENGTH) * CHAPTER_LENGTH, TOTAL_WEEKS)
}

export function weeksToDisbursement(s: AppState): number {
  return Math.max(0, disbursementWeek(s) - s.week)
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
