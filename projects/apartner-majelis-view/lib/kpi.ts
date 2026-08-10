'use client'

// The KPI model, ported from `apartner-homepage-ia` so the two directions are
// judged on the same numbers.
//
// The shape of the thing being measured is the point: a BP is not on four daily
// targets, she is on SEVEN monthly parameters, each carrying its own flat rupiah
// bonus. That is why the page leads with "n dari 7 target tercapai" and an
// incentive split into earned / still on the table — the money is the reason she
// opens this tab, and a percentage that doesn't say what it is worth is a number
// she has to convert herself.

export interface KpiRowDef {
  k: string
  n: string
  unit: string
  target: number
  /**
   * Mitra count the percentage is computed against — omitted for the raw-count
   * row (mitraNew), which targets a count directly.
   */
  base?: number
  baseLabel?: string
  /** Lower-is-better row (the DPD buckets past 0). */
  lower?: boolean
  /**
   * The incentive gate, in the same unit as `target` — and a LOOSER bar than
   * the target, not a stricter one. Three bands come out of the pair: below the
   * min is non-performing, the min itself pays nothing, and everything past it
   * earns. The target still sits above as the number she is actually aiming at.
   *
   * All five targets now come from the "KPI Business Partner" table the
   * business shared (Sales & Growth + Risk & Portfolio Management, 100%
   * across five rows on a 100-mitra book) — but that table states TARGETS and
   * WEIGHTS only, not a gate. Every `min` below is still a PLACEHOLDER at
   * roughly 94% of its target, wrong enough that it must be replaced with a
   * real figure before anyone quotes it.
   */
  min: number
  /** Flat Rp bonus earned when this parameter's target is met — the v1 model. */
  bonus: number
  /**
   * The v2 model: this parameter's share of the whole scoreboard, in percent.
   * A parameter no longer carries its own rupiah — it carries WEIGHT, and the
   * seven weights sum to 100. Overall completion is the weighted roll-up of how
   * far each parameter has come, and the bonus hangs off that one number at the
   * three tiers below.
   */
  weight: number
  /**
   * Which half of the job this parameter belongs to, and the reason the two are
   * named apart: collection GATES growth. Miss Mitra DPD 0 and the incentive on
   * every growth parameter is annulled, however well she did on it — the book
   * she is lending against has to be healthy before selling more into it counts
   * for anything.
   *
   * DPD 0 alone is the gate, not every collection row — see `collectionMet`.
   */
  group: KpiGroup
}

/** `collection` — the DPD buckets. `growth` — disbursement and cross-sell. */
export type KpiGroup = 'collection' | 'growth'

/** The BP's book: ten majelis, a hundred mitra. */
export const BP_TOTAL_MITRA = 100
export const BP_TOTAL_MAJELIS = 10

/**
 * The DPD rows are NOT measured against the full 100-mitra book — a mitra only
 * has a DPD status while she has an installment due this cycle, and not all 100
 * do at once. `DPD_POOL` is that smaller, plausible pool (illustrative, not a
 * real figure): the ~40 mitra with a payment due this month, which DPD 0,
 * DPD 1–30, and DPD 31–90 are three mutually exclusive readings of.
 *
 * Restating a 98% target against the full 100 would print "diatas 98 mitra" —
 * almost the entire book current on the same day, which overstates what the
 * number means. Against a 40-mitra pool it prints "diatas 39 mitra", a figure
 * that could actually be true of one BP in one month.
 */
export const DPD_POOL = 40

/**
 * FIVE parameters, not seven. Celengan and PPOB came off the scoreboard: in the
 * model the business actually runs they are not scored at all, they are the two
 * BOOST conditions that top the incentive up (see `KPI_BOOSTS`). Scoring them
 * AND paying a bonus for them would count the same behaviour twice.
 *
 * The weights are round and repayment-heavy — 60 points of collection against
 * 40 of growth — matching the shape of the BM scorecard, where repayment is
 * half the score on its own.
 */
