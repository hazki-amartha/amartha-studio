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
/** Pembayaran is read a week at a time; Pencairan is set and chased by the
 *  MONTH, so the scope line changes with the tab rather than claiming one
 *  period for both. */
export const UPDATE_BAR = {
  scope: 'Minggu ini, 22 - 27 Juni 2026',
  scopeMonthly: 'Bulan ini, 1 - 27 Juni 2026',
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

/** A bucket counted two ways. The page reads in loans or in rupiah, and the
 *  two tell different stories — a handful of large arrears is a rounding error
 *  by count and most of the money by value — so both live on every bucket
 *  rather than one being derived from the other. */
export interface Bucket {
  /** Loans active in this bucket. */
  total: number
  /** Loans with at least one angsuran paid this period. */
  paid: number
  /** Rupiah due. */
  due: number
  /** Rupiah actually paid. */
  dibayar: number
}

/** Which reading the page is in. */
export type Unit = 'pinjaman' | 'rupiah'

export type BucketIntent = 'green' | 'yellow' | 'orange' | 'red'

/** The buckets in reading order. `intent` runs green → red with age, so the
 *  row of cards reads as a severity ramp before a number is taken in. The
 *  first is "Lancar" on the cards but "DPD 0" in the table: the cards describe
 *  the state of the book, the table scores a bucket against its standard. */
export const BUCKET_ORDER: { id: string; label: string; intent: BucketIntent }[] = [
  { id: 'dpd0', label: 'Lancar', intent: 'green' },
  { id: 'dpd130', label: 'DPD 1-30', intent: 'yellow' },
  { id: 'dpd3190', label: 'DPD 31-90', intent: 'orange' },
  { id: 'dpd90', label: 'DPD 90+', intent: 'red' },
]

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
  total: Bucket
  dpd0: Bucket
  dpd130: Bucket
  dpd3190: Bucket
  dpd90: Bucket
}

