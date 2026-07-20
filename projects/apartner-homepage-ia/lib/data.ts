// Mock data + derivations for the A-Partner IA prototype.
// Ported from the team's standalone JSX draft (apartner-homepage-ia_6). The
// source carries its own hex palette; here every colour is expressed as a
// design-system Badge intent or a token-named class, so the data layer never
// hardcodes a value.

import type { BadgeIntent } from '@/design-system/components'

// --- Tone ------------------------------------------------------------------

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

// --- Formatting --------------------------------------------------------------

export const rp = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID')
export const parseRp = (s: string) => Number(String(s).replace(/[^\d]/g, '')) || 0
export const fmt = (v: number, unit: string) =>
  unit === 'rp' ? rp(v) : unit === '%' ? `${v}%` : `${v}`

/** Small deterministic string hash — drives every "random but stable" derived value below. */
export const hashOf = (s: string) => s.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

// --- Tasks -----------------------------------------------------------------

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
  { id: 't1', act: 'Kunjungan Majelis', who: 'Majelis Melati', maj: 'Majelis Melati', time: '07.30', loc: 'Desa Terucuk', types: ['Collection', 'Attendance'], meta: '1 menunggak · ada renewal', day: 0, kind: 'wajib' },
  { id: 't2', act: 'Kunjungan Rumah', who: 'Sri Rahayu', maj: 'Majelis Kenanga', time: '09.00', loc: 'Desa Ngawen', types: ['Collection'], meta: 'DPD 5', day: 0, kind: 'wajib' },
  { id: 't3', act: 'Verifikasi SLIK', who: 'Ratna Kanya Herdhitia', maj: 'Majelis Melati', time: '09.30', loc: 'Pengajuan baru', types: ['Acquisition', 'Disbursement'], meta: 'Batas hari ini', day: 0, kind: 'wajib' },
  { id: 't4', act: 'Survei Usaha', who: 'Siti Aminah', maj: 'Majelis Anggrek', time: '11.00', loc: 'Warung kelontong', types: ['Acquisition'], meta: null, day: 0, kind: 'wajib' },
  { id: 't5', act: 'Kunjungan Rumah', who: 'Calon mitra — Ibu Darmi', maj: 'Majelis Anggrek', time: '12.00', loc: 'Desa Terucuk', types: ['Acquisition'], meta: null, day: 0, kind: 'wajib' },
  { id: 't6', act: 'Pencairan', who: 'Aura Kasih Asmara', maj: 'Majelis Anggrek', time: '13.00', loc: 'Rp7.000.000', types: ['Disbursement'], meta: 'Menunggu tanda tangan', day: 0, kind: 'wajib' },
  { id: 't7', act: 'Kunjungan Majelis', who: 'Majelis Kenanga', maj: 'Majelis Kenanga', time: '15.00', loc: 'Desa Ngawen', types: ['Collection', 'Attendance'], meta: '2 mitra menunggak', day: 0, kind: 'wajib' },
  { id: 't20', act: 'Kunjungan Majelis', who: 'Majelis Alamanda', maj: 'Majelis Alamanda', time: '10.00', loc: 'Desa Bayat', types: ['Collection', 'Attendance'], meta: 'Ada tawaran Celengan', day: 0, kind: 'wajib' },
  { id: 't8', act: 'Kunjungan Rumah', who: 'Sumiyati', maj: 'Majelis Bougenville', time: '16.00', loc: 'Desa Ngawen', types: ['Collection'], meta: 'DPD 35', day: 0, kind: 'wajib' },
  { id: 't9', act: 'Pencairan Ulang', who: 'Endang Susilowati', maj: 'Majelis Mawar', time: '16.30', loc: 'Rp10.000.000', types: ['Disbursement'], meta: null, day: 0, kind: 'wajib' },
  { id: 't10', act: 'Setor Titip Bayar', who: 'Cabang Terucuk', maj: null, time: '17.00', loc: 'Setoran harian ke VA', types: ['Collection'], meta: 'Belum disetor', day: 0, kind: 'wajib' },
  { id: 't18', act: 'Kunjungan Rumah', who: 'Sukarni', maj: 'Majelis Melati', time: 'PTP 18 Jul', loc: 'Desa Terucuk', types: ['Collection'], meta: 'Janji bayar 18 Jul · Sakit', day: 0, kind: 'wajib' },
  { id: 't19', act: 'Kunjungan Rumah', who: 'Yuliana Rahmawati', maj: 'Majelis Cempaka', time: 'Hari ini', loc: 'Desa Terucuk', types: ['Collection'], meta: 'DPD 72 · eligible Peldis', day: 0, kind: 'wajib' },

  { id: 't11', act: 'Tawarkan Agen AmarthaLink', who: 'Sulastri', maj: 'Majelis Teratai', time: 'Belum dijadwalkan', loc: 'Desa Terucuk', types: ['Cross-sell'], meta: 'Usaha aktif, cocok jadi agen', day: 0, kind: 'rekomendasi' },

  { id: 't12', act: 'Kunjungan Majelis', who: 'Majelis Anggrek', maj: 'Majelis Anggrek', time: '08.00', loc: 'Desa Terucuk', types: ['Collection', 'Attendance'], meta: 'Ada renewal & Celengan', day: 0, kind: 'wajib' },
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

