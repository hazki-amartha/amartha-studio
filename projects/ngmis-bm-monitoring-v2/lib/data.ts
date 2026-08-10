// Mock data for the BM monitoring v2 prototype.
//
// The activities and columns follow the reference scorecard ("Bekasi 1 (sample)",
// 07-Aug-2026), transposed: where the reference put BPs across the top and the
// metrics down the side, here the BPs are the ROWS and each activity's metrics
// are the columns. Six BPs (a full branch roster), kept small elsewhere (§3):
// five history rows, because the history list shows five.

export interface Bp {
  id: string
  name: string
  /** Whether the BP has closed (submitted) their day in the field app. */
  closedDay: boolean
}

export const BPS: Bp[] = [
  { id: 'bp-a', name: 'Sukma Ayuningrum', closedDay: true },
  { id: 'bp-b', name: 'Diski Tafa Ilham', closedDay: true },
  { id: 'bp-c', name: 'Cenli Cencen', closedDay: false },
  { id: 'bp-d', name: 'Laili Maulidia', closedDay: true },
  { id: 'bp-e', name: 'Fadhil Maulana', closedDay: true },
  { id: 'bp-f', name: 'Ainur Rohmah', closedDay: false },
]

/** The branch this view is scoped to, drilled down region → provinsi → kota →
 *  branch. The cascade is shown as a locked filter in the header — fixed context,
 *  not something the BM switches. */
export const LOCATION = {
  region: 'Jawa',
  provinsi: 'Jawa Barat 1',
  kota: 'Cianjur',
  branch: 'Cisaat',
}

export const BRANCH_LABEL = LOCATION.branch
export const REPORT_DATE = '07 Aug 2026'

/** How the scorecard is laid out: BPs down the side (rows) or across the top
 *  (columns, the original reference layout). A view preference, not per-page. */
export type Orientation = 'bp-rows' | 'bp-columns'

/** A figure, optionally out of a population. `total` present → the cell reads
 *  "count/total (pct%)"; absent → a bare count (targets, potential mitra). */
export interface Metric {
  count: number
  total?: number
}

const m = (count: number, total?: number): Metric => ({ count, total })

export interface ScorecardColumn {
  id: string
  header: string
  kind: 'count' | 'rupiah'
}

export interface ScorecardSection {
  id: string
  title: string
  columns: ScorecardColumn[]
  /** Per BP id → per column id → the figure. */
  rows: Record<string, Record<string, Metric>>
}

