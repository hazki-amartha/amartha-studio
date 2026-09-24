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
  { id: 'daily', label: 'Progres harian' },
  { id: 'repayment', label: 'Pembayaran' },
  { id: 'cash', label: 'Setor tunai' },
  { id: 'disbursement', label: 'Pencairan' },
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

/** The tab the dashboard opens on. Pencairan, not TABS[0] — a BM opens this
 *  dashboard to check disbursement against the month's target first, not the
 *  day's progress. Kept as a named constant rather than inlined so the entry
 *  tab stays a deliberate choice, not whatever TABS happens to list first. */
export const DEFAULT_TAB = 'disbursement'

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

// --- End state: the BP → mitra detail drill-down -----------------------------
//
// What opens when a BM clicks "Lihat detail" on a BP: every mitra under her
// (not just the ones behind a standard — a general lookup, not a shortfall
// list), each with her own DPD, tunggakan and the tindakan already logged
// against her, then drills once more into that one mitra's full call/visit
// history. Both panels are DERIVED from the BP's own numbers — a name pool
// cycled by the BP's own index — rather than hand-authored per BP, so ten BPs
// don't mean ten bespoke fixtures to keep in sync.

const MAJELIS_NAMES = ['Majelis 1', 'Majelis 2', 'Majelis 3']
const MITRA_NAMES = ['Siti Aminah', 'Wahyuni', 'Dewi Lestari', 'Ratna Sari', 'Yuli Astuti', 'Nur Fadilah']

/** The DPD chip a mitra wears in this drawer, and what "Semua status" filters
 *  by — its own four bands, finer than the loan-bucket `BUCKET_ORDER` the
 *  table above groups by: a single mitra's DPD is one number, so it reads
 *  naturally at a tighter grain than an aggregate bucket does. */
export const MITRA_DPD_BUCKETS: { id: string; label: string; intent: BucketIntent }[] = [
  { id: 'dpd0', label: 'DPD 0', intent: 'green' },
  { id: 'dpd130', label: 'DPD 1-30', intent: 'yellow' },
  { id: 'dpd3060', label: 'DPD 30-60', intent: 'orange' },
  { id: 'dpd6090', label: 'DPD 60-90', intent: 'red' },
]

export function dpdChipLabel(dpdId: string) {
  return MITRA_DPD_BUCKETS.find((b) => b.id === dpdId)?.label ?? dpdId
}

export function dpdChipIntent(dpdId: string) {
  return MITRA_DPD_BUCKETS.find((b) => b.id === dpdId)?.intent ?? 'green'
}

export interface MitraTindakan {
  date: string
  /** Pembayaran logs Telepon/Home Visit against an existing mitra; Pencairan
   *  logs "Contacted" against a lead who hasn't been visited yet — a
   *  different vocabulary for a different relationship, not two names for
   *  the same thing, so both stay distinct values rather than one being
   *  aliased to the other. */
  jenis: 'Telepon' | 'Home Visit' | 'Contacted'
  pelaku: 'AM' | 'BM' | 'BP'
  hasil: string
  hasilOk: boolean
  /** null when the visit/call itself carried no payment outcome to report. */
  dibayar: string | null
  /** What actually happened, in full — the detail view's own read, richer
   *  than the short outcome caption the timeline row shows beside the
   *  badge. */
  catatan: string
  /** Whether this task was logged in person, with a geotagged photo as
   *  proof. A Telepon call happens from wherever the BP is and carries
   *  neither; a Home Visit and Pencairan's site-visit outcomes
   *  (Survei selesai, Tidak di tempat) do. */
  evidence: boolean
}

export interface BpMitraDetail {
  id: string
  /** "002" — a stand-in for the mitra code the real roster prefixes each name
   *  with, so the row reads the same shape without fabricating a full address. */
  code: string
  name: string
  majelis: string
  dpdId: string
  tunggakan: number
  /** Most recent first — the roster panel shows the first two as a preview,
   *  the mitra's own panel shows the whole thing. */
  tindakan: MitraTindakan[]
  followUp: string
}

const TINDAKAN_JENIS: MitraTindakan['jenis'][] = ['Home Visit', 'Telepon', 'Home Visit', 'Telepon', 'Telepon']
const TINDAKAN_PELAKU: MitraTindakan['pelaku'][] = ['AM', 'BM', 'BP', 'BP', 'BP']
/** Paired 1:1 with `TINDAKAN_JENIS` by index — `evidence` follows the
 *  channel (a visit is logged in person, a call isn't), not the outcome. */
