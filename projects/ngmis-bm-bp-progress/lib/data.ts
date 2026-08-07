// =============================================================================
// The branch, its BPs, and the one thing the BM monitors: repayment.
//
// Scoped to what engineering says it can actually surface today — repayment,
// on two clocks (this week, and today). Tasks and disbursement stay in the model
// because the BP drill-down still reads them, but they are off the board.
//
// Every repayment figure is a PAIR: how many loans sat in a DPD bucket, and how
// many of those got paid. That is the shape the national "BP Loan" sheet already
// carries (Total Loan / Total Paid Loan per BP per bucket per week), and reading
// it as a pair rather than as a lone percentage is the point — "18" means
// nothing until you know it was 18 of 50.
// =============================================================================

export const BRANCH = 'Banjarmasin Kota'
export const TODAY = 'Selasa, 28 Juli 2026'
export const WEEK = '27 – 31 Juli 2026'
export const MONTH = 'Juli 2026'

/** Bucket-specific repayment targets, straight off the sheet's header note:
 *  "DPD 0 >= 98% · DPD 1-30 >= 55% · DPD 31-90 >= 13%". DPD 90+ is reported but
 *  carries no target there, and so carries none here. The board no longer judges
 *  by these (see `paidTone`); the BP page still reports them. */
export const BUCKETS = [
  { id: 'd0', label: 'DPD 0', target: 98 },
  { id: 'd1', label: 'DPD 1–30', target: 55 },
  { id: 'd3', label: 'DPD 31–90', target: 13 },
  { id: 'd9', label: 'DPD 90+', target: null },
] as const

export type BucketId = (typeof BUCKETS)[number]['id']

/** Loans in a bucket, and how many of them were paid. */
export type Pair = [total: number, terbayar: number]

/** The same four buckets, on one clock. */
export type Book = Record<BucketId, Pair>

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
  /** This week, and today. */
  week: Book
  day: Book
  /** % RR per bucket for the three weeks before this one, oldest first. */
  history: Record<BucketId, [number, number, number]>
  tasks: TaskCounts
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
    id: 'sukma-ayuningrum',
    name: 'Sukma Ayuningrum',
    majelis: 6,
    konteks: 'BP cover pelayanan BP resign atau mangkir',
    week: { d0: [172, 132], d1: [50, 18], d3: [30, 6], d9: [18, 2] },
    day: { d0: [34, 22], d1: [10, 3], d3: [6, 1], d9: [4, 0] },
    history: { d0: [78, 76, 77], d1: [42, 38, 34], d3: [24, 22, 20], d9: [11, 11, 11] },
    tasks: { mv: [1, 5], hv: [1, 7], sos: [0, 1], fu: [0, 3] },
    disb: { cair: jt(82), target: jt(180), mitraBaru: 2, targetMitraBaru: 8 },
  },
  {
    id: 'cenli-cencen',
    name: 'Cenli Cencen',
    majelis: 8,
    week: { d0: [176, 148], d1: [44, 18], d3: [24, 6], d9: [14, 2] },
    day: { d0: [36, 30], d1: [9, 3], d3: [5, 1], d9: [3, 0] },
    history: { d0: [82, 84, 83], d1: [44, 42, 41], d3: [27, 26, 25], d9: [14, 14, 14] },
    tasks: { mv: [1, 5], hv: [2, 7], sos: [0, 1], fu: [1, 3] },
    disb: { cair: jt(104), target: jt(180), mitraBaru: 3, targetMitraBaru: 8 },
  },
  {
    id: 'diski-tafa',
    name: 'Diski Tafa Ilham',
    majelis: 8,
    konteks: 'Majelis tidak kumpul dan 90% door to door',
    week: { d0: [184, 158], d1: [42, 18], d3: [26, 6], d9: [14, 2] },
    day: { d0: [38, 33], d1: [8, 3], d3: [5, 1], d9: [3, 0] },
    history: { d0: [84, 85, 86], d1: [45, 44, 43], d3: [24, 23, 23], d9: [14, 14, 14] },
    tasks: { mv: [1, 5], hv: [2, 7], sos: [0, 1], fu: [1, 3] },
    disb: { cair: jt(104), target: jt(180), mitraBaru: 3, targetMitraBaru: 8 },
  },
  {
    id: 'laili-maulidia',
    name: 'Laili Maulidia',
    majelis: 8,
    week: { d0: [210, 188], d1: [44, 22], d3: [26, 10], d9: [12, 2] },
    day: { d0: [42, 38], d1: [9, 5], d3: [5, 2], d9: [2, 0] },
    history: { d0: [88, 89, 89], d1: [48, 50, 50], d3: [36, 37, 38], d9: [16, 16, 17] },
    tasks: { mv: [2, 5], hv: [2, 6], sos: [0, 1], fu: [1, 3] },
    disb: { cair: jt(118), target: jt(180), mitraBaru: 3, targetMitraBaru: 8 },
  },
  {
    id: 'fadhil-maulana',
    name: 'Fadhil Maulana',
    majelis: 7,
    week: { d0: [208, 192], d1: [36, 20], d3: [22, 8], d9: [10, 2] },
    day: { d0: [42, 39], d1: [7, 4], d3: [4, 2], d9: [2, 0] },
    history: { d0: [90, 91, 92], d1: [52, 54, 55], d3: [34, 35, 36], d9: [19, 20, 20] },
    tasks: { mv: [2, 4], hv: [3, 6], sos: [1, 1], fu: [1, 3] },
    disb: { cair: jt(141), target: jt(180), mitraBaru: 5, targetMitraBaru: 8 },
  },
  {
    id: 'ainur-rohmah',
    name: 'Ainur Rohmah',
    majelis: 8,
    konteks: 'BP baru mutasi',
    week: { d0: [178, 164], d1: [34, 18], d3: [20, 6], d9: [10, 2] },
    day: { d0: [36, 33], d1: [7, 4], d3: [4, 1], d9: [2, 0] },
    history: { d0: [90, 91, 91], d1: [50, 51, 52], d3: [28, 29, 30], d9: [20, 20, 20] },
    tasks: { mv: [2, 4], hv: [3, 7], sos: [0, 1], fu: [1, 3] },
    disb: { cair: jt(126), target: jt(180), mitraBaru: 4, targetMitraBaru: 8 },
  },
  {
    id: 'rudi-hartono',
    name: 'Rudi Hartono',
    majelis: 6,
    week: { d0: [192, 182], d1: [30, 18], d3: [18, 6], d9: [8, 2] },
    day: { d0: [38, 36], d1: [6, 4], d3: [4, 2], d9: [2, 1] },
    history: { d0: [93, 94, 94], d1: [56, 58, 59], d3: [31, 32, 33], d9: [24, 25, 25] },
    tasks: { mv: [2, 4], hv: [3, 6], sos: [1, 1], fu: [1, 3] },
    disb: { cair: jt(149), target: jt(180), mitraBaru: 5, targetMitraBaru: 8 },
  },
  {
    id: 'fauzan-aditama',
    name: 'Fauzan Aditama',
    majelis: 7,
    week: { d0: [236, 228], d1: [28, 20], d3: [14, 5], d9: [6, 1] },
    day: { d0: [48, 46], d1: [6, 4], d3: [3, 1], d9: [1, 0] },
    history: { d0: [96, 96, 97], d1: [68, 70, 71], d3: [34, 35, 36], d9: [16, 16, 17] },
    tasks: { mv: [3, 3], hv: [5, 5], sos: [1, 1], fu: [3, 3] },
    disb: { cair: jt(172), target: jt(180), mitraBaru: 7, targetMitraBaru: 8 },
  },
]