/** Parse a schedule string like "08.00" into minutes; non-times sort last. */
export const timeRank = (t: Task) => {
  const m = /^(\d{1,2})\.(\d{2})$/.exec((t.time || '').trim())
  return m ? Number(m[1]) * 60 + Number(m[2]) : 9999
}

export type TaskSort = 'default' | 'distance'

export const SORT_OPTS: { l: string; v: TaskSort }[] = [
  { l: 'Default (jadwal/waktu)', v: 'default' },
  { l: 'Jarak terdekat', v: 'distance' },
]

/** Deterministic distance (km) from the FO to a task location — demo only. */
export const taskDist = (t: Task) =>
  Math.round((0.3 + (hashOf(String(t.id) + t.who) % 118) / 10) * 10) / 10

// --- Comms / banners ---------------------------------------------------------
// Unread comms surface as banners on Home; read ones live only on the full
// Informasi & Program list. Each tag carries a token background — the source
// painted these with a bespoke linear-gradient, which is off-system here.

export type CommTag = 'Program' | 'Fitur baru' | 'Pengumuman'

export const TAG_BG: Record<CommTag, string> = {
  Program: 'bg-primary-500',
  'Fitur baru': 'bg-blue-500',
  Pengumuman: 'bg-green-600',
}

export interface Comm {
  id: string
  tag: CommTag
  title: string
  sub: string
  d: string
  days: number
  body: string
  read: boolean
}

export const COMMS_SEED: Comm[] = [
  { id: 'c1', tag: 'Program', title: 'Insentif Rekrutmen Q3 sudah dibuka', sub: 'Bonus per mitra aktif baru', d: '12 Jul 2026', days: 1, body: 'Setiap mitra aktif baru yang lolos verifikasi dihitung sebagai poin insentif.', read: false },
  { id: 'c2', tag: 'Fitur baru', title: 'Cek SLIK langsung dari A-Partner', sub: 'Tak perlu buka NG-MIS lagi', d: '9 Jul 2026', days: 4, body: 'Tak perlu lagi membuka NG-MIS untuk pengecekan dasar.', read: false },
  { id: 'c3', tag: 'Pengumuman', title: 'Jadwal setoran cabang berubah', sub: 'Berlaku mulai 20 Juli', d: '5 Jul 2026', days: 8, body: 'Mulai 20 Juli, setoran diterima sampai pukul 17.00.', read: false },
  { id: 'c4', tag: 'Program', title: 'Pelatihan literasi keuangan mitra', sub: 'Modul baru untuk kumpulan', d: '1 Jul 2026', days: 12, body: 'Modul baru tersedia untuk kumpulan majelis mingguan.', read: true },
  { id: 'c5', tag: 'Fitur baru', title: 'Titip bayar kini bisa disetor via VA', sub: 'Tanpa datang ke cabang', d: '24 Jun 2026', days: 19, body: 'Setoran harian tidak perlu lagi datang ke kantor cabang.', read: true },
  { id: 'c6', tag: 'Pengumuman', title: 'Libur nasional 17 Agustus', sub: 'Tidak ada kumpulan', d: '18 Jun 2026', days: 25, body: 'Tidak ada kumpulan majelis pada tanggal tersebut.', read: true },
  { id: 'c7', tag: 'Program', title: 'Bonus kehadiran kumpulan semester 1', sub: 'Rekap dikirim ke FO', d: '2 Jun 2026', days: 41, body: 'Rekap pencapaian kehadiran akan dikirim ke masing-masing FO.', read: true },
]