const TINDAKAN_HASIL: { label: string; ok: boolean; catatan: string; evidence: boolean }[] = [
  {
    label: 'Tidak berhasil',
    ok: false,
    catatan: 'Mitra tidak ada di rumah saat kunjungan dilakukan; tetangga menyebut sedang ke pasar.',
    evidence: true,
  },
  {
    label: 'Tidak berhasil',
    ok: false,
    catatan: 'Telepon tidak diangkat setelah tiga kali percobaan.',
    evidence: false,
  },
  {
    label: 'Diterima mitra',
    ok: true,
    catatan: 'Mitra ditemui langsung di rumah dan menyatakan kesanggupan membayar.',
    evidence: true,
  },
  {
    label: 'Diterima mitra',
    ok: true,
    catatan: 'Mitra menjawab telepon dan menyatakan bersedia membayar sesuai jadwal.',
    evidence: false,
  },
  {
    label: 'Janji bayar',
    ok: true,
    catatan: 'Mitra berjanji melunasi tunggakan sebelum akhir minggu.',
    evidence: false,
  },
]

/** Every mitra under a BP, not just the ones missing a standard — "Lihat
 *  detail" is a general lookup, not a shortfall list. Four mitra, cycled from
 *  the shared name/majelis pools above, each carrying five tindakan entries
 *  so the drawer's history table has enough rows to read as a real log
 *  rather than a single row repeated. Counts and rupiah scale off the BP's
 *  own `majelis`, the one real per-BP number available for fabricating this,
 *  rather than being identical for every row. */
export function mitraDetailFor(bp: RepaymentBp): BpMitraDetail[] {
  const start = REPAYMENT_BPS.findIndex((b) => b.id === bp.id)
  const bucketIds = MITRA_DPD_BUCKETS.map((b) => b.id)
  return Array.from({ length: 4 }, (_, i) => {
    const dpdId = bucketIds[(start + i) % bucketIds.length]
    const tunggakan = 1_500_000 + bp.majelis * 120_000 + i * 350_000
    const tindakan: MitraTindakan[] = Array.from({ length: 5 }, (_, j) => {
      const idx = (start + i + j) % TINDAKAN_JENIS.length
      const hasil = TINDAKAN_HASIL[idx]
      return {
        date: `${29 - j} Ags 2026, 10:15`,
        jenis: TINDAKAN_JENIS[idx],
        pelaku: TINDAKAN_PELAKU[idx],
        hasil: hasil.label,
        hasilOk: hasil.ok,
        dibayar: hasil.ok && j === 0 ? `Dibayar Rp${rupiah(500_000 + i * 100_000)}` : 'Tidak dibayar',
        catatan: hasil.catatan,
        evidence: hasil.evidence,
      }
    })
    return {
      id: `${bp.id}-mitra-${i}`,
      code: String(i + 1).padStart(3, '0'),
      name: MITRA_NAMES[(start + i) % MITRA_NAMES.length],
      majelis: MAJELIS_NAMES[(start + i) % MAJELIS_NAMES.length],
      dpdId,
      tunggakan,
      tindakan,
      followUp: `Home Visit oleh BP, sebelum ${10 + i} Sep 2026`,
    }
  })
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
  /** This BP's leads stuck before Disetujui — "With Leads monitoring" opens
   *  these up per row, same stages the branch card breaks out. Three of the
   *  five stages carry their own breakdown rather than a flat count: New
   *  mitra by KTP status, Follow up by interest, UK by draft/submitted —
   *  each pair sums to that stage's total, so the flat total is never
   *  stored separately and can't drift from its own two halves. */
  leadsUnqualified: number
  leadsQualified: number
  /** Leads with KTP who've had their follow-up call/visit, ahead of UK. */
  leadsFollowUpInterested: number
  leadsFollowUpNotInterested: number
  leadsUkDraft: number
  leadsUkSubmitted: number
  /** Leads approved this period. NOT the same as `noaBaru`: an approved lead
   *  can still fail to disburse in the period it was approved in (paperwork,
   *  the mitra backing out, a majelis slot slipping to next month), so
   *  Disetujui can run ahead of the NoA the BP actually cleared. */
  leadsDisetujui: number
  /** The NTB (New-to-Bank) acquisition funnel behind this BP's Mitra baru
   *  NoA, in the product's own stage names — Prospek through Survei dikirim
   *  — rather than "With Leads monitoring"'s KTP/UK breakdown. Mitra
   *  disetujui reuses `leadsDisetujui`: both name the same "approved this
   *  period" count, just read from the default table's own toggle instead
   *  of the Leads cut's panel, so the two never carry two different answers
   *  to the same question. */
  ntbProspek: number
  ntbDilanjuti: number
  ntbSurveiDimulai: number
  ntbSurveiDikirim: number
  /** The ETB (Existing-to-Bank) renewal funnel behind Mitra lanjutan's NoA —
   *  same four stages, starting from the leads pool instead of a KTP check.
   *  `etbDisetujui` is its own field rather than reusing `leadsDisetujui`:
   *  that field is approvals into Mitra baru, and a renewal approval is a
   *  different event. */
  etbTotalLeads: number
  etbDilanjuti: number
  etbSurveiDimulai: number
  etbSurveiDikirim: number
  etbDisetujui: number
}

