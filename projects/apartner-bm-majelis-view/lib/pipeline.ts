// The Sales pipeline — the BP New Concept lead model, ported into the BM
// direction and given the axis this direction turns on: ASSIGNMENT.
//
// In the BP app a lead is always the one BP's own. Here the Branch Manager runs
// seven BPs, so every lead — and every POI — carries who it is assigned to: one
// of the branch's BPs (`./bp`), or the BM herself. That single field is what the
// Sales roster's new Petugas filter reads, what the card prints under the name,
// and what a POI hands to whoever works it.
//
// The two-level status model is unchanged from the source:
//
//   MAIN status (the funnel)   — how far she is toward a disbursed loan:
//     Interested / Undecided / Not interested → Waiting for KYC → Underwriting
//     → Approved / Rejected → Disbursed. This is what the roster sorts and
//     colours by.
//
//   INTEREST sub-status         — how she feels about it, only while she is
//     still being worked (the three New statuses). Submitted and beyond carry no
//     interest — the decision has left her hands.
//
// Type (Qualified / Unqualified) is NOT a status — it reads whether her data is
// complete (a valid KTP), and is derived, never stored.

import { BUSINESS_PARTNERS, findBP } from './bp'
import { MAJELIS_DIRECTORY, ME } from './schedule'

/** The interest phase — a lead still being worked. */
export type Interest = 'interested' | 'undecided' | 'not-interested'

/**
 * A lead's status — a single flat progression, no sub-states:
 *   Interested / Undecided / Not interested  (New — the BP works her)
 *   → Waiting for KYC   (Invited — the pengajuan is filed, she does self-serve KYC)
 *   → Underwriting ongoing  (Form submitted — the system underwrites)
 *   → Approved / Rejected   (Results)
 *   → Disbursed   (After approved — she is a Mitra)
 */
export type LeadStatus =
  | Interest
  | 'waiting-kyc'
  | 'underwriting'
  | 'approved'
  | 'rejected'
  | 'disbursed'

/** Her type — NOT a status. `qualified` once she has a valid KTP. */
export type LeadType = 'qualified' | 'unqualified'

/** The two loan products a submission picks between. */
export type Product = 'GL' | 'Modal'

/** Where the lead came from. */
export type LeadSource = 'referral' | 'poi'

/** Who referred her — a mitra, or one of the non-mitra kinds. */
export type ReferrerKind = 'mitra' | 'employee' | 'neighbor' | 'friend'

/** Her role in the majelis she joins. `ketua` only for a majelis being formed. */
export type MemberRole = 'anggota' | 'ketua'

export const MEMBER_ROLE_LABEL: Record<MemberRole, string> = {
  anggota: 'Anggota',
  ketua: 'Ketua Majelis',
}

/**
 * Which majelis she joins.
 * - `existing` — an active `MAJELIS_DIRECTORY` group.
 * - `new`      — a majelis being formed; `name` is what it is called.
 * - `none`     — not assigned yet; only her `branch` is fixed.
 */
export type MajelisAssignment =
  | { kind: 'existing'; id: string }
  | { kind: 'new'; name: string }
  | { kind: 'none'; branch: string }

/** How a contact was made. */
export type Channel = 'poi' | 'wa' | 'telepon' | 'manual' | 'system'

/** One recorded contact — the lead's history, oldest first. */
export interface PipelineLog {
  at: string
  via: Channel
  status: LeadStatus
  note?: string
  system?: string
  next?: string
}

// --- Assignment ------------------------------------------------------------
// The axis the BM direction adds. A lead / POI is worked by one of the branch's
// BPs, or by the BM herself (she carries a handful directly). `SELF` is the
// sentinel for "the BM" wherever a BP id would otherwise sit.

export const SELF = 'self'

/** How the assignee reads on a card — the same slot the BP line owns. */
export function assigneeLine(assignedTo: string): string {
  return assignedTo === SELF ? `BM · ${ME.name}` : `BP · ${findBP(assignedTo).name}`
}

/** The assignee's short name, for the picker's current value and detail rows. */
export function assigneeName(assignedTo: string): string {
  return assignedTo === SELF ? 'Saya (BM)' : findBP(assignedTo).name
}

