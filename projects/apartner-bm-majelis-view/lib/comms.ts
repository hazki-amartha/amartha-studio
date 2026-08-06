// The inbox: what the business sends TO the BP. Ported from
// `apartner-homepage-ia`, where the same list sits behind Home's banner
// carousel — here it hangs off the one inbox in the schedule header.
//
// Each tag carries a token background for the detail page's hero.

export type CommTag = 'Program' | 'Fitur baru' | 'Pengumuman'

export const TAG_BG: Record<CommTag, string> = {
  Program: 'bg-primary-500',
  'Fitur baru': 'bg-blue-500',
  Pengumuman: 'bg-green-600',
}

export interface Comm {
  id: string
  tag: CommTag
  title: string
  /** The one-liner under the title on the detail hero. */
  sub: string
  /** Display date. */
  d: string
  /** Days ago — what the time filter measures. */
  days: number
  body: string
  read: boolean
}

export const COMMS_SEED: Comm[] = [
  {
    id: 'c1',
    tag: 'Program',
    title: 'Insentif Rekrutmen Q3 sudah dibuka',
    sub: 'Bonus per mitra aktif baru',
    d: '12 Jul 2026',
    days: 1,
    body: 'Setiap mitra aktif baru yang lolos verifikasi dihitung sebagai poin insentif.',
    read: false,
  },
  {
    id: 'c2',
    tag: 'Fitur baru',
    title: 'Cek SLIK langsung dari A-Partner',
    sub: 'Tak perlu buka NG-MIS lagi',
    d: '9 Jul 2026',
    days: 4,
    body: 'Tak perlu lagi membuka NG-MIS untuk pengecekan dasar.',
    read: false,
  },
  {
    id: 'c3',
    tag: 'Pengumuman',
    title: 'Jadwal setoran cabang berubah',
    sub: 'Berlaku mulai 20 Juli',
    d: '5 Jul 2026',
    days: 8,
    body: 'Mulai 20 Juli, setoran diterima sampai pukul 17.00.',
    read: true,
  },
  {
    id: 'c4',
    tag: 'Program',
    title: 'Pelatihan literasi keuangan mitra',
    sub: 'Modul baru untuk kumpulan',
    d: '1 Jul 2026',
    days: 12,
    body: 'Modul baru tersedia untuk kumpulan majelis mingguan.',
    read: true,
  },
  {
    id: 'c5',
    tag: 'Fitur baru',
    title: 'Titip bayar kini bisa disetor via VA',
    sub: 'Tanpa datang ke cabang',
    d: '24 Jun 2026',
    days: 19,
    body: 'Setoran harian tidak perlu lagi datang ke kantor cabang.',
    read: true,
  },
]

export const COMMS_TAGS: CommTag[] = ['Program', 'Fitur baru', 'Pengumuman']

export const TIME_OPTS: { label: string; value: number | null }[] = [
  { label: 'Semua waktu', value: null },
  { label: 'Hari ini', value: 0 },
  { label: '7 hari terakhir', value: 7 },
  { label: '30 hari terakhir', value: 30 },
]

export const inWindow = (days: number, w: number | null) =>
  w === null ? true : w === 0 ? days === 0 : days <= w
