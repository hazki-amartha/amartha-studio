// Mock data for the BM monitoring prototype. Kept to what is actually on
// screen (CLAUDE.md §3): ten BP rows because the table shows ten, five history
// rows because the history screen shows five.

// --- Header filters ---------------------------------------------------------
//
// The header narrows region → provinsi → kota, then branch, BP and majelis
// within it. Only the kota list drives anything (it names the page); the rest
// are drawn so the shape of the control row is right.

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
  { value: 'all', label: 'Semua branch' },
  { value: 'cirebon-1', label: 'Cirebon 1' },
  { value: 'cirebon-2', label: 'Cirebon 2' },
]

export const BP_FILTER = [
  { value: 'all', label: 'Semua BP' },
  { value: 'fadhil', label: 'Fadhil Maulana' },
  { value: 'sukma', label: 'Sukma Ayuningrum' },
]

// --- Tabs -------------------------------------------------------------------

export const TABS = [
  { id: 'task', label: 'Tugas' },
  { id: 'disbursement', label: 'Pencairan' },
  { id: 'repayment', label: 'Pembayaran' },
]

/** The band under the tabs: what period the figures cover, and when they last
 *  landed. Two different facts — the scope, and the freshness. */
export const UPDATE_BAR = {
  scope: 'Update: Minggu ini',
  refreshed: 'Diperbarui Hari ini, 29 Dec 2025, 12:44',
}

/** The tab the dashboard opens on — the first one, kept as a named constant so
 *  reordering TABS doesn't silently land the screen on an empty view. */
export const DEFAULT_TAB = TABS[0].id

// --- Repayment ---------------------------------------------------------------
//
// One row per BP, ranked worst first. The unit is the MITRA, not the loan:
// each mitra sits in exactly one ageing bucket, so the four buckets always sum
// to the Total Mitra pair and the row is consistent by construction.
//
// A mitra counts as terbayar once at least one angsuran lands in the period
// ("paid min. 1x angsuran").

export interface Bucket {
  total: number
  paid: number
}

/** The two headline rates for the branch, each judged against its own target. */
export interface Metric {
  id: string
  label: string
  value: number
  target: number
  /** DPD flow is a rate you want DOWN; repayment is one you want UP. Without
   *  this flag both would score the same way and one of them would read
   *  backwards. */
  higherIsBetter: boolean
}

export const REPAYMENT_METRICS: Metric[] = [
  { id: 'dpd-flow', label: 'Flow rate to DPD 1-30', value: 20, target: 15, higherIsBetter: false },
  { id: 'repayment-rate', label: 'Repayment rate', value: 60, target: 90, higherIsBetter: true },
]

export function metricOnTarget(m: Metric) {
  return m.higherIsBetter ? m.value >= m.target : m.value <= m.target
}

export interface RepaymentBp {
  id: string
  name: string
  majelis: number
  mitra: Bucket
  dpd0: Bucket
  dpd130: Bucket
  dpd3190: Bucket
  dpd90: Bucket
}