/** The assignee options — the BM, then the seven BPs. Used by picker + filter. */
export const ASSIGNEE_CHOICES: { label: string; value: string }[] = [
  { label: 'Saya (BM)', value: SELF },
  ...BUSINESS_PARTNERS.map((bp) => ({ label: bp.name, value: bp.id })),
]

/** The Petugas filter options — "everyone" plus each assignee. */
export const ASSIGNEE_FILTER_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'Semua petugas', value: null },
  ...ASSIGNEE_CHOICES.map((c) => ({ label: c.label, value: c.value as string | null })),
]

// --- POI --------------------------------------------------------------------
// In the BP app a POI is a bare place-name a lead is tagged with. Here it is a
// first-class thing the BM plans and hands out: a point of interest with an
// area, an assignee, and (once leads are captured there) a count. The lead still
// carries the POI by NAME, so a POI's leads are the ones whose `poi` matches.

/** Which day of the week the sosialisasi runs on, how often, and when the cadence
 *  stops: after a set number of sessions, or once its lead target is reached.
 *  Absent = no schedule. */
export type SosDay = 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu'
export type SosFrequency = 'weekly' | 'biweekly' | 'monthly'
export interface SosialisasiSchedule {
  day: SosDay
  frequency: SosFrequency
  until: { kind: 'count'; count: number } | { kind: 'target' }
}

export const SOS_DAY_ORDER: SosDay[] = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu']
export const SOS_DAY_LABEL: Record<SosDay, string> = {
  senin: 'Senin',
  selasa: 'Selasa',
  rabu: 'Rabu',
  kamis: 'Kamis',
  jumat: 'Jumat',
  sabtu: 'Sabtu',
  minggu: 'Minggu',
}

export const SOS_FREQUENCY_LABEL: Record<SosFrequency, string> = {
  weekly: 'Mingguan',
  biweekly: '2 minggu sekali',
  monthly: 'Bulanan',
}

/** The one-line schedule label — "Senin, Mingguan, sampai 3x", "Rabu, Bulanan,
 *  sampai target penuh", or "Tidak ada jadwal" when unset. */
export function sosialisasiLabel(s?: SosialisasiSchedule): string {
  if (!s) return 'Tidak ada jadwal'
  const until =
    s.until.kind === 'target'
      ? 'sampai target penuh'
      : s.until.count <= 1
        ? '1x'
        : `sampai ${s.until.count}x`
  return `${SOS_DAY_LABEL[s.day]}, ${SOS_FREQUENCY_LABEL[s.frequency]}, ${until}`
}

export interface PointOfInterest {
  id: string
  name: string
  /** Where it is — the line under the name. */
  area: string
  /** Optional stand-in for a dropped map pin (the prototype draws the map). */
  mapsCoord?: string
  /** Who is meant to work it: a BP id, or `SELF`. */
  assignedTo: string
  /** The sosialisasi cadence planned for this POI. Absent = no schedule. */
  sosialisasi?: SosialisasiSchedule
  /** An on-site contact — the person who opens the door. Both optional. */
  contactName?: string
  contactPhone?: string
  /** A photo of the place attached (a boolean stand-in — the prototype draws it). */
  photo?: boolean
  /** Lead target for this POI — the denominator of "capaian/target". */
  target?: number
  /** One line of why this POI is worth a visit. */
  note?: string
}

// --- Lead -------------------------------------------------------------------

export interface PipelineLead {
  id: string
  name: string
  phone: string
  address?: string
  mapsCoord?: string
  source: LeadSource
  /** POI only — the point of interest she was met at (matched by name). */
  poi?: string
  referredBy: string
  referrerKind?: ReferrerKind | null

  /** Her single, flat status. Type (qualified/unqualified) is derived. */
  status: LeadStatus

  /** Who works her: a BP id, or `SELF` (the BM). */
  assignedTo: string

  majelis: MajelisAssignment
  role?: MemberRole
  nik: string
  ktp: boolean

  product: Product | null
  amount: string
  disburseDate: string
  nextFollowUp?: string

  log: PipelineLog[]
}

// --- Vocabulary ------------------------------------------------------------

type BadgeIntent = 'primary' | 'green' | 'yellow' | 'red' | 'blue' | 'orange' | 'neutral'

