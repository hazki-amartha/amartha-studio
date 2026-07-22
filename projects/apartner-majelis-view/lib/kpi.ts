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
  /** Flat Rp bonus earned when this parameter's target is met. */
  bonus: number
}

export const KPI_DEF: KpiRowDef[] = [
  { k: 'dpd0', n: 'Mitra DPD 0', unit: '%', target: 80, base: 225, baseLabel: 'mitra', bonus: 400000 },
  { k: 'dpd30', n: 'Mitra DPD 1–30', unit: '%', target: 15, base: 225, baseLabel: 'mitra', lower: true, bonus: 300000 },
  { k: 'dpd90', n: 'Mitra DPD 31–90', unit: '%', target: 5, base: 225, baseLabel: 'mitra', lower: true, bonus: 200000 },
  { k: 'mitraNew', n: 'Pencairan mitra baru per bulan', unit: 'mitra', target: 15, bonus: 500000 },
  { k: 'renewal', n: 'Pencairan mitra lama per bulan', unit: '%', target: 80, base: 27, baseLabel: 'mitra jatuh tempo', bonus: 500000 },
  { k: 'celengan', n: 'Mitra saldo Celengan', unit: '%', target: 50, base: 225, baseLabel: 'mitra', bonus: 300000 },
  { k: 'ppob', n: 'Mitra transaksi PPOB', unit: '%', target: 50, base: 225, baseLabel: 'mitra', bonus: 300000 },
]

export const KPI_MAX_BONUS = KPI_DEF.reduce((s, r) => s + r.bonus, 0) // Rp2.500.000

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
}

export interface KpiView {
  rows: KpiRow[]
  earned: number
  maxBonus: number
  metCount: number
  totalParams: number
  totalMitra: number
  totalMajelis: number
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
    return { ...r, val, count, targetCount, met, earned: met ? r.bonus : 0 }
  })

  return {
    rows,
    earned: rows.reduce((s, r) => s + r.earned, 0),
    maxBonus: KPI_MAX_BONUS,
    metCount: rows.filter((r) => r.met).length,
    totalParams: rows.length,
    totalMitra: 225,
    totalMajelis: 15,
  }
}
