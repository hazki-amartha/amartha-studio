// Mock data + derivations for the A-Partner IA prototype.
// Ported from the team's standalone JSX draft. The source carried its own hex
// palette; here every colour is expressed as a design-system Badge intent or a
// token-named class, so the data layer never hardcodes a value.

import type { BadgeIntent } from '@/design-system/components'

// --- Tone ------------------------------------------------------------------
// Attainment tone, shared by KPI rows, majelis health, and the incentive hero.

export type Tone = 'on' | 'warn' | 'off'

export const TONE_TEXT: Record<Tone, string> = {
  on: 'text-green-600',
  warn: 'text-orange-700',
  off: 'text-red-500',
}

export const TONE_BAR: Record<Tone, string> = {
  on: 'bg-green-500',
  warn: 'bg-orange-500',
  off: 'bg-red-500',
}

export const TONE_BADGE: Record<Tone, BadgeIntent> = {
  on: 'green',
  warn: 'orange',
  off: 'red',
}

// --- Formatting ------------------------------------------------------------

export const rp = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID')
export const parseRp = (s: string) => Number(String(s).replace(/[^\d]/g, '')) || 0
export const fmt = (v: number, unit: string) =>
  unit === 'rp' ? rp(v) : unit === '%' ? `${v}%` : `${v}`

// --- Tasks -----------------------------------------------------------------
// KPI types — the four buckets tasks roll up into. "Cross-sell" is a task type
// that sits outside the four KPI buckets, so it reads neutral.

export type KpiType = 'Collection' | 'Attendance' | 'Disbursement' | 'Acquisition'
export type TaskType = KpiType | 'Cross-sell'

export const KTYPES: KpiType[] = ['Collection', 'Attendance', 'Disbursement', 'Acquisition']

export const TYPE_BADGE: Record<TaskType, BadgeIntent> = {
  Collection: 'blue',
  Attendance: 'green',
  Disbursement: 'primary',
  Acquisition: 'orange',
  'Cross-sell': 'neutral',
}

export type TaskKind = 'wajib' | 'rekomendasi'

export interface Task {
  id: string
  act: string
  who: string
  maj: string | null
  time: string
  loc: string
  types: TaskType[]
  meta: string | null
  day: number
  kind: TaskKind
}

export const TASKS: Task[] = [
  { id: 't1', act: 'Kunjungan Majelis', who: 'Majelis Melati', maj: 'Majelis Melati', time: '07.30', loc: 'Desa Terucuk', types: ['Collection', 'Attendance'], meta: '2 mitra menunggak', day: 0, kind: 'wajib' },
  { id: 't2', act: 'Kunjungan Rumah', who: 'Sri Rahayu', maj: 'Majelis Kenanga', time: '09.00', loc: 'Desa Ngawen', types: ['Collection'], meta: 'DPD 5', day: 0, kind: 'wajib' },
  { id: 't3', act: 'Verifikasi SLIK', who: 'Ratna Kanya Herdhitia', maj: 'Majelis Melati', time: '09.30', loc: 'Pengajuan baru', types: ['Acquisition', 'Disbursement'], meta: 'Batas hari ini', day: 0, kind: 'wajib' },
  { id: 't4', act: 'Survei Usaha', who: 'Siti Aminah', maj: 'Majelis Anggrek', time: '11.00', loc: 'Warung kelontong', types: ['Acquisition'], meta: null, day: 0, kind: 'wajib' },
  { id: 't5', act: 'Kunjungan Rumah', who: 'Calon mitra — Ibu Darmi', maj: 'Majelis Anggrek', time: '12.00', loc: 'Desa Terucuk', types: ['Acquisition'], meta: null, day: 0, kind: 'wajib' },
  { id: 't6', act: 'Pencairan', who: 'Aura Kasih Asmara', maj: 'Majelis Anggrek', time: '13.00', loc: 'Rp7.000.000', types: ['Disbursement'], meta: 'Menunggu tanda tangan', day: 0, kind: 'wajib' },
  { id: 't7', act: 'Kunjungan Majelis', who: 'Majelis Kenanga', maj: 'Majelis Kenanga', time: '15.00', loc: 'Desa Ngawen', types: ['Collection', 'Attendance'], meta: null, day: 0, kind: 'wajib' },
  { id: 't8', act: 'Kunjungan Rumah', who: 'Sumiyati', maj: 'Majelis Bougenville', time: '16.00', loc: 'Desa Ngawen', types: ['Collection'], meta: 'DPD 35', day: 0, kind: 'wajib' },
  { id: 't9', act: 'Pencairan Ulang', who: 'Endang Susilowati', maj: 'Majelis Mawar', time: '16.30', loc: 'Rp10.000.000', types: ['Disbursement'], meta: null, day: 0, kind: 'wajib' },
  { id: 't10', act: 'Setor Angsuran', who: 'Cabang Terucuk', maj: null, time: '17.00', loc: 'Setoran harian', types: ['Collection'], meta: null, day: 0, kind: 'wajib' },

  { id: 't11', act: 'Tawarkan Agen AmarthaLink', who: 'Sulastri', maj: 'Majelis Teratai', time: 'Belum dijadwalkan', loc: 'Desa Terucuk', types: ['Cross-sell'], meta: 'Usaha aktif, cocok jadi agen', day: 0, kind: 'rekomendasi' },

  { id: 't12', act: 'Kunjungan Majelis', who: 'Majelis Anggrek', maj: 'Majelis Anggrek', time: '08.00', loc: 'Desa Terucuk', types: ['Collection', 'Attendance'], meta: null, day: 1, kind: 'wajib' },
  { id: 't13', act: 'Pencairan', who: 'Darmi Wijayanti', maj: 'Majelis Anggrek', time: '10.00', loc: 'Rp5.500.000', types: ['Disbursement'], meta: null, day: 2, kind: 'wajib' },
  { id: 't14', act: 'Tawarkan Celengan', who: 'Ngatinem', maj: 'Majelis Dahlia', time: 'Belum dijadwalkan', loc: 'Desa Bayat', types: ['Cross-sell'], meta: 'Belum punya produk simpanan', day: 3, kind: 'rekomendasi' },
  { id: 't15', act: 'Tawarkan Top-up Modal', who: 'Andira Damara', maj: 'Majelis Dahlia', time: 'Belum dijadwalkan', loc: 'Desa Bayat', types: ['Disbursement'], meta: 'Riwayat bayar lancar', day: 5, kind: 'rekomendasi' },

  { id: 't16', act: 'Kunjungan Majelis', who: 'Majelis Sakura', maj: 'Majelis Sakura', time: '08.00', loc: 'Desa Terucuk', types: ['Collection', 'Attendance'], meta: null, day: 8, kind: 'wajib' },
  { id: 't17', act: 'Tawarkan Asuransi Mikro', who: 'Painem', maj: 'Majelis Teratai', time: 'Belum dijadwalkan', loc: 'Desa Terucuk', types: ['Cross-sell'], meta: 'Belum punya proteksi', day: 10, kind: 'rekomendasi' },
]