export const REPAYMENT_BPS: RepaymentBp[] = [
  {
    id: 'bp-sukma', name: 'Sukma Ayuningrum', majelis: 6,
    total: { total: 270, paid: 158, due: 146148615, dibayar: 11663586 },
    dpd0: { total: 172, paid: 132, due: 10328678, dibayar: 9426506 },
    dpd130: { total: 50, paid: 18, due: 9105650, dibayar: 2078943 },
    dpd3190: { total: 30, paid: 6, due: 33497852, dibayar: 158137 },
    dpd90: { total: 18, paid: 2, due: 93216435, dibayar: 0 },
  },
  {
    id: 'bp-diski', name: 'Diski Tafa Ilham', majelis: 8,
    total: { total: 266, paid: 184, due: 127350428, dibayar: 11971316 },
    dpd0: { total: 184, paid: 158, due: 11078565, dibayar: 9904900 },
    dpd130: { total: 42, paid: 18, due: 8232139, dibayar: 1791486 },
    dpd3190: { total: 26, paid: 6, due: 29754735, dibayar: 274930 },
    dpd90: { total: 14, paid: 2, due: 78284989, dibayar: 0 },
  },
  {
    id: 'bp-cenli', name: 'Cenli Cencen', majelis: 8,
    total: { total: 258, paid: 174, due: 125580312, dibayar: 12415554 },
    dpd0: { total: 176, paid: 148, due: 11088591, dibayar: 10335484 },
    dpd130: { total: 44, paid: 18, due: 8162643, dibayar: 1953321 },
    dpd3190: { total: 24, paid: 6, due: 26943031, dibayar: 126749 },
    dpd90: { total: 14, paid: 2, due: 79386047, dibayar: 0 },
  },
  {
    id: 'bp-laili', name: 'Laili Maulidia', majelis: 8,
    total: { total: 292, paid: 222, due: 118253455, dibayar: 13459972 },
    dpd0: { total: 210, paid: 188, due: 12709500, dibayar: 11208008 },
    dpd130: { total: 44, paid: 22, due: 8497047, dibayar: 1850826 },
    dpd3190: { total: 26, paid: 10, due: 29351003, dibayar: 401138 },
    dpd90: { total: 12, paid: 2, due: 67695905, dibayar: 0 },
  },
  {
    id: 'bp-fadhil', name: 'Fadhil Maulana', majelis: 7,
    total: { total: 276, paid: 222, due: 97246816, dibayar: 13631661 },
    dpd0: { total: 208, paid: 192, due: 12733453, dibayar: 11817338 },
    dpd130: { total: 36, paid: 20, due: 6615741, dibayar: 1686001 },
    dpd3190: { total: 22, paid: 8, due: 25300228, dibayar: 128322 },
    dpd90: { total: 10, paid: 2, due: 52597394, dibayar: 0 },
  },
  {
    id: 'bp-ainur', name: 'Ainur Rohmah', majelis: 8,
    total: { total: 242, paid: 190, due: 94073168, dibayar: 12043813 },
    dpd0: { total: 178, paid: 164, due: 11652444, dibayar: 10559091 },
    dpd130: { total: 34, paid: 18, due: 6385594, dibayar: 1303185 },
    dpd3190: { total: 20, paid: 6, due: 22019121, dibayar: 181537 },
    dpd90: { total: 10, paid: 2, due: 54016009, dibayar: 0 },
  },
  {
    id: 'bp-rudi', name: 'Rudi Hartono', majelis: 6,
    total: { total: 248, paid: 208, due: 83246683, dibayar: 12983705 },
    dpd0: { total: 192, paid: 182, due: 12024352, dibayar: 11233776 },
    dpd130: { total: 30, paid: 18, due: 5671200, dibayar: 1442274 },
    dpd3190: { total: 18, paid: 6, due: 20646807, dibayar: 307655 },
    dpd90: { total: 8, paid: 2, due: 44904324, dibayar: 0 },
  },
  {
    id: 'bp-budi', name: 'Budi Ngurah', majelis: 6,
    total: { total: 256, paid: 224, due: 71379636, dibayar: 13802235 },
    dpd0: { total: 204, paid: 194, due: 13195361, dibayar: 12375638 },
    dpd130: { total: 30, paid: 20, due: 5819527, dibayar: 1312469 },
    dpd3190: { total: 16, paid: 8, due: 18051581, dibayar: 114128 },
    dpd90: { total: 6, paid: 2, due: 34313167, dibayar: 0 },
  },
  {
    id: 'bp-alif', name: 'M. Alif Rizqi', majelis: 8,
    total: { total: 270, paid: 234, due: 81325813, dibayar: 13157584 },
    dpd0: { total: 212, paid: 200, due: 12804817, dibayar: 11316995 },
    dpd130: { total: 32, paid: 22, due: 6171440, dibayar: 1599541 },
    dpd3190: { total: 18, paid: 8, due: 18822318, dibayar: 241048 },
    dpd90: { total: 8, paid: 4, due: 43527238, dibayar: 0 },
  },
  {
    id: 'bp-fauzan', name: 'Fauzan Aditama', majelis: 7,
    total: { total: 284, paid: 262, due: 69158497, dibayar: 14279340 },
    dpd0: { total: 236, paid: 226, due: 14270106, dibayar: 13215937 },
    dpd130: { total: 28, paid: 22, due: 5411711, dibayar: 993239 },
    dpd3190: { total: 14, paid: 10, due: 15611656, dibayar: 70164 },
    dpd90: { total: 6, paid: 4, due: 33865024, dibayar: 0 },
  },
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

export function rate(b: Bucket, unit: Unit = 'pinjaman') {
  const [whole, part] = unit === 'rupiah' ? [b.due, b.dibayar] : [b.total, b.paid]
  return whole === 0 ? 0 : (part / whole) * 100
}

export const rupiah = (n: number) => n.toLocaleString('id-ID')

/** A shortfall said in whatever unit is on screen. */
export const shortfallLabel = (n: number, unit: Unit) =>
  unit === 'rupiah' ? `Rp${rupiah(n)} lagi` : `${n} pinjaman lagi`

/** One bucket totalled across every BP — loans and rupiah pooled, not an
 *  average of rates, so a BP with six loans cannot swing the branch figure as
 *  hard as one with three hundred. */
export function branchBucket(id: string): Bucket {
  return REPAYMENT_BPS.reduce(
    (acc, bp) => {
      const b = bp[id as 'total' | 'dpd0' | 'dpd130' | 'dpd3190' | 'dpd90']
      return {
        total: acc.total + b.total,
        paid: acc.paid + b.paid,
        due: acc.due + b.due,
        dibayar: acc.dibayar + b.dibayar,
      }
    },
    { total: 0, paid: 0, due: 0, dibayar: 0 },
  )
}

/** Does this bucket clear the biz team's standard? Buckets without a target
 *  return null rather than false — "no standard" is not the same as "missed". */
export function meetsTarget(bucket: Bucket, id: string, unit: Unit = 'pinjaman'): boolean | null {
  const target = TARGETS[id]
  if (target === undefined) return null
  return rate(bucket, unit) >= target
}

/** How many more mitra must pay for this bucket to clear its standard.
 *  A count, not a percentage-point gap: "kurang 37 mitra" is something a BP can
 *  act on this week, while "kurang 21,3" is arithmetic the reader has to
 *  convert before it means anything. */
export function shortfall(bucket: Bucket, id: string, unit: Unit = 'pinjaman'): number | null {
  const target = TARGETS[id]
  if (target === undefined) return null
  const [whole, part] = unit === 'rupiah' ? [bucket.due, bucket.dibayar] : [bucket.total, bucket.paid]
  return Math.max(0, Math.ceil((whole * target) / 100) - part)
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
    short: shortfall(bp[id as 'dpd0' | 'dpd130' | 'dpd3190'], id) ?? 0,
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

export const noaTotal = (bp: DisbursementBp) => bp.noaBaru + bp.noaLanjutan
export const nilaiTotal = (bp: DisbursementBp) => bp.nilaiBaru + bp.nilaiLanjutan

/** Share of the mitra due for renewal who actually took another loan. */
export const renewalRate = (bp: DisbursementBp) =>
  bp.renewalDue === 0 ? 0 : (bp.noaLanjutan / bp.renewalDue) * 100

/** Rupiah still to disburse before the BP clears the month's nilai target. */
export const nilaiShortfall = (bp: DisbursementBp) =>
  Math.max(0, DISBURSEMENT_TARGETS.nilai - nilaiTotal(bp))

/** Share of the month's nilai target this BP has disbursed so far. */
export const nilaiRate = (bp: DisbursementBp) => (nilaiTotal(bp) / DISBURSEMENT_TARGETS.nilai) * 100
export const meetsNilai = (bp: DisbursementBp) => nilaiRate(bp) >= 100

/** Mitra baru still to disburse before the BP clears the month's count target. */
export const noaBaruShortfall = (bp: DisbursementBp) =>
  Math.max(0, DISBURSEMENT_TARGETS.noaBaru - bp.noaBaru)

/** Share of the month's mitra baru target this BP has disbursed so far. */
export const noaBaruRate = (bp: DisbursementBp) => (bp.noaBaru / DISBURSEMENT_TARGETS.noaBaru) * 100
export const meetsNoaBaru = (bp: DisbursementBp) => noaBaruRate(bp) >= 100

/** How many more of the mitra due for renewal have to come back before the BP
 *  clears the 85% standard — a count, not a percentage-point gap, for the same
 *  reason Pembayaran reports its shortfall in mitra. */
export const renewalShortfall = (bp: DisbursementBp) =>
  Math.max(
    0,
    Math.ceil((bp.renewalDue * DISBURSEMENT_TARGETS.renewalRate) / 100) - bp.noaLanjutan,
  )

/** Does this BP clear the renewal standard — the one figure on the tab that is
 *  a rate, and so the only one that carries a verdict. Pencairan follows
 *  Pembayaran here: the counts are facts and stay black, the rate is the
 *  judgement and is the only thing allowed to wear colour. */
export const meetsRenewal = (bp: DisbursementBp) =>
  renewalRate(bp) >= DISBURSEMENT_TARGETS.renewalRate

/** Branch totals — the two headline figures above the table. */
export function branchDisbursement() {
  const baru = DISBURSEMENT_BPS.reduce((n, bp) => n + bp.noaBaru, 0)
  const lanjutan = DISBURSEMENT_BPS.reduce((n, bp) => n + bp.noaLanjutan, 0)
  const due = DISBURSEMENT_BPS.reduce((n, bp) => n + bp.renewalDue, 0)
  return { baru, lanjutan, due, renewal: due === 0 ? 0 : (lanjutan / due) * 100 }
}
