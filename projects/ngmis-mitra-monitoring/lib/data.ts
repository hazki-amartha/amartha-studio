// Mock data for Mitra monitoring — only what is on screen: seven majelis and
// eight mitra.

export const REGIONS = [
  { value: 'jawa', label: 'Jawa' },
  { value: 'sumatera', label: 'Sumatera' },
  { value: 'sulawesi', label: 'Sulawesi' },
]

export const PROVINCES = [
  { value: 'jawa-barat', label: 'Jawa Barat' },
  { value: 'jawa-tengah', label: 'Jawa Tengah' },
  { value: 'jawa-timur', label: 'Jawa Timur' },
]

export const KOTA = [
  { value: 'cirebon', label: 'Cirebon' },
  { value: 'indramayu', label: 'Indramayu' },
  { value: 'kuningan', label: 'Kuningan' },
]

export const BRANCHES = [
  { value: 'belawa', label: 'Belawa' },
  { value: 'cirebon-1', label: 'Cirebon 1' },
  { value: 'cirebon-2', label: 'Cirebon 2' },
]

export const TABS = [
  { id: 'majelis', label: 'Per majelis' },
  { id: 'mitra', label: 'Per mitra' },
]

export const UPDATE_BAR = {
  scope: 'Minggu ini, 22 - 27 Juni 2026',
  refreshed: 'Diperbarui 26 Jun 2026, 22:49',
}

// --- Buckets ----------------------------------------------------------------

export type BucketId = 'dpd0' | 'dpd130' | 'dpd3190' | 'dpd90'
export type Intent = 'green' | 'yellow' | 'orange' | 'red'

export const BUCKETS: { id: BucketId; label: string; intent: Intent }[] = [
  { id: 'dpd0', label: 'DPD 0', intent: 'green' },
  { id: 'dpd130', label: 'DPD 1-30', intent: 'yellow' },
  { id: 'dpd3190', label: 'DPD 31-90', intent: 'orange' },
  { id: 'dpd90', label: 'DPD 90+', intent: 'red' },
]

/** Rate standards, in percent. DPD 90+ carries none. */
export const TARGETS: Partial<Record<BucketId, number>> = {
  dpd0: 98,
  dpd130: 55,
  dpd3190: 13,
}

/** Mitra counted in one bucket: `total` active, `paid` with at least one
 *  angsuran this week. */
export interface Count {
  total: number
  paid: number
}

export interface Majelis {
  id: string
  name: string
  bp: string
  dpd0: Count
  dpd130: Count
  dpd3190: Count
  dpd90: Count
}

const c = (total: number, paid: number): Count => ({ total, paid })

export const MAJELIS: Majelis[] = [
  { id: 'm-melati', name: 'Melati 1', bp: 'Fadhil Maulana', dpd0: c(20, 18), dpd130: c(6, 3), dpd3190: c(3, 1), dpd90: c(1, 0) },
  { id: 'm-mawar', name: 'Mawar', bp: 'Fadhil Maulana', dpd0: c(18, 16), dpd130: c(5, 2), dpd3190: c(2, 1), dpd90: c(2, 0) },
  { id: 'm-anggrek', name: 'Anggrek', bp: 'Sukma Ayuningrum', dpd0: c(22, 17), dpd130: c(6, 2), dpd3190: c(4, 1), dpd90: c(1, 0) },
  { id: 'm-kenanga', name: 'Kenanga', bp: 'Diski Tafa Ilham', dpd0: c(19, 16), dpd130: c(7, 3), dpd3190: c(3, 1), dpd90: c(2, 0) },
  { id: 'm-dahlia', name: 'Dahlia', bp: 'Cenli Cencen', dpd0: c(21, 18), dpd130: c(4, 2), dpd3190: c(2, 0), dpd90: c(3, 0) },
  { id: 'm-teratai', name: 'Teratai', bp: 'Laili Maulidia', dpd0: c(17, 15), dpd130: c(6, 3), dpd3190: c(4, 2), dpd90: c(1, 0) },
  { id: 'm-cempaka', name: 'Cempaka', bp: 'Rudi Hartono', dpd0: c(23, 21), dpd130: c(3, 2), dpd3190: c(2, 1), dpd90: c(0, 0) },
]

export const totalOf = (m: Majelis): Count => ({
  total: m.dpd0.total + m.dpd130.total + m.dpd3190.total + m.dpd90.total,
  paid: m.dpd0.paid + m.dpd130.paid + m.dpd3190.paid + m.dpd90.paid,
})

export function branchBucket(id: BucketId): Count {
  return MAJELIS.reduce(
    (acc, m) => ({ total: acc.total + m[id].total, paid: acc.paid + m[id].paid }),
    { total: 0, paid: 0 },
  )
}

/** Percent, or null when nobody is in the bucket. */
export const rateOf = (n: Count) => (n.total === 0 ? null : (n.paid / n.total) * 100)

export const formatRate = (r: number | null) =>
  r === null ? '-' : `${r.toFixed(1).replace('.', ',').replace(',0', '')}%`

/** Rate against the bucket's standard; null where there is none to judge. */
export function meetsTarget(n: Count, id: BucketId): boolean | null {
  const t = TARGETS[id]
  const r = rateOf(n)
  if (t === undefined || r === null) return null
  return r >= t
}

// --- Per mitra --------------------------------------------------------------

export interface Mitra {
  id: string
  name: string
  majelis: string
  bp: string
  bucket: BucketId
  tunggakan: number
  lastPaid: string
}

export const MITRA: Mitra[] = [
  { id: 'mi-1', name: 'Siti Aminah', majelis: 'Melati 1', bp: 'Fadhil Maulana', bucket: 'dpd90', tunggakan: 4850000, lastPaid: '12 Mar 2026' },
  { id: 'mi-2', name: 'Rohmah', majelis: 'Kenanga', bp: 'Diski Tafa Ilham', bucket: 'dpd90', tunggakan: 3920000, lastPaid: '28 Mar 2026' },
  { id: 'mi-3', name: 'Dewi Lestari', majelis: 'Dahlia', bp: 'Cenli Cencen', bucket: 'dpd3190', tunggakan: 1640000, lastPaid: '29 Apr 2026' },
  { id: 'mi-4', name: 'Yuli Astuti', majelis: 'Anggrek', bp: 'Sukma Ayuningrum', bucket: 'dpd3190', tunggakan: 1280000, lastPaid: '07 May 2026' },
  { id: 'mi-5', name: 'Nur Hayati', majelis: 'Teratai', bp: 'Laili Maulidia', bucket: 'dpd130', tunggakan: 420000, lastPaid: '13 Jun 2026' },
  { id: 'mi-6', name: 'Sri Wahyuni', majelis: 'Mawar', bp: 'Fadhil Maulana', bucket: 'dpd130', tunggakan: 310000, lastPaid: '16 Jun 2026' },
  { id: 'mi-7', name: 'Ani Marlina', majelis: 'Cempaka', bp: 'Rudi Hartono', bucket: 'dpd130', tunggakan: 180000, lastPaid: '20 Jun 2026' },
  { id: 'mi-8', name: 'Tuti Handayani', majelis: 'Kenanga', bp: 'Diski Tafa Ilham', bucket: 'dpd0', tunggakan: 0, lastPaid: '24 Jun 2026' },
]

export const rupiah = (n: number) => n.toLocaleString('id-ID')