export const KPI_DEF: KpiRowDef[] = [
  // "% Repayment rate DPD 0", target 98%, bobot 30% — matches the BP table on
  // both numbers. Base is the DPD_POOL, not the full book — see its doc.
  // min is a placeholder (~94% of target).
  { k: 'dpd0', n: 'Mitra DPD 0', unit: '%', target: 98, min: 93, base: DPD_POOL, baseLabel: 'mitra', bonus: 400000, weight: 30, group: 'collection' },
  // "% Repayment rate 1–30 dari tunggakan", target 50%, bobot 20%. The BP
  // table's Definisi computes paid ÷ total-in-bucket — a COLLECTION rate, not
  // a population share — so unlike the old model this is higher-is-better: a
  // 50% CEILING on how much of the book sits in DPD1–30 would be an
  // implausibly loose cap, but 50% RECOVERED on what's already overdue in that
  // bucket is a plausible floor. Flagging this directional read for
  // confirmation — it is the one inference in this table, not a stated fact.
  { k: 'dpd30', n: 'Mitra DPD 1–30', unit: '%', target: 50, min: 47, base: DPD_POOL, baseLabel: 'mitra', bonus: 300000, weight: 20, group: 'collection' },
  // "% Repayment rate 31–90 min 1x angsuran", target 5%, bobot 10%. Same
  // Definisi shape as DPD1–30, so the same directional read applies — this
  // used to be a ≤5% population ceiling and is now a ≥5% collection floor. The
  // NUMBER is unchanged from before; only what it MEANS moved.
  //
  // min is 3%, not the usual ~94%-of-target: at DPD_POOL=40, 5% and 4.5% both
  // round to the same 2-mitra target, which erases the gap the gate needs. 3%
  // rounds to 1 — the smallest count below 2 that still leaves visible daylight
  // at this pool size.
  { k: 'dpd90', n: 'Mitra DPD 31–90', unit: '%', target: 5, min: 3, base: DPD_POOL, baseLabel: 'mitra', bonus: 200000, weight: 10, group: 'collection' },
  // "# Mitra Cair New per Bulan", target 20, bobot 20%.
  { k: 'mitraNew', n: 'Pencairan mitra baru per bulan', unit: 'mitra', target: 20, min: 19, bonus: 500000, weight: 20, group: 'growth' },
  // "% Renewal Mitra Cair per Bulan", target 85%, bobot 20%. Denominator is
  // "mitra yang melunasi loannya" — its own subset of the 100-mitra book,
  // distinct from the DPD_POOL above — so `base` stays its own plausible count.
  { k: 'renewal', n: 'Pencairan mitra lama per bulan', unit: '%', target: 85, min: 80, base: 12, baseLabel: 'mitra jatuh tempo', bonus: 500000, weight: 20, group: 'growth' },
]

export const KPI_MAX_BONUS = KPI_DEF.reduce((s, r) => s + r.bonus, 0) // Rp1.900.000

// --- Version B: one weighted score, then three modifiers -------------------
//
// The model the business actually runs. The five weights roll into ONE score,
// and everything after that is a band or a modifier on the rupiah:
//
//   score < 90%          → nothing
//   score 90–100%        → Rp300.000
//   score > 100%         → Rp600.000
//   boom factor tripped  → Rp0, whatever the score said
//   BOTH boosts met      → +Rp100.000
//
// The score is deliberately UNCAPPED: >100% is a real band, so a parameter that
// beats its target has to be able to carry the total past 100.

export interface KpiBand {
  /** Inclusive floor of the band, in score %. */
  at: number
  nominal: number
  label: string
}

export const KPI_BANDS: KpiBand[] = [
  { at: 90, nominal: 300_000, label: '90–100%' },
  { at: 100.001, nominal: 600_000, label: 'di atas 100%' },
]

/**
 * The boom factor: one portfolio condition that zeroes the whole incentive
 * however well the five parameters went. It is not a sixth parameter and must
 * not read as one — a weight can be traded off against another weight, and this
 * cannot be traded off against anything.
 *
 * What it measures is a COHORT, not the book as it stands today: the mitra she
 * disbursed three months ago, and how many of them are already DPD 7+. In
 * August that is May's intake. The lag is the whole point — it is the check on
 * whether the growth she was paid for last quarter was lent well, so a BP
 * cannot bank a bonus for volume this month and leave the arrears behind her.
 */
export const KPI_BOOM = {
  k: 'cohortDpd7',
  label: 'Cohort DPD 7+',
  /** Above this share of the cohort, the incentive is zero. */
  limit: 5,
  rule: 'Maks 5% mitra baru 3 bulan lalu boleh DPD 7+',
  /** How many months back the cohort was disbursed. */
  lagMonths: 3,
}

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

/**
 * "Mei 2026" — which intake the boom factor is watching, named rather than left
 * as "3 bulan lalu". A BP checking a cohort has to know which month's mitra to
 * go and look at, and counting back three months from the period she is reading
 * is arithmetic the page can do for her.
 *
 * Null for the demo-only scenarios, whose keys ("boom", "gate-zero") are not
 * months at all — the caller says "3 bulan lalu" instead rather than printing
 * a scenario name where a month belongs.
 */