export const TASK_MAJELIS = Array.from(new Set(TASKS.map((t) => t.maj).filter(Boolean))) as string[]

export type WhenFilter = 'today' | 'tomorrow' | 'all'
export type KindFilter = TaskKind | 'all'

export const WHEN_OPTS: { l: string; v: WhenFilter }[] = [
  { l: 'Hari ini', v: 'today' },
  { l: 'Besok', v: 'tomorrow' },
  { l: 'Semua waktu', v: 'all' },
]

export const KIND_OPTS: { l: string; v: KindFilter }[] = [
  { l: 'Wajib', v: 'wajib' },
  { l: 'Rekomendasi', v: 'rekomendasi' },
  { l: 'Semua tugas', v: 'all' },
]

export const inWhen = (day: number, w: WhenFilter) =>
  w === 'today' ? day === 0 : w === 'tomorrow' ? day === 1 : true

export const dayLabel = (d: number) =>
  d === 0 ? 'Hari ini' : d === 1 ? 'Besok' : d <= 6 ? 'Minggu ini' : 'Minggu depan'

// --- Banners ---------------------------------------------------------------
// The source painted each banner with a bespoke linear-gradient. Gradients are
// off-system, so each banner instead carries a token background + its matching
// on-dark text tint.

export interface Banner {
  id: string
  tag: string
  title: string
  sub: string
  bg: string
}

export const BANNERS: Banner[] = [
  { id: 'b1', tag: 'Program', title: 'Insentif Rekrutmen Q3', sub: 'Bonus per mitra aktif baru', bg: 'bg-primary-500' },
  { id: 'b2', tag: 'Fitur baru', title: 'Cek SLIK langsung dari app', sub: 'Tak perlu buka NG-MIS lagi', bg: 'bg-blue-500' },
  { id: 'b3', tag: 'Pengumuman', title: 'Jadwal setoran berubah', sub: 'Berlaku mulai 20 Juli', bg: 'bg-green-600' },
]

// --- Majelis ---------------------------------------------------------------

export type LoanType = 'Group loan' | 'Modal' | 'Hybrid'

interface MajelisSeed {
  n: string
  day: string
  area: string
  cnt: number
  loan: LoanType
  rep: number
  att: number
}

