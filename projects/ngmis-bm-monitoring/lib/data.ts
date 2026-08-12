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
  scope: 'Minggu ini, 22 - 27 Juni 2026',
  refreshed: 'Diperbarui 26 Jun 2026, 22:49',
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
  { id: 'dpd-flow', label: 'Flow rate ke DPD 1-30', value: 20, target: 15, higherIsBetter: false },
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

/** What the BM should do about a BP who is missing standards.
 *
 * The action keys off the bucket with the biggest shortfall in mitra, because
 * the three failures need different responses: mitra going unpaid at DPD 0
 * means collection is not happening at all, which is what a surprise visit
 * tests; DPD 1-30 means it is happening but not landing, which is a coaching
 * problem; and 31-90 is past what a BP can fix alone.
 *
 * Returns null for a BP clearing every standard — no action is the right
 * answer there, and inventing one would bury the BPs who need it.
 */
export interface Action {
  /** The bucket that triggered it, so the brief can be looked up. */
  id: string
  label: string
  reason: string
}

/** The brief behind an action. A button that only says "Surprise visit" leaves
 *  the BM to invent the instruction, the window and the proof — which is how
 *  two BMs end up running the same task differently. */
export interface ActionBrief {
  title: string
  what: string
  when: string
  /** The day the task lands on once created — stated rather than derived from
   *  `when`, which is a range and would have to be parsed back out. */
  scheduledFor: string
  evidence: string[]
  ifNotDone: string
}

export const ACTION_BRIEFS: Record<string, ActionBrief> = {
  dpd0: {
    title: 'Surprise visit',
    what: 'Datangi majelis tanpa memberi tahu lebih dulu. Periksa apakah kumpulan benar berjalan dan mitra yang baru telat sudah didatangi.',
    when: 'Selasa 28 - Rabu 29 Juli',
    scheduledFor: 'Selasa, 28 Juli',
    evidence: [
      'Foto di lokasi majelis',
      'Titik lokasi otomatis dari BP App',
      'Catatan penyebab mitra tidak bayar',
    ],
    ifNotDone: 'Tidak ada. Hasilnya masuk ke penilaian mingguan.',
  },
  dpd130: {
    title: 'Dampingi penagihan',
    what: 'Ikut BP ke majelis dan dampingi saat menagih mitra yang sudah telat. Tunjukkan cara membuka pembicaraan, jangan ambil alih.',
    when: 'Rabu 29 - Kamis 30 Juli',
    scheduledFor: 'Rabu, 29 Juli',
    evidence: [
      'Catatan hasil tiap mitra yang didampingi',
      'Kesepakatan tanggal bayar dari mitra',
    ],
    ifNotDone: 'Tidak ada. Hasilnya masuk ke penilaian mingguan.',
  },
  dpd3190: {
    title: 'Eskalasi ke Area Manager',
    what: 'Bawa daftar mitra DPD 31-90 ke Area Manager. Sudah di luar yang bisa diselesaikan BP sendiri.',
    when: 'Sebelum Jumat 31 Juli',
    scheduledFor: 'Kamis, 30 Juli',
    evidence: ['Daftar mitra dan riwayat penagihannya', 'Rencana tindak lanjut yang disetujui AM'],
    ifNotDone: 'Tidak ada. Hasilnya masuk ke penilaian mingguan.',
  },
}

const ACTION_BY_BUCKET: Record<string, string> = {
  dpd0: 'Surprise visit',
  dpd130: 'Dampingi penagihan',
  dpd3190: 'Eskalasi ke Area Manager',
}

const BUCKET_LABEL: Record<string, string> = {
  dpd0: 'DPD 0',
  dpd130: 'DPD 1-30',
  dpd3190: 'DPD 31-90',
}

export function recommendedAction(bp: RepaymentBp): Action | null {
  const gaps = SCORED_BUCKETS.map((id) => ({
    id,
    short: mitraShortfall(bp[id as 'dpd0' | 'dpd130' | 'dpd3190'], id) ?? 0,
  }))
  const worst = gaps.reduce((a, b) => (b.short > a.short ? b : a))
  if (worst.short === 0) return null
  return {
    id: worst.id,
    label: ACTION_BY_BUCKET[worst.id],
    reason: `${worst.short} mitra ${BUCKET_LABEL[worst.id]} kurang dari target`,
  }
}

// --- Pencairan ---------------------------------------------------------------
//
// One row per BP, weakest first, split the way the business reads disbursement:
// how MANY loans went out (NoA) and how MUCH they were worth, each broken into
// mitra baru and mitra lanjutan. The two halves answer different questions —
// new mitra are growth, renewals are retention — and a BP can be strong at one
// while failing the other, which a single "pencairan" figure hides.
//
// Renewal is stated as a RATE as well as a count. A count of 11 renewals means
// nothing without how many were due: the same eleven is excellent on a book
// with twelve maturing and poor on one with twenty.

export interface DisbursementBp {
  id: string
  name: string
  majelis: number
  /** Loans disbursed to mitra new to Amartha. */
  noaBaru: number
  /** Loans disbursed to mitra renewing. */
  noaLanjutan: number
  /** Mitra whose cycle ended in this period — the denominator for renewal. */
  renewalDue: number
  /** Rupiah, in juta, so the table can print what the business says out loud. */
  nilaiBaru: number
  nilaiLanjutan: number
}