export function cohortMonth(period: string): string | null {
  const parse = (p: string) => {
    const [name, year] = p.split(' ')
    const i = MONTHS_ID.indexOf(name)
    return i === -1 || !year ? null : { i, year: Number(year) }
  }
  // The demo-only scenarios are keyed by situation ("nothing-yet"), not by a
  // month, so they fall back to the RUNNING month. Without it a scenario that
  // is not a month has no cohort to name, and the tracker loses the one thing
  // that tells the BP which intake to go and look at.
  const at = parse(period) ?? parse(KPI_PERIODS[0])
  if (!at) return null
  const back = at.i - KPI_BOOM.lagMonths
  return back >= 0
    ? `${MONTHS_ID[back]} ${at.year}`
    : `${MONTHS_ID[back + 12]} ${at.year - 1}`
}

/**
 * The two boost conditions. Both must be met — the pair pays Rp100.000, either
 * one alone pays nothing, which is why they are shown as one AND rather than as
 * two independent bonuses.
 *
 * These are exactly the two things that came OFF the scoreboard. In this model
 * cross-sell is not scored, it is a top-up.
 */
export interface KpiBoostDef {
  k: string
  label: string
  rule: string
  target: number
}

export const KPI_BOOSTS: KpiBoostDef[] = [
  { k: 'celengan', label: 'Mitra saldo Celengan', rule: '≥50% mitra saldo >Rp50rb', target: 50 },
  { k: 'ppob', label: 'Transaksi PPOB', rule: '≥30% mitra transaksi PPOB', target: 30 },
]

export const KPI_BOOST_BONUS = 100_000

export const KPI_PERIODS = ['Juli 2026', 'Juni 2026', 'Mei 2026']

/** Days left in the running period — the deadline the hero card closes on. */
export const KPI_DAYS_LEFT = 12

// Rewritten against the new targets (98 / 50 / 5 / 20 / 85). dpd30 and dpd90
// flipped to higher-is-better, so a value that used to read as a near-miss
// reads as a comfortable clear now — every scenario below was re-tuned rather
// than left with numbers written for the old direction.
const PERIOD_VALS: Record<string, Record<string, number>> = {
  // dpd90 misses (3%, below the new 5% floor), so version A's gate closes on
  // the mitra-baru row she DID win — the annulment worth demonstrating.
  // Tuned so version B lands in the FIRST paying band (98% → Rp300.000), not
  // the top one: the running month is the base case both versions argue from,
  // and a default that already maxes out hides the rule the model is built on.
  'Juli 2026': { dpd0: 99, dpd30: 55, dpd90: 3, mitraNew: 21, renewal: 78, celengan: 62, ppob: 44, cohortDpd7: 3 },
  'Juni 2026': { dpd0: 100, dpd30: 60, dpd90: 6, mitraNew: 22, renewal: 90, celengan: 71, ppob: 58, cohortDpd7: 2 },
  'Mei 2026': { dpd0: 90, dpd30: 30, dpd90: 2, mitraNew: 12, renewal: 60, celengan: 48, ppob: 40, cohortDpd7: 7 },

  // --- Demo-only scenarios, not offered as periods ------------------------
  //
  // The two ways to arrive at Rp0, which the page has to tell APART. They read
  // identically on the bottom line and mean opposite things to the BP.

  /**
   * Every growth target won, every collection target missed — the gate's worst
   * case: a full month of work paying nothing.
   *
   * The collection figures are LOW enough that the weighted score lands below
   * 90 too (30 points of DPD 0 at 71% drags the roll-up down), so version A
   * and the score model agree on Rp0. They used to disagree: dpd0 at 85 still
   * rolled up to a paying 93, which put "Semua tertahan — Rp0" on a state that
   * paid Rp400.000 the moment you switched to B1.
   *
   * Boom stays inside its limit and both boosts are met on purpose — this is
   * the state that shows a top-up earned and still not paid, because the band
   * underneath it was never reached.
   */
  'gate-zero': { dpd0: 70, dpd30: 25, dpd90: 1, mitraNew: 25, renewal: 92, celengan: 64, ppob: 57, cohortDpd7: 4 },
  /**
   * Nothing met anywhere. Rp0 with nothing held behind it — the OTHER zero,
   * and the one the hero has to tell apart from `gate-zero`.
   *
   * Its collection figures sit below gate-zero's rather than level with them:
   * the two states differ in what she WON (gate-zero took every growth target
   * and both boosts), and a shared set of DPD numbers made them read as the
   * same month with a different label.
   */
  'nothing-yet': { dpd0: 60, dpd30: 18, dpd90: 1, mitraNew: 8, renewal: 45, celengan: 31, ppob: 22, cohortDpd7: 4 },
  /**
   * Version B's own worst case: a score that pays, wiped by the boom factor.
   *
   * The DPD buckets MISS here, and that is not incidental — it is what makes
   * the month believable. A cohort going bad is not a number floating free of
   * the book: those souring mitra are the same women the DPD parameters count,
   * so a cohort at 8% sitting beside a 99% DPD 0 was two facts that could not
   * both be true. Growth carries the score to 98 instead, which keeps the
   * point of the state intact — she would have been paid, and the cohort is
   * the only reason she is not.
   */
  'boom': { dpd0: 94, dpd30: 42, dpd90: 3, mitraNew: 24, renewal: 95, celengan: 64, ppob: 41, cohortDpd7: 8 },
  /** Over 100% AND both boosts — the top of the version B table, Rp700.000. */
  'boosted': { dpd0: 100, dpd30: 58, dpd90: 7, mitraNew: 23, renewal: 92, celengan: 66, ppob: 38, cohortDpd7: 2 },
}

