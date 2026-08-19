// Mock data for Progres harian, ported verbatim from ngmis-bm-monitoring-v2's
// Daily Monitoring dashboard (§1: never import across projects, so this is a
// copy, not a live link — see NOTES.md). Its own roster and figures, kept
// separate from `data.ts`'s ten-BP roster rather than remapped onto it, per
// the "follow exactly" brief.
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
  /** A smaller, greyed line under the label, when a row needs a second line. */
  sublabel?: string
  kind: CellKind
  /** The SECOND measure's kind, when it differs from the first — Pencairan's
   *  Mitra/Jumlah pair is a count then a rupiah amount. Defaults to `kind`. */
  kind2?: CellKind
  note?: NoteKind
  goal?: RowGoal
  /** Per-row colour rule for the 2nd measure: 'below' reds when it trails the 1st
   *  (BTC), 'above' reds when it exceeds the 1st (Flow, target 0). */
  redWhen?: 'below' | 'above'
  /** Colour the 1st measure red when it is > 0 (Cash settlement Outstanding). */
  firstRedWhenPositive?: boolean
  /** A status row (Tugas' "Ingatkan kumpulan" / "Tutup hari") — no figures; one
   *  merged cell per BP spanning both measure columns, showing `status`
   *  (Sudah/Belum) instead. */
  merged?: boolean
  /** Explicit Sudah(true)/Belum(false) per BP, in `BPS` order — only present
   *  on a `merged` row. */
  status?: boolean[]
}

/** The colour a measure's figure reads in — 'bad' red, 'good' green, else
 *  default. Every rule that reds a shortfall also greens the achieved state, so
 *  the tables read symmetrically (as Repayment already does). */
export type Tone = 'good' | 'bad' | undefined

export function measureTone(
  section: MatrixSection,
  row: MatrixRow,
  cells: Record<string, number>,
  measureIndex: number,
): Tone {
  const first = cells[section.measures[0].id]
  const second = section.measures.length > 1 ? cells[section.measures[1].id] : 0
  if (measureIndex === 0) {
    // Cash settlement Outstanding: green when nothing is left (fully settled),
    // red when any is outstanding.
    return row.firstRedWhenPositive ? (first > 0 ? 'bad' : 'good') : undefined
  }
  if (row.redWhen === 'below') return second < first ? 'bad' : 'good'
  if (row.redWhen === 'above') return second > first ? 'bad' : 'good'
  if (row.goal) {
    const pct = first <= 0 ? 0 : (second / first) * 100
    const met = row.goal.dir === 'min' ? pct >= row.goal.pct : pct <= row.goal.pct
    return met ? 'good' : 'bad'
  }
  // Repayment: the colour sits on Terbayar, read against Aktif as the target —
  // green when Terbayar meets Aktif, red when it falls short.
  if (section.paidTone) return second >= first ? 'good' : 'bad'
  if (section.shortfallTone) return second < first ? 'bad' : 'good'
  return undefined
}

export interface MatrixSection {
  id: string
  title: string
  measures: Measure[]
  rows: MatrixRow[]
  /** A row where the 2nd measure trailing the 1st reads as a shortfall — the
   *  figure turns red (target not met), no green. */
  shortfallTone?: boolean
  /** Repayment: the 2nd measure (Terbayar) is judged against the 1st (Aktif) as
   *  its target — green when it meets Aktif, red when short. */
  paidTone?: boolean
  /** The row axis's own name, in the sticky corner cell above the row labels —
   *  "DPD" reads oddly without it once every row already says "DPD 0" etc. */
  rowAxisLabel?: string
  /** values[bpId][rowId][measureId] */
  values: Record<string, Record<string, Record<string, number>>>
}

/** Compact authoring: each row carries, per measure, one number per BP. */
interface RowSpec {
  id: string
  label: string
  sublabel?: string
  kind?: CellKind
  kind2?: CellKind
  note?: NoteKind
  goal?: RowGoal
  redWhen?: 'below' | 'above'
  firstRedWhenPositive?: boolean
  merged?: boolean
  status?: boolean[]
  m: Record<string, number[]>
}

function section(
  id: string,
  title: string,
  measures: Measure[],
  rowSpecs: RowSpec[],
  shortfallTone = false,
  paidTone = false,
  rowAxisLabel?: string,
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
    paidTone,
    rowAxisLabel,
    rows: rowSpecs.map((r) => ({
      id: r.id,
      label: r.label,
      sublabel: r.sublabel,
      kind: r.kind ?? 'count',
      kind2: r.kind2,
      note: r.note,
      goal: r.goal,
      redWhen: r.redWhen,
      firstRedWhenPositive: r.firstRedWhenPositive,
      merged: r.merged,
      status: r.status,
    })),
    values,
  }
}

