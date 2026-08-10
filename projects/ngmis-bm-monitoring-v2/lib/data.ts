// Mock data for the NGMIS Daily Monitoring prototype.
//
// The scorecard is BPs-across-the-top, always: each section names its ROWS (the
// things being counted) and its MEASURES (the columns each row carries), and
// every BP gets that block of measures under their name. Six BPs — a full branch
// roster — kept small elsewhere (§3): five history rows, because the history
// list shows five.

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

/** One column inside a BP's block.
 *
 *  `role` is what the figure means, and it is what drives the reading aids: an
 *  `achievement` is compared against the row's `target` — shown as a percentage
 *  and lifted to orange when it falls short — while `outstanding` reads orange
 *  the moment it is above zero. `standing` figures (mitra aktif) are neither. */
export type MeasureRole = 'standing' | 'target' | 'achievement' | 'outstanding'

export interface Measure {
  id: string
  header: string
  kind: 'count' | 'rupiah'
  role: MeasureRole
}

/** One row of a section — `values` is per BP, aligned to the section's measures.
 *  `null` means the row doesn't carry that measure (BTC has no daily target). */
export interface SectionRow {
  id: string
  label: string
  /** Set where the row's figures mean something other than the column header
   *  says — Sosialisasi's target and achievement are potential leads. */
  note?: string
  values: Record<string, (number | null)[]>
}

export interface ScorecardSection {
  id: string
  title: string
  measures: Measure[]
  rows: SectionRow[]
}

const TASK_MEASURES: Measure[] = [
  { id: 'target', header: 'Target', kind: 'count', role: 'target' },
  { id: 'completed', header: 'Completed', kind: 'count', role: 'achievement' },
]

const REPAYMENT_MEASURES: Measure[] = [
  { id: 'active', header: 'Total Mitra Aktif', kind: 'count', role: 'standing' },
  { id: 'target', header: 'Target hari ini', kind: 'count', role: 'target' },
  { id: 'achievement', header: 'Achievement hari ini', kind: 'count', role: 'achievement' },
]

const DISBURSEMENT_MEASURES: Measure[] = [
  { id: 'target', header: 'Target hari ini', kind: 'count', role: 'target' },
  { id: 'achievement', header: 'Achievement hari ini', kind: 'count', role: 'achievement' },
]

const CASH_MEASURES: Measure[] = [
  { id: 'target', header: 'Target harian', kind: 'rupiah', role: 'target' },
  { id: 'collected', header: 'Terkumpul', kind: 'rupiah', role: 'achievement' },
  { id: 'settled', header: 'Sudah disetor', kind: 'rupiah', role: 'standing' },
  { id: 'outstanding', header: 'Belum disetor', kind: 'rupiah', role: 'outstanding' },
]

