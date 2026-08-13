import type { Period } from './store'

// Per-period figures. `pemasukan` = omzet (Poket Premium) + qris; `untungTotal`
// is the all-in profit shown in layouts 2 & 3. The 7-day column is the Figma
// source; the others are placeholder prototype numbers.
export interface Figures {
  omzet: string
  untung: string
  jual: string
  reward: string
  qris: string
  pemasukan: string
  untungTotal: string
}

export const FIGURES: Record<Period, Figures> = {
  hari: {
    omzet: 'Rp238.000',
    untung: 'Rp12.500',
    jual: 'Rp9.500',
    reward: 'Rp3.000',
    qris: 'Rp358.500',
    pemasukan: 'Rp596.500',
    untungTotal: 'Rp41.000',
  },
  minggu: {
    omzet: 'Rp1.554.000',
    untung: 'Rp81.500',
    jual: 'Rp59.500',
    reward: 'Rp12.000',
    qris: 'Rp2.481.500',
    pemasukan: 'Rp4.035.500',
    untungTotal: 'Rp281.500',
  },
  bulan: {
    omzet: 'Rp6.640.000',
    untung: 'Rp2.360.000',
    jual: 'Rp2.015.000',
    reward: 'Rp345.000',
    qris: 'Rp10.420.000',
    pemasukan: 'Rp17.060.000',
    untungTotal: 'Rp1.240.000',
  },
}

export const PERIOD_LABEL: Record<Period, string> = {
  hari: 'Hari ini',
  minggu: '7 Hari',
  bulan: '30 Hari',
}

const IDN_MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const fmtD = (d: Date) => `${d.getDate()} ${IDN_MON[d.getMonth()]} ${d.getFullYear()}`

// Hari ini = today; 7/30 hari = (yesterday minus N days) … yesterday.
export function periodDate(k: Period): string {
  const today = new Date()
  if (k === 'hari') return fmtD(today)
  const end = new Date(today)
  end.setDate(end.getDate() - 1)
  const start = new Date(end)
  start.setDate(start.getDate() - (k === 'minggu' ? 7 : 30))
  return `${fmtD(start)} - ${fmtD(end)}`
}

// Full Indonesian month names — the "Tanggal lain" date-picker wheel spells
// the month out (Figma 4515:103391), unlike the abbreviated IDN_MON above.
export const MONTHS_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export const fmtDMY = (d: Date) => `${String(d.getDate()).padStart(2, '0')} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`