export const SECTIONS: ScorecardSection[] = [
  {
    id: 'majelis-visit',
    title: 'Majelis Visit',
    columns: [
      { id: 'target', header: 'Target', kind: 'count' },
      { id: 'completed', header: 'Completed', kind: 'count' },
      // A majelis holds 15–20 mitra, so "paid at majelis" is counted over the
      // whole membership of the majelis visited, not over the visits.
      { id: 'paid', header: 'Mitra Paid at Majelis', kind: 'count' },
      { id: 'dpd0', header: "Mitra DPD-0, didn't pay", kind: 'count' },
    ],
    rows: {
      'bp-a': { target: m(5), completed: m(5), paid: m(68, 85), dpd0: m(17, 85) },
      'bp-b': { target: m(6), completed: m(6), paid: m(92, 108), dpd0: m(12, 108) },
      'bp-c': { target: m(4), completed: m(3), paid: m(41, 51), dpd0: m(8, 51) },
      'bp-d': { target: m(6), completed: m(6), paid: m(88, 102), dpd0: m(10, 102) },
      'bp-e': { target: m(5), completed: m(4), paid: m(55, 72), dpd0: m(14, 72) },
      'bp-f': { target: m(4), completed: m(4), paid: m(60, 68), dpd0: m(6, 68) },
    },
  },
  {
    id: 'sosialisasi',
    title: 'Sosialisasi',
    columns: [
      { id: 'target', header: 'Target', kind: 'count' },
      { id: 'completed', header: 'Completed', kind: 'count' },
      { id: 'potential', header: 'Potential Mitra Brought In', kind: 'count' },
    ],
    rows: {
      'bp-a': { target: m(3), completed: m(2), potential: m(6) },
      'bp-b': { target: m(4), completed: m(1), potential: m(3) },
      'bp-c': { target: m(2), completed: m(2), potential: m(5) },
      'bp-d': { target: m(3), completed: m(3), potential: m(7) },
      'bp-e': { target: m(4), completed: m(2), potential: m(4) },
      'bp-f': { target: m(2), completed: m(1), potential: m(2) },
    },
  },
  {
    id: 'uk',
    title: 'UK',
    columns: [
      { id: 'target', header: 'Target', kind: 'count' },
      { id: 'completed', header: 'Completed', kind: 'count' },
      { id: 'approved', header: 'UK Approved (NoA)', kind: 'count' },
      { id: 'disbursement', header: 'Disbursement Amount', kind: 'rupiah' },
    ],
    rows: {
      'bp-a': { target: m(5), completed: m(4), approved: m(3, 4), disbursement: m(45_000_000) },
      'bp-b': { target: m(1), completed: m(1), approved: m(1, 1), disbursement: m(15_000_000) },
      'bp-c': { target: m(3), completed: m(2), approved: m(2, 2), disbursement: m(30_000_000) },
      'bp-d': { target: m(4), completed: m(4), approved: m(3, 4), disbursement: m(40_000_000) },
      'bp-e': { target: m(2), completed: m(1), approved: m(1, 1), disbursement: m(12_000_000) },
      'bp-f': { target: m(3), completed: m(2), approved: m(2, 2), disbursement: m(28_000_000) },
    },
  },
  {
    id: 'home-visit',
    title: 'Home Visit',
    columns: [
      { id: 'target', header: 'Target', kind: 'count' },
      { id: 'completed', header: 'Completed (HV Submitted)', kind: 'count' },
      { id: 'payment', header: 'Resulted in Payment (Mitra)', kind: 'count' },
      { id: 'collected', header: 'Rp collected', kind: 'rupiah' },
      { id: 'ptp', header: 'PTP Commitment', kind: 'count' },
      { id: 'btc', header: 'BTC (fully cleared)', kind: 'count' },
    ],
    rows: {
      'bp-a': {
        target: m(6), completed: m(4), payment: m(3, 4), collected: m(2_500_000),
        ptp: m(1, 4), btc: m(1, 4),
      },
      'bp-b': {
        target: m(8), completed: m(3), payment: m(2, 3), collected: m(1_800_000),
        ptp: m(1, 3), btc: m(0, 3),
      },
      'bp-c': {
        target: m(5), completed: m(5), payment: m(4, 5), collected: m(3_200_000),
        ptp: m(1, 5), btc: m(2, 5),
      },
      'bp-d': {
        target: m(6), completed: m(5), payment: m(4, 5), collected: m(3_000_000),
        ptp: m(2, 5), btc: m(2, 5),
      },
      'bp-e': {
        target: m(7), completed: m(4), payment: m(2, 4), collected: m(1_500_000),
        ptp: m(1, 4), btc: m(1, 4),
      },
      'bp-f': {
        target: m(5), completed: m(3), payment: m(2, 3), collected: m(1_900_000),
        ptp: m(1, 3), btc: m(1, 3),
      },
    },
  },
  {
    id: 'cash-collection',
    title: 'Cash Collection',
    columns: [
      // The day's collectible across all assigned tasks.
      { id: 'target', header: 'Target (Rp)', kind: 'rupiah' },
      // Collected from tasks the BP has completed.
      { id: 'collected', header: 'Terkumpul (Rp)', kind: 'rupiah' },
      // Settled into Amartha's accounts — never more than collected; the gap is
      // cash the BP is still holding.
      { id: 'settled', header: 'Sudah di setor (Rp)', kind: 'rupiah' },
    ],
    rows: {
      'bp-a': { target: m(6_500_000), collected: m(5_200_000), settled: m(5_000_000) },
      'bp-b': { target: m(6_000_000), collected: m(5_800_000), settled: m(5_800_000) },
      'bp-c': { target: m(5_500_000), collected: m(3_200_000), settled: m(2_500_000) },
      'bp-d': { target: m(7_000_000), collected: m(6_400_000), settled: m(6_000_000) },
      'bp-e': { target: m(5_000_000), collected: m(3_100_000), settled: m(3_000_000) },
      'bp-f': { target: m(4_500_000), collected: m(3_900_000), settled: m(3_500_000) },
    },
  },
]

/** "Rp45.000.000" — grouped, the way the reference prints money. */
export function rupiah(value: number): string {
  return `Rp${value.toLocaleString('id-ID')}`
}

/** The percentage a figure carries, floored; null where it has no population. */
export function metricPct(metric: Metric): number | null {
  if (metric.total === undefined) return null
  return metric.total === 0 ? 0 : Math.round((metric.count / metric.total) * 100)
}