export const REPAYMENT_BPS: RepaymentBp[] = [
  { id: 'bp-sukma', name: 'Sukma Ayuningrum', majelis: 6,
    mitra: { total: 270, paid: 158 }, dpd0: { total: 172, paid: 132 }, dpd130: { total: 50, paid: 18 }, dpd3190: { total: 30, paid: 6 }, dpd90: { total: 18, paid: 2 } },
  { id: 'bp-diski', name: 'Diski Tafa Ilham', majelis: 8,
    mitra: { total: 266, paid: 184 }, dpd0: { total: 184, paid: 158 }, dpd130: { total: 42, paid: 18 }, dpd3190: { total: 26, paid: 6 }, dpd90: { total: 14, paid: 2 } },
  { id: 'bp-cenli', name: 'Cenli Cencen', majelis: 8,
    mitra: { total: 258, paid: 174 }, dpd0: { total: 176, paid: 148 }, dpd130: { total: 44, paid: 18 }, dpd3190: { total: 24, paid: 6 }, dpd90: { total: 14, paid: 2 } },
  { id: 'bp-laili', name: 'Laili Maulidia', majelis: 8,
    mitra: { total: 292, paid: 222 }, dpd0: { total: 210, paid: 188 }, dpd130: { total: 44, paid: 22 }, dpd3190: { total: 26, paid: 10 }, dpd90: { total: 12, paid: 2 } },
  { id: 'bp-fadhil', name: 'Fadhil Maulana', majelis: 7,
    mitra: { total: 276, paid: 222 }, dpd0: { total: 208, paid: 192 }, dpd130: { total: 36, paid: 20 }, dpd3190: { total: 22, paid: 8 }, dpd90: { total: 10, paid: 2 } },
  { id: 'bp-ainur', name: 'Ainur Rohmah', majelis: 8,
    mitra: { total: 242, paid: 190 }, dpd0: { total: 178, paid: 164 }, dpd130: { total: 34, paid: 18 }, dpd3190: { total: 20, paid: 6 }, dpd90: { total: 10, paid: 2 } },
  { id: 'bp-rudi', name: 'Rudi Hartono', majelis: 6,
    mitra: { total: 248, paid: 208 }, dpd0: { total: 192, paid: 182 }, dpd130: { total: 30, paid: 18 }, dpd3190: { total: 18, paid: 6 }, dpd90: { total: 8, paid: 2 } },
  { id: 'bp-budi', name: 'Budi Ngurah', majelis: 6,
    mitra: { total: 256, paid: 224 }, dpd0: { total: 204, paid: 194 }, dpd130: { total: 30, paid: 20 }, dpd3190: { total: 16, paid: 8 }, dpd90: { total: 6, paid: 2 } },
  { id: 'bp-alif', name: 'M. Alif Rizqi', majelis: 8,
    mitra: { total: 270, paid: 234 }, dpd0: { total: 212, paid: 200 }, dpd130: { total: 32, paid: 22 }, dpd3190: { total: 18, paid: 8 }, dpd90: { total: 8, paid: 4 } },
  { id: 'bp-fauzan', name: 'Fauzan Aditama', majelis: 7,
    mitra: { total: 284, paid: 262 }, dpd0: { total: 236, paid: 226 }, dpd130: { total: 28, paid: 22 }, dpd3190: { total: 14, paid: 10 }, dpd90: { total: 6, paid: 4 } },
]

/** The biz team's standard: the share of a BP's mitra in each bucket that must
 *  pay. Total Mitra and DPD 90+ carry no target — the first is an aggregate of
 *  the others, and nobody is held to a number on the oldest bucket. */
export const TARGETS: Record<string, number> = {
  dpd0: 98,
  dpd130: 55,
  dpd3190: 13,
}

/** Bucket ids that carry a target, in table order. */
export const SCORED_BUCKETS = ['dpd0', 'dpd130', 'dpd3190']

export function rate({ total, paid }: Bucket) {
  return total === 0 ? 0 : (paid / total) * 100
}

/** The whole branch's rate for one bucket — every BP's mitra pooled, not an
 *  average of rates, which would let a BP with six mitra swing the figure as
 *  hard as one with three hundred. */
export function branchRate(bucket: string) {
  const sum = REPAYMENT_BPS.reduce(
    (acc, bp) => {
      const b = bp[bucket as 'mitra' | 'dpd0' | 'dpd130' | 'dpd3190' | 'dpd90']
      return { total: acc.total + b.total, paid: acc.paid + b.paid }
    },
    { total: 0, paid: 0 },
  )
  return rate(sum)
}

/** Does this bucket clear the biz team's standard? Buckets without a target
 *  return null rather than false — "no standard" is not the same as "missed". */
export function meetsTarget(bucket: Bucket, id: string): boolean | null {
  const target = TARGETS[id]
  if (target === undefined) return null
  return rate(bucket) >= target
}