export const DISBURSEMENT_BPS: DisbursementBp[] = [
  { id: 'bp-sukma', name: 'Sukma Ayuningrum', majelis: 6, noaBaru: 2, noaLanjutan: 11, renewalDue: 14, nilaiBaru: 10, nilaiLanjutan: 72, leadsUnqualified: 5, leadsQualified: 2, leadsFollowUpInterested: 1, leadsFollowUpNotInterested: 0, leadsUkDraft: 0, leadsUkSubmitted: 1, leadsDisetujui: 3, ntbProspek: 10, ntbDilanjuti: 7, ntbSurveiDimulai: 5, ntbSurveiDikirim: 4, etbTotalLeads: 22, etbDilanjuti: 17, etbSurveiDimulai: 14, etbSurveiDikirim: 12, etbDisetujui: 12 },
  { id: 'bp-cenli', name: 'Cenli Cencen', majelis: 8, noaBaru: 2, noaLanjutan: 13, renewalDue: 16, nilaiBaru: 10, nilaiLanjutan: 87, leadsUnqualified: 5, leadsQualified: 2, leadsFollowUpInterested: 1, leadsFollowUpNotInterested: 0, leadsUkDraft: 0, leadsUkSubmitted: 1, leadsDisetujui: 2, ntbProspek: 9, ntbDilanjuti: 6, ntbSurveiDimulai: 4, ntbSurveiDikirim: 3, etbTotalLeads: 26, etbDilanjuti: 20, etbSurveiDimulai: 16, etbSurveiDikirim: 14, etbDisetujui: 14 },
  { id: 'bp-diski', name: 'Diski Tafa Ilham', majelis: 8, noaBaru: 3, noaLanjutan: 13, renewalDue: 15, nilaiBaru: 15, nilaiLanjutan: 89, leadsUnqualified: 4, leadsQualified: 3, leadsFollowUpInterested: 1, leadsFollowUpNotInterested: 1, leadsUkDraft: 1, leadsUkSubmitted: 1, leadsDisetujui: 4, ntbProspek: 14, ntbDilanjuti: 10, ntbSurveiDimulai: 7, ntbSurveiDikirim: 5, etbTotalLeads: 26, etbDilanjuti: 20, etbSurveiDimulai: 16, etbSurveiDikirim: 14, etbDisetujui: 13 },
  { id: 'bp-laili', name: 'Laili Maulidia', majelis: 8, noaBaru: 3, noaLanjutan: 15, renewalDue: 18, nilaiBaru: 15, nilaiLanjutan: 103, leadsUnqualified: 4, leadsQualified: 3, leadsFollowUpInterested: 1, leadsFollowUpNotInterested: 1, leadsUkDraft: 1, leadsUkSubmitted: 1, leadsDisetujui: 3, ntbProspek: 13, ntbDilanjuti: 9, ntbSurveiDimulai: 6, ntbSurveiDikirim: 4, etbTotalLeads: 30, etbDilanjuti: 23, etbSurveiDimulai: 19, etbSurveiDikirim: 16, etbDisetujui: 15 },
  { id: 'bp-ainur', name: 'Ainur Rohmah', majelis: 8, noaBaru: 4, noaLanjutan: 15, renewalDue: 17, nilaiBaru: 20, nilaiLanjutan: 106, leadsUnqualified: 3, leadsQualified: 3, leadsFollowUpInterested: 1, leadsFollowUpNotInterested: 1, leadsUkDraft: 1, leadsUkSubmitted: 1, leadsDisetujui: 5, ntbProspek: 18, ntbDilanjuti: 13, ntbSurveiDimulai: 9, ntbSurveiDikirim: 6, etbTotalLeads: 30, etbDilanjuti: 23, etbSurveiDimulai: 19, etbSurveiDikirim: 16, etbDisetujui: 16 },
  { id: 'bp-fadhil', name: 'Fadhil Maulana', majelis: 7, noaBaru: 4, noaLanjutan: 16, renewalDue: 18, nilaiBaru: 20, nilaiLanjutan: 114, leadsUnqualified: 3, leadsQualified: 3, leadsFollowUpInterested: 1, leadsFollowUpNotInterested: 1, leadsUkDraft: 1, leadsUkSubmitted: 1, leadsDisetujui: 4, ntbProspek: 17, ntbDilanjuti: 12, ntbSurveiDimulai: 8, ntbSurveiDikirim: 5, etbTotalLeads: 32, etbDilanjuti: 25, etbSurveiDimulai: 20, etbSurveiDikirim: 17, etbDisetujui: 16 },
  { id: 'bp-rudi', name: 'Rudi Hartono', majelis: 6, noaBaru: 5, noaLanjutan: 16, renewalDue: 20, nilaiBaru: 25, nilaiLanjutan: 116, leadsUnqualified: 3, leadsQualified: 3, leadsFollowUpInterested: 1, leadsFollowUpNotInterested: 1, leadsUkDraft: 1, leadsUkSubmitted: 1, leadsDisetujui: 6, ntbProspek: 22, ntbDilanjuti: 16, ntbSurveiDimulai: 11, ntbSurveiDikirim: 7, etbTotalLeads: 32, etbDilanjuti: 25, etbSurveiDimulai: 20, etbSurveiDikirim: 17, etbDisetujui: 17 },
  { id: 'bp-alif', name: 'M. Alif Rizqi', majelis: 8, noaBaru: 5, noaLanjutan: 18, renewalDue: 20, nilaiBaru: 25, nilaiLanjutan: 124, leadsUnqualified: 3, leadsQualified: 3, leadsFollowUpInterested: 1, leadsFollowUpNotInterested: 1, leadsUkDraft: 1, leadsUkSubmitted: 1, leadsDisetujui: 5, ntbProspek: 21, ntbDilanjuti: 15, ntbSurveiDimulai: 10, ntbSurveiDikirim: 6, etbTotalLeads: 36, etbDilanjuti: 28, etbSurveiDimulai: 22, etbSurveiDikirim: 19, etbDisetujui: 18 },
  { id: 'bp-budi', name: 'Budi Ngurah', majelis: 6, noaBaru: 6, noaLanjutan: 18, renewalDue: 21, nilaiBaru: 30, nilaiLanjutan: 126, leadsUnqualified: 2, leadsQualified: 3, leadsFollowUpInterested: 1, leadsFollowUpNotInterested: 1, leadsUkDraft: 1, leadsUkSubmitted: 1, leadsDisetujui: 6, ntbProspek: 26, ntbDilanjuti: 19, ntbSurveiDimulai: 13, ntbSurveiDikirim: 8, etbTotalLeads: 36, etbDilanjuti: 28, etbSurveiDimulai: 22, etbSurveiDikirim: 19, etbDisetujui: 19 },
  { id: 'bp-fauzan', name: 'Fauzan Aditama', majelis: 7, noaBaru: 6, noaLanjutan: 19, renewalDue: 21, nilaiBaru: 30, nilaiLanjutan: 133, leadsUnqualified: 2, leadsQualified: 3, leadsFollowUpInterested: 1, leadsFollowUpNotInterested: 1, leadsUkDraft: 1, leadsUkSubmitted: 1, leadsDisetujui: 6, ntbProspek: 25, ntbDilanjuti: 18, ntbSurveiDimulai: 12, ntbSurveiDikirim: 7, etbTotalLeads: 38, etbDilanjuti: 29, etbSurveiDimulai: 23, etbSurveiDikirim: 20, etbDisetujui: 19 },
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
  /** The 85% standard converted to a headcount — how many renewals the
   *  branch is actually judged against, in the same "N mitra" shape Mitra
   *  baru's target already uses. */
  const renewalTarget = Math.ceil((due * DISBURSEMENT_TARGETS.renewalRate) / 100)
  return { baru, lanjutan, due, renewal: due === 0 ? 0 : (lanjutan / due) * 100, renewalTarget }
}