const MAJELIS_BASE: MajelisSeed[] = [
  { n: 'Majelis Melati', day: 'Senin, 07.30', area: 'Desa Terucuk', cnt: 4, loan: 'Group loan', rep: 75, att: 85 },
  { n: 'Majelis Bougenville', day: 'Senin, 09.30', area: 'Desa Ngawen', cnt: 2, loan: 'Group loan', rep: 95, att: 100 },
  { n: 'Majelis Kenanga', day: 'Senin, 15.00', area: 'Desa Ngawen', cnt: 3, loan: 'Group loan', rep: 67, att: 78 },
  { n: 'Majelis Anggrek', day: 'Selasa, 08.00', area: 'Desa Terucuk', cnt: 3, loan: 'Modal', rep: 100, att: 90 },
  { n: 'Majelis Alamanda', day: 'Selasa, 10.00', area: 'Desa Bayat', cnt: 2, loan: 'Group loan', rep: 100, att: 88 },
  { n: 'Majelis Dahlia', day: 'Selasa, 14.00', area: 'Desa Bayat', cnt: 3, loan: 'Hybrid', rep: 100, att: 92 },
  { n: 'Majelis Mawar', day: 'Rabu, 07.30', area: 'Desa Ngawen', cnt: 3, loan: 'Group loan', rep: 67, att: 75 },
  { n: 'Majelis Flamboyan', day: 'Rabu, 10.00', area: 'Desa Terucuk', cnt: 2, loan: 'Modal', rep: 100, att: 95 },
  { n: 'Majelis Teratai', day: 'Rabu, 15.00', area: 'Desa Terucuk', cnt: 3, loan: 'Group loan', rep: 100, att: 88 },
  { n: 'Majelis Kamboja', day: 'Kamis, 07.30', area: 'Desa Bayat', cnt: 2, loan: 'Group loan', rep: 100, att: 90 },
  { n: 'Majelis Kenari', day: 'Kamis, 09.30', area: 'Desa Ngawen', cnt: 2, loan: 'Hybrid', rep: 100, att: 92 },
  { n: 'Majelis Seruni', day: 'Kamis, 14.00', area: 'Desa Ngawen', cnt: 2, loan: 'Group loan', rep: 100, att: 85 },
  { n: 'Majelis Cempaka', day: 'Jumat, 07.30', area: 'Desa Terucuk', cnt: 3, loan: 'Group loan', rep: 67, att: 70 },
  { n: 'Majelis Wijaya', day: 'Jumat, 15.00', area: 'Desa Bayat', cnt: 2, loan: 'Modal', rep: 100, att: 88 },
  { n: 'Majelis Sakura', day: 'Sabtu, 08.00', area: 'Desa Terucuk', cnt: 2, loan: 'Group loan', rep: 100, att: 90 },
]

const STREETS = ['Bango', 'Melati', 'Anggrek', 'Kenanga', 'Mawar', 'Dahlia', 'Wijaya', 'Teratai']

export interface Majelis extends MajelisSeed {
  disb: number
  acq: number
  petugas: string
  lokasi: string
  wa: string
  /** Mitra in this majelis currently past due — filled in once MITRA exists. */
  menunggak: number
  /** Worst DPD among those mitra, 0 when none. */
  worstDpd: number
}

/** Per-majelis volume + detail figures (derived, deterministic). */
export const MAJELIS: Majelis[] = MAJELIS_BASE.map((g, i) => ({
  ...g,
  disb: Math.round(g.cnt * (1.4 + (g.rep % 7) / 10)) * 1000000,
  acq: Math.max(0, Math.round(g.cnt / 3) - (g.rep < 80 ? 1 : 0)),
  petugas: 'Fadhil Maulana',
  lokasi: `Jl. ${STREETS[i % 8]} No. ${10 + (i * 7) % 90}, ${g.area}`,
  wa: `chat.wa/${g.n.toLowerCase().replace(/[^a-z]/g, '')}${(1000 + i * 47) % 10000}`,
  menunggak: 0,
  worstDpd: 0,
}))

// --- Mitra -----------------------------------------------------------------

export type ProductKey = 'celengan' | 'insurance' | 'agent'

export const PRODUCT: Record<ProductKey, { l: string; intent: BadgeIntent }> = {
  celengan: { l: 'Celengan', intent: 'green' },
  insurance: { l: 'Asuransi', intent: 'blue' },
  agent: { l: 'Agen Link', intent: 'primary' },
}

export interface Mitra {
  n: string
  m: string
  p: string
  dpd: number
  prod: ProductKey[]
  pending?: boolean
  ketua?: boolean
  keringanan?: boolean
  autodebit?: string
  pic?: { n: string; phone: string; rel: string }
}