export const COMMS_TAGS: CommTag[] = ['Program', 'Fitur baru', 'Pengumuman']

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
  /** True for majelis with a kumpulan (group visit) scheduled today. */
  kumpulanToday?: boolean
}

const MAJELIS_BASE: MajelisSeed[] = [
  { n: 'Majelis Melati', day: 'Senin, 07.30', area: 'Desa Terucuk', cnt: 4, loan: 'Group loan', rep: 75, att: 85, kumpulanToday: true },
  { n: 'Majelis Bougenville', day: 'Senin, 09.30', area: 'Desa Ngawen', cnt: 2, loan: 'Group loan', rep: 95, att: 100 },
  { n: 'Majelis Kenanga', day: 'Senin, 15.00', area: 'Desa Ngawen', cnt: 3, loan: 'Group loan', rep: 67, att: 78, kumpulanToday: true },
  { n: 'Majelis Anggrek', day: 'Selasa, 08.00', area: 'Desa Terucuk', cnt: 3, loan: 'Modal', rep: 100, att: 90, kumpulanToday: true },
  { n: 'Majelis Alamanda', day: 'Selasa, 10.00', area: 'Desa Bayat', cnt: 2, loan: 'Group loan', rep: 100, att: 88, kumpulanToday: true },
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
  { n: 'Yuliana Rahmawati', m: 'Majelis Cempaka', p: 'Rp8.000.000', dpd: 72, prod: [], pic: { n: 'Bambang Sujarwo', phone: '0812-9988-1122', rel: 'Suami' } },
  { n: 'Dwi Lestari', m: 'Majelis Cempaka', p: 'Rp7.000.000', dpd: 0, prod: ['celengan'] },
  { n: 'Sumarni', m: 'Majelis Cempaka', p: 'Rp6.800.000', dpd: 0, prod: [] },

  { n: 'Tri Wahyuni', m: 'Majelis Wijaya', p: 'Rp7.500.000', dpd: 0, prod: ['insurance'] },
  { n: 'Parmi', m: 'Majelis Wijaya', p: 'Rp4.900.000', dpd: 0, prod: [] },

  { n: 'Lastri Handayani', m: 'Majelis Sakura', p: 'Rp5.000.000', dpd: 0, prod: ['celengan', 'agent'] },
  { n: 'Jumiyem', m: 'Majelis Sakura', p: 'Rp6.100.000', dpd: 0, prod: [] },
]

/** Back-fill a suami contact for every mitra who doesn't have one yet — pending
 *  mitra excluded (no established relationship on file yet). Deterministic
 *  from her name so it's stable across renders; clearly synthetic data. */
const SUAMI_FIRST = ['Dono', 'Slamet', 'Bambang', 'Agus', 'Wahyu', 'Joko', 'Hendra', 'Sutrisno', 'Eko', 'Dedi', 'Yanto', 'Rahmat']
const SUAMI_LAST = ['Sutardi', 'Riyadi', 'Prasetyo', 'Wibowo', 'Setiawan', 'Kurniawan', 'Santoso', 'Hidayat']
MITRA.forEach((m) => {
  if (m.pending || m.pic) return
  const h = hashOf(m.n)
  const first = SUAMI_FIRST[h % SUAMI_FIRST.length]
  const last = SUAMI_LAST[(h >>> 3) % SUAMI_LAST.length]
  const phone = `08${13 + (h % 6)}-${1000 + (h % 9000)}-${1000 + ((h >>> 5) % 9000)}`
  m.pic = { n: `${first} ${last}`, phone, rel: 'Suami' }
})