/**
 * The mitra baru acquisition funnel — where the month's leads are sitting
 * before they get approved, and separately, how many of those approvals
 * actually disbursed. "With Leads monitoring" is the one Pencairan cut that
 * opens this up, both per BP and for the branch; the plain cut only ever
 * shows NoA, the count that made it all the way through.
 *
 * Disetujui is NOT `noaBaru`: an approved lead can still miss disbursing in
 * the same period (paperwork, the mitra backing out, a majelis slot slipping
 * to next month), so Disetujui can run ahead of NoA — see `leadsDisetujui` on
 * `DisbursementBp`.
 */
export const leadsFollowUp = (bp: DisbursementBp) =>
  bp.leadsFollowUpInterested + bp.leadsFollowUpNotInterested
export const leadsUk = (bp: DisbursementBp) => bp.leadsUkDraft + bp.leadsUkSubmitted

export const leadsTotal = (bp: DisbursementBp) =>
  bp.leadsUnqualified + bp.leadsQualified + leadsFollowUp(bp) + leadsUk(bp) + bp.leadsDisetujui

/** Branch totals for the funnel, summed from every BP's row. Follow up and UK
 *  carry their own breakdown alongside the stage total, same shape the BP
 *  table's columns use. */
export function potentialMitraFunnel() {
  return {
    unqualified: DISBURSEMENT_BPS.reduce((n, bp) => n + bp.leadsUnqualified, 0),
    qualified: DISBURSEMENT_BPS.reduce((n, bp) => n + bp.leadsQualified, 0),
    followUpInterested: DISBURSEMENT_BPS.reduce((n, bp) => n + bp.leadsFollowUpInterested, 0),
    followUpNotInterested: DISBURSEMENT_BPS.reduce((n, bp) => n + bp.leadsFollowUpNotInterested, 0),
    ukDraft: DISBURSEMENT_BPS.reduce((n, bp) => n + bp.leadsUkDraft, 0),
    ukSubmitted: DISBURSEMENT_BPS.reduce((n, bp) => n + bp.leadsUkSubmitted, 0),
    disetujui: DISBURSEMENT_BPS.reduce((n, bp) => n + bp.leadsDisetujui, 0),
  }
}