export const MITRA: Mitra[] = [
  { n: 'Rury Ramadhita', m: 'Majelis Melati', p: 'Rp7.000.000', dpd: 0, prod: ['celengan'], ketua: true, autodebit: '17 Okt 2025', pic: { n: 'Dono Sutardi', phone: '0812-3456-7890', rel: 'Suami' } },
  { n: 'Ratna Kanya Herdhitia', m: 'Majelis Melati', p: 'Pengajuan baru', pending: true, dpd: 0, prod: [] },
  { n: 'Wulandari Safitri', m: 'Majelis Melati', p: 'Rp6.500.000', dpd: 0, prod: ['celengan', 'agent'] },
  { n: 'Sukarni', m: 'Majelis Melati', p: 'Rp5.200.000', dpd: 8, prod: [] },

  { n: 'Sumiyati', m: 'Majelis Bougenville', p: 'Rp12.000.000', dpd: 35, prod: ['celengan'], keringanan: true, autodebit: '17 Okt 2025', pic: { n: 'Slamet Riyadi', phone: '0813-2211-9087', rel: 'Suami' } },
  { n: 'Ratmi', m: 'Majelis Bougenville', p: 'Rp4.800.000', dpd: 0, prod: ['insurance'] },

  { n: 'Sri Rahayu', m: 'Majelis Kenanga', p: 'Rp11.000.000', dpd: 5, prod: ['celengan'], keringanan: true },
  { n: 'Nurhayati', m: 'Majelis Kenanga', p: 'Rp4.000.000', dpd: 0, prod: ['celengan'] },
  { n: 'Tuminah', m: 'Majelis Kenanga', p: 'Rp6.000.000', dpd: 2, prod: [] },

  { n: 'Aura Kasih Asmara', m: 'Majelis Anggrek', p: 'Rp7.000.000', dpd: 0, prod: ['celengan', 'insurance'] },
  { n: 'Siti Aminah', m: 'Majelis Anggrek', p: 'Pengajuan baru', pending: true, dpd: 0, prod: [] },
  { n: 'Darmi Wijayanti', m: 'Majelis Anggrek', p: 'Rp5.500.000', dpd: 0, prod: [] },

  { n: 'Retno Palupi', m: 'Majelis Alamanda', p: 'Rp8.000.000', dpd: 0, prod: ['agent'] },
  { n: 'Sriyati', m: 'Majelis Alamanda', p: 'Rp6.200.000', dpd: 0, prod: [] },

  { n: 'Andira Damara', m: 'Majelis Dahlia', p: 'Rp8.500.000', dpd: 0, prod: ['celengan'] },
  { n: 'Ngatinem', m: 'Majelis Dahlia', p: 'Rp3.800.000', dpd: 0, prod: [] },
  { n: 'Suparti', m: 'Majelis Dahlia', p: 'Rp7.200.000', dpd: 0, prod: ['insurance'] },

  { n: 'Hana Amarullah', m: 'Majelis Mawar', p: 'Rp9.000.000', dpd: 2, prod: ['celengan'] },
  { n: 'Endang Susilowati', m: 'Majelis Mawar', p: 'Rp10.000.000', dpd: 1, prod: [] },
  { n: 'Rukmini', m: 'Majelis Mawar', p: 'Rp4.500.000', dpd: 0, prod: ['celengan'] },

  { n: 'Yuni Kartika', m: 'Majelis Flamboyan', p: 'Rp6.000.000', dpd: 0, prod: ['celengan', 'agent'] },
  { n: 'Wagiyem', m: 'Majelis Flamboyan', p: 'Rp5.000.000', dpd: 0, prod: [] },

  { n: 'Annisa Puspa Ningrum', m: 'Majelis Teratai', p: 'Rp9.000.000', dpd: 0, prod: ['insurance'] },
  { n: 'Painem', m: 'Majelis Teratai', p: 'Rp3.500.000', dpd: 0, prod: [] },
  { n: 'Sulastri', m: 'Majelis Teratai', p: 'Rp7.800.000', dpd: 0, prod: ['celengan'] },

  { n: 'Angelika Norma', m: 'Majelis Kamboja', p: 'Rp5.800.000', dpd: 0, prod: [] },
  { n: 'Warsiti', m: 'Majelis Kamboja', p: 'Rp6.400.000', dpd: 0, prod: ['celengan', 'insurance'] },

  { n: 'Marsinah', m: 'Majelis Kenari', p: 'Rp9.500.000', dpd: 0, prod: ['agent'] },
  { n: 'Sarinah', m: 'Majelis Kenari', p: 'Rp4.200.000', dpd: 0, prod: [] },

  { n: 'Kinanti Putri', m: 'Majelis Seruni', p: 'Rp9.000.000', dpd: 0, prod: ['celengan'] },
  { n: 'Sri Wahyuni', m: 'Majelis Seruni', p: 'Rp5.600.000', dpd: 0, prod: [] },

  { n: 'Delia Hermansyah', m: 'Majelis Cempaka', p: 'Rp8.500.000', dpd: 12, prod: [] },
  { n: 'Dwi Lestari', m: 'Majelis Cempaka', p: 'Rp7.000.000', dpd: 0, prod: ['celengan'] },
  { n: 'Sumarni', m: 'Majelis Cempaka', p: 'Rp6.800.000', dpd: 0, prod: [] },

  { n: 'Tri Wahyuni', m: 'Majelis Wijaya', p: 'Rp7.500.000', dpd: 0, prod: ['insurance'] },
  { n: 'Parmi', m: 'Majelis Wijaya', p: 'Rp4.900.000', dpd: 0, prod: [] },

  { n: 'Lastri Handayani', m: 'Majelis Sakura', p: 'Rp5.000.000', dpd: 0, prod: ['celengan', 'agent'] },
  { n: 'Jumiyem', m: 'Majelis Sakura', p: 'Rp6.100.000', dpd: 0, prod: [] },
]