/** How many more mitra must pay for this bucket to clear its standard.
 *  A count, not a percentage-point gap: "kurang 37 mitra" is something a BP can
 *  act on this week, while "kurang 21,3" is arithmetic the reader has to
 *  convert before it means anything. */
export function mitraShortfall(bucket: Bucket, id: string): number | null {
  const target = TARGETS[id]
  if (target === undefined) return null
  return Math.max(0, Math.ceil((bucket.total * target) / 100) - bucket.paid)
}

/** How many of the three standards a BP is clearing — the BM's at-a-glance
 *  answer to "is this one on track". */
export function targetsMet(bp: RepaymentBp) {
  const met = SCORED_BUCKETS.filter((id) => meetsTarget(bp[id as keyof RepaymentBp] as Bucket, id))
  return { met: met.length, total: SCORED_BUCKETS.length }
}

/** The bucket the branch is furthest below its target — measured as the gap to
 *  the standard, not the raw rate, so a bucket with a low bar does not look
 *  like the worst problem simply because its number is small. */
export function weakestBucket() {
  const scored = SCORED_BUCKETS.map((id) => {
    const pct = branchRate(id)
    return { id, pct, target: TARGETS[id], shortfall: TARGETS[id] - pct }
  })
  return scored.reduce((worst, b) => (b.shortfall > worst.shortfall ? b : worst))
}

/** The majelis the morning report asks the BM to plan around. */
export interface FlaggedMajelis {
  id: string
  name: string
  bp: string
  repaymentRate: number
  attendanceRate: number
}

export const FLAGGED_MAJELIS: FlaggedMajelis[] = [
  { id: 'm-123', name: '123_BIN TURATEA', bp: 'Fadhil Maulana', repaymentRate: 62, attendanceRate: 55 },
  { id: 'm-456', name: '456_BONTORAMBA', bp: 'Sukma Ayuningrum', repaymentRate: 67, attendanceRate: 60 },
  { id: 'm-789', name: '789_TAMALATEA', bp: 'Laili Maulidia', repaymentRate: 71, attendanceRate: 64 },
]

export const MORNING_ACTIONS = [
  { value: 'kunjungan', label: 'Kunjungan langsung ke majelis' },
  { value: 'telepon', label: 'Telepon ketua majelis' },
  { value: 'dampingi', label: 'Dampingi BP saat pertemuan' },
  { value: 'eskalasi', label: 'Eskalasi ke Area Manager' },
]

export const EVENING_CAUSES = [
  { value: 'cuaca', label: 'Cuaca / akses ke lokasi' },
  { value: 'panen', label: 'Musim panen belum masuk' },
  { value: 'mitra-luar', label: 'Mitra sedang di luar kota' },
  { value: 'bp-berhalangan', label: 'BP berhalangan hadir' },
  { value: 'lainnya', label: 'Lainnya' },
]

export interface HistoryEntry {
  id: string
  date: string
  kind: 'Morning report' | 'Evening report'
  submittedBy: string
  submittedAt: string
  status: 'Terkirim' | 'Terlambat' | 'Tidak diisi'
}

export const HISTORY: HistoryEntry[] = [
  { id: 'h-1', date: '26 Sep 2025', kind: 'Evening report', submittedBy: 'John Doe', submittedAt: '18.42 WIB', status: 'Terkirim' },
  { id: 'h-2', date: '26 Sep 2025', kind: 'Morning report', submittedBy: 'John Doe', submittedAt: '07.15 WIB', status: 'Terkirim' },
  { id: 'h-3', date: '25 Sep 2025', kind: 'Evening report', submittedBy: 'John Doe', submittedAt: '21.03 WIB', status: 'Terlambat' },
  { id: 'h-4', date: '25 Sep 2025', kind: 'Morning report', submittedBy: '—', submittedAt: '—', status: 'Tidak diisi' },
  { id: 'h-5', date: '24 Sep 2025', kind: 'Evening report', submittedBy: 'John Doe', submittedAt: '18.10 WIB', status: 'Terkirim' },
]