/** Augment MAJELIS with real menunggak count + worst DPD, now that MITRA exists. */
MAJELIS.forEach((g) => {
  const late = MITRA.filter((m) => m.m === g.n && !m.pending && m.dpd > 0)
  g.menunggak = late.length
  g.worstDpd = late.length ? Math.max(...late.map((m) => m.dpd)) : 0
})

export const mitraOf = (majelisName: string) => MITRA.filter((m) => m.m === majelisName)

/** Loan status buckets, derived from DPD — matches the KPI page's buckets
 *  (0 / 1–30 / 31–90) plus Pending, so a mitra's badge always agrees with
 *  which KPI tile they'd fall under. */
export const loanStatus = (m: Mitra): { l: string; intent: BadgeIntent } => {
  if (m.pending) return { l: 'Pending', intent: 'blue' }
  if (m.dpd === 0) return { l: 'DPD 0', intent: 'green' }
  if (m.dpd <= 30) return { l: 'DPD 1–30', intent: 'orange' }
  return { l: 'DPD 31–90', intent: 'red' }
}

// --- Installments ------------------------------------------------------------

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

/** Derived per-mitra attendance for the last 6 kumpulan — consistent with her
 *  DPD (a late payer tends to attend less). Demo only, not real records. */
export const genAttendance = (m: Mitra): { label: string; hadir: boolean }[] => {
  const n = 6
  const misses = m.dpd === 0 ? 0 : m.dpd <= 7 ? 1 : m.dpd <= 30 ? 2 : 3
  const today = new Date()
  return Array.from({ length: n }, (_, i) => {
    const idx = n - 1 - i
    const d = new Date(today)
    d.setDate(today.getDate() - idx * 7)
    const label = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
    const hadir = !(idx > 0 && idx <= misses)
    return { label, hadir }
  })
}

export const attendanceRate = (m: Mitra) => {
  const a = genAttendance(m)
  return Math.round((a.filter((x) => x.hadir).length / a.length) * 100)
}

/** Loan snapshot for the majelis-detail mitra cards: total loan, weekly
 *  installment, loan week (of 50), outstanding, and whether this week's
 *  installment is paid. Deterministic from name/dpd; demo only. Loan week
 *  drives the week-40 renewal offer. Some mitra are pinned to week 40 so
 *  renewal is explorable. */
export const RENEWAL_WEEK = 40
const NEAR_RENEWAL = ['Rury Ramadhita', 'Aura Kasih Asmara', 'Hana Amarullah', 'Lastri Handayani']

export interface MitraLoanInfo {
  total: number
  weekly: number
  week: number
  tenor: number
  outstanding: number
  paidThisWeek: boolean
  dpd: number
  nearRenewal: boolean
}

export const mitraLoanInfo = (m: Mitra): MitraLoanInfo => {
  if (m.pending) {
    return { total: 0, weekly: 0, week: 0, tenor: 50, outstanding: 0, paidThisWeek: false, dpd: 0, nearRenewal: false }
  }
  const total = parseRp(m.p)
  const tenor = 50
  const weekly = Math.round(total / tenor / 1000) * 1000
  const week = NEAR_RENEWAL.includes(m.n) ? RENEWAL_WEEK : 8 + (hashOf(m.n) % 28)
  const weeksPaidNominal = week - 1
  const paidThisWeek = m.dpd === 0
  const weeksOutstanding = tenor - weeksPaidNominal + (paidThisWeek ? 0 : 1)
  const outstanding = Math.max(0, weeksOutstanding) * weekly
  return { total, weekly, week, tenor, outstanding, paidThisWeek, dpd: m.dpd, nearRenewal: week >= RENEWAL_WEEK }
}

/** Healthy + no Celengan yet → a Top-up Celengan offer is worth surfacing. */
export const offersCelengan = (m: Mitra) => !m.pending && m.dpd === 0 && !m.prod.includes('celengan')

/** Home address + personal phone for a mitra, derived deterministically from
 *  her name and majelis area. Demo only — real values come from NG-MIS/KYC. */
