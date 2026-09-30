// The merged history: account and Poket activity in one list (PRD D). Only
// the rows on screen — enough to show both sources and both directions.

export type TxSource = 'rekening' | 'poket'

export interface Tx {
  id: string
  date: string
  title: string
  subtitle: string
  amount: number
  source: TxSource
}

export const TRANSACTIONS: Tx[] = [
  { id: 't1', date: 'Hari ini', title: 'Pulsa Telkomsel 50.000', subtitle: '0812-3456-7890', amount: -51500, source: 'rekening' },
  { id: 't2', date: 'Hari ini', title: 'Transfer masuk', subtitle: 'Dari BCA · Budi Santoso', amount: 500000, source: 'rekening' },
  { id: 't3', date: '28 Sep 2026', title: 'Pencairan Modal', subtitle: 'Pinjaman Modal Amartha', amount: 5000000, source: 'rekening' },
  { id: 't4', date: '28 Sep 2026', title: 'Kirim ke sesama AmarthaFin', subtitle: 'Ke Siti Aminah', amount: -100000, source: 'poket' },
  { id: 't5', date: '25 Sep 2026', title: 'Bayar cicilan Modal', subtitle: 'Minggu ke-12', amount: -262500, source: 'poket' },
]

export const rupiah = (n: number) =>
  `${n < 0 ? '-' : n > 0 ? '+' : ''}Rp${Math.abs(n).toLocaleString('id-ID')}`