export const SECTIONS: ScorecardSection[] = [
  {
    id: 'task',
    title: 'Task',
    measures: TASK_MEASURES,
    rows: [
      {
        id: 'hv',
        label: 'HV',
        values: {
          'bp-a': [6, 4], 'bp-b': [8, 3], 'bp-c': [5, 5],
          'bp-d': [6, 5], 'bp-e': [7, 4], 'bp-f': [5, 3],
        },
      },
      {
        id: 'mv',
        label: 'MV',
        values: {
          'bp-a': [5, 5], 'bp-b': [6, 6], 'bp-c': [4, 3],
          'bp-d': [6, 6], 'bp-e': [5, 4], 'bp-f': [4, 4],
        },
      },
      {
        id: 'sos',
        label: 'SOS',
        values: {
          'bp-a': [3, 2], 'bp-b': [4, 1], 'bp-c': [2, 2],
          'bp-d': [3, 3], 'bp-e': [4, 2], 'bp-f': [2, 1],
        },
      },
      {
        id: 'fu',
        label: 'FU',
        values: {
          'bp-a': [4, 3], 'bp-b': [5, 2], 'bp-c': [3, 3],
          'bp-d': [4, 4], 'bp-e': [5, 3], 'bp-f': [3, 2],
        },
      },
      {
        id: 'uk',
        label: 'UK',
        values: {
          'bp-a': [5, 4], 'bp-b': [1, 1], 'bp-c': [3, 2],
          'bp-d': [4, 4], 'bp-e': [2, 1], 'bp-f': [3, 2],
        },
      },
    ],
  },
  {
    id: 'repayment',
    title: 'Repayment',
    measures: REPAYMENT_MEASURES,
    rows: [
      {
        id: 'dpd-0',
        label: 'DPD 0',
        values: {
          'bp-a': [85, 68, 60], 'bp-b': [108, 92, 88], 'bp-c': [51, 41, 33],
          'bp-d': [102, 88, 84], 'bp-e': [72, 55, 47], 'bp-f': [68, 60, 55],
        },
      },
      {
        id: 'dpd-1-30',
        label: 'DPD 1–30',
        values: {
          'bp-a': [17, 10, 6], 'bp-b': [12, 8, 7], 'bp-c': [8, 6, 3],
          'bp-d': [10, 7, 6], 'bp-e': [14, 9, 5], 'bp-f': [6, 4, 4],
        },
      },
      {
        id: 'dpd-31-90',
        label: 'DPD 31–90',
        values: {
          'bp-a': [6, 3, 1], 'bp-b': [4, 2, 2], 'bp-c': [5, 3, 1],
          'bp-d': [3, 2, 2], 'bp-e': [7, 4, 2], 'bp-f': [2, 1, 1],
        },
      },
      {
        // BTC is cleared-in-full, not a daily quota — no target is set for it.
        id: 'btc',
        label: 'BTC',
        values: {
          'bp-a': [9, null, 1], 'bp-b': [7, null, 0], 'bp-c': [11, null, 2],
          'bp-d': [8, null, 2], 'bp-e': [10, null, 1], 'bp-f': [5, null, 1],
        },
      },
    ],
  },
  {
    id: 'disbursement',
    title: 'Disbursement',
    measures: DISBURSEMENT_MEASURES,
    rows: [
      {
        id: 'uk-approved',
        label: 'UK Approved',
        values: {
          'bp-a': [4, 3], 'bp-b': [1, 1], 'bp-c': [2, 2],
          'bp-d': [4, 3], 'bp-e': [1, 1], 'bp-f': [2, 2],
        },
      },
      {
        id: 'disbursement-amount',
        label: 'Disbursement amount',
        values: {
          'bp-a': [50_000_000, 45_000_000], 'bp-b': [15_000_000, 15_000_000],
          'bp-c': [35_000_000, 30_000_000], 'bp-d': [45_000_000, 40_000_000],
          'bp-e': [15_000_000, 12_000_000], 'bp-f': [30_000_000, 28_000_000],
        },
      },
      {
        id: 'sosialisasi',
        label: 'Sosialisasi',
        note: 'Target & achievement dihitung dalam potential lead.',
        values: {
          'bp-a': [8, 6], 'bp-b': [6, 3], 'bp-c': [5, 5],
          'bp-d': [8, 7], 'bp-e': [6, 4], 'bp-f': [4, 2],
        },
      },
    ],
  },
  {
    id: 'cash-collection',
    title: 'Cash collection',
    measures: CASH_MEASURES,
    rows: [
      {
        id: 'cash-collection',
        label: 'Cash collection',
        values: {
          'bp-a': [6_500_000, 5_200_000, 5_000_000, 200_000],
          'bp-b': [6_000_000, 5_800_000, 5_800_000, 0],
          'bp-c': [5_500_000, 3_200_000, 2_500_000, 700_000],
          'bp-d': [7_000_000, 6_400_000, 6_000_000, 400_000],
          'bp-e': [5_000_000, 3_100_000, 3_000_000, 100_000],
          'bp-f': [4_500_000, 3_900_000, 3_500_000, 400_000],
        },
      },
    ],
  },
]

