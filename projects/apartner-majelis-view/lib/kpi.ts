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
}

export const KPI_DEF: KpiRowDef[] = [
  { k: 'dpd0', n: 'Mitra DPD 0', unit: '%', target: 80, base: 225, baseLabel: 'mitra', bonus: 400000, weight: 16 },
  { k: 'dpd30', n: 'Mitra DPD 1–30', unit: '%', target: 15, base: 225, baseLabel: 'mitra', lower: true, bonus: 300000, weight: 12 },
  { k: 'dpd90', n: 'Mitra DPD 31–90', unit: '%', target: 5, base: 225, baseLabel: 'mitra', lower: true, bonus: 200000, weight: 8 },
  { k: 'mitraNew', n: 'Pencairan mitra baru per bulan', unit: 'mitra', target: 15, bonus: 500000, weight: 20 },
  { k: 'renewal', n: 'Pencairan mitra lama per bulan', unit: '%', target: 80, base: 27, baseLabel: 'mitra jatuh tempo', bonus: 500000, weight: 20 },
  { k: 'celengan', n: 'Mitra saldo Celengan', unit: '%', target: 50, base: 225, baseLabel: 'mitra', bonus: 300000, weight: 12 },
  { k: 'ppob', n: 'Mitra transaksi PPOB', unit: '%', target: 50, base: 225, baseLabel: 'mitra', bonus: 300000, weight: 12 },
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
}

export interface KpiRow extends KpiRowDef {
  val: number
  count: number
  targetCount: number
  met: boolean
  earned: number
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
}

/** Build the KPI view for a period. */
export const buildKpi = (period: string): KpiView => {
  const vals = PERIOD_VALS[period]

  const rows: KpiRow[] = KPI_DEF.map((r) => {
    const val = vals[r.k]
    // Percentages are restated as mitra counts, because "kurang 4 mitra lagi"
    // is a thing the BP can go and do and "kurang 2%" is not.
    const count = r.unit === '%' && r.base != null ? Math.round((val / 100) * r.base) : val
    const targetCount =
      r.unit === '%' && r.base != null ? Math.round((r.target / 100) * r.base) : r.target
    const met = r.lower ? val <= r.target : val >= r.target
    const progress = met
      ? 100
      : r.lower
        ? Math.round((r.target / val) * 100)
        : Math.round((val / r.target) * 100)
    return { ...r, val, count, targetCount, met, earned: met ? r.bonus : 0, progress }
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
    completion,
    currentTier,
    nextTier,
  }
}