export interface KpiRow extends KpiRowDef {
  val: number
  count: number
  targetCount: number
  /** `min` restated as a mitra count, same as `targetCount`. */
  minCount: number
  /** Past the incentive gate — the band that actually pays. Strictly PAST it:
   *  landing on the min exactly is the job done, not an achievement. */
  incentivised: boolean
  met: boolean
  earned: number
  /**
   * Met, but paying nothing because collection failed. Only ever true on a
   * `growth` row — it is the state the gate exists to express, and the card has
   * to show it rather than silently paying zero on a row wearing a tick.
   */
  annulled: boolean
  /**
   * How far this parameter has come toward its target, 0–100 — the graded
   * version of `met`, and what the version A meter reads. A met parameter is
   * 100; a lagging one is the fraction of the way there (target/val for the
   * lower-is-better DPD buckets, val/target everywhere else).
   */
  progress: number
  /**
   * The same fraction with the cap taken OFF, which is what version B's SCORE
   * weighs. A BP who beats a target has to be able to carry the total past
   * 100%, because "di atas 100%" is a real band paying double — capping every
   * row at 100 would make that band unreachable by construction.
   *
   * Computed from the raw percentages (val/target), not from `count`/
   * `targetCount` — at DPD_POOL's small size those two derivations round
   * differently often enough to matter (1 mitra achieved against a target of
   * 2 is 50% by the count, but the underlying 3%-against-5% is 60%). The score
   * uses the true, unrounded rate; `countProgress` below is the one that has
   * to agree with the mitra figures printed on the card.
   */
  rawProgress: number
  /**
   * Achievement over target as mitra COUNTS — the number B2's row card shows,
   * because that card also prints "Target: diatas N mitra" and an achieved
   * figure has to divide by that same N or a reader doing the arithmetic by
   * eye catches the mismatch. Uncapped, same reasoning as `rawProgress`.
   */
  countProgress: number
}

/** One of the two conditions that, together, top the incentive up. */
export interface KpiBoost extends KpiBoostDef {
  val: number
  met: boolean
}

/** Version B's whole answer: the score, the band it lands in, and the two
 *  modifiers that can wipe it or raise it. */
export interface KpiScore {
  /** Weighted roll-up of every row's uncapped progress. Can exceed 100. */
  score: number
  /** What the band alone pays, before boom and boost. */
  bandNominal: number
  band: KpiBand | null
  /** The next band up, or null once she is in the top one. */
  nextBand: KpiBand | null
  /** The portfolio condition that zeroes everything. */
  boomVal: number
  boomTriggered: boolean
  /**
   * Which intake the boom factor is watching — "Mei 2026" read from August.
   * Null on the demo scenarios, whose keys are not months.
   */
  boomCohort: string | null
  boosts: KpiBoost[]
  /** Both boosts met — the pair pays, either one alone does not. */
  boostsMet: boolean
  boostBonus: number
  /** What she actually takes home. */
  total: number
}

export interface KpiView {
  rows: KpiRow[]
  earned: number
  maxBonus: number
  metCount: number
  totalParams: number
  totalMitra: number
  totalMajelis: number
  /** Version B's score and everything hanging off it. */
  scored: KpiScore
  /** Whether Mitra DPD 0 is met — the one gate on all growth pay. */
  collectionMet: boolean
  /** What the annulment is costing her: growth bonus met but not payable. */
  annulledTotal: number
}