export const potentialMitraTotal = () => DISBURSEMENT_BPS.reduce((n, bp) => n + leadsTotal(bp), 0)

// --- Pencairan: the BP → mitra detail drill-down -----------------------------
//
// The same "Lihat detail" drawer Pembayaran uses (lib/mitra-drawer.tsx),
// reading a different question: not "how behind is this mitra on paying"
// but "where is this lead stuck in the NTB funnel". The chip is a funnel
// stage instead of a DPD band, and the metric is the loan amount a lead has
// applied for instead of a rupiah owed — everything else, including the
// tindakan log, is the same shape so the shared drawer doesn't have to know
// which tab it's in.

/** The funnel-stage chip a lead wears in this drawer — the same five stages
 *  the table's own "Lihat Alur" already opens onto (see
 *  disbursement-table.tsx's `NTB_FUNNEL`), reused rather than inventing a
 *  second name for the same journey. */
export const NTB_STAGE_BUCKETS: { id: string; label: string; intent: BucketIntent }[] = [
  { id: 'prospek', label: 'Prospek', intent: 'yellow' },
  { id: 'dilanjuti', label: 'Dilanjuti', intent: 'orange' },
  { id: 'surveiDimulai', label: 'Survei dimulai', intent: 'orange' },
  { id: 'surveiDikirim', label: 'Survei dikirim', intent: 'orange' },
  { id: 'disetujui', label: 'Mitra disetujui', intent: 'green' },
]

export function ntbStageLabel(stageId: string) {
  return NTB_STAGE_BUCKETS.find((b) => b.id === stageId)?.label ?? stageId
}

export function ntbStageIntent(stageId: string) {
  return NTB_STAGE_BUCKETS.find((b) => b.id === stageId)?.intent ?? 'yellow'
}

export interface DisbursementMitraDetail {
  id: string
  /** Both null before Survei dimulai — a Prospek or a Dilanjuti lead hasn't
   *  been assigned a mitra code or a majelis yet; that assignment happens
   *  once a survey is underway. */
  code: string | null
  name: string
  majelis: string | null
  stageId: string
  /** When the lead itself was logged — the app's own leads list badges this
   *  ("Kamis, 21 Jul 2026" / "Hari ini"), separate from any tindakan date. */
  leadDate: string
  leadDateRelative: string
  /** How this lead entered the pipeline — "POI Pasar Ciseeng", "Reaktivasi -
   *  eks Majelis Dahlia" — the app's own leads list names the source on
   *  every card, not just the mitra's own name and majelis. */
  source: string
  /** A place name, not a distance — "500m near you" is true only at the
   *  moment the BP happened to be standing there, and stops meaning
   *  anything the next time this card is read. */
  location: string
  tindakan: MitraTindakan[]
  followUp: string
  /** Which funnel this record belongs to — the drawer's roster filter reads
   *  this to split "Lihat detail" between new mitra (NTB) and renewal mitra
   *  (ETB) rather than only ever showing the NTB pipeline. */
  segment: 'baru' | 'lanjutan'
}

/** Always "Contacted" — a lead never gets a Home Visit or a Telepon-flavoured
 *  entry logged against her, only the one generic touch the app itself logs.
 *  Always the BP too: she's the one running her own pipeline, not an AM or
 *  BM stepping in the way Pembayaran's tindakan mixes all three. */
