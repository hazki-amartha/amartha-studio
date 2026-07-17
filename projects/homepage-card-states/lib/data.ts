// Mock figures for the card stack. One source so the three states stay
// arithmetically consistent with each other.

export type LoanState = 'ontrack' | 'settled' | 'late'

export const PLAFON = 7_000_000
export const WEEKLY = 150_000
export const OUTSTANDING = 5_500_000

export const LIMIT_CURRENT = 5_000_000
export const LIMIT_POTENTIAL = 8_000_000
export const LIMIT_PROJECTED = 6_500_000

export const rp = (n: number) => 'Rp' + n.toLocaleString('id-ID')
export const jt = (n: number) => 'Rp ' + (n / 1_000_000).toLocaleString('id-ID') + ' jt'

/** Available-to-disburse after n more weekly payments, capped at the plafon. */
const afterWeeks = (outstanding: number, n: number) =>
  PLAFON - Math.max(0, outstanding - WEEKLY * n)

export function projection(outstanding: number) {
  return [
    { k: 'Dalam 1 bulan', v: afterWeeks(outstanding, 4), strong: false },
    { k: 'Dalam 3 bulan', v: afterWeeks(outstanding, 13), strong: false },
    { k: 'Saat lunas', v: PLAFON, strong: true },
  ]
}

export const RINGS = [
  { label: 'Repayment', pct: 90, stroke: 'var(--green-500)' },
  { label: 'Kehadiran', pct: 80, stroke: 'var(--blue-500)' },
  { label: 'Majelis Repayment', pct: 40, stroke: 'var(--orange-500)' },
]

export function outstandingFor(state: LoanState) {
  return state === 'settled' ? 0 : OUTSTANDING
}
