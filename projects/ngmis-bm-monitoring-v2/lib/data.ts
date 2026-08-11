// Mock data for the BM monitoring v2 prototype.
//
// The scorecard is a stack of matrices, one per subject (Task, Repayment,
// Disbursement, Cash settlement). BPs run across the top; under each BP sit the
// subject's paired measures (Target/Completed, Aktif/Terbayar, Collected/
// Settled). The metrics run down the side. This mirrors the reference sheet.
//
// Six BPs (a full branch roster). Figures vary per BP so the branch can actually
// be read across — the reference's identical columns are a blank template.

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
 *  branch. Shown as a locked filter in the header — fixed context. */
export const LOCATION = {
  region: 'Jawa',
  provinsi: 'Jawa Barat 1',
  kota: 'Cianjur',
  branch: 'Cisaat',
}

export const BRANCH_LABEL = LOCATION.branch
export const REPORT_DATE = '07 Aug 2026'

/** "Rp45.000.000" — grouped, the way the reference prints money. */
export function rupiah(value: number): string {
  return `Rp${value.toLocaleString('id-ID')}`
}

/** "87,5%", "10%", "50%" — one decimal, Indonesian comma, trimmed when whole. */
export function pctText(part: number, whole: number): string {
  if (whole <= 0) return '0%'
  const p = Math.round((part / whole) * 1000) / 10
  return `${(Number.isInteger(p) ? String(p) : p.toFixed(1)).replace('.', ',')}%`
}

// --- Scorecard model --------------------------------------------------------

export type CellKind = 'count' | 'rupiah'
/** The secondary line under a row's SECOND measure. */
export type NoteKind = 'pct' | 'sisa'

export interface Measure {
  id: string
  label: string
  /** A same-day result the morning briefing hasn't produced yet → zeroed then. */
  actual?: boolean
}

/** The threshold the 2nd measure's percentage (of the 1st) is judged against —
 *  'min' → good when ≥ pct (a ">90%" target), 'max' → good when ≤ pct ("<5%"). */
export interface RowGoal {
  pct: number
  dir: 'min' | 'max'
}

export interface MatrixRow {
  id: string
  label: string
  /** A smaller, greyed line under the label — carries the target for a row that
   *  states one (Repayment's ">90%" / "<5%" / "<3%"). */
  sublabel?: string
  kind: CellKind
  note?: NoteKind
  goal?: RowGoal
}

/** The colour a measure's figure reads in — 'bad' red, 'good' green, else
 *  default. Only the 2nd measure is judged: a goal row against its threshold, a
 *  shortfall row against the 1st measure (red when short, no green). */
export type Tone = 'good' | 'bad' | undefined

export function measureTone(
  section: MatrixSection,
  row: MatrixRow,
  cells: Record<string, number>,
  measureIndex: number,
): Tone {
  if (measureIndex !== 1) return undefined
  const first = cells[section.measures[0].id]
  const second = cells[section.measures[1].id]
  if (row.goal) {
    const pct = first <= 0 ? 0 : (second / first) * 100
    const met = row.goal.dir === 'min' ? pct >= row.goal.pct : pct <= row.goal.pct
    return met ? 'good' : 'bad'
  }
  if (section.shortfallTone && second < first) return 'bad'
  return undefined
}

export interface MatrixSection {
  id: string
  title: string
  measures: Measure[]
  rows: MatrixRow[]
  /** A row where the 2nd measure trailing the 1st reads as a shortfall — the
   *  figure turns red (target not met). Off for Repayment, where Terbayar is
   *  always below Aktif by design. */
  shortfallTone?: boolean
  /** values[bpId][rowId][measureId] */
  values: Record<string, Record<string, Record<string, number>>>
}

/** Compact authoring: each row carries, per measure, one number per BP. */
interface RowSpec {
  id: string
  label: string
  sublabel?: string
  kind?: CellKind
  note?: NoteKind
  goal?: RowGoal
  m: Record<string, number[]>
}

function section(
  id: string,
  title: string,
  measures: Measure[],
  rowSpecs: RowSpec[],
  shortfallTone = false,
): MatrixSection {
  const values: MatrixSection['values'] = {}
  BPS.forEach((bp, i) => {
    values[bp.id] = {}
    for (const row of rowSpecs) {
      values[bp.id][row.id] = {}
      for (const [mid, arr] of Object.entries(row.m)) {
        values[bp.id][row.id][mid] = arr[i]
      }
    }
  })
  return {
    id,
    title,
    measures,
    shortfallTone,
    rows: rowSpecs.map((r) => ({
      id: r.id,
      label: r.label,
      sublabel: r.sublabel,
      kind: r.kind ?? 'count',
      note: r.note,
      goal: r.goal,
    })),
    values,
  }
}