/** Build the KPI view for a period. */
export const buildKpi = (period: string): KpiView => {
  const vals = PERIOD_VALS[period]

  const graded = KPI_DEF.map((r) => {
    const val = vals[r.k]
    // Percentages are restated as mitra counts, because "kurang 4 mitra lagi"
    // is a thing the BP can go and do and "kurang 2%" is not.
    const count = r.unit === '%' && r.base != null ? Math.round((val / 100) * r.base) : val
    const targetCount =
      r.unit === '%' && r.base != null ? Math.round((r.target / 100) * r.base) : r.target
    const minCount =
      r.unit === '%' && r.base != null ? Math.round((r.min / 100) * r.base) : r.min
    const met = r.lower ? val <= r.target : val >= r.target
    // The TARGET is the incentive bar, not the min. The two used to run the
    // other way round — min was the looser gate that paid, target was an
    // aspiration above it — which put "min 37" and "insentif" on the same
    // rail and read as though clearing 37 already earned. It does not: 37 is
    // the floor she has to hold, and the money starts above the target.
    const incentivised = met
    // Uncapped: beating a target has to be able to push the version B score
    // past 100, or its top band could never be reached.
    const rawProgress = Math.round((r.lower ? r.target / Math.max(val, 0.01) : val / r.target) * 100)
    const progress = Math.min(100, rawProgress)
    // The count-based twin of rawProgress — same uncapped shape, but divides
    // the two ROUNDED mitra figures instead of the raw percentages, so it
    // agrees with "Target: diatas N mitra" on the same card.
    const countProgress = Math.round(
      (r.lower ? targetCount / Math.max(count, 0.01) : count / targetCount) * 100,
    )
    return { ...r, val, count, targetCount, minCount, incentivised, met, progress, rawProgress, countProgress }
  })

  // The gate, and it is ONE row: Mitra DPD 0. Growth pay is held only when
  // she is below that target — which is exactly what the screens say
  // ("Mitra DPD 0 harus tercapai untuk mendapatkan insentif").
  //
  // It used to require every collection row, so a miss on DPD 31–90 held
  // growth money the stated rule never said it would: the card showed a
  // struck-through incentive and a "tertahan" banner on a month whose DPD 0
  // was clean. A gate the copy does not describe is a gate nobody can act on.
  //
  // Computed across the whole set BEFORE any row is told what it earned.
  const collectionMet = graded.find((r) => r.k === 'dpd0')?.incentivised ?? true

  const rows: KpiRow[] = graded.map((r) => {
    const annulled = r.incentivised && r.group === 'growth' && !collectionMet
    return { ...r, annulled, earned: r.incentivised && !annulled ? r.bonus : 0 }
  })

  // --- Version B ----------------------------------------------------------
  //
  // The weighted roll-up: each row contributes its UNCAPPED progress scaled by
  // its weight, and the weights sum to 100, so the total is itself a percentage
  // — one that can pass 100 when she beats her targets.
  const score = Math.round(rows.reduce((s, r) => s + r.weight * r.rawProgress, 0) / 100)

  const band = [...KPI_BANDS].reverse().find((b) => score >= b.at) ?? null
  const nextBand = KPI_BANDS.find((b) => score < b.at) ?? null
  const bandNominal = band?.nominal ?? 0

  const boomVal = vals[KPI_BOOM.k]
  const boomTriggered = boomVal > KPI_BOOM.limit

  const boosts: KpiBoost[] = KPI_BOOSTS.map((b) => ({
    ...b,
    val: vals[b.k],
    met: vals[b.k] >= b.target,
  }))
  const boostsMet = boosts.every((b) => b.met)

  // Order of operations, and it matters: the boom wipes everything, including a
  // boost pair she genuinely earned. The boost only tops up an incentive that
  // exists — adding Rp100.000 to a score that paid nothing would invent an
  // incentive out of a condition the table calls a BONUS.
  const boostBonus = !boomTriggered && bandNominal > 0 && boostsMet ? KPI_BOOST_BONUS : 0
  const total = boomTriggered ? 0 : bandNominal + boostBonus

  return {
    rows,
    earned: rows.reduce((s, r) => s + r.earned, 0),
    maxBonus: KPI_MAX_BONUS,
    metCount: rows.filter((r) => r.met).length,
    totalParams: rows.length,
    totalMitra: BP_TOTAL_MITRA,
    totalMajelis: BP_TOTAL_MAJELIS,
    collectionMet,
    annulledTotal: rows.reduce((s, r) => s + (r.annulled ? r.bonus : 0), 0),
    scored: {
      score,
      bandNominal,
      band,
      nextBand,
      boomVal,
      boomTriggered,
      boomCohort: cohortMonth(period),
      boosts,
      boostsMet,
      boostBonus,
      total,
    },
  }
}