/* Augment MAJELIS with real menunggak count + worst DPD, now that MITRA exists.
   Replaces the abstract "Sehat/Perhatian/Kritis" mood label with a specific,
   actionable fact: how many mitra, and how bad the worst case is. */
MAJELIS.forEach((g) => {
  const late = MITRA.filter((m) => m.m === g.n && !m.pending && m.dpd > 0)
  g.menunggak = late.length
  g.worstDpd = late.length ? Math.max(...late.map((m) => m.dpd)) : 0
})

export const mitraOf = (majelisName: string) => MITRA.filter((m) => m.m === majelisName)

/** Loan status buckets, derived from DPD. */
export const loanStatus = (m: Mitra): { l: string; intent: BadgeIntent } => {
  if (m.pending) return { l: 'Verifikasi', intent: 'blue' }
  if (m.dpd === 0) return { l: 'Lancar', intent: 'green' }
  if (m.dpd <= 7) return { l: 'DPD 1–7', intent: 'orange' }
  if (m.dpd <= 30) return { l: 'DPD 8–30', intent: 'red' }
  return { l: 'DPD 30–60', intent: 'red' }
}

// --- Installments ----------------------------------------------------------

export type InstallmentStatus = 'upcoming' | 'late' | 'ontime'

export interface Installment {
  no: number
  label: string
  amt: number
  status: InstallmentStatus
}

const lateCountFor = (dpd: number) => (dpd === 0 ? 0 : dpd <= 7 ? 1 : dpd <= 30 ? 2 : 3)

/** Derived weekly installment schedule — built from the loan amount + dpd so it
 *  stays consistent with the status badge. Not real repayment data — demo only. */
export const genInstallments = (m: Mitra): Installment[] => {
  const total = parseRp(m.p)
  const n = 6
  const amt = Math.round(total / n / 50000) * 50000
  const late = lateCountFor(m.dpd)
  const today = new Date()
  return Array.from({ length: n }, (_, i) => {
    const idx = n - 1 - i
    const due = new Date(today)
    due.setDate(today.getDate() - idx * 7 + 7)
    const label = due.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
    const isUpcoming = idx === 0
    const isLate = !isUpcoming && idx <= late
    return { no: i + 1, label, amt, status: isUpcoming ? 'upcoming' : isLate ? 'late' : 'ontime' }
  })
}

// --- Recommendations -------------------------------------------------------

export interface Rec {
  id: string
  act: string
  why: string
  types: TaskType[]
}

/** Recommended tasks, derived from a mitra's current state. */
export const recsFor = (m: Mitra): Rec[] => {
  const out: Rec[] = []
  if (m.pending) {
    out.push({ id: `r-slik-${m.n}`, act: 'Verifikasi SLIK', why: 'Pengajuan baru belum diverifikasi', types: ['Acquisition', 'Disbursement'] })
    out.push({ id: `r-survei-${m.n}`, act: 'Survei Usaha', why: 'Wajib sebelum pencairan', types: ['Acquisition'] })
    return out
  }
  if (m.dpd > 0) {
    out.push({ id: `r-tagih-${m.n}`, act: 'Kunjungan Penagihan', why: `Menunggak ${m.dpd} hari`, types: ['Collection'] })
  }
  if (m.dpd === 0) {
    out.push({ id: `r-topup-${m.n}`, act: 'Tawarkan Top-up Modal', why: 'Riwayat bayar lancar', types: ['Disbursement'] })
  }
  if (!m.prod.includes('celengan')) {
    out.push({ id: `r-celengan-${m.n}`, act: 'Tawarkan Celengan', why: 'Belum punya produk simpanan', types: ['Cross-sell'] })
  }
  if (!m.prod.includes('insurance')) {
    out.push({ id: `r-asuransi-${m.n}`, act: 'Tawarkan Asuransi Mikro', why: 'Belum punya proteksi', types: ['Cross-sell'] })
  }
  if (m.dpd === 0 && !m.prod.includes('agent')) {
    out.push({ id: `r-agen-${m.n}`, act: 'Tawarkan Agen AmarthaLink', why: 'Usaha aktif, cocok jadi agen', types: ['Cross-sell'] })
  }
  return out
}

