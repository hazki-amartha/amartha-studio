// The FO monitoring Pembayaran figures — copied from ngmis-bm-monitoring (one
// project never imports another's folder). Loans counted per BP, per bucket.

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
  { id: 'dpd0', label: 'DPD 0', intent: 'green' },
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

const ALL_BPS: RepaymentBp[] = [
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

/** The seven BPs the table shows, in the order the live page lists them. */
const SHOWN = ['bp-fadhil', 'bp-sukma', 'bp-diski', 'bp-cenli', 'bp-laili', 'bp-ainur', 'bp-rudi']
export const REPAYMENT_BPS: RepaymentBp[] = SHOWN.map((id) => ALL_BPS.find((b) => b.id === id)!)

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

