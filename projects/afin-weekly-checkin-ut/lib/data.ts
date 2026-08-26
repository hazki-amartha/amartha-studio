// The rules of the check-in, and the derivations every screen reads.
//
// The tenor is 48 weeks read as four 12-week stretches. Each stretch is graded
// on how she paid inside it, and the grade decides what that stretch adds to
// the amount she can disburse.

import type { AppState } from './store'

export const TOTAL_WEEKS = 48

export const FINAL_LIMIT = 7_000_000
export const CURRENT_LIMIT = 5_000_000

// --- The status ------------------------------------------------------------
// It is a GRADE on the financing rather than a membership she joins: the thing
// moves down mid-tenor and recovers, which is a reading of how the loan is
// going. Three things fall out of that, and they are why it is a
// simplification rather than a re-skin:
//
//   · There is no "earning" state. A grade exists from week 1 — a new mitra is
//     already Baik — so the card is never about something she does not have.
//   · Nothing to compare. There is one loan, and the four grades below are the
//     whole of its scale.
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
 * which is the one place a grade has a price attached, and the reason the scale
 * is worth naming at all. A grade with no consequence is decoration and invites
 * gaming.
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
// The window model
// ===========================================================================
//
// What a disbursement actually is: she re-borrows principal she has already
// repaid. Nothing is banked on her behalf, so nothing can be forfeited — and
// holding a window shut is a credit decision, not a withheld reward. Which is
// why this model computes no payout arithmetic at all. The risk engine owns the
// figure; this model owns the standing and the direction.
//
// The rule of numbers, and the reason the constants below are so thin:
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

/** The disbursement window: 12 weeks, four to a tenor. The whole cadence. */
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
 * her behaviour, not about our money — this is the one list allowed to carry a
 * number, and the reason the rest can afford to be vague.
 *
 * All three are hers alone. The majelis is not here on purpose (see the status
 * banner at the top of this file); it is named once, on the majelis page, where
 * it actually does something.
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
 *
 * So "pencairan terbuka" is the wrong verb everywhere: the behaviour gates the
 * INCREMENT, never the withdrawal.
 *
 * The figure itself: a quarter of her limit, because over the 48 weeks she
 * repays the whole of it and the window is a quarter of the tenor.
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
 * The grade right now — the one derivation every screen reads.
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

/** The four beats of the tenor: earn, hold, hold, graduate. */
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
 * The twelve weeks of one window, each with its own verdict — because a grade
 * with no visible weeks behind it is an unsupported opinion.
 */
export function windowCells(s: AppState, index: number): WeekCell[] {
  return range(windowStart(index), windowEnd(index)).map((week) => ({
    week,
    status: paymentStatus(s, week),
  }))
}

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

// --- The roster ------------------------------------------------------------
// Who has paid this week, name by name. This page USED to withhold it — a count
// and no names, on the argument that a majelis meets face to face and a
// screenshot-able list of who is behind adds a permanent record to a room that
// has none. Overruled by the designer 2026-08-03: the group's standing is a
// shared obligation she is asked to protect, and a bare count is something she
// cannot act on. Same shape as the majelis page in afin-milestone-journey.

export interface Member {
  name: string
  /** Has this week's instalment posted? */
  bayar: boolean
  /** Her own row, pulled out of the list under "Anda". */
  you?: boolean
}

/**
 * The five members the page names, besides her. Fifteen rows is a scroll for no
 * gain — the ones worth reading are the ones still owing, so `groupShort` lands
 * on the top of this list and the rest of the majelis stays a count.
 */
const ROSTER = ['Ibu Ratna', 'Ibu Yuni', 'Ibu Dewi', 'Ibu Marni', 'Ibu Wati']

export function members(s: AppState): Member[] {
  // The short ones sort to the top, so the list and the count on the card can
  // never disagree with each other on screen.
  const short = Math.min(s.groupShort, ROSTER.length)
  return [
    { name: 'Ibu Siti', bayar: s.paid, you: true },
    ...ROSTER.map((name, i) => ({ name, bayar: i >= short })),
  ]
}

/** Members the page does not name. All current — anyone owing is named above. */
export const UNNAMED_MEMBERS = GROUP_SIZE - 1 - ROSTER.length

/**
 * How many of the majelis have paid this week. Counted off the roster rather
 * than off `groupShort`, so the sentence on home and the rows on the majelis
 * page can never disagree — her own unpaid week counts here too.
 */
export function paidThisWeek(s: AppState): number {
  return GROUP_SIZE - members(s).filter((m) => !m.bayar).length
}

// --- The calendar -----------------------------------------------------------
// Home's track carries DATES, not week numbers. "Minggu 24" is our unit, not
// hers: a mitra knows when Lebaran is and when school fees are due, and a
// milestone she can put against those is a milestone she can plan around. The
// week number survives everywhere it is the subject — the status page's
// stretches, the verdict screen — because there it names a stretch rather than
// answering "when".

/**
 * Week 1's due date, fixed rather than read off today's clock. The same
 * prototype has to draw the same dates on every machine and on every render:
 * a date derived from `now` would differ between the server pass and the
 * client one, which is a hydration mismatch, and it would also make two
 * screenshots taken a month apart disagree for no reason.
 *
 * A Thursday, because the kumpulan is Thursday. Chosen so the default journey
 * (week 15) sits around the middle of 2026.
 */
const TENOR_START = Date.UTC(2026, 3, 23)
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

/** The date week `n` falls on, spoken the short way: "9 Jul". */
export function weekDate(n: number): string {
  // UTC throughout — a local-time Date would shift the day across timezones and
  // reintroduce exactly the drift the fixed start date exists to prevent.
  const d = new Date(TENOR_START + (n - 1) * WEEK_MS)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

// --- Weeks and formatting ---------------------------------------------------

/** Inclusive integer range — the weeks already behind her. */
export function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

/** Short rupiah, the way the amount is spoken: Rp500rb, Rp2jt. */
export function short(amount: number): string {
  // Nothing is spoken as "Rp0rb" — an empty balance is a flat Rp0.
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
 * is the whole reason the increase can come out smaller instead of simply not
 * coming.
 */
export type CellStatus = 'done' | 'late' | 'missed' | 'active' | 'future'

export interface WeekCell {
  week: number
  status: CellStatus
}

/** The verdict on a single week. Order matters: unpaid beats late beats paid. */
export function paymentStatus(s: AppState, week: number): CellStatus {
  if (s.unpaid.includes(week)) return 'missed'
  if (s.late.includes(week)) return 'late'
  if (s.done.includes(week)) return 'done'
  if (week === s.week) return 'active'
  return 'future'
}

/** Good weeks banked so far, across the whole journey. */
export function goodWeeks(s: AppState): number {
  return s.done.length
}