// --- Reads ------------------------------------------------------------------

export const bpById = (id: string) => BPS.find((b) => b.id === id) ?? BPS[0]

/** The four buckets summed — the row's Total Loan pair. It is not stored,
 *  because a stored total is a total that can disagree with its own columns. */
export function totalLoan(book: Book): Pair {
  return (['d0', 'd1', 'd3', 'd9'] as const).reduce<Pair>(
    ([t, p], id) => [t + book[id][0], p + book[id][1]],
    [0, 0],
  )
}

export const rate = ([total, terbayar]: Pair) =>
  total ? Math.round((terbayar / total) * 100) : 0

/** Last week's rate for the same bucket — the last entry in the history. */
export const prevRate = (bp: Bp, bucket: BucketId) => bp.history[bucket][2]

export type Tone = 'green' | 'yellow' | 'red'

/**
 * How much of a pair got paid, as the board's only colour rule.
 *
 * The board used to colour each bucket against ITS OWN target (DPD 0 ≥ 98%,
 * DPD 31–90 ≥ 13%), which is correct and unreadable: the same green meant "98
 * out of 100" in one column and "13 out of 100" in the next, so a row could not
 * be scanned across. One rule — how much of what was owed came in — makes the
 * row scannable left to right, and the targets keep their own column on the BP
 * page where there is room to explain them.
 */
export function paidTone(pair: Pair): Tone {
  const share = rate(pair)
  if (share >= 85) return 'green'
  if (share >= 60) return 'yellow'
  return 'red'
}

export const TONE_TEXT: Record<Tone, string> = {
  green: 'text-green-500',
  yellow: 'text-yellow-500',
  red: 'text-red-500',
}

export const TONE_LABEL: Record<Tone, string> = {
  green: 'hampir semua terbayar',
  yellow: 'separuh terbayar',
  red: 'sedikit terbayar',
}

/** The row's verdict, on the same thresholds as every cell: how much of this
 *  BP's whole book came in. One column carrying the read the tinted rows and
 *  rank numbers used to carry. */
export const STATUS: Record<Tone, { label: string; intent: 'green' | 'yellow' | 'red' }> = {
  green: { label: 'On Track', intent: 'green' },
  yellow: { label: 'At Risk', intent: 'yellow' },
  red: { label: 'Beyond Target', intent: 'red' },
}

export const statusOf = (book: Book) => STATUS[paidTone(totalLoan(book))]

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

/** The board's order: least of what was owed actually collected, first. One
 *  rule, applied to whichever clock is on screen — the worst week and the worst
 *  day are not the same BP, and that difference is worth seeing. */
export const boardOrder = (clock: 'week' | 'day') =>
  [...BPS].sort((a, b) => rate(totalLoan(a[clock])) - rate(totalLoan(b[clock])))

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
