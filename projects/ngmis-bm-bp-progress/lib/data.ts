// =============================================================================
// The branch, its BPs, and the three things the BM monitors.
//
// Shapes and thresholds follow the national "BP Loan" sheet the BM filters down
// today: one row per BP per DPD bucket per week, carrying Total Loan / Total
// Paid Loan / % Repayment Rate, and judged against a target that DIFFERS BY
// BUCKET. Task and disbursement figures are not in that sheet — tasks come from
// the A-Partner BP app, disbursement from the loan system — so they are modelled
// here alongside it.
// =============================================================================

export const BRANCH = 'Banjarmasin Kota'
export const TODAY = 'Selasa, 28 Juli 2026'
export const WEEK = '27 – 31 Juli 2026'
export const MONTH = 'Juli 2026'

/** Bucket-specific repayment targets, straight off the sheet's header note:
 *  "DPD 0 >= 98% · DPD 1-30 >= 55% · DPD 31-90 >= 13%". DPD 90+ is reported but
 *  carries no target there, and so carries none here. */
export const BUCKETS = [
  { id: 'd0', label: 'DPD 0', target: 98 },
  { id: 'd1', label: 'DPD 1–30', target: 55 },
  { id: 'd3', label: 'DPD 31–90', target: 13 },
  { id: 'd9', label: 'DPD 90+', target: null },
] as const

export type BucketId = (typeof BUCKETS)[number]['id']

/** Loans and loans-paid for one bucket in one week. */
export type Pair = [loan: number, paid: number]

export interface TaskCounts {
  /** [done, total] for each kind of work the BP App hands out. */
  mv: Pair
  hv: Pair
  sos: Pair
  fu: Pair
}

export interface Bp {
  id: string
  name: string
  majelis: number
  /** Why this BP's portfolio looks the way it does, where ops has recorded one.
   *  The sheet's `Grouping Reason` column — read-only here. */
  konteks?: string
  tasks: TaskCounts
  /** This week, per bucket. */
  week: Record<BucketId, Pair>
  /** % RR per bucket for the three weeks before this one, oldest first. */
  history: Record<BucketId, [number, number, number]>
  disb: {
    /** Rupiah disbursed month-to-date, and the month's target. */
    cair: number
    target: number
    mitraBaru: number
    targetMitraBaru: number
  }
}

const jt = (n: number) => n * 1_000_000

export const BPS: Bp[] = [
  {
    id: 'fauzan-aditama',
    name: 'Fauzan Aditama',
    majelis: 7,
    tasks: { mv: [3, 3], hv: [5, 5], sos: [1, 1], fu: [3, 3] },
    week: { d0: [236, 234], d1: [28, 18], d3: [14, 2], d9: [6, 0] },
    history: { d0: [98, 99, 98], d1: [58, 61, 60], d3: [13, 15, 14], d9: [0, 0, 0] },
    disb: { cair: jt(172), target: jt(180), mitraBaru: 7, targetMitraBaru: 8 },
  },
  {
    id: 'budi-ngurah',
    name: 'Budi Ngurah',
    majelis: 6,
    tasks: { mv: [2, 3], hv: [4, 5], sos: [1, 1], fu: [2, 3] },
    week: { d0: [204, 201], d1: [30, 17], d3: [16, 2], d9: [6, 0] },
    history: { d0: [98, 98, 99], d1: [54, 57, 56], d3: [11, 13, 12], d9: [0, 0, 0] },
    disb: { cair: jt(158), target: jt(180), mitraBaru: 6, targetMitraBaru: 8 },
  },
  {
    id: 'alif-rizqi',
    name: 'M. Alif Rizqi',
    majelis: 8,
    tasks: { mv: [3, 4], hv: [4, 6], sos: [0, 1], fu: [2, 3] },
    week: { d0: [212, 208], d1: [32, 18], d3: [18, 2], d9: [8, 0] },
    history: { d0: [97, 98, 98], d1: [52, 55, 58], d3: [10, 12, 11], d9: [0, 0, 0] },
    disb: { cair: jt(149), target: jt(180), mitraBaru: 5, targetMitraBaru: 8 },
  },
  {
    id: 'rudi-hartono',
    name: 'Rudi Hartono',
    majelis: 6,
    tasks: { mv: [2, 4], hv: [3, 6], sos: [1, 1], fu: [1, 3] },
    week: { d0: [192, 186], d1: [30, 15], d3: [18, 2], d9: [8, 0] },
    history: { d0: [98, 97, 97], d1: [56, 53, 52], d3: [13, 12, 11], d9: [0, 0, 0] },
    disb: { cair: jt(141), target: jt(180), mitraBaru: 5, targetMitraBaru: 8 },
  },
  {
    id: 'ainur-rohmah',
    name: 'Ainur Rohmah',
    majelis: 8,
    konteks: 'BP baru mutasi',
    tasks: { mv: [2, 4], hv: [3, 7], sos: [0, 1], fu: [1, 3] },
    week: { d0: [178, 171], d1: [34, 16], d3: [20, 2], d9: [10, 0] },
    history: { d0: [97, 97, 96], d1: [52, 49, 48], d3: [12, 11, 10], d9: [0, 0, 0] },
    disb: { cair: jt(126), target: jt(180), mitraBaru: 4, targetMitraBaru: 8 },
  },
  {
    id: 'laili-maulidia',
    name: 'Laili Maulidia',
    majelis: 8,
    tasks: { mv: [2, 5], hv: [2, 6], sos: [0, 1], fu: [1, 3] },
    week: { d0: [210, 199], d1: [44, 19], d3: [26, 2], d9: [12, 0] },
    history: { d0: [96, 96, 95], d1: [48, 46, 44], d3: [10, 9, 8], d9: [0, 0, 0] },
    disb: { cair: jt(118), target: jt(180), mitraBaru: 3, targetMitraBaru: 8 },
  },
  {
    id: 'diski-tafa',
    name: 'Diski Tafa Ilham',
    majelis: 8,
    konteks: 'Majelis tidak kumpul dan 90% door to door',
    tasks: { mv: [1, 5], hv: [2, 7], sos: [0, 1], fu: [1, 3] },
    week: { d0: [184, 172], d1: [42, 17], d3: [26, 1], d9: [14, 0] },
    history: { d0: [96, 95, 94], d1: [46, 43, 41], d3: [8, 7, 5], d9: [0, 0, 0] },
    disb: { cair: jt(104), target: jt(180), mitraBaru: 3, targetMitraBaru: 8 },
  },
  {
    id: 'sukma-ayuningrum',
    name: 'Sukma Ayuningrum',
    majelis: 6,
    konteks: 'BP cover pelayanan BP resign atau mangkir',
    tasks: { mv: [1, 5], hv: [1, 7], sos: [0, 1], fu: [0, 3] },
    week: { d0: [172, 157], d1: [50, 17], d3: [30, 1], d9: [18, 0] },
    history: { d0: [95, 94, 92], d1: [42, 38, 34], d3: [7, 5, 3], d9: [0, 0, 0] },
    disb: { cair: jt(82), target: jt(180), mitraBaru: 2, targetMitraBaru: 8 },
  },
]