const TARGET_COMPLETED: Measure[] = [
  { id: 'target', label: 'Target' },
  { id: 'completed', label: 'Completed', actual: true },
]

export const SECTIONS: MatrixSection[] = [
  section(
    'task',
    'Task',
    TARGET_COMPLETED,
    [
      { id: 'hv', label: 'HV', m: { target: [3, 3, 3, 4, 3, 3], completed: [2, 3, 3, 2, 1, 2] } },
      { id: 'mv', label: 'MV', m: { target: [6, 6, 6, 6, 6, 6], completed: [6, 6, 4, 6, 5, 6] } },
      { id: 'sos', label: 'SOS', m: { target: [2, 2, 2, 3, 2, 2], completed: [1, 2, 1, 2, 0, 1] } },
      { id: 'fu', label: 'FU', m: { target: [1, 1, 1, 1, 1, 1], completed: [1, 1, 0, 1, 1, 1] } },
      { id: 'uk', label: 'UK', m: { target: [2, 1, 3, 2, 1, 2], completed: [2, 1, 2, 2, 1, 2] } },
    ],
    true,
  ),
  section(
    'repayment',
    'Repayment',
    [
      { id: 'aktif', label: 'Aktif' },
      { id: 'terbayar', label: 'Terbayar', actual: true },
    ],
    [
      { id: 'dpd0', label: 'DPD 0', sublabel: 'target >90%', note: 'pct', goal: { pct: 90, dir: 'min' },
        m: { aktif: [40, 42, 38, 45, 36, 40], terbayar: [35, 39, 30, 42, 28, 36] } },
      { id: 'dpd130', label: 'DPD 1-30', sublabel: 'target <5%', note: 'pct', goal: { pct: 5, dir: 'max' },
        m: { aktif: [10, 8, 12, 9, 11, 10], terbayar: [1, 1, 2, 1, 2, 1] } },
      { id: 'dpd3190', label: 'DPD 31-90', sublabel: 'target <3%', note: 'pct', goal: { pct: 3, dir: 'max' },
        m: { aktif: [10, 8, 12, 9, 11, 10], terbayar: [1, 0, 2, 1, 1, 1] } },
      { id: 'btc', label: 'BTC', note: 'pct',
        m: { aktif: [2, 2, 3, 2, 3, 2], terbayar: [1, 1, 1, 1, 2, 1] } },
    ],
  ),
  section(
    'disbursement',
    'Disbursement',
    TARGET_COMPLETED,
    [
      { id: 'uk-approved', label: 'UK Approved',
        m: { target: [4, 1, 3, 4, 2, 3], completed: [4, 1, 2, 4, 1, 2] } },
      { id: 'amount', label: 'Disbursement amount', kind: 'rupiah',
        m: {
          target: [45_000_000, 15_000_000, 30_000_000, 40_000_000, 12_000_000, 28_000_000],
          completed: [45_000_000, 15_000_000, 20_000_000, 40_000_000, 12_000_000, 20_000_000],
        } },
      { id: 'leads', label: 'New leads from Sos',
        m: { target: [15, 15, 15, 15, 15, 15], completed: [7, 5, 8, 9, 4, 6] } },
    ],
    true,
  ),
  section(
    'cash-settlement',
    'Cash settlement',
    [
      { id: 'collected', label: 'Collected', actual: true },
      { id: 'settled', label: 'Settled', actual: true },
    ],
    [
      { id: 'setoran', label: 'Cash settlement', kind: 'rupiah', note: 'sisa',
        m: {
          collected: [15_000_000, 12_000_000, 9_000_000, 18_000_000, 8_000_000, 11_000_000],
          settled: [10_000_000, 12_000_000, 6_000_000, 15_000_000, 7_000_000, 9_000_000],
        } },
    ],
    true,
  ),
]

/**
 * How the Monitoring scorecard is oriented — the two prototype states.
 *  'matrix'  BPs across the top, each spanning its subject's measure pair, the
 *            metrics down the side (the original reference sheet's shape).
 *  'bp-rows' BPs down the side (named once per table), the metrics across the
 *            top, and each measure pair collapsed into ONE cell (result over
 *            "dari <target>"). Fits without horizontal scroll.
 */
export type ScorecardLayout = 'matrix' | 'bp-rows'