// --- Titip bayar -----------------------------------------------------------
// Cash collected today that must be settled to Amartha via VA.

export const TITIP = {
  total: 'Rp4.850.000',
  va: '8808 1042 5510 3821',
  bank: 'BCA Virtual Account',
  due: 'Hari ini, 17.00',
  target: 'Rp6.200.000',
  pct: 78,
  items: [
    { n: 'Rury Ramadhita', m: 'Majelis Melati', a: 'Rp1.200.000' },
    { n: 'Marsinah', m: 'Majelis Kenari', a: 'Rp900.000' },
    { n: 'Wulandari Safitri', m: 'Majelis Melati', a: 'Rp850.000' },
    { n: 'Nurhayati', m: 'Majelis Kenanga', a: 'Rp750.000' },
    { n: 'Painem', m: 'Majelis Teratai', a: 'Rp600.000' },
    { n: 'Retno Palupi', m: 'Majelis Alamanda', a: 'Rp550.000' },
  ],
}

// --- Majelis metrics -------------------------------------------------------
// Metrics a majelis can be ranked by — one per KPI group.

export type MetricKey = 'rep' | 'att' | 'disb' | 'acq' | 'celengan'

export const METRIC: Record<MetricKey, { l: string; unit: string; get: (g: Majelis) => number }> = {
  rep: { l: 'Repayment', unit: '%', get: (g) => g.rep },
  att: { l: 'Attendance', unit: '%', get: (g) => g.att },
  disb: { l: 'Disbursement', unit: 'rp', get: (g) => g.disb },
  acq: { l: 'Akuisisi', unit: 'mitra', get: (g) => g.acq },
  celengan: {
    l: 'Celengan',
    unit: '%',
    get: (g) => {
      const all = mitraOf(g.n)
      return all.length
        ? Math.round((all.filter((m) => m.prod.includes('celengan')).length / all.length) * 100)
        : 0
    },
  },
}

// --- KPI -------------------------------------------------------------------

export interface KpiRowDef {
  k: string
  n: string
  unit: string
  target: number
  /** Weight toward the score. Boost rows omit it and sit outside the score. */
  w?: number
}

export interface KpiGroupDef {
  n: string
  boost?: string
  rows: KpiRowDef[]
}

export const KPI_DEF: KpiGroupDef[] = [
  {
    n: 'Kualitas portofolio',
    rows: [
      { k: 'dpd0', n: 'Repayment DPD 0', unit: '%', target: 90, w: 30 },
      { k: 'dpd30', n: 'Repayment DPD 1–30', unit: '%', target: 85, w: 20 },
      { k: 'dpd90', n: 'Repayment DPD 31–90 min 1x angsuran', unit: '%', target: 70, w: 10 },
    ],
  },
  {
    n: 'Pertumbuhan',
    rows: [
      { k: 'mitraNew', n: 'Mitra cair baru per bulan', unit: 'mitra', target: 15, w: 20 },
      { k: 'renewal', n: 'Renewal mitra cair per bulan', unit: '%', target: 80, w: 20 },
    ],
  },
  {
    n: 'Insentif tambahan (boost)',
    boost: '+Rp100rb',
    rows: [
      { k: 'celengan', n: 'Mitra saldo Celengan ≥ 50rb', unit: '%', target: 70 },
      { k: 'ppob', n: 'Mitra transaksi PPOB', unit: '%', target: 60 },
    ],
  },
]

/** Maps each KPI group to the task type it drives. */
export const GROUP_TO_TYPE: Record<string, TaskType> = {
  'Kualitas portofolio': 'Collection',
  Pertumbuhan: 'Acquisition',
  'Insentif tambahan (boost)': 'Cross-sell',
}

/** Maps each KPI group to the majelis metric it ranks by. */
export const GROUP_TO_METRIC: Record<string, MetricKey> = {
  'Kualitas portofolio': 'rep',
  Pertumbuhan: 'acq',
  'Insentif tambahan (boost)': 'celengan',
}

export const KPI_PERIODS = ['Juli 2026', 'Juni 2026', 'Mei 2026']

const PERIOD_VALS: Record<string, Record<string, number>> = {
  'Juli 2026': { dpd0: 91, dpd30: 76, dpd90: 62, mitraNew: 12, renewal: 74, celengan: 62, ppob: 44 },
  'Juni 2026': { dpd0: 94, dpd30: 88, dpd90: 78, mitraNew: 16, renewal: 85, celengan: 71, ppob: 58 },
  'Mei 2026': { dpd0: 83, dpd30: 68, dpd90: 55, mitraNew: 9, renewal: 62, celengan: 48, ppob: 32 },
}