export const STATUS_META: Record<LeadStatus, { label: string; intent: BadgeIntent; order: number }> = {
  interested: { label: 'Interested', intent: 'green', order: 0 },
  undecided: { label: 'Undecided', intent: 'yellow', order: 1 },
  'not-interested': { label: 'Not interested', intent: 'red', order: 2 },
  'waiting-kyc': { label: 'Waiting for KYC', intent: 'blue', order: 3 },
  underwriting: { label: 'Underwriting ongoing', intent: 'blue', order: 4 },
  approved: { label: 'Approved', intent: 'orange', order: 5 },
  rejected: { label: 'Rejected', intent: 'red', order: 6 },
  disbursed: { label: 'Disbursed', intent: 'green', order: 7 },
}

export const STATUS_ORDER: LeadStatus[] = [
  'interested',
  'undecided',
  'not-interested',
  'waiting-kyc',
  'underwriting',
  'approved',
  'rejected',
  'disbursed',
]

/** The statuses actively worked — the roster's default cut. */
export const ACTIVE_STATUSES: LeadStatus[] = [
  'interested',
  'undecided',
  'not-interested',
  'waiting-kyc',
  'underwriting',
]

export const TYPE_LABEL: Record<LeadType, string> = {
  qualified: 'Qualified',
  unqualified: 'Unqualified',
}

export const TYPE_ORDER: LeadType[] = ['qualified', 'unqualified']

export const INCOMPLETE_LABEL = 'Belum ada KTP'

export const INTEREST_META: Record<
  Interest,
  { label: string; intent: 'green' | 'yellow' | 'red'; hint: string }
> = {
  interested: { label: 'Interested', intent: 'green', hint: 'Follow up dalam 3 hari' },
  undecided: { label: 'Undecided', intent: 'yellow', hint: 'Follow up minimal 1 minggu' },
  'not-interested': { label: 'Not interested', intent: 'red', hint: 'Follow up minimal 1 bulan' },
}

export const INTEREST_ORDER: Interest[] = ['interested', 'undecided', 'not-interested']

export const REASON_OTHER = 'Lainnya'

export const NOT_INTERESTED_REASONS: string[] = [
  'Angsuran terlalu tinggi',
  'Masih ada pinjaman lain',
  'Tidak butuh pinjaman',
  'Tidak diizinkan keluarga',
  REASON_OTHER,
]

export const UNDECIDED_REASONS: string[] = [
  'Perlu diskusi dengan keluarga',
  'Perlu waktu untuk berpikir',
  'Menunggu pinjaman lain selesai',
  REASON_OTHER,
]

export function statusReasons(interest: Interest): string[] | null {
  if (interest === 'not-interested') return NOT_INTERESTED_REASONS
  if (interest === 'undecided') return UNDECIDED_REASONS
  return null
}

export const REASON_TITLE: Partial<Record<Interest, string>> = {
  undecided: 'Kenapa masih ragu?',
  'not-interested': 'Kenapa tidak berminat?',
}

export const CADENCE_DURATION: Record<Interest, string> = {
  interested: '3 hari',
  undecided: '1 minggu',
  'not-interested': '1 bulan',
}

export const SOURCE_LABEL: Record<LeadSource, string> = {
  referral: 'Referral',
  poi: 'POI Visit',
}

export const MITRA_REFERRERS = [
  'Rina Marlina (Majelis Mawar)',
  'Yanti Suryani (Majelis Melati)',
  'Imas Kurniasih (Majelis Kenanga)',
  'Euis Rohaeti (Majelis Dahlia)',
  'Nining Suryani (Majelis Seruni)',
  'Kokom Komariah (Majelis Anggrek)',
]

/** Amartha staff who can refer a prospect — the "Petugas Amartha" branch. */
export const PETUGAS_REFERRERS = [
  ...BUSINESS_PARTNERS.map((bp) => `${bp.name} (${bp.code})`),
  `${ME.name} (BM-2041)`,
]

export const OTHER_REFERRERS: { value: ReferrerKind; label: string }[] = [
  { value: 'employee', label: 'Karyawan Amartha' },
  { value: 'neighbor', label: 'Tetangga' },
  { value: 'friend', label: 'Teman' },
]

export const REFERRER_KIND_LABEL: Record<ReferrerKind, string> = {
  mitra: 'Mitra',
  employee: 'Karyawan Amartha',
  neighbor: 'Tetangga',
  friend: 'Teman',
}