/** The subject that is really an end-of-day fact per BP, not a metric grid: in
 *  the 'bp-rows' layout it leaves the scorecard and folds into the closing
 *  panel alongside "sudah tutup hari?". */
export const CLOSING_SECTION_ID = 'cash-settlement'

/** The subject that carries the "sudah tutup hari?" column in the 'bp-rows'
 *  layout — closing the day in the field app is the last item on the BP's task
 *  list, so it reads as part of Task rather than a panel of its own. */
export const TASK_SECTION_ID = 'task'

// --- Briefings --------------------------------------------------------------

export type BriefingKind = 'morning' | 'evening'

/** How a briefing collects commentary — the three prototype states.
 *  'inline'    a Komentar box in every section's table (default)
 *  'dedicated' no per-section box; one note per BP in a section of its own
 *  'dialog'    a "✎ Isi" CTA in every section that opens a dialog to type in */
export type CommentStyle = 'inline' | 'dedicated' | 'dialog'

export const BRIEFING_LABEL: Record<BriefingKind, string> = {
  morning: 'Briefing Pagi',
  evening: 'Briefing Sore',
}

/** The prompt under each briefing — what the BM covers on the figures in front
 *  of them. Morning sets the day's plan; evening reads the result. */
export const BRIEFING_INTRO: Record<BriefingKind, string> = {
  morning:
    'Bahas target hari ini bersama BP: siapa mengejar apa, dan mitra mana yang harus diprioritaskan.',
  evening:
    'Tutup hari bersama BP: apa yang tercapai, apa yang meleset, dan tindak lanjut untuk besok.',
}

/**
 * The scorecard as it reads for a briefing. A morning briefing happens BEFORE
 * the BPs do any fieldwork, so every "actual" measure (Completed, Terbayar,
 * Collected, Settled) is 0; the plan figures (Target, Aktif) stand. The evening
 * briefing reads the full day.
 */
export function sectionsForBriefing(kind: BriefingKind): MatrixSection[] {
  if (kind === 'evening') return SECTIONS
  return SECTIONS.map((s) => {
    const actualIds = s.measures.filter((mm) => mm.actual).map((mm) => mm.id)
    const values: MatrixSection['values'] = {}
    for (const [bpId, rows] of Object.entries(s.values)) {
      values[bpId] = {}
      for (const [rowId, cells] of Object.entries(rows)) {
        values[bpId][rowId] = { ...cells }
        for (const mid of actualIds) values[bpId][rowId][mid] = 0
      }
    }
    return { ...s, values }
  })
}

/** The commentary column is keyed per section + per BP. */
export const commentKey = (sectionId: string, bpId: string): string => `${sectionId}:${bpId}`

/** A row's figures for one BP, per measure, formatted for a preview — e.g.
 *  [{label:'Target', value:'6'}, {label:'Completed', value:'4'}], with the
 *  '(87,5%)' / 'Sisa …' note folded into the second measure. Used by the
 *  dialog-style commentary so the BM sees the numbers while typing. */
export function rowSummary(
  section: MatrixSection,
  bpId: string,
  row: MatrixRow,
): { label: string; value: string; tone: Tone }[] {
  const cells = section.values[bpId][row.id]
  const first = cells[section.measures[0].id]
  const second = cells[section.measures[1].id]
  return section.measures.map((mm, j) => {
    const raw = cells[mm.id]
    const main = row.kind === 'rupiah' ? rupiah(raw) : String(raw)
    let note = ''
    if (j === 1 && row.note === 'pct') note = ` (${pctText(second, first)})`
    else if (j === 1 && row.note === 'sisa') note = ` · Sisa ${rupiah(first - second)}`
    return { label: mm.label, value: main + note, tone: measureTone(section, row, cells, j) }
  })
}

/** Seeded commentary, so a past briefing's detail isn't a page of empty boxes.
 *  Only a handful of cells carry a note. */
export const SAMPLE_COMMENTS: Record<string, string> = {
  [commentKey('task', 'bp-e')]: 'SOS 0 dari 2 — dorong Fadhil kejar 1 sosialisasi besok.',
  [commentKey('repayment', 'bp-c')]: 'DPD 0 baru 79% (target >90%). Dampingi penagihan Cenli.',
  [commentKey('disbursement', 'bp-b')]: 'Leads dari SOS baru 5, paling rendah. Review pipeline.',
  [commentKey('cash-settlement', 'bp-c')]: 'Sisa Rp3jt belum disetor & belum tutup hari — ingatkan.',
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