/** How a single figure reads: "68/85 (80%)", "5", or a rupiah amount. */
export function metricText(metric: Metric, kind: ScorecardColumn['kind']): string {
  if (kind === 'rupiah') return rupiah(metric.count)
  const pct = metricPct(metric)
  return pct === null ? String(metric.count) : `${metric.count}/${metric.total} (${pct}%)`
}

// --- Briefings --------------------------------------------------------------

export type BriefingKind = 'morning' | 'evening'

export const BRIEFING_LABEL: Record<BriefingKind, string> = {
  morning: 'Briefing Pagi',
  evening: 'Briefing Sore',
}

/** The prompt under each briefing — what the BM is meant to cover on the figures
 *  in front of them. Morning sets the day's plan; evening reads the result. */
export const BRIEFING_INTRO: Record<BriefingKind, string> = {
  morning:
    'Bahas target hari ini bersama BP: siapa mengejar apa, dan mitra mana yang harus diprioritaskan.',
  evening:
    'Tutup hari bersama BP: apa yang tercapai, apa yang meleset, dan tindak lanjut untuk besok.',
}

/**
 * The scorecard as it reads for a briefing. A morning briefing happens BEFORE
 * the BPs do any fieldwork, so only the targets are known — Completed and every
 * result figure is 0. The evening briefing reads the full day.
 */
export function sectionsForBriefing(kind: BriefingKind): ScorecardSection[] {
  if (kind === 'evening') return SECTIONS
  return SECTIONS.map((section) => ({
    ...section,
    rows: Object.fromEntries(
      Object.entries(section.rows).map(([bpId, cells]) => {
        const zeroed: Record<string, Metric> = {}
        for (const col of section.columns) {
          zeroed[col.id] = col.id === 'target' ? cells[col.id] : m(0)
        }
        return [bpId, zeroed]
      }),
    ),
  }))
}

/** The commentary column is keyed per section + per BP, so the BM can note a
 *  specific activity for a specific person. */
export const commentKey = (sectionId: string, bpId: string): string => `${sectionId}:${bpId}`

/** Seeded commentary, so the read-only detail of a past briefing is not a page
 *  of empty boxes. Only a handful of cells carry a note — a real briefing
 *  comments where something needs saying, not on every figure. */
export const SAMPLE_COMMENTS: Record<string, string> = {
  [commentKey('majelis-visit', 'bp-a')]: '17 mitra DPD-0 belum bayar — dampingi Sukma di majelis besok.',
  [commentKey('sosialisasi', 'bp-b')]: 'Baru 1 dari 4. Dorong minimal 1 majelis baru minggu ini.',
  [commentKey('uk', 'bp-e')]: '1 pengajuan belum di-approve, kejar berkas ke Fadhil.',
  [commentKey('home-visit', 'bp-c')]: 'HV bagus (5/5), tapi Cenli belum tutup hari — ingatkan.',
  [commentKey('home-visit', 'bp-b')]: 'BTC 0 — tidak ada yang lunas. Review daftar HV besok.',
}

export interface HistoryEntry {
  id: string
  date: string
  kind: BriefingKind
  submittedBy: string
  submittedAt: string
  status: 'Terkirim' | 'Terlambat' | 'Belum diisi'
  hasPhoto: boolean
}

export const HISTORY: HistoryEntry[] = [
  { id: 'h-1', date: '06 Aug 2026', kind: 'evening', submittedBy: 'Rina Marlina', submittedAt: '17.42 WIB', status: 'Terkirim', hasPhoto: true },
  { id: 'h-2', date: '06 Aug 2026', kind: 'morning', submittedBy: 'Rina Marlina', submittedAt: '07.15 WIB', status: 'Terkirim', hasPhoto: true },
  { id: 'h-3', date: '05 Aug 2026', kind: 'evening', submittedBy: 'Rina Marlina', submittedAt: '18.55 WIB', status: 'Terlambat', hasPhoto: true },
  { id: 'h-4', date: '05 Aug 2026', kind: 'morning', submittedBy: '—', submittedAt: '—', status: 'Belum diisi', hasPhoto: false },
  { id: 'h-5', date: '04 Aug 2026', kind: 'evening', submittedBy: 'Rina Marlina', submittedAt: '17.20 WIB', status: 'Terkirim', hasPhoto: true },
]