const TOTAL_MITRA = 38

/** Bonus bands — score determines the tier, so the two can never disagree. */
const BONUS_TIERS: { min: number; label: string; tone: Tone }[] = [
  { min: 0, label: 'Tanpa bonus', tone: 'off' },
  { min: 70, label: '1–1,25x gaji', tone: 'warn' },
  { min: 85, label: '1,25–1,5x gaji', tone: 'on' },
  { min: 95, label: '1,5x gaji', tone: 'on' },
]

const tierOf = (s: number) => [...BONUS_TIERS].reverse().find((t) => s >= t.min) ?? BONUS_TIERS[0]
const nextTier = (s: number) => BONUS_TIERS.find((t) => t.min > s)

const rateOf = (r: { val: number; target: number }) => r.val / r.target
const toneOf = (r: { val: number; target: number }): Tone => {
  const a = rateOf(r)
  return a >= 1 ? 'on' : a >= 0.7 ? 'warn' : 'off'
}
const pctOf = (r: { val: number; target: number }) => Math.min(rateOf(r), 1) * 100

export interface KpiRow extends KpiRowDef {
  val: number
  tone: Tone
  pct: number
}

export interface KpiGroup extends KpiGroupDef {
  rows: KpiRow[]
  score: number
  tone: Tone
  weight: number
}

export interface KpiView {
  score: number
  tone: Tone
  bonus: string
  next: { min: number; label: string } | undefined
  groups: KpiGroup[]
  totalMitra: number
  totalMajelis: number
}

/** Build the KPI view for a period, optionally narrowed to one majelis. */
export const buildKpi = (period: string, majelis: Majelis | null): KpiView => {
  const v = PERIOD_VALS[period]
  const share = majelis ? majelis.cnt / TOTAL_MITRA : 1

  /* When one majelis is selected, derive metrics from that majelis's own data;
     counts get pro-rated by portfolio share; percentages stay realistic. */
  const vals = { ...v }
  if (majelis) {
    const gap = Math.max(0, 100 - majelis.rep)
    vals.dpd0 = majelis.rep
    vals.dpd30 = Math.max(0, majelis.rep - Math.round(gap * 0.5))
    vals.dpd90 = Math.max(0, majelis.rep - Math.round(gap * 0.8))
    vals.mitraNew = Math.max(1, Math.round(v.mitraNew * share))
    vals.renewal = Math.max(0, Math.round(v.renewal * (majelis.rep / 100)))
    vals.celengan = Math.max(0, Math.round(v.celengan * (majelis.rep / 100)))
    vals.ppob = Math.max(0, Math.round(v.ppob * (majelis.rep / 100)))
  }

  const groups: KpiGroup[] = KPI_DEF.map((g) => {
    const rows: KpiRow[] = g.rows.map((r) => {
      const target =
        majelis && r.unit === 'mitra' ? Math.max(1, Math.round(r.target * share)) : r.target
      const row = { ...r, target, val: vals[r.k] }
      return { ...row, tone: toneOf(row), pct: pctOf(row) }
    })
    /* Group score = weighted attainment within the group.
       Boost rows carry no weight, so that group falls back to a plain average. */
    const wsum = rows.reduce((s, r) => s + (r.w ?? 0), 0)
    const score =
      wsum > 0
        ? Math.round(rows.reduce((s, r) => s + r.pct * (r.w ?? 0), 0) / wsum)
        : Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length)
    const tone: Tone = score >= 95 ? 'on' : score >= 70 ? 'warn' : 'off'
    return { ...g, rows, score, tone, weight: wsum }
  })

  /* Overall score = sum of (attainment x bobot) across all scored rows. Bobot sums to 100. */
  const scored = groups.flatMap((g) => g.rows).filter((r) => (r.w ?? 0) > 0)
  const totalW = scored.reduce((s, r) => s + (r.w ?? 0), 0)
  const score = Math.round(
    scored.reduce((s, r) => s + (r.pct / 100) * (r.w ?? 0), 0) * (100 / totalW),
  )

  return {
    score,
    tone: score >= 95 ? 'on' : score >= 70 ? 'warn' : 'off',
    bonus: tierOf(score).label,
    next: nextTier(score),
    groups,
    totalMitra: majelis ? majelis.cnt : 225,
    totalMajelis: majelis ? 1 : 15,
  }
}

/** Incentive estimate + band table, both keyed off the score. */
export const insentifFor = (score: number) =>
  score >= 95 ? 2100000 : score >= 85 ? 1680000 : score >= 70 ? 1120000 : 0

export const INSENTIF_BANDS: { s: string; v: string; tone: Tone }[] = [
  { s: '95% ke atas', v: rp(2100000), tone: 'on' },
  { s: '85% – 94%', v: rp(1680000), tone: 'on' },
  { s: '70% – 84%', v: rp(1120000), tone: 'warn' },
  { s: 'Di bawah 70%', v: 'Tidak ada insentif', tone: 'off' },
]

