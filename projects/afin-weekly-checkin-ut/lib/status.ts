// The five grades behind the check-in card's status chevron, and the copy that
// explains each one. Lives here rather than in status-detail.tsx because the
// payment-history page (reached from the "Kelancaran pembayaran" row) needs
// the same done/total figures to draw a week-by-week record that agrees with
// what the status page already said.

export type StatusKey = 'sangat-baik' | 'baik' | 'sedang' | 'buruk' | 'sangat-buruk'

// Which grade each home-b variant currently shows — kept in step with the
// VARIANT_CONFIG in home-b.tsx by hand, since these pages have no props of
// their own and read the same store.
export const VARIANT_STATUS: Record<string, StatusKey> = {
  'first-week':          'sangat-baik',
  'matrix-sangat-baik':  'sangat-baik',
  'matrix-baik':         'baik',
  'matrix-sedang':       'sedang',
  'matrix-buruk':        'buruk',
  'matrix-sangat-buruk': 'sangat-buruk',
  'limit-ready':         'sangat-baik',
}

export interface StatusRow {
  title: string
  link: string
  done: number
  total: number
  /** What's being counted — "minggu berjalan" for her own habits, "anggota kumpulan" for the group's. */
  unit: string
  desc: string
}

export interface StatusDetail {
  label: string
  color: string
  rows: StatusRow[]
  rewardIcon: string
  rewardText: string
  /** A reward still on offer reads green; one at risk reads amber. */
  rewardTone: 'gift' | 'warn'
}

export const STATUS_DETAIL: Record<StatusKey, StatusDetail> = {
  'sangat-baik': {
    label: 'Sangat Baik', color: '#22C55E',
    rows: [
      { title: 'Kelancaran pembayaran', link: 'Lihat riwayat', done: 11, total: 12, unit: 'minggu berjalan', desc: 'Pembayaran kamu hampir selalu lancar dan tepat waktu.' },
      { title: 'Kehadiran kumpulan',    link: 'Lihat riwayat', done: 11, total: 12, unit: 'minggu berjalan', desc: 'Kehadiran kamu hampir selalu lancar dan tepat waktu.' },
      { title: 'Pembayaran anggota',    link: 'Lihat majelis', done: 19, total: 20, unit: 'anggota kumpulan', desc: 'Pembayaran anggota kamu hampir selalu lancar dan tepat waktu.' },
    ],
    rewardIcon: '🎁', rewardTone: 'gift',
    rewardText: 'Jika status tetap Sangat Baik hingga Desember, Ibu bisa cairkan limit hingga Rp1.500.000, dan dapat tambahan pinjaman 4 x Rp1,25jt — dikasih setiap 3 bulan (12x pembayaran).',
  },
  'baik': {
    label: 'Baik', color: '#0F7A3D',
    rows: [
      { title: 'Kelancaran pembayaran', link: 'Lihat riwayat', done: 11, total: 12, unit: 'minggu berjalan', desc: 'Pembayaran kamu hampir selalu lancar dan tepat waktu.' },
      { title: 'Kehadiran kumpulan',    link: 'Lihat riwayat', done: 11, total: 12, unit: 'minggu berjalan', desc: 'Kehadiran kamu hampir selalu lancar dan tepat waktu.' },
      { title: 'Pembayaran anggota',    link: 'Lihat majelis', done: 15, total: 20, unit: 'anggota kumpulan', desc: 'Beberapa anggota kelompok kamu belum bayar tepat waktu.' },
    ],
    rewardIcon: '⚠️', rewardTone: 'warn',
    rewardText: 'Status turun karena anggota kumpulan tidak bayar. Hadiah berpotensi berkurang hingga Rp250.000.',
  },
  'sedang': {
    label: 'Sedang', color: '#B45309',
    rows: [
      { title: 'Kelancaran pembayaran', link: 'Lihat riwayat', done: 6,  total: 12, unit: 'minggu berjalan', desc: 'Pembayaran kamu beberapa kali terlambat.' },
      { title: 'Kehadiran kumpulan',    link: 'Lihat riwayat', done: 6,  total: 12, unit: 'minggu berjalan', desc: 'Kamu 2 kali tidak hadir kumpulan.' },
      { title: 'Pembayaran anggota',    link: 'Lihat majelis', done: 18, total: 20, unit: 'anggota kumpulan', desc: 'Kelompok kamu mulai perlu dijaga.' },
    ],
    rewardIcon: '⚠️', rewardTone: 'warn',
    rewardText: 'Hadiah Ibu berpotensi berkurang hingga Rp500.000.',
  },
  'buruk': {
    label: 'Buruk', color: '#B91C1C',
    rows: [
      { title: 'Kelancaran pembayaran', link: 'Lihat riwayat', done: 6,  total: 12, unit: 'minggu berjalan', desc: 'Pembayaran kamu sering terlambat.' },
      { title: 'Kehadiran kumpulan',    link: 'Lihat riwayat', done: 6,  total: 12, unit: 'minggu berjalan', desc: 'Kamu 3 kali tidak hadir kumpulan.' },
      { title: 'Pembayaran anggota',    link: 'Lihat majelis', done: 10, total: 20, unit: 'anggota kumpulan', desc: 'Kelompok kamu tidak lancar.' },
    ],
    rewardIcon: '⚠️', rewardTone: 'warn',
    rewardText: 'Hadiah Ibu berpotensi berkurang hingga Rp250.000.',
  },
  'sangat-buruk': {
    label: 'Sangat Buruk', color: '#B91C1C',
    rows: [
      { title: 'Kelancaran pembayaran', link: 'Lihat riwayat', done: 5, total: 12, unit: 'minggu berjalan', desc: 'Pembayaran kamu kurang dari separuh tepat waktu.' },
      { title: 'Kehadiran kumpulan',    link: 'Lihat riwayat', done: 5, total: 12, unit: 'minggu berjalan', desc: 'Kamu 5 kali tidak hadir kumpulan.' },
      { title: 'Pembayaran anggota',    link: 'Lihat majelis', done: 6, total: 20, unit: 'anggota kumpulan', desc: 'Kelompok kamu tidak lancar.' },
    ],
    rewardIcon: '⚠️', rewardTone: 'warn',
    rewardText: 'Hadiah Ibu di bulan Desember berpotensi hangus.',
  },
}