export const CHANNEL_LABEL: Record<Channel, string> = {
  poi: 'POI Visit',
  wa: 'WhatsApp',
  telepon: 'Telepon',
  manual: 'Manual',
  system: 'System',
}

// --- Derivations -----------------------------------------------------------

export const isNew = (status: LeadStatus): boolean =>
  status === 'interested' || status === 'undecided' || status === 'not-interested'

export const isInterest = (status: LeadStatus): status is Interest => isNew(status)

export function leadType(lead: PipelineLead): LeadType {
  return lead.ktp && lead.nik.replace(/\D/g, '').length === 16 ? 'qualified' : 'unqualified'
}

export function statusBadge(lead: PipelineLead): { label: string; intent: BadgeIntent } {
  const meta = STATUS_META[lead.status]
  return { label: meta.label, intent: meta.intent }
}

export function statusAction(lead: PipelineLead): string {
  if (isInterest(lead.status)) return INTEREST_META[lead.status].hint
  switch (lead.status) {
    case 'waiting-kyc':
      return 'Calon mitra KYC mandiri di AFIN — tanpa aksi BP'
    case 'underwriting':
      return 'Sistem sedang underwriting — tanpa aksi BP'
    case 'approved':
      return 'Menunggu pencairan'
    case 'disbursed':
      return 'Perlakukan sebagai Mitra'
    case 'rejected':
      return 'Follow up setelah 6 bulan'
  }
}

export function majelisLine(lead: PipelineLead): string {
  const m = lead.majelis
  if (m.kind === 'existing') return MAJELIS_DIRECTORY.find((g) => g.id === m.id)?.name ?? 'Majelis'
  if (m.kind === 'new') return `${m.name} (Baru)`
  return 'Belum ada majelis'
}

export function sourceDetail(lead: PipelineLead): string {
  if (lead.source === 'poi') return lead.poi ? `POI ${lead.poi}` : 'POI Visit'
  return lead.referredBy ? `Referral · ${lead.referredBy}` : 'Referral'
}

export function majelisDetail(lead: PipelineLead): string {
  return lead.majelis.kind === 'none' ? 'Belum ditentukan' : majelisLine(lead)
}

export function ktpDetail(lead: PipelineLead): string {
  return lead.nik ? lead.nik : 'Belum ada'
}