export const mitraContact = (m: Mitra) => {
  const g = MAJELIS.find((x) => x.n === m.m)
  const area = g ? g.area : 'Desa Terucuk'
  const houseNo = (hashOf(m.n) % 80) + 1
  const rt = ((hashOf(m.n) % 8) + 1).toString().padStart(2, '0')
  const rw = (((hashOf(m.n) >> 3) % 6) + 1).toString().padStart(2, '0')
  const addr = `${area} No. ${houseNo}, RT ${rt}/RW ${rw}`
  const digits = (hashOf(m.n + 'hp') % 100000000).toString().padStart(8, '0')
  const phone = `0857-${digits.slice(0, 4)}-${digits.slice(4)}`
  return { addr, phone }
}

/** Limit-increase outlook. Likelihood is driven by three factors the FO can
 *  actually coach: her repayment, her attendance, and her majelis's collective
 *  repayment rate. It's a PROBABILITY, never a promise — copy stays hedged
 *  ("bisa naik", "berpeluang"), never "akan naik". Ceiling is indicative. */
export interface LimitOutlook {
  current: number
  ceiling: number
  minNext: number
  status: { l: string; tone: Tone }
  factors: { k: string; l: string; ok: boolean; detail: string }[]
}

export const limitOutlook = (m: Mitra, g: Majelis): LimitOutlook => {
  const current = parseRp(m.p)
  const ceiling = Math.round((current * 1.6) / 500000) * 500000
  const minNext = Math.round((current * 1.05) / 100000) * 100000

  const payOk = m.dpd === 0
  const attOk = attendanceRate(m) >= 80
  const majOk = g.rep >= 90
  const strong = [payOk, attOk, majOk].filter(Boolean).length

  const status: { l: string; tone: Tone } =
    strong === 3 ? { l: 'Peluang besar', tone: 'on' } : strong === 2 ? { l: 'Cukup berpeluang', tone: 'warn' } : { l: 'Perlu diperbaiki', tone: 'off' }

  return {
    current,
    ceiling,
    minNext,
    status,
    factors: [
      { k: 'pay', l: 'Pembayaran tepat waktu', ok: payOk, detail: payOk ? 'Tidak ada tunggakan' : `Menunggak ${m.dpd} hari` },
      { k: 'att', l: 'Kehadiran kumpulan', ok: attOk, detail: `${attendanceRate(m)}% hadir (6 sesi terakhir)` },
      { k: 'maj', l: 'Kesehatan majelis', ok: majOk, detail: `Repayment majelis ${g.rep}%` },
    ],
  }
}

// --- Recommendations ---------------------------------------------------------

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

// --- Titip bayar ---------------------------------------------------------
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

// --- Majelis metrics -----------------------------------------------------
// Metrics a majelis can be ranked by — one per KPI parameter group.

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
      return all.length ? Math.round((all.filter((m) => m.prod.includes('celengan')).length / all.length) * 100) : 0
    },
  },
}

// --- PTP (janji bayar) date options ---------------------------------------
// Shared by the majelis-detail payment dialog and the Kunjungan Rumah flow.

export interface PtpOption {
  l: string
  day: number
  date: string
}

export const ptpOptions = (): PtpOption[] =>
  Array.from({ length: 6 }, (_, i) => {
    const day = i + 1
    const d = new Date()
    d.setDate(d.getDate() + day)
    return {
      l: day === 1 ? 'Besok' : d.toLocaleDateString('id-ID', { weekday: 'long' }),
      day,
      date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    }
  })

// --- KPI ---------------------------------------------------------------------
// Flat-Rp model: each parameter is binary — hit the target, earn its full
// rupiah bonus; miss it, earn nothing. Total earned = sum of met parameters.

export interface KpiRowDef {
  k: string
  n: string
  unit: string
  target: number
  /** Mitra count the percentage is computed against — omitted for the two
   *  count-unit rows (mitraNew), which target a raw count instead. */
  base?: number
  baseLabel?: string
  /** Lower-is-better row (DPD buckets past 0). */
  lower?: boolean
  /** Flat Rp bonus earned when this parameter's target is met. */
  bonus: number
}

