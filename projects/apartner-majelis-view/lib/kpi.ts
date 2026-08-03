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
   * Only `dpd0` carries a figure the business gave us (min 170 against a target
   * of 180). The other six are PLACEHOLDERS at the same ~94% ratio — plausible
   * enough to design against, and wrong enough that they must be replaced
   * before anyone quotes them.
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
   * named apart: collection GATES growth. Miss a DPD bucket and the incentive on
   * every growth parameter is annulled, however well she did on it — the book
   * she is lending against has to be healthy before selling more into it counts
   * for anything.
   */
  group: KpiGroup
}

/** `collection` — the DPD buckets. `growth` — disbursement and cross-sell. */
export type KpiGroup = 'collection' | 'growth'

export const KPI_DEF: KpiRowDef[] = [
  // min 75.6% of 225 = 170 mitra against a target of 180 — the one pair the
  // business actually gave us. Every other `min` below is a placeholder.
  { k: 'dpd0', n: 'Mitra DPD 0', unit: '%', target: 80, min: 75.6, base: 225, baseLabel: 'mitra', bonus: 400000, weight: 16, group: 'collection' },
  // Lower-is-better: the min is a LOOSER ceiling than the target, so it sits
  // above it in the raw number and below it in how hard it is to clear.
  { k: 'dpd30', n: 'Mitra DPD 1–30', unit: '%', target: 15, min: 16, base: 225, baseLabel: 'mitra', lower: true, bonus: 300000, weight: 12, group: 'collection' },
  { k: 'dpd90', n: 'Mitra DPD 31–90', unit: '%', target: 5, min: 5.5, base: 225, baseLabel: 'mitra', lower: true, bonus: 200000, weight: 8, group: 'collection' },
  { k: 'mitraNew', n: 'Pencairan mitra baru per bulan', unit: 'mitra', target: 15, min: 14, bonus: 500000, weight: 20, group: 'growth' },
  { k: 'renewal', n: 'Pencairan mitra lama per bulan', unit: '%', target: 80, min: 76, base: 27, baseLabel: 'mitra jatuh tempo', bonus: 500000, weight: 20, group: 'growth' },
  { k: 'celengan', n: 'Mitra saldo Celengan', unit: '%', target: 50, min: 47, base: 225, baseLabel: 'mitra', bonus: 300000, weight: 12, group: 'growth' },
  { k: 'ppob', n: 'Mitra transaksi PPOB', unit: '%', target: 50, min: 47, base: 225, baseLabel: 'mitra', bonus: 300000, weight: 12, group: 'growth' },
]

export const KPI_MAX_BONUS = KPI_DEF.reduce((s, r) => s + r.bonus, 0) // Rp2.500.000

/**
 * The v2 bonus ladder — three tiers hung off overall completion, not off any one
 * parameter. Reach 50% of the weighted score and Rp500.000 is banked; 75% lifts
 * it to Rp1.500.000; a full 100% pays Rp2.000.000. The amounts are the tier's
 * total, not additive — landing at 80% pays the 75% tier, nothing more.
 */
export interface KpiTier {
  at: number
  bonus: number
}

export const KPI_TIERS: KpiTier[] = [
  { at: 50, bonus: 500000 },
  { at: 75, bonus: 1500000 },
  { at: 100, bonus: 2000000 },
]

export const KPI_PERIODS = ['Juli 2026', 'Juni 2026', 'Mei 2026']

/** Days left in the running period — the deadline the hero card closes on. */
export const KPI_DAYS_LEFT = 12

const PERIOD_VALS: Record<string, Record<string, number>> = {
  'Juli 2026': { dpd0: 82, dpd30: 12, dpd90: 6, mitraNew: 12, renewal: 74, celengan: 62, ppob: 44 },
  'Juni 2026': { dpd0: 88, dpd30: 9, dpd90: 3, mitraNew: 16, renewal: 85, celengan: 71, ppob: 58 },
  'Mei 2026': { dpd0: 76, dpd30: 18, dpd90: 8, mitraNew: 9, renewal: 62, celengan: 48, ppob: 40 },

  // --- Demo-only scenarios, not offered as periods ------------------------
  //
  // The two ways to arrive at Rp0, which the page has to tell APART. They read
  // identically on the bottom line and mean opposite things to the BP.

  /** Every growth target won, every collection target missed — the gate's
   *  worst case: a full month of work paying nothing. */
  'gate-zero': { dpd0: 70, dpd30: 20, dpd90: 9, mitraNew: 18, renewal: 88, celengan: 64, ppob: 57 },
  /** Nothing met anywhere. Rp0 with nothing held behind it. */
  'nothing-yet': { dpd0: 62, dpd30: 24, dpd90: 11, mitraNew: 6, renewal: 48, celengan: 31, ppob: 22 },
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
   * version of `met`, and what the v2 roll-up weighs. A met parameter is 100;
   * a lagging one is the fraction of the way there (target/val for the
   * lower-is-better DPD buckets, val/target everywhere else).
   */
  progress: number
}

export interface KpiView {
  rows: KpiRow[]
  earned: number
  maxBonus: number
  metCount: number
  totalParams: number
  totalMitra: number
  totalMajelis: number
  /** v2: the weighted roll-up of every row's progress, 0–100. */
  completion: number
  /** v2: the tier the completion currently pays, or null below the first. */
  currentTier: KpiTier | null
  /** v2: the next tier still to reach, or null once every tier is cleared. */
  nextTier: KpiTier | null
  /** Whether every collection parameter is met — the gate on all growth pay. */
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
    // Strictly past the gate — "if only achieving this, no bonus is granted".
    const incentivised = r.lower ? val < r.min : val > r.min
    const progress = met
      ? 100
      : r.lower
        ? Math.round((r.target / val) * 100)
        : Math.round((val / r.target) * 100)
    return { ...r, val, count, targetCount, minCount, incentivised, met, progress }
  })

  // The gate. Every collection parameter has to be performing before a single
  // growth rupiah is payable — so this is computed across the whole set BEFORE
  // any row is told what it earned.
  //
  // The bar here is the incentive gate, not the target: the same threshold that
  // decides whether a row pays is the one that decides whether it blocks. A
  // collection row sitting between its min and its target is performing, and
  // holding growth pay hostage to a target she is already past the gate on
  // would be a second, stricter rule nobody stated.
  const collectionMet = graded.every((r) => r.group !== 'collection' || r.incentivised)

  const rows: KpiRow[] = graded.map((r) => {
    // Pay hangs off the GATE, not the target — "beyond the min will be
    // incentivised". Landing between min and target still earns.
    const annulled = r.incentivised && r.group === 'growth' && !collectionMet
    return { ...r, annulled, earned: r.incentivised && !annulled ? r.bonus : 0 }
  })

  // The weighted roll-up: each row contributes its progress scaled by its
  // weight, and the weights sum to 100, so the total is itself a percentage.
  const completion = Math.round(rows.reduce((s, r) => s + r.weight * r.progress, 0) / 100)

  const currentTier = [...KPI_TIERS].reverse().find((t) => completion >= t.at) ?? null
  const nextTier = KPI_TIERS.find((t) => completion < t.at) ?? null

  return {
    rows,
    earned: rows.reduce((s, r) => s + r.earned, 0),
    maxBonus: KPI_MAX_BONUS,
    metCount: rows.filter((r) => r.met).length,
    totalParams: rows.length,
    totalMitra: 225,
    totalMajelis: 15,
    collectionMet,
    annulledTotal: rows.reduce((s, r) => s + (r.annulled ? r.bonus : 0), 0),
    completion,
    currentTier,
    nextTier,
  }
}
