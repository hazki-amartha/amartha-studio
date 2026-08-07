// Mock data for the BM monitoring prototype. Kept to what is actually on
// screen (CLAUDE.md §3): ten BP rows because the table shows ten, five history
// rows because the history screen shows five.

import type { StatDelta } from './ui'

export interface Kpi {
  id: string
  label: string
  value: string
  delta: StatDelta
  average: string
  aside?: { label: string; value: string }
}

const YESTERDAY = 'Kemarin: 19.8%'
const MONTH_AVG = 'Rata-rata bulan ini: 98%'

export const KPIS: Kpi[] = [
  {
    id: 'task-completion',
    label: 'Task Completion',
    value: '73,2%',
    delta: { label: YESTERDAY, value: '0,2%', direction: 'up', good: true },
    average: MONTH_AVG,
  },
  {
    id: 'attendance',
    label: 'Attendance rate',
    value: '73,2%',
    delta: { label: YESTERDAY, value: '0,2%', direction: 'up', good: true },
    average: MONTH_AVG,
  },
  {
    id: 'disbursement-pengajuan',
    label: 'Disbursement - Pengajuan',
    value: 'Rp40 M',
    delta: { label: YESTERDAY, value: '0,2%', direction: 'up', good: true },
    average: MONTH_AVG,
    aside: { label: 'New mitra', value: '12' },
  },
  {
    id: 'dpd-flow',
    label: 'Flow rate to DPD 1-30',
    value: '20%',
    // A rise here is bad news, so the delta reads red while the arrow still
    // points up — the reference frame draws it green, which inverts the meaning.
    delta: { label: YESTERDAY, value: '0,2%', direction: 'up', good: false },
    average: MONTH_AVG,
  },
  {
    id: 'repayment',
    label: 'Repayment rate',
    value: '20%',
    delta: { label: YESTERDAY, value: '0,2%', direction: 'up', good: true },
    average: MONTH_AVG,
  },
  {
    id: 'disbursement-pencairan',
    label: 'Disbursement - Pencairan',
    value: 'Rp40 M',
    delta: { label: YESTERDAY, value: '0,2%', direction: 'down', good: false },
    average: MONTH_AVG,
    aside: { label: 'New mitra', value: '0' },
  },
]

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
  scope: 'Update: Minggu ini',
  refreshed: 'Diperbarui Hari ini, 29 Dec 2025, 12:44',
}

/** Which KPIs and which table columns each tab keeps — so switching tab
 *  actually changes the read rather than just the underline. */
export const TAB_VIEWS: Record<string, { kpis: string[]; columns: string[] }> = {
  repayment: {
    kpis: ['repayment', 'attendance', 'dpd-flow'],
    columns: ['name', 'majelis', 'repayment', 'dpd', 'tasks'],
  },
  disbursement: {
    kpis: ['disbursement-pengajuan', 'disbursement-pencairan', 'task-completion'],
    columns: ['name', 'majelis', 'disbursement', 'tasks'],
  },
  task: {
    kpis: ['task-completion', 'attendance'],
    columns: ['name', 'majelis', 'tasks'],
  },
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

/** What a healthy rate looks like in each bucket. A flat threshold would paint
 *  every DPD 90+ figure red and leave the BM with no signal at all — collecting
 *  little on the oldest bucket is the norm, not the exception. */
export const RATE_BANDS: Record<string, { good: number; fair: number }> = {
  mitra: { good: 85, fair: 65 },
  dpd0: { good: 85, fair: 75 },
  dpd130: { good: 80, fair: 58 },
  dpd3190: { good: 80, fair: 60 },
  // DPD 90+ is deliberately absent: almost nothing is collected there, so
  // scoring it would colour the entire column the same and carry no signal.
}

export function rate({ total, paid }: Bucket) {
  return total === 0 ? 0 : (paid / total) * 100
}

export interface BpRow {
  id: string
  name: string
  majelisAktif: number
  repaymentRate: number
  newFlowDpd: number
  tasksDone: number
  tasksTotal: number
  disbursement: string
}

export const BP_ROWS: BpRow[] = [
  { id: 'bp-1', name: 'Fadhil Maulana', majelisAktif: 7, repaymentRate: 91, newFlowDpd: 2, tasksDone: 6, tasksTotal: 12, disbursement: 'Rp34 jt' },
  { id: 'bp-2', name: 'Sukma Ayuningrum', majelisAktif: 6, repaymentRate: 67, newFlowDpd: 0, tasksDone: 0, tasksTotal: 10, disbursement: 'Rp34 jt' },
  { id: 'bp-3', name: 'Laili Maulidia', majelisAktif: 8, repaymentRate: 78, newFlowDpd: 4, tasksDone: 7, tasksTotal: 14, disbursement: 'Rp34 jt' },
  { id: 'bp-4', name: 'Fadhil Maulana', majelisAktif: 5, repaymentRate: 89, newFlowDpd: 5, tasksDone: 8, tasksTotal: 10, disbursement: 'Rp34 jt' },
  { id: 'bp-5', name: 'Cenli Cencen', majelisAktif: 8, repaymentRate: 78, newFlowDpd: 4, tasksDone: 7, tasksTotal: 14, disbursement: 'Rp34 jt' },
  { id: 'bp-6', name: 'Budi Ngurah', majelisAktif: 5, repaymentRate: 89, newFlowDpd: 5, tasksDone: 8, tasksTotal: 10, disbursement: 'Rp34 jt' },
  { id: 'bp-7', name: 'Ainur Rohmah', majelisAktif: 8, repaymentRate: 78, newFlowDpd: 4, tasksDone: 8, tasksTotal: 12, disbursement: 'Rp34 jt' },
  { id: 'bp-8', name: 'M. Alif Rizqi', majelisAktif: 5, repaymentRate: 89, newFlowDpd: 5, tasksDone: 8, tasksTotal: 10, disbursement: 'Rp34 jt' },
  { id: 'bp-9', name: 'Diski Tafa Ilham', majelisAktif: 8, repaymentRate: 78, newFlowDpd: 4, tasksDone: 7, tasksTotal: 14, disbursement: 'Rp34 jt' },
  { id: 'bp-10', name: 'Fauzan Aditama', majelisAktif: 5, repaymentRate: 89, newFlowDpd: 5, tasksDone: 10, tasksTotal: 10, disbursement: 'Rp34 jt' },
]

/** The whole branch, of which BP_ROWS is the first page. */
export const BP_TOTAL = 95

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
