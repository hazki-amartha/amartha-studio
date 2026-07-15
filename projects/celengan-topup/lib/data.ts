// Project-local mock data for the Celengan top-up flow.
// No design-system values live here — pure content.

export interface SavingsGoal {
  id: string
  name: string
  target: number
  saved: number
}

export interface PaymentMethod {
  id: string
  name: string
  detail: string
  /** When true, selecting this method routes the confirmation to the failure state. */
  disrupted?: boolean
}

export const GOALS: SavingsGoal[] = [
  { id: 'umroh', name: 'Tabungan Umroh', target: 30_000_000, saved: 12_500_000 },
  { id: 'pendidikan', name: 'Dana Pendidikan Anak', target: 15_000_000, saved: 4_200_000 },
  { id: 'darurat', name: 'Dana Darurat', target: 10_000_000, saved: 8_900_000 },
]

export const QUICK_AMOUNTS = [50_000, 100_000, 250_000, 500_000]

export const MIN_AMOUNT = 10_000

export const METHODS: PaymentMethod[] = [
  { id: 'poket', name: 'Saldo Poket', detail: 'Rp2.150.000 tersedia' },
  { id: 'bca-va', name: 'Virtual Account BCA', detail: 'Bayar dalam 24 jam' },
  { id: 'bni-va', name: 'Virtual Account BNI', detail: 'Sedang ada gangguan', disrupted: true },
]

/** Format an integer rupiah amount as "Rp1.250.000" (Indonesian thousands separator). */
export function formatRupiah(value: number): string {
  return 'Rp' + value.toLocaleString('id-ID')
}