const NTB_TINDAKAN_JENIS: MitraTindakan['jenis'][] = ['Contacted']
const NTB_TINDAKAN_PELAKU: MitraTindakan['pelaku'][] = ['BP']
/** `evidence` marks the two outcomes that mean a BP was actually at the
 *  lead's location — Survei selesai and Tidak di tempat — not the phone
 *  touches (Tidak diangkat, Tertarik) or the approval note (Disetujui),
 *  which are logged from wherever the BP happens to be. */
const NTB_TINDAKAN_HASIL: { label: string; ok: boolean; note: string; catatan: string; evidence: boolean }[] = [
  {
    label: 'Tidak diangkat',
    ok: false,
    note: 'Belum terhubung',
    catatan: 'Nomor telepon dihubungi tiga kali, tidak ada jawaban.',
    evidence: false,
  },
  {
    label: 'Tertarik',
    ok: true,
    note: 'Lanjut ke survei',
    catatan: 'Lead dihubungi dan menyatakan tertarik; dijadwalkan untuk survei.',
    evidence: false,
  },
  {
    label: 'Survei selesai',
    ok: true,
    note: 'Menunggu persetujuan',
    catatan: 'Survei lapangan selesai dilakukan; hasil menunggu persetujuan.',
    evidence: true,
  },
  {
    label: 'Tidak di tempat',
    ok: false,
    note: 'Dijadwalkan ulang',
    catatan: 'BP mendatangi lokasi sesuai jadwal survei, namun lead tidak ada di tempat.',
    evidence: true,
  },
  {
    label: 'Disetujui',
    ok: true,
    note: 'Menunggu pencairan',
    catatan: 'Pengajuan disetujui; menunggu proses pencairan.',
    evidence: false,
  },
]

/** Every lead behind a BP's Mitra baru funnel, not just the branch total —
 *  same shape and same reasoning as `mitraDetailFor`: four leads, cycled
 *  from the shared name/majelis pools, each with five tindakan entries so
 *  the drawer's log reads as a real history. */
/** The app's own leads-list vocabulary — how a lead entered the pipeline —
 *  cycled per lead the same way the name/majelis pools are, rather than
 *  every card claiming the same source. */
const LEAD_SOURCES = [
  'POI Pasar Ciseeng',
  'Reaktivasi - eks Majelis Dahlia',
  'POI Warung Bu Ipah',
  'Referral mitra existing',
]
const LEAD_LOCATIONS = [
  'Ciseeng, Parigi Mekar',
  'Panunggangan, Cirebon',
  'Cirebon, Jawa Barat',
  'Sumber, Kabupaten Cirebon',
]
const LEAD_DATES: { date: string; relative: string }[] = [
  { date: 'Kamis, 27 Ags 2026', relative: 'Hari ini' },
  { date: 'Rabu, 26 Ags 2026', relative: 'Kemarin' },
  { date: 'Selasa, 25 Ags 2026', relative: '2 hari lalu' },
  { date: 'Senin, 24 Ags 2026', relative: '3 hari lalu' },
]

export function disbursementMitraDetailFor(bp: DisbursementBp): DisbursementMitraDetail[] {
  const start = DISBURSEMENT_BPS.findIndex((b) => b.id === bp.id)
  const stageIds = NTB_STAGE_BUCKETS.map((b) => b.id)
  // A mitra code and a majelis both wait for the same milestone: a survey
  // actually underway. A Prospek or a Dilanjuti lead is still just a name
  // and a phone number, with nothing assigned to her yet.
  const surveyed = ['surveiDimulai', 'surveiDikirim', 'disetujui']
  return Array.from({ length: 4 }, (_, i) => {
    const stageId = stageIds[(start + i) % stageIds.length]
    const tindakan: MitraTindakan[] = Array.from({ length: 5 }, (_, j) => {
      const hasilIdx = (start + i + j) % NTB_TINDAKAN_HASIL.length
      const hasil = NTB_TINDAKAN_HASIL[hasilIdx]
      return {
        date: `${29 - j} Ags 2026, 10:15`,
        jenis: NTB_TINDAKAN_JENIS[(start + i + j) % NTB_TINDAKAN_JENIS.length],
        pelaku: NTB_TINDAKAN_PELAKU[(start + i + j) % NTB_TINDAKAN_PELAKU.length],
        hasil: hasil.label,
        hasilOk: hasil.ok,
        dibayar: hasil.note,
        catatan: hasil.catatan,
        evidence: hasil.evidence,
      }
    })
    const leadDate = LEAD_DATES[(start + i) % LEAD_DATES.length]
    return {
      id: `${bp.id}-lead-${i}`,
      code: surveyed.includes(stageId) ? String(i + 1).padStart(3, '0') : null,
      name: MITRA_NAMES[(start + i) % MITRA_NAMES.length],
      majelis: surveyed.includes(stageId) ? MAJELIS_NAMES[(start + i) % MAJELIS_NAMES.length] : null,
      stageId,
      leadDate: leadDate.date,
      leadDateRelative: leadDate.relative,
      source: LEAD_SOURCES[(start + i) % LEAD_SOURCES.length],
      location: LEAD_LOCATIONS[(start + i) % LEAD_LOCATIONS.length],
      tindakan,
      followUp: `Survei oleh BP, sebelum ${10 + i} Sep 2026`,
      segment: 'baru',
    }
  })
}