const TODAY = new Date(2026, 6, 21) // 21 Juli 2026
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const fmtDate = (d: Date): string => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`

export function dateFromToday(days: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() + days)
  return fmtDate(d)
}

export function followUpDateFor(status: Interest): string {
  return dateFromToday(status === 'interested' ? 3 : status === 'undecided' ? 7 : 30)
}

export function rejectedReactivationDate(): string {
  const d = new Date(TODAY)
  d.setMonth(d.getMonth() + 6)
  return fmtDate(d)
}

export function actionDetail(lead: PipelineLead): { title: string; sub?: string } {
  if (isInterest(lead.status)) {
    const date = lead.nextFollowUp ?? followUpDateFor(lead.status)
    const sub = `${CADENCE_DURATION[lead.status]} setelah ${INTEREST_META[lead.status].label.toLowerCase()} di follow-up terakhir`
    return { title: `Follow up · ${date}`, sub }
  }
  switch (lead.status) {
    case 'waiting-kyc':
      return { title: 'Menunggu calon mitra KYC mandiri', sub: 'Calon mitra KYC mandiri di AFIN — tanpa aksi BP' }
    case 'underwriting':
      return { title: 'Underwriting', sub: 'Sistem sedang underwriting — tanpa aksi BP' }
    case 'approved':
      return {
        title: 'Menunggu pencairan',
        sub: lead.disburseDate ? `Perkiraan cair ${lead.disburseDate}` : undefined,
      }
    case 'disbursed':
      return {
        title: 'Sudah cair — jadi Mitra',
        sub: lead.disburseDate ? `Cair ${lead.disburseDate}` : undefined,
      }
    case 'rejected':
      return {
        title: `Follow up · ${rejectedReactivationDate()}`,
        sub: 'Setelah 6 bulan, lead otomatis aktif kembali sebagai Qualified untuk ditawari lagi',
      }
    default:
      return { title: statusAction(lead) }
  }
}

export function historyActivity(entry: PipelineLog, lead: PipelineLead): string {
  if (entry.via === 'poi') return lead.poi ? `POI Visit: ${lead.poi}` : 'POI Visit'
  if (entry.via === 'manual') return 'Manual'
  if (entry.via === 'system') return 'System'
  return 'Follow-up'
}

export function historyStatusLabel(entry: PipelineLog): string {
  return STATUS_META[entry.status].label
}

// --- Filters ---------------------------------------------------------------

export const MAJELIS_FILTER_NONE = '__none__'
const NEW_PREFIX = 'new:'

export const newMajelisFilterValue = (name: string): string => `${NEW_PREFIX}${name}`

export function matchesMajelis(lead: PipelineLead, value: string): boolean {
  const m = lead.majelis
  if (value === MAJELIS_FILTER_NONE) return m.kind === 'none'
  if (value.startsWith(NEW_PREFIX)) return m.kind === 'new' && m.name === value.slice(NEW_PREFIX.length)
  return m.kind === 'existing' && m.id === value
}

// --- Seed: POIs -------------------------------------------------------------
// The points of interest the branch is working, each already handed to someone.
// Warung Bu Ipah is the BM's own (she pre-recorded Bu Ipah before the visit).

export const SEED_POIS: PointOfInterest[] = [
  {
    id: 'poi-ipah',
    name: 'Warung Bu Ipah, Cibeuteung',
    area: 'Jl. Batu Sangkar VII, No.15, Kab. Ciseeng, Jawa Barat',
    mapsCoord: 'pinned',
    assignedTo: SELF,
    sosialisasi: { day: 'senin', frequency: 'weekly', until: { kind: 'count', count: 1 } },
    contactName: 'Ibu Ipah',
    contactPhone: '0813-2245-8890',
    photo: true,
    target: 9,
    note: 'Bu Ipah (pemilik warung) memiliki 8 orang teman yang juga tertarik untuk mengambil pinjaman Amartha.',
  },
  {
    id: 'poi-pasar',
    name: 'Pasar Ciseeng',
    area: 'Ciseeng, Bogor',
    assignedTo: 'bp1',
    sosialisasi: { day: 'selasa', frequency: 'weekly', until: { kind: 'count', count: 3 } },
    target: 15,
    note: 'Ramai hari Selasa & Jumat — pedagang perempuan.',
  },
  {
    id: 'poi-posyandu',
    name: 'Posyandu RW 04',
    area: 'Desa Ciseeng',
    assignedTo: 'bp2',
    sosialisasi: { day: 'rabu', frequency: 'monthly', until: { kind: 'target' } },
    target: 10,
  },
  {
    id: 'poi-balai',
    name: 'Balai Desa Ciseeng',
    area: 'Ciseeng, Bogor',
    assignedTo: 'bp3',
  },
  {
    id: 'poi-taklim',
    name: 'Majelis Taklim Al-Hidayah',
    area: 'Cibeuteung Ilir',
    assignedTo: SELF,
    sosialisasi: { day: 'kamis', frequency: 'biweekly', until: { kind: 'count', count: 2 } },
    note: 'Pengajian rutin Kamis — akses lewat Bu Ustadzah.',
  },
]

/** The POI names — for the source picker and the Sumber filter. */
export const POI_LIST: string[] = SEED_POIS.map((p) => p.name)

// --- Seed: leads ------------------------------------------------------------
// The BP source's leads, each now handed to a BP or kept by the BM.

export const SEED_PIPELINE: PipelineLead[] = [
  {
    id: 'p1',
    name: 'Dewi Anggraeni',
    phone: '0812-8834-6721',
    source: 'poi',
    poi: 'Posyandu RW 04',
    referredBy: '',
    status: 'interested',
    assignedTo: 'bp2',
    majelis: { kind: 'none', branch: 'BP Ciseeng' },
    nik: '',
    ktp: false,
    product: null,
    amount: '',
    disburseDate: '',
    log: [
      { at: '21 Juli', via: 'poi', status: 'interested', note: 'Punya warung sembako, tanya soal modal.' },
    ],
  },
  {
    id: 'pipah',
    name: 'Ibu Ipah',
    phone: '0813-2245-8890',
    source: 'poi',
    poi: 'Warung Bu Ipah, Cibeuteung',
    referredBy: '',
    status: 'interested',
    assignedTo: SELF,
    majelis: { kind: 'new', name: 'Majelis Batu Sangkar' },
    role: 'ketua',
    nik: '',
    ktp: false,
    product: null,
    amount: '',
    disburseDate: '',
    log: [
      {
        at: '20 Juli',
        via: 'manual',
        status: 'interested',
        system: 'Didaftarkan oleh BM',
        note: 'Pemilik warung; punya 8 teman yang juga tertarik.',
      },
    ],
  },
  {
    id: 'p2',
    name: 'Sri Mulyani',
    phone: '0858-7712-2043',
    source: 'poi',
    poi: 'Pasar Ciseeng',
    referredBy: '',
    status: 'undecided',
    assignedTo: 'bp1',
    majelis: { kind: 'none', branch: 'BP Ciseeng' },
    nik: '',
    ktp: false,
    product: null,
    amount: '',
    disburseDate: '',
    nextFollowUp: '27 Jul 2026',
    log: [
      { at: '26 Juni', via: 'poi', status: 'interested' },
      { at: '3 Juli', via: 'telepon', status: 'interested', note: 'Tertarik, tapi tunggu loan dari Mekaar selesai' },
      { at: '10 Juli', via: 'telepon', status: 'undecided', note: 'Mau diskusi dengan suami lagi' },
    ],
  },
  {
    id: 'p3',
    name: 'Halimah',
    phone: '0821-4456-9910',
    source: 'referral',
    referredBy: 'Ibu Yanti (Majelis Kenanga)',
    status: 'not-interested',
    assignedTo: 'bp2',
    majelis: { kind: 'existing', id: 'kenanga' },
    nik: '',
    ktp: false,
    product: null,
    amount: '',
    disburseDate: '',
    log: [
      { at: '13 Juli', via: 'manual', status: 'interested', system: 'Referral dari Ibu Yanti (Majelis Kenanga)' },
      { at: '17 Juli', via: 'telepon', status: 'not-interested', note: 'Masih ada pinjaman lain, keberatan angsuran mingguan.' },
    ],
  },
  {
    id: 'p4',
    name: 'Nia Kurniasih',
    phone: '0813-6612-4408',
    source: 'poi',
    poi: 'Pasar Ciseeng',
    referredBy: '',
    status: 'interested',
    assignedTo: 'bp1',
    majelis: { kind: 'existing', id: 'melati' },
    nik: '3201094507900012',
    ktp: true,
    product: null,
    amount: '',
    disburseDate: '',
    log: [
      { at: '14 Juli', via: 'poi', status: 'interested' },
      { at: '18 Juli', via: 'telepon', status: 'interested', system: 'KTP dilengkapi', note: 'Siap ikut Majelis Melati.' },
    ],
  },
  {
    id: 'p5',
    name: 'Yuyun Wahyuni',
    phone: '0812-3390-5514',
    source: 'referral',
    referredBy: 'Bu Imas (tokoh warga)',
    status: 'undecided',
    assignedTo: SELF,
    majelis: { kind: 'new', name: 'Majelis Cibeuteung' },
    nik: '3201095203910022',
    ktp: true,
    product: null,
    amount: '',
    disburseDate: '',
    log: [
      { at: '15 Juli', via: 'manual', status: 'interested', system: 'Referral dari Bu Imas', note: 'Mau ajak tetangga bikin majelis baru.' },
      { at: '18 Juli', via: 'telepon', status: 'interested', system: 'KTP dilengkapi' },
      { at: '19 Juli', via: 'telepon', status: 'undecided', note: 'Masih menimbang.' },
    ],
  },
  {
    id: 'p6',
    name: 'Euis Komariah',
    phone: '0813-9987-3320',
    source: 'poi',
    poi: 'Balai Desa Ciseeng',
    referredBy: '',
    status: 'waiting-kyc',
    assignedTo: 'bp3',
    majelis: { kind: 'existing', id: 'mawar' },
    nik: '3201094507880002',
    ktp: true,
    product: 'Modal',
    amount: '',
    disburseDate: '',
    log: [
      { at: '14 Juli', via: 'poi', status: 'interested' },
      { at: '16 Juli', via: 'telepon', status: 'interested', system: 'KTP dilengkapi' },
      { at: '20 Juli', via: 'manual', status: 'waiting-kyc', system: 'Produk Modal' },
    ],
  },
  {
    id: 'p7',
    name: 'Rohaya',
    phone: '0857-2290-1188',
    source: 'referral',
    referredBy: 'Ibu Rina Marlina (Majelis Mawar)',
    status: 'approved',
    assignedTo: 'bp3',
    majelis: { kind: 'existing', id: 'mawar' },
    nik: '3201096007920003',
    ktp: true,
    product: 'GL',
    amount: 'Rp2.000.000',
    disburseDate: '24 Juli',
    log: [
      { at: '12 Juli', via: 'manual', status: 'interested', system: 'Referral dari Ibu Rina Marlina (Majelis Mawar)' },
      { at: '15 Juli', via: 'manual', status: 'waiting-kyc', system: 'Produk GL' },
      { at: '16 Juli', via: 'system', status: 'underwriting', system: 'KYC calon mitra selesai, masuk proses underwriting' },
      { at: '19 Juli', via: 'system', status: 'approved', system: 'Lolos underwriting, cair Rp2.000.000 pada 24 Juli' },
    ],
  },
  {
    id: 'p8',
    name: 'Siti Aisyah',
    phone: '0856-1123-8842',
    source: 'referral',
    referredBy: 'Bu Yanti (Majelis Melati)',
    status: 'disbursed',
    assignedTo: 'bp1',
    majelis: { kind: 'existing', id: 'melati' },
    nik: '3201095102900007',
    ktp: true,
    product: 'GL',
    amount: 'Rp2.500.000',
    disburseDate: '18 Juli',
    log: [
      { at: '5 Juli', via: 'manual', status: 'interested', system: 'Referral dari Bu Yanti (Majelis Melati)' },
      { at: '10 Juli', via: 'manual', status: 'waiting-kyc', system: 'Produk GL' },
      { at: '12 Juli', via: 'system', status: 'underwriting', system: 'KYC calon mitra selesai, masuk proses underwriting' },
      { at: '15 Juli', via: 'system', status: 'approved', system: 'Lolos underwriting, cair Rp2.500.000' },
      { at: '18 Juli', via: 'system', status: 'disbursed', system: 'Cair Rp2.500.000, jadi mitra Majelis Melati' },
    ],
  },
  {
    id: 'p9',
    name: 'Wati Ningsih',
    phone: '0819-2278-6605',
    source: 'poi',
    poi: 'Balai Desa Ciseeng',
    referredBy: '',
    status: 'rejected',
    assignedTo: SELF,
    majelis: { kind: 'existing', id: 'dahlia' },
    nik: '3201096003910004',
    ktp: true,
    product: 'Modal',
    amount: '',
    disburseDate: '',
    log: [
      { at: '4 Juli', via: 'poi', status: 'interested' },
      { at: '9 Juli', via: 'manual', status: 'waiting-kyc', system: 'Produk Modal' },
      { at: '11 Juli', via: 'system', status: 'underwriting', system: 'KYC calon mitra selesai, masuk proses underwriting' },
      { at: '15 Juli', via: 'system', status: 'rejected', system: 'Tidak lolos underwriting, skor kredit tidak memenuhi' },
    ],
  },
  {
    id: 'p10',
    name: 'Ratna Sari',
    phone: '0813-4471-9026',
    source: 'referral',
    referredBy: 'Bu Sari (Majelis Melati)',
    status: 'underwriting',
    assignedTo: 'bp1',
    majelis: { kind: 'existing', id: 'melati' },
    nik: '3201094601910005',
    ktp: true,
    product: 'GL',
    amount: '',
    disburseDate: '',
    log: [
      { at: '13 Juli', via: 'manual', status: 'interested', system: 'Referral dari Bu Sari (Majelis Melati)' },
      { at: '17 Juli', via: 'telepon', status: 'interested', system: 'KTP dilengkapi' },
      { at: '19 Juli', via: 'manual', status: 'waiting-kyc', system: 'Produk GL' },
      { at: '21 Juli', via: 'system', status: 'underwriting', system: 'KYC calon mitra selesai, masuk proses underwriting' },
    ],
  },
]