export const KPI_DEF: KpiRowDef[] = [
  { k: 'dpd0', n: 'Mitra DPD 0', unit: '%', target: 80, base: 225, baseLabel: 'mitra', bonus: 400000 },
  { k: 'dpd30', n: 'Mitra DPD 1–30', unit: '%', target: 15, base: 225, baseLabel: 'mitra', lower: true, bonus: 300000 },
  { k: 'dpd90', n: 'Mitra DPD 31–90', unit: '%', target: 5, base: 225, baseLabel: 'mitra', lower: true, bonus: 200000 },
  { k: 'mitraNew', n: 'Pencairan mitra baru per bulan', unit: 'mitra', target: 15, bonus: 500000 },
  { k: 'renewal', n: 'Pencairan mitra lama per bulan', unit: '%', target: 80, base: 27, baseLabel: 'mitra jatuh tempo', bonus: 500000 },
  { k: 'celengan', n: 'Mitra saldo Celengan', unit: '%', target: 50, base: 225, baseLabel: 'mitra', bonus: 300000 },
  { k: 'ppob', n: 'Mitra transaksi PPOB', unit: '%', target: 50, base: 225, baseLabel: 'mitra', bonus: 300000 },
]

export const KPI_MAX_BONUS = KPI_DEF.reduce((s, r) => s + r.bonus, 0) // Rp2.500.000

/** Maps each KPI parameter to the task type it drives. */
export const PARAM_TO_TYPE: Record<string, TaskType> = {
  dpd0: 'Collection',
  dpd30: 'Collection',
  dpd90: 'Collection',
  mitraNew: 'Acquisition',
  renewal: 'Acquisition',
  celengan: 'Cross-sell',
  ppob: 'Cross-sell',
}

export const KPI_PERIODS = ['Juli 2026', 'Juni 2026', 'Mei 2026']

const PERIOD_VALS: Record<string, Record<string, number>> = {
  'Juli 2026': { dpd0: 82, dpd30: 12, dpd90: 6, mitraNew: 12, renewal: 74, celengan: 62, ppob: 44 },
  'Juni 2026': { dpd0: 88, dpd30: 9, dpd90: 3, mitraNew: 16, renewal: 85, celengan: 71, ppob: 58 },
  'Mei 2026': { dpd0: 76, dpd30: 18, dpd90: 8, mitraNew: 9, renewal: 62, celengan: 48, ppob: 40 },
}

export interface KpiRow extends KpiRowDef {
  val: number
  count: number
  targetCount: number
  met: boolean
  earned: number
  tone: Tone
}

export interface KpiView {
  rows: KpiRow[]
  earned: number
  maxBonus: number
  metCount: number
  totalParams: number
  totalMitra: number
  totalMajelis: number
}

/** Build the KPI view for a period. */
export const buildKpi = (period: string): KpiView => {
  const vals = PERIOD_VALS[period]

  const rows: KpiRow[] = KPI_DEF.map((r) => {
    const val = vals[r.k]
    const count = r.unit === '%' && r.base != null ? Math.round((val / 100) * r.base) : val
    const targetCount = r.unit === '%' && r.base != null ? Math.round((r.target / 100) * r.base) : r.target
    const met = r.lower ? val <= r.target : val >= r.target
    const earned = met ? r.bonus : 0
    return { ...r, val, count, targetCount, met, earned, tone: met ? 'on' : 'off' }
  })

  const earned = rows.reduce((s, r) => s + r.earned, 0)
  const metCount = rows.filter((r) => r.met).length

  return {
    rows,
    earned,
    maxBonus: KPI_MAX_BONUS,
    metCount,
    totalParams: rows.length,
    totalMitra: 225,
    totalMajelis: 15,
  }
}

// --- Notifications -----------------------------------------------------------

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

// --- Profile -----------------------------------------------------------------

export const FO = {
  name: 'Siti Rahayu',
  initials: 'SR',
  role: 'Field Officer · FO-10482',
  branch: 'Cabang Terucuk, Klaten',
  version: 'A-Partner v2.0.0',
}