/** The renewal side of the same funnel — ETB's own five stages, reusing
 *  `NTB_STAGE_BUCKETS`' shape but distinct ids (a shared id between the two
 *  would make one status option match rows from both funnels at once). The
 *  journey mirrors NTB's (contact → survey → approval); only the first
 *  stage and the last label differ, since a renewal starts from an existing
 *  mitra flagged for reactivation rather than a cold lead, and ends in a
 *  renewal rather than a first-time approval. */
export const ETB_STAGE_BUCKETS: { id: string; label: string; intent: BucketIntent }[] = [
  { id: 'etbDitawarkan', label: 'Ditawarkan', intent: 'yellow' },
  { id: 'etbDilanjuti', label: 'Dilanjuti', intent: 'orange' },
  { id: 'etbSurveiDimulai', label: 'Survei dimulai', intent: 'orange' },
  { id: 'etbSurveiDikirim', label: 'Survei dikirim', intent: 'orange' },
  { id: 'etbDisetujui', label: 'Mitra diperpanjang', intent: 'green' },
]

export function etbStageLabel(stageId: string) {
  return ETB_STAGE_BUCKETS.find((b) => b.id === stageId)?.label ?? stageId
}

export function etbStageIntent(stageId: string) {
  return ETB_STAGE_BUCKETS.find((b) => b.id === stageId)?.intent ?? 'yellow'
}

/** How a renewal mitra was flagged, in place of a lead's "source" — she
 *  isn't newly acquired, so the pool reads as "why this touch happened now"
 *  instead of "where this lead came from". */
const RENEWAL_SOURCES = [
  'Jatuh tempo bulan ini',
  'Follow-up jatuh tempo',
  'Reaktivasi otomatis',
  'Ditawarkan BP saat kunjungan',
]

/** Every mitra behind a BP's Mitra lanjutan funnel — same shape and same
 *  reasoning as `disbursementMitraDetailFor`, reusing the same tindakan
 *  outcome pool (a renewal call and a new-mitra call fail or land the same
 *  handful of ways) but the ETB stage vocabulary and a renewal-flavoured
 *  `source`. Unlike an NTB lead, a renewal mitra already has a code and a
 *  majelis at every stage — she's existing, not being onboarded. */
export function disbursementLanjutanDetailFor(bp: DisbursementBp): DisbursementMitraDetail[] {
  const start = DISBURSEMENT_BPS.findIndex((b) => b.id === bp.id)
  const stageIds = ETB_STAGE_BUCKETS.map((b) => b.id)
  return Array.from({ length: 4 }, (_, i) => {
    const stageId = stageIds[(start + i) % stageIds.length]
    const tindakan: MitraTindakan[] = Array.from({ length: 5 }, (_, j) => {
      const hasilIdx = (start + i + j + 1) % NTB_TINDAKAN_HASIL.length
      const hasil = NTB_TINDAKAN_HASIL[hasilIdx]
      return {
        date: `${29 - j} Ags 2026, 10:15`,
        jenis: NTB_TINDAKAN_JENIS[(start + i + j) % NTB_TINDAKAN_JENIS.length],
        pelaku: NTB_TINDAKAN_PELAKU[(start + i + j) % NTB_TINDAKAN_PELAKU.length],
        hasil: hasil.label,
        hasilOk: hasil.ok,
        dibayar: hasil.note,
        catatan: hasil.catatan,
        evidence: hasil.evidence,
      }
    })
    const leadDate = LEAD_DATES[(start + i + 1) % LEAD_DATES.length]
    return {
      id: `${bp.id}-lanjutan-${i}`,
      code: String(i + 1).padStart(3, '0'),
      name: MITRA_NAMES[(start + i + 2) % MITRA_NAMES.length],
      majelis: MAJELIS_NAMES[(start + i + 1) % MAJELIS_NAMES.length],
      stageId,
      leadDate: leadDate.date,
      leadDateRelative: leadDate.relative,
      source: RENEWAL_SOURCES[(start + i) % RENEWAL_SOURCES.length],
      location: LEAD_LOCATIONS[(start + i + 1) % LEAD_LOCATIONS.length],
      tindakan,
      followUp: `Survei oleh BP, sebelum ${12 + i} Sep 2026`,
      segment: 'lanjutan',
    }
  })
}