const TARGET_COMPLETED: Measure[] = [
  { id: 'target', label: 'Target' },
  { id: 'completed', label: 'Selesai', actual: true },
]

// DPD 1-30 and 31-90 active loans, shared by the Repayment rows.
const DPD130_AKTIF = [10, 8, 12, 9, 11, 10]
const DPD3190_AKTIF = [10, 8, 12, 9, 11, 10]

export const SECTIONS: MatrixSection[] = [
  section(
    'task',
    'Tugas',
    TARGET_COMPLETED,
    [
      { id: 'home-visit', label: 'Home Visit', m: { target: [3, 3, 3, 4, 3, 3], completed: [2, 3, 3, 2, 1, 2] } },
      { id: 'pelayanan', label: 'Pelayanan', m: { target: [6, 6, 6, 6, 6, 6], completed: [6, 6, 4, 6, 5, 6] } },
      // Status rows carry no target/completed pair — Sudah/Belum per BP,
      // seeded independently rather than derived from the rows above.
      { id: 'ingatkan-kumpulan', label: 'Ingatkan kumpulan', merged: true,
        status: [true, true, false, false, true, false], m: {} },
      { id: 'tutup-hari', label: 'Tutup hari', merged: true,
        status: BPS.map((bp) => bp.closedDay), m: {} },
    ],
    true,
    false,
    'Tugas',
  ),
  section(
    'repayment',
    'Pembayaran',
    [
      { id: 'aktif', label: 'Aktif' },
      { id: 'terbayar', label: 'Terbayar', actual: true },
    ],
    [
      { id: 'dpd0', label: 'DPD 0',
        m: { aktif: [40, 42, 38, 45, 36, 40], terbayar: [40, 42, 30, 45, 28, 40] } },
      { id: 'dpd130', label: 'DPD 1-30',
        m: { aktif: DPD130_AKTIF, terbayar: [10, 8, 9, 9, 8, 10] } },
      { id: 'dpd3190', label: 'DPD 31-90',
        m: { aktif: DPD3190_AKTIF, terbayar: [8, 8, 9, 9, 8, 7] } },
    ],
    false,
    true,
    'DPD',
  ),
  section(
    'cash-settlement',
    'Setor tunai',
    [{ id: 'outstanding', label: 'Outstanding', actual: true }],
    [
      // Outstanding = cash collected but not yet settled today (red when any left).
      { id: 'setoran', label: 'Belum disetor', kind: 'rupiah', firstRedWhenPositive: true,
        m: { outstanding: [5_000_000, 0, 3_000_000, 3_000_000, 1_000_000, 2_000_000] } },
    ],
  ),
  section(
    'disbursement',
    'Pencairan',
    [
      { id: 'mitra', label: 'Mitra' },
      { id: 'jumlah', label: 'Jumlah', actual: true },
    ],
    [
      { id: 'mitra-baru', label: 'Mitra baru', kind: 'count', kind2: 'rupiah',
        m: {
          mitra: [4, 1, 2, 4, 1, 2],
          jumlah: [45_000_000, 15_000_000, 20_000_000, 40_000_000, 12_000_000, 20_000_000],
        } },
      { id: 'mitra-lanjutan', label: 'Mitra lanjutan', kind: 'count', kind2: 'rupiah',
        m: {
          mitra: [3, 2, 3, 3, 1, 3],
          jumlah: [28_000_000, 20_000_000, 25_000_000, 28_000_000, 15_000_000, 22_000_000],
        } },
    ],
  ),
]

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
    const kind = j === 1 ? (row.kind2 ?? row.kind) : row.kind
    const main = kind === 'rupiah' ? rupiah(raw) : String(raw)
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
  status: 'Terkirim' | 'Tidak dikerjakan'
  hasPhoto: boolean
}

export const HISTORY: HistoryEntry[] = [
  { id: 'h-1', date: '06 Aug 2026', kind: 'evening', submittedBy: 'Rina Marlina', submittedAt: '17.42 WIB', status: 'Terkirim', hasPhoto: true },
  { id: 'h-2', date: '06 Aug 2026', kind: 'morning', submittedBy: 'Rina Marlina', submittedAt: '07.15 WIB', status: 'Terkirim', hasPhoto: true },
  { id: 'h-3', date: '05 Aug 2026', kind: 'evening', submittedBy: 'Rina Marlina', submittedAt: '18.55 WIB', status: 'Terkirim', hasPhoto: true },
  { id: 'h-4', date: '05 Aug 2026', kind: 'morning', submittedBy: '—', submittedAt: '—', status: 'Tidak dikerjakan', hasPhoto: false },
  { id: 'h-5', date: '04 Aug 2026', kind: 'evening', submittedBy: 'Rina Marlina', submittedAt: '17.20 WIB', status: 'Terkirim', hasPhoto: true },
]
