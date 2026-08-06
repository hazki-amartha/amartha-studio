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