// --- Progres harian ------------------------------------------------------

/** A BP's day, task by task: how many were owed and how many are done. Each
 *  task type is its own target — a BP can clear her majelis visits (MV) and
 *  still owe follow-ups (NTB - FU), and burying that inside one combined
 *  count would hide which one. */
export interface TaskMetric {
  target: number
  completed: number
}

export interface DailyTaskRow {
  id: string
  name: string
  mv: TaskMetric
  hv: TaskMetric
  ntbFu: TaskMetric
  ntbSos: TaskMetric
  etbRenewal: TaskMetric
  etbTopup: TaskMetric
  /** Has the BP closed out her day in the BP App yet. */
  tutupHari: boolean
}

/** Same roster and row order as `REPAYMENT_BPS`, so a BP reads the same
 *  wherever she appears in the app. */
export const DAILY_TASKS: DailyTaskRow[] = [
  { id: 'bp-sukma', name: 'Sukma Ayuningrum', mv: { target: 6, completed: 6 }, hv: { target: 3, completed: 2 }, ntbFu: { target: 1, completed: 1 }, ntbSos: { target: 2, completed: 1 }, etbRenewal: { target: 2, completed: 2 }, etbTopup: { target: 2, completed: 1 }, tutupHari: false },
  { id: 'bp-diski', name: 'Diski Tafa Ilham', mv: { target: 6, completed: 6 }, hv: { target: 3, completed: 3 }, ntbFu: { target: 1, completed: 1 }, ntbSos: { target: 2, completed: 2 }, etbRenewal: { target: 1, completed: 1 }, etbTopup: { target: 2, completed: 2 }, tutupHari: true },
  { id: 'bp-cenli', name: 'Cenli Cencen', mv: { target: 6, completed: 4 }, hv: { target: 3, completed: 3 }, ntbFu: { target: 1, completed: 0 }, ntbSos: { target: 2, completed: 1 }, etbRenewal: { target: 3, completed: 2 }, etbTopup: { target: 1, completed: 1 }, tutupHari: false },
  { id: 'bp-laili', name: 'Laili Maulidia', mv: { target: 6, completed: 6 }, hv: { target: 4, completed: 2 }, ntbFu: { target: 1, completed: 1 }, ntbSos: { target: 3, completed: 2 }, etbRenewal: { target: 2, completed: 2 }, etbTopup: { target: 2, completed: 1 }, tutupHari: false },
  { id: 'bp-fadhil', name: 'Fadhil Maulana', mv: { target: 6, completed: 5 }, hv: { target: 3, completed: 1 }, ntbFu: { target: 1, completed: 1 }, ntbSos: { target: 2, completed: 0 }, etbRenewal: { target: 1, completed: 1 }, etbTopup: { target: 3, completed: 2 }, tutupHari: false },
  { id: 'bp-ainur', name: 'Ainur Rohmah', mv: { target: 6, completed: 6 }, hv: { target: 3, completed: 2 }, ntbFu: { target: 1, completed: 1 }, ntbSos: { target: 2, completed: 1 }, etbRenewal: { target: 2, completed: 2 }, etbTopup: { target: 2, completed: 2 }, tutupHari: false },
  { id: 'bp-rudi', name: 'Rudi Hartono', mv: { target: 6, completed: 6 }, hv: { target: 3, completed: 3 }, ntbFu: { target: 1, completed: 1 }, ntbSos: { target: 2, completed: 2 }, etbRenewal: { target: 2, completed: 2 }, etbTopup: { target: 2, completed: 2 }, tutupHari: true },
  { id: 'bp-budi', name: 'Budi Ngurah', mv: { target: 6, completed: 6 }, hv: { target: 3, completed: 2 }, ntbFu: { target: 1, completed: 1 }, ntbSos: { target: 2, completed: 1 }, etbRenewal: { target: 2, completed: 2 }, etbTopup: { target: 2, completed: 1 }, tutupHari: true },
  { id: 'bp-alif', name: 'M. Alif Rizqi', mv: { target: 6, completed: 5 }, hv: { target: 3, completed: 3 }, ntbFu: { target: 1, completed: 1 }, ntbSos: { target: 2, completed: 2 }, etbRenewal: { target: 2, completed: 1 }, etbTopup: { target: 2, completed: 2 }, tutupHari: false },
  { id: 'bp-fauzan', name: 'Fauzan Aditama', mv: { target: 6, completed: 6 }, hv: { target: 3, completed: 3 }, ntbFu: { target: 1, completed: 1 }, ntbSos: { target: 2, completed: 2 }, etbRenewal: { target: 2, completed: 2 }, etbTopup: { target: 2, completed: 2 }, tutupHari: true },
]