/** The disbursement-amount row is money even though its section's other rows are
 *  counts — the measure's own `kind` can't tell them apart, so the row does. */
const RUPIAH_ROWS = new Set(['disbursement-amount'])

export function isRupiah(section: ScorecardSection, row: SectionRow, measure: Measure): boolean {
  return measure.kind === 'rupiah' || (section.id === 'disbursement' && RUPIAH_ROWS.has(row.id))
}

/** "Rp45.000.000" — grouped, the way the reference prints money. */
export function rupiah(value: number): string {
  return `Rp${value.toLocaleString('id-ID')}`
}

/** The value a row carries for a BP under a given measure; null where the row
 *  doesn't carry it. */
export function valueAt(
  section: ScorecardSection,
  row: SectionRow,
  bpId: string,
  measureId: string,
): number | null {
  const index = section.measures.findIndex((me) => me.id === measureId)
  if (index < 0) return null
  return row.values[bpId]?.[index] ?? null
}

/** An achievement as a percentage of its row's target — null where either is
 *  missing, so BTC and the standing figures show no percentage. */
export function achievementPct(
  section: ScorecardSection,
  row: SectionRow,
  bpId: string,
  value: number,
): number | null {
  const target = valueAt(section, row, bpId, 'target')
  if (target === null || target === 0) return null
  return Math.round((value / target) * 100)
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
 * the BPs do any fieldwork, so only what is already known survives — targets and
 * the standing mitra-aktif counts. Every achievement, and every rupiah not yet
 * collected, reads 0.
 */
export function sectionsForBriefing(kind: BriefingKind): ScorecardSection[] {
  if (kind === 'evening') return SECTIONS
  return SECTIONS.map((section) => ({
    ...section,
    rows: section.rows.map((row) => ({
      ...row,
      values: Object.fromEntries(
        Object.entries(row.values).map(([bpId, values]) => [
          bpId,
          values.map((value, i) => {
            const role = section.measures[i].role
            if (value === null) return null
            return role === 'standing' || role === 'target' ? value : 0
          }),
        ]),
      ),
    })),
  }))
}

/** The commentary column is keyed per section + per BP, so the BM can note a
 *  specific activity for a specific person. */
export const commentKey = (sectionId: string, bpId: string): string => `${sectionId}:${bpId}`

/** The alternative where commentary is NOT per activity: one note per BP for the
 *  whole briefing, so it keys against a single pseudo-section. */
export const briefingCommentKey = (bpId: string): string => commentKey('briefing', bpId)

/** Which activity + which BP a comment key belongs to — the dialog's heading. */
export function commentLabel(key: string): { section: string; bp: string } {
  const [sectionId, bpId] = key.split(':')
  return {
    section: SECTIONS.find((s) => s.id === sectionId)?.title ?? sectionId,
    bp: BPS.find((b) => b.id === bpId)?.name ?? bpId,
  }
}

/** Seeded commentary, so the read-only detail of a past briefing is not a page
 *  of empty boxes. Only a handful of cells carry a note — a real briefing
 *  comments where something needs saying, not on every figure. */
export const SAMPLE_COMMENTS: Record<string, string> = {
  [commentKey('task', 'bp-b')]: 'HV baru 3 dari 8 dan SOS 1 dari 4 — susun ulang rute besok.',
  [commentKey('repayment', 'bp-a')]: 'DPD 0 meleset 8 mitra. Dampingi Sukma di majelis besok pagi.',
  [commentKey('repayment', 'bp-c')]: 'DPD 31–90 baru 1 dari 3, dan Cenli belum tutup hari — ingatkan.',
  [commentKey('disbursement', 'bp-e')]: '1 UK belum cair, kejar berkas ke Fadhil.',
  [commentKey('cash-collection', 'bp-c')]: 'Rp700.000 belum disetor — setor pagi ini sebelum ke lapangan.',
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