// --- Reads ------------------------------------------------------------------

export const bpById = (id: string) => BPS.find((b) => b.id === id) ?? BPS[0]

export const rate = ([loan, paid]: Pair) => (loan ? Math.round((paid / loan) * 100) : 0)

/** Last week's rate for the same bucket — the last entry in the history. */
export const prevRate = (bp: Bp, bucket: BucketId) => bp.history[bucket][2]

/** Whether a bucket clears its own target. Untargeted buckets never fail. */
export function onTarget(bp: Bp, bucket: BucketId) {
  const target = BUCKETS.find((b) => b.id === bucket)?.target
  return target === null || target === undefined ? true : rate(bp.week[bucket]) >= target
}

/** How many of the three targeted buckets this BP is under. */
export const bucketsMissed = (bp: Bp) =>
  (['d0', 'd1', 'd3'] as const).filter((b) => !onTarget(bp, b)).length

/**
 * The sheet's three-way verdict, rebuilt from the same two facts it uses: is the
 * BP on target, and did the rate move from last week. A BP under target who is
 * climbing is a different conversation from one under target and still falling —
 * that distinction is the whole reason the column exists.
 */
export function progress(bp: Bp): 'on-target' | 'progressing' | 'non-progressing' {
  if (bucketsMissed(bp) === 0) return 'on-target'
  const moved = (['d0', 'd1', 'd3'] as const).reduce(
    (sum, b) => sum + (rate(bp.week[b]) - prevRate(bp, b)),
    0,
  )
  return moved > 0 ? 'progressing' : 'non-progressing'
}

export const PROGRESS_LABEL: Record<ReturnType<typeof progress>, string> = {
  'on-target': 'Sesuai target',
  progressing: 'Di bawah target, membaik',
  'non-progressing': 'Di bawah target, memburuk',
}

export const taskTotals = (t: TaskCounts) => {
  const all = [t.mv, t.hv, t.sos, t.fu]
  return {
    done: all.reduce((s, [d]) => s + d, 0),
    total: all.reduce((s, [, t2]) => s + t2, 0),
  }
}

/** The board's order: most broken first. Tasks left over break ties, because
 *  two BPs equally behind on repayment are not equally reachable today. */
export const boardOrder = () =>
  [...BPS].sort((a, b) => {
    const missed = bucketsMissed(b) - bucketsMissed(a)
    if (missed) return missed
    const at = taskTotals(a.tasks)
    const bt = taskTotals(b.tasks)
    return bt.total - bt.done - (at.total - at.done)
  })

// --- Formatting -------------------------------------------------------------

export const n = (v: number) => Math.round(v).toLocaleString('id-ID')

/** Rupiah at the scale a board is read at: juta, one decimal, never raw digits. */
export function rp(v: number) {
  const abs = Math.abs(v)
  const sign = v < 0 ? '−' : ''
  if (abs >= 1_000_000_000) return `${sign}Rp${(abs / 1_000_000_000).toFixed(1).replace('.', ',')} M`
  if (abs >= 1_000_000) return `${sign}Rp${Math.round(abs / 1_000_000)} jt`
  return `${sign}Rp${n(abs)}`
}