// --- Comms -----------------------------------------------------------------

export interface Comm {
  id: string
  tag: string
  title: string
  d: string
  days: number
  body: string
}

export const COMMS: Comm[] = [
  { id: 'c1', tag: 'Program', title: 'Insentif Rekrutmen Q3 sudah dibuka', d: '12 Jul 2026', days: 1, body: 'Setiap mitra aktif baru yang lolos verifikasi dihitung sebagai poin insentif.' },
  { id: 'c2', tag: 'Fitur baru', title: 'Cek SLIK langsung dari A-Partner', d: '9 Jul 2026', days: 4, body: 'Tak perlu lagi membuka NG-MIS untuk pengecekan dasar.' },
  { id: 'c3', tag: 'Pengumuman', title: 'Jadwal setoran cabang berubah', d: '5 Jul 2026', days: 8, body: 'Mulai 20 Juli, setoran diterima sampai pukul 17.00.' },
  { id: 'c4', tag: 'Program', title: 'Pelatihan literasi keuangan mitra', d: '1 Jul 2026', days: 12, body: 'Modul baru tersedia untuk kumpulan majelis mingguan.' },
  { id: 'c5', tag: 'Fitur baru', title: 'Titip bayar kini bisa disetor via VA', d: '24 Jun 2026', days: 19, body: 'Setoran harian tidak perlu lagi datang ke kantor cabang.' },
  { id: 'c6', tag: 'Pengumuman', title: 'Libur nasional 17 Agustus', d: '18 Jun 2026', days: 25, body: 'Tidak ada kumpulan majelis pada tanggal tersebut.' },
  { id: 'c7', tag: 'Program', title: 'Bonus kehadiran kumpulan semester 1', d: '2 Jun 2026', days: 41, body: 'Rekap pencapaian kehadiran akan dikirim ke masing-masing FO.' },
]

export const COMMS_TAGS = ['Program', 'Fitur baru', 'Pengumuman']

// --- Notifications ---------------------------------------------------------

export type NotifType = 'Tugas' | 'Penagihan' | 'Persetujuan' | 'Sistem'

export interface Notif {
  id: string
  type: NotifType
  title: string
  s: string
  days: number
  read: boolean
}

export const NOTIFS_SEED: Notif[] = [
  { id: 'n1', type: 'Persetujuan', title: 'SLIK Ratna Kanya sudah keluar', s: 'Hasil: layak · 10 menit lalu', days: 0, read: false },
  { id: 'n2', type: 'Penagihan', title: '2 mitra Majelis Melati menunggak', s: 'DPD 3 · 1 jam lalu', days: 0, read: false },
  { id: 'n3', type: 'Tugas', title: 'Tugas kunjungan baru ditugaskan', s: 'Hari ini, 07.05', days: 0, read: true },
  { id: 'n4', type: 'Persetujuan', title: 'Pengajuan Sri Rahayu disetujui BM', s: 'Kemarin, 16.40', days: 1, read: true },
  { id: 'n5', type: 'Penagihan', title: 'Sumiyati masuk DPD 30+', s: 'Kemarin, 08.15', days: 1, read: false },
  { id: 'n6', type: 'Sistem', title: 'Titip bayar kemarin sudah terverifikasi', s: '2 hari lalu', days: 2, read: true },
  { id: 'n7', type: 'Tugas', title: 'Jadwal Majelis Kenanga bergeser ke 15.30', s: '5 hari lalu', days: 5, read: true },
  { id: 'n8', type: 'Sistem', title: 'Versi baru A-Partner tersedia', s: '12 hari lalu', days: 12, read: true },
]

export const NOTIF_TYPES: NotifType[] = ['Tugas', 'Penagihan', 'Persetujuan', 'Sistem']

export const NOTIF_BADGE: Record<NotifType, BadgeIntent> = {
  Tugas: 'blue',
  Penagihan: 'red',
  Persetujuan: 'green',
  Sistem: 'neutral',
}

// --- Shared time-window filter ---------------------------------------------

export const TIME_OPTS: { l: string; v: number | null }[] = [
  { l: 'Semua waktu', v: null },
  { l: 'Hari ini', v: 0 },
  { l: '7 hari terakhir', v: 7 },
  { l: '30 hari terakhir', v: 30 },
]

export const inWindow = (days: number, w: number | null) =>
  w === null ? true : w === 0 ? days === 0 : days <= w

// --- Profile ---------------------------------------------------------------

export const FO = {
  name: 'Siti Rahayu',
  initials: 'SR',
  role: 'Field Officer · FO-10482',
  branch: 'Cabang Terucuk, Klaten',
  version: 'A-Partner v2.0.0',
}