export const DISBURSEMENT_BPS: DisbursementBp[] = [
  { id: 'bp-sukma', name: 'Sukma Ayuningrum', majelis: 6, noaBaru: 2, noaLanjutan: 11, renewalDue: 14, nilaiBaru: 10, nilaiLanjutan: 72 },
  { id: 'bp-cenli', name: 'Cenli Cencen', majelis: 8, noaBaru: 2, noaLanjutan: 13, renewalDue: 16, nilaiBaru: 10, nilaiLanjutan: 87 },
  { id: 'bp-diski', name: 'Diski Tafa Ilham', majelis: 8, noaBaru: 3, noaLanjutan: 13, renewalDue: 15, nilaiBaru: 15, nilaiLanjutan: 89 },
  { id: 'bp-laili', name: 'Laili Maulidia', majelis: 8, noaBaru: 3, noaLanjutan: 15, renewalDue: 18, nilaiBaru: 15, nilaiLanjutan: 103 },
  { id: 'bp-ainur', name: 'Ainur Rohmah', majelis: 8, noaBaru: 4, noaLanjutan: 15, renewalDue: 17, nilaiBaru: 20, nilaiLanjutan: 106 },
  { id: 'bp-fadhil', name: 'Fadhil Maulana', majelis: 7, noaBaru: 4, noaLanjutan: 16, renewalDue: 18, nilaiBaru: 20, nilaiLanjutan: 114 },
  { id: 'bp-rudi', name: 'Rudi Hartono', majelis: 6, noaBaru: 5, noaLanjutan: 16, renewalDue: 20, nilaiBaru: 25, nilaiLanjutan: 116 },
  { id: 'bp-alif', name: 'M. Alif Rizqi', majelis: 8, noaBaru: 5, noaLanjutan: 18, renewalDue: 20, nilaiBaru: 25, nilaiLanjutan: 124 },
  { id: 'bp-budi', name: 'Budi Ngurah', majelis: 6, noaBaru: 6, noaLanjutan: 18, renewalDue: 21, nilaiBaru: 30, nilaiLanjutan: 126 },
  { id: 'bp-fauzan', name: 'Fauzan Aditama', majelis: 7, noaBaru: 6, noaLanjutan: 19, renewalDue: 21, nilaiBaru: 30, nilaiLanjutan: 133 },
]

/**
 * What the business asks of a BP each MONTH: twenty new mitra disbursed, and
 * 85% of the mitra whose cycle ended coming back for another one.
 *
 * `nilai` is the rupiah the two together are expected to add up to — it is not
 * a third goal, it is the money version of the first two, and it is the column
 * the BM is chased on.
 */
export const DISBURSEMENT_TARGETS = {
  /** Mitra baru cair per bulan. */
  noaBaru: 20,
  /** Renewal mitra lanjutan cair per bulan, as a share of those due. */
  renewalRate: 85,
  /** Nilai pencairan per bulan, in juta. */
  nilai: 180,
}

/** Weeks in the month the monthly targets are spread across — the page reports
 *  a week, the targets are set for a month, so the count target has to be
 *  paced before a weekly figure can be judged against it at all. */
export const WEEKS_IN_MONTH = 4

export const noaTotal = (bp: DisbursementBp) => bp.noaBaru + bp.noaLanjutan
export const nilaiTotal = (bp: DisbursementBp) => bp.nilaiBaru + bp.nilaiLanjutan

/** Share of the mitra due for renewal who actually took another loan. */
export const renewalRate = (bp: DisbursementBp) =>
  bp.renewalDue === 0 ? 0 : (bp.noaLanjutan / bp.renewalDue) * 100

/** Rupiah still to disburse before the BP clears the month's nilai target. */
export const nilaiShortfall = (bp: DisbursementBp) =>
  Math.max(0, DISBURSEMENT_TARGETS.nilai - nilaiTotal(bp))

/**
 * How hard a miss is, as three bands rather than a pass/fail.
 *
 * A pencairan gap is not binary the way a repayment standard is: every BP in
 * the branch is short of a monthly target mid-month, so colouring them all red
 * would say nothing. The bands are shares of the target itself — 40% or more
 * still missing is a month that will not be recovered without help, 20% is
 * behind but reachable, under that is on track.
 */
export type Band = 'red' | 'orange' | 'green'

export function shortfallBand(shortfall: number): Band {
  const share = (shortfall / DISBURSEMENT_TARGETS.nilai) * 100
  if (share >= 40) return 'red'
  if (share >= 20) return 'orange'
  return 'green'
}

/** The same three bands for the new-mitra count, paced to the week. */
export function noaBaruBand(count: number): Band {
  const weekly = DISBURSEMENT_TARGETS.noaBaru / WEEKS_IN_MONTH
  if (count >= weekly) return 'green'
  if (count >= weekly - 1) return 'orange'
  return 'red'
}

/** Branch totals — the two headline figures above the table. */
export function branchDisbursement() {
  const baru = DISBURSEMENT_BPS.reduce((n, bp) => n + bp.noaBaru, 0)
  const lanjutan = DISBURSEMENT_BPS.reduce((n, bp) => n + bp.noaLanjutan, 0)
  const due = DISBURSEMENT_BPS.reduce((n, bp) => n + bp.renewalDue, 0)
  return { baru, lanjutan, due, renewal: due === 0 ? 0 : (lanjutan / due) * 100 }
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
