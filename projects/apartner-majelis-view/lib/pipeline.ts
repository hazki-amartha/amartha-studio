// The Sales pipeline — a two-level status model, per the concept.
//
// A lead carries TWO statuses at once:
//
//   MAIN status (the funnel)   — how far she is toward a disbursed loan:
//     Unqualified → Qualified → Submitted → Approved → Disbursed, with Rejected
//     branching off once a loan is in review. This is what the roster sorts and
//     colours by.
//
//   INTEREST sub-status         — how she feels about it: Interested / Undecided
//     / Not interested. It only means anything while she is still being worked —
//     Unqualified and Qualified — because once a loan is Submitted the decision
//     has left her hands. Submitted and beyond carry no interest.
//
// What the two levels gate is the WORK: interest sets the follow-up cadence
// (3 days / 1 week / 1 month), and the main status sets everything else — when
// KTP is captured (Qualified), when a loan form goes in (Submitted), and when
// there is nothing left to do but wait (Submitted, Approved) or nothing left at
// all (Disbursed → she is a Mitra, Rejected → follow up in 6 months).

import { MAJELIS_DIRECTORY } from './schedule'

/** The funnel. A lead sits at exactly one of these. */
export type MainStatus =
  | 'unqualified'
  | 'qualified'
  | 'submitted'
  | 'approved'
  | 'disbursed'
  | 'rejected'

/** The interest note — only meaningful at Unqualified / Qualified. */
export type Interest = 'interested' | 'undecided' | 'not-interested'

/**
 * The two sub-states of Submitted. Once a loan is filed the process is entirely
 * system-driven with no BP action: the calon mitra does self-serve KYC on AFIN
 * (`kyc`), then the system underwrites (`underwriting`), then the status resolves
 * to Approved or Rejected — all of it logged as "System", not the BP's work.
 */
export type SubmittedStage = 'kyc' | 'underwriting'

/** The two loan products a submission picks between. */
export type Product = 'GL' | 'Modal'

/** Where the lead came from. */
export type LeadSource = 'referral' | 'poi'

/** Who referred her — a mitra, or one of the non-mitra kinds. */
export type ReferrerKind = 'mitra' | 'employee' | 'neighbor' | 'friend'

/**
 * Her role in the majelis she joins. `ketua` (the majelis chair) is only
 * offered for a majelis the BP is forming — an existing group already has one.
 */
export type MemberRole = 'anggota' | 'ketua'

export const MEMBER_ROLE_LABEL: Record<MemberRole, string> = {
  anggota: 'Anggota',
  ketua: 'Ketua Majelis',
}

/**
 * Which majelis she joins.
 * - `existing` — an active `MAJELIS_DIRECTORY` group.
 * - `new`      — a majelis the BP is forming; `name` is what she is calling it.
 * - `none`     — not assigned yet; only her `branch` is fixed.
 */
export type MajelisAssignment =
  | { kind: 'existing'; id: string }
  | { kind: 'new'; name: string }
  | { kind: 'none'; branch: string }

/**
 * How a contact was made. `poi` is the first touch in the field; `manual` is a
 * status update the BP made directly (not from a scheduled follow-up call);
 * `system` is a change the platform made on its own, after Submitted — KYC,
 * underwriting, the Approved / Rejected decision — with no BP action at all.
 */
export type Channel = 'poi' | 'wa' | 'telepon' | 'manual' | 'system'

/** One recorded contact — the lead's history, oldest first. */
export interface PipelineLog {
  at: string
  via: Channel
  /** The main funnel status recorded at this point. */
  status: MainStatus
  /** The interest sub-state, when the status carries one (unqualified/qualified). */
  interest?: Interest
  /** The submitted sub-state, when the status is 'submitted'. */
  stage?: SubmittedStage
  /** Free-text catatan, in the BP's own words. Shown italic, in quotes. */
  note?: string
  /**
   * System-generated detail — product/plafon at submit, the UK result and cair
   * amount at approve/disburse, KTP captured, referral origin. Shown plain.
   */
  system?: string
  /** The follow-up this contact scheduled — the "action selanjutnya" line. */
  next?: string
}

export interface PipelineLead {
  id: string
  name: string
  phone: string
  source: LeadSource
  /** POI only — which point of interest she was met at. */
  poi?: string
  /** Referral only — who sent her. */
  referredBy: string
  /** Referral only — what kind of person the referrer is. */
  referrerKind?: ReferrerKind | null

  status: MainStatus
  /** The interest note. Null once Submitted — the decision has left her hands. */
  interest: Interest | null
  /**
   * Which sub-state of Submitted she is in — set only while `status` is
   * 'submitted', advanced by the system (KYC → underwriting). Undefined for
   * every other status.
   */
  subStatus?: SubmittedStage

  majelis: MajelisAssignment
  /**
   * Her role in that majelis. `ketua` only applies to a `new` majelis; joining
   * an existing group she is always an `anggota`. Undefined reads as `anggota`.
   */
  role?: MemberRole
  /** 16-digit NIK. Present from Qualified onward (the KTP that qualifies her). */
  nik: string
  /** Foto KTP attached. */
  ktp: boolean

  /** The product the loan was submitted under. Null before Submitted. */
  product: Product | null
  /** Disbursement amount — requested at Submit, finalised at Approved. */
  amount: string
  /** When it disburses / disbursed. Set from Approved onward. */
  disburseDate: string
  /** The next follow-up date, set when a call is recorded. */
  nextFollowUp?: string

  log: PipelineLog[]
}

// --- Vocabulary ------------------------------------------------------------

/**
 * Each main status carries its badge intent and a funnel `order` the roster
 * sorts by — the ones the BP still works (Unqualified, Qualified) at the top,
 * the waiting and closed ones below.
 */
export const STATUS_META: Record<
  MainStatus,
  {
    label: string
    intent: 'primary' | 'green' | 'yellow' | 'red' | 'blue' | 'orange' | 'neutral'
    order: number
  }
> = {
  unqualified: { label: 'Unqualified', intent: 'neutral', order: 0 },
  qualified: { label: 'Qualified', intent: 'primary', order: 1 },
  submitted: { label: 'Submitted', intent: 'blue', order: 2 },
  approved: { label: 'Approved', intent: 'orange', order: 3 },
  disbursed: { label: 'Disbursed', intent: 'green', order: 4 },
  rejected: { label: 'Rejected', intent: 'red', order: 5 },
}

export const STATUS_ORDER: MainStatus[] = [
  'unqualified',
  'qualified',
  'submitted',
  'approved',
  'disbursed',
  'rejected',
]

/**
 * The interest note — its label, its colour, and the follow-up cadence it sets.
 * The hint is the "what to do" for a lead still being worked.
 */
export const INTEREST_META: Record<
  Interest,
  { label: string; intent: 'green' | 'yellow' | 'red'; hint: string }
> = {
  interested: { label: 'Interested', intent: 'green', hint: 'Follow up dalam 3 hari' },
  undecided: { label: 'Undecided', intent: 'yellow', hint: 'Follow up minimal 1 minggu' },
  'not-interested': { label: 'Not interested', intent: 'red', hint: 'Follow up minimal 1 bulan' },
}

export const INTEREST_ORDER: Interest[] = ['interested', 'undecided', 'not-interested']

/**
 * The Submitted sub-states — the compact tag shown beside the Submitted badge,
 * and the "action selanjutnya" line, which in both cases says the same thing:
 * the system is handling it and the BP has nothing to do.
 */
export const SUBMITTED_STAGE_META: Record<SubmittedStage, { label: string; action: string }> = {
  kyc: { label: 'Menunggu KYC', action: 'Calon mitra KYC mandiri di AFIN — tanpa aksi BP' },
  underwriting: { label: 'Underwriting', action: 'Sistem sedang underwriting — tanpa aksi BP' },
}

/** The follow-up cadence each interest implies, as a duration phrase. */
export const CADENCE_DURATION: Record<Interest, string> = {
  interested: '3 hari',
  undecided: '1 minggu',
  'not-interested': '1 bulan',
}

export const SOURCE_LABEL: Record<LeadSource, string> = {
  referral: 'Referral',
  poi: 'POI Visit',
}

/** The points of interest a POI Visit lead can be captured at. */
export const POI_LIST = [
  'Pasar Ciseeng',
  'Posyandu RW 04',
  'Balai Desa Ciseeng',
  'Warung Bu Ipah, Cibeuteung',
  'Majelis Taklim Al-Hidayah',
]

/** A short roster of mitra, for the searchable referral picker. */
export const MITRA_REFERRERS = [
  'Rina Marlina (Majelis Mawar)',
  'Yanti Suryani (Majelis Melati)',
  'Imas Kurniasih (Majelis Kenanga)',
  'Euis Rohaeti (Majelis Dahlia)',
  'Nining Suryani (Majelis Seruni)',
  'Kokom Komariah (Majelis Anggrek)',
]

/** The non-mitra referrer kinds — the "Others" branch of the referral picker. */
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

/** Interest only applies while the lead is still the BP's to work. */
export const hasInterest = (status: MainStatus): boolean =>
  status === 'unqualified' || status === 'qualified'

/** The status badge a lead wears — main funnel status, coloured. */
export function statusBadge(lead: PipelineLead): {
  label: string
  intent: 'primary' | 'green' | 'yellow' | 'red' | 'blue' | 'orange' | 'neutral'
} {
  const meta = STATUS_META[lead.status]
  return { label: meta.label, intent: meta.intent }
}

/**
 * The small tag shown beside the badge for a Submitted lead — which system
 * sub-state she is in (Menunggu KYC / Underwriting). Null for every other
 * status; the interest tag takes that slot while she is still being worked.
 */
export function subStateTag(lead: PipelineLead): string | null {
  if (lead.status !== 'submitted' || !lead.subStatus) return null
  return SUBMITTED_STAGE_META[lead.subStatus].label
}

/**
 * The one line of "what to do" for a lead, by status — the concept's action
 * table. Unqualified / Qualified defer to the interest cadence; everything else
 * is a fixed instruction.
 */
export function statusAction(lead: PipelineLead): string {
  switch (lead.status) {
    case 'unqualified':
    case 'qualified':
      return lead.interest ? INTEREST_META[lead.interest].hint : 'Hubungi & catat minat'
    case 'submitted':
      return lead.subStatus
        ? SUBMITTED_STAGE_META[lead.subStatus].action
        : 'Diproses sistem — tanpa aksi BP'
    case 'approved':
      return 'Menunggu pencairan'
    case 'disbursed':
      return 'Perlakukan sebagai Mitra'
    case 'rejected':
      return 'Follow up setelah 6 bulan'
  }
}

/**
 * The one line under her name: which majelis she is bound for. A new majelis
 * reads "Majelis X (Baru)"; an unassigned lead reads "Tanpa majelis" (her branch
 * is not shown — every lead on this surface is already this BP's).
 */
export function majelisLine(lead: PipelineLead): string {
  const m = lead.majelis
  if (m.kind === 'existing') return MAJELIS_DIRECTORY.find((g) => g.id === m.id)?.name ?? 'Majelis'
  if (m.kind === 'new') return `${m.name} (Baru)`
  return 'Tanpa majelis'
}

// --- Detail-row values -----------------------------------------------------
// The three editable rows on the record — source, majelis, KTP — plus the
// "action selanjutnya" line and the follow-up date a recorded call schedules.

export function sourceDetail(lead: PipelineLead): string {
  if (lead.source === 'poi') return lead.poi ? `POI ${lead.poi}` : 'POI Visit'
  return lead.referredBy ? `Referral · ${lead.referredBy}` : 'Referral'
}

/** Like `majelisLine`, but an unassigned lead reads "Belum ditentukan". */
export function majelisDetail(lead: PipelineLead): string {
  return lead.majelis.kind === 'none' ? 'Belum ditentukan' : majelisLine(lead)
}

export function ktpDetail(lead: PipelineLead): string {
  // Once captured, the KTP reads as its number outright — no "Terlampir" prefix.
  return lead.nik ? lead.nik : 'Belum ada'
}

const TODAY = new Date(2026, 6, 21) // 21 Juli 2026
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const fmtDate = (d: Date): string => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`

/** A formatted date `days` after today — for the follow-up date options. */
export function dateFromToday(days: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() + days)
  return fmtDate(d)
}

/** When to come back, by interest: +3 days / +1 week / +1 month from today. */
export function followUpDateFor(interest: Interest): string {
  return dateFromToday(interest === 'interested' ? 3 : interest === 'undecided' ? 7 : 30)
}

/** Six months out — when a rejected lead reactivates. */
export function rejectedReactivationDate(): string {
  const d = new Date(TODAY)
  d.setMonth(d.getMonth() + 6)
  return fmtDate(d)
}

/**
 * The "action selanjutnya" block: a bold headline with the concrete date on top,
 * and a clarifying statement beneath it. What each says depends on the status.
 */
export function actionDetail(lead: PipelineLead): { title: string; sub?: string } {
  if (hasInterest(lead.status)) {
    if (!lead.interest) return { title: 'Hubungi & catat minat' }
    const date = lead.nextFollowUp ?? followUpDateFor(lead.interest)
    // "[duration] setelah [decision] di follow-up terakhir" — why this date.
    const sub = `${CADENCE_DURATION[lead.interest]} setelah ${INTEREST_META[lead.interest].label.toLowerCase()} di follow-up terakhir`
    return { title: `Follow up · ${date}`, sub }
  }
  switch (lead.status) {
    case 'submitted':
      return lead.subStatus
        ? { title: SUBMITTED_STAGE_META[lead.subStatus].label, sub: SUBMITTED_STAGE_META[lead.subStatus].action }
        : { title: 'Diproses sistem', sub: 'Tanpa aksi BP' }
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

/**
 * How a history entry names its activity: a POI Visit (with the place), a
 * manual status update, or a follow-up call.
 */
export function historyActivity(entry: PipelineLog, lead: PipelineLead): string {
  if (entry.via === 'poi') return lead.poi ? `POI Visit: ${lead.poi}` : 'POI Visit'
  if (entry.via === 'manual') return 'Manual'
  // A change the platform made on its own — KYC, underwriting, the decision.
  if (entry.via === 'system') return 'System'
  return 'Follow-up'
}

/**
 * Line 2 of a history card: the main status, plus its sub-state when the status
 * carries one — an interest (Unqualified / Qualified) or a Submitted stage.
 * "Unqualified · Interested", "Submitted · Underwriting", or just "Approved".
 */
export function historyStatusLabel(entry: PipelineLog): string {
  const main = STATUS_META[entry.status].label
  const sub = entry.interest
    ? INTEREST_META[entry.interest].label
    : entry.stage
      ? SUBMITTED_STAGE_META[entry.stage].label
      : null
  return sub ? `${main} · ${sub}` : main
}

// --- Filters ---------------------------------------------------------------

export const MAJELIS_FILTER_NONE = '__none__'
const NEW_PREFIX = 'new:'

/** The filter value for a new majelis, keyed by its name. */
export const newMajelisFilterValue = (name: string): string => `${NEW_PREFIX}${name}`

/** Does this lead pass the chosen majelis filter value? */
export function matchesMajelis(lead: PipelineLead, value: string): boolean {
  const m = lead.majelis
  if (value === MAJELIS_FILTER_NONE) return m.kind === 'none'
  if (value.startsWith(NEW_PREFIX)) return m.kind === 'new' && m.name === value.slice(NEW_PREFIX.length)
  return m.kind === 'existing' && m.id === value
}

// --- Seed ------------------------------------------------------------------
// Leads spanning every main status and, where it applies, every interest —
// plus the three majelis shapes (existing / new / none).

export const SEED_PIPELINE: PipelineLead[] = [
  {
    id: 'p1',
    name: 'Dewi Anggraeni',
    phone: '0812-8834-6721',
    source: 'poi',
    poi: 'Posyandu RW 04',
    referredBy: '',
    status: 'unqualified',
    interest: 'interested',
    majelis: { kind: 'none', branch: 'BP Ciseeng' },
    nik: '',
    ktp: false,
    product: null,
    amount: '',
    disburseDate: '',
    log: [
      { at: '21 Juli', via: 'poi', status: 'unqualified', interest: 'interested', note: 'Punya warung sembako, tanya soal modal.' },
    ],
  },
  {
    id: 'p2',
    name: 'Sri Mulyani',
    phone: '0858-7712-2043',
    source: 'poi',
    poi: 'Pasar Cibeuteung',
    referredBy: '',
    status: 'unqualified',
    interest: 'undecided',
    majelis: { kind: 'none', branch: 'BP Ciseeng' },
    nik: '',
    ktp: false,
    product: null,
    amount: '',
    disburseDate: '',
    nextFollowUp: '27 Jul 2026',
    log: [
      { at: '26 Juni', via: 'poi', status: 'unqualified', interest: 'interested' },
      { at: '3 Juli', via: 'telepon', status: 'unqualified', interest: 'interested', note: 'Tertarik, tapi tunggu loan dari Mekaar selesai' },
      { at: '4 Juli', via: 'manual', status: 'unqualified', interest: 'interested', note: 'Tertarik, tapi tunggu loan dari Mekaar selesai' },
      { at: '20 Juli', via: 'telepon', status: 'unqualified', interest: 'undecided', note: 'Mau diskusi dengan suami lagi' },
    ],
  },
  {
    id: 'p3',
    name: 'Halimah',
    phone: '0821-4456-9910',
    source: 'referral',
    referredBy: 'Ibu Yanti (Majelis Kenanga)',
    status: 'unqualified',
    interest: 'not-interested',
    majelis: { kind: 'existing', id: 'kenanga' },
    nik: '',
    ktp: false,
    product: null,
    amount: '',
    disburseDate: '',
    log: [
      { at: '13 Juli', via: 'manual', status: 'unqualified', interest: 'interested', system: 'Referral dari Ibu Yanti (Majelis Kenanga)' },
      { at: '17 Juli', via: 'telepon', status: 'unqualified', interest: 'not-interested', note: 'Masih ada pinjaman lain, keberatan angsuran mingguan.' },
    ],
  },
  {
    id: 'p4',
    name: 'Nia Kurniasih',
    phone: '0813-6612-4408',
    source: 'poi',
    poi: 'Pasar Ciseeng',
    referredBy: '',
    status: 'qualified',
    interest: 'interested',
    majelis: { kind: 'existing', id: 'melati' },
    nik: '3201094507900012',
    ktp: true,
    product: null,
    amount: '',
    disburseDate: '',
    log: [
      { at: '14 Juli', via: 'poi', status: 'unqualified', interest: 'interested' },
      { at: '18 Juli', via: 'telepon', status: 'qualified', interest: 'interested', system: 'KTP dilengkapi', note: 'Siap ikut Majelis Melati.' },
    ],
  },
  {
    id: 'p5',
    name: 'Yuyun Wahyuni',
    phone: '0812-3390-5514',
    source: 'referral',
    referredBy: 'Bu Imas (tokoh warga)',
    status: 'qualified',
    interest: 'undecided',
    majelis: { kind: 'new', name: 'Majelis Cibeuteung' },
    nik: '3201095203910022',
    ktp: true,
    product: null,
    amount: '',
    disburseDate: '',
    log: [
      { at: '15 Juli', via: 'manual', status: 'unqualified', interest: 'interested', system: 'Referral dari Bu Imas', note: 'Mau ajak tetangga bikin majelis baru.' },
      { at: '18 Juli', via: 'telepon', status: 'qualified', interest: 'interested', system: 'KTP dilengkapi' },
      { at: '19 Juli', via: 'telepon', status: 'qualified', interest: 'undecided', note: 'Masih menimbang.' },
    ],
  },
  {
    id: 'p6',
    name: 'Euis Komariah',
    phone: '0813-9987-3320',
    source: 'poi',
    poi: 'Balai Desa Ciseeng',
    referredBy: '',
    status: 'submitted',
    interest: null,
    subStatus: 'kyc',
    majelis: { kind: 'existing', id: 'mawar' },
    nik: '3201094507880002',
    ktp: true,
    product: 'Modal',
    amount: '',
    disburseDate: '',
    log: [
      { at: '14 Juli', via: 'poi', status: 'unqualified', interest: 'interested' },
      { at: '16 Juli', via: 'telepon', status: 'qualified', interest: 'interested', system: 'KTP dilengkapi' },
      { at: '20 Juli', via: 'manual', status: 'submitted', stage: 'kyc', system: 'Produk Modal' },
    ],
  },
  {
    id: 'p7',
    name: 'Rohaya',
    phone: '0857-2290-1188',
    source: 'referral',
    referredBy: 'Ibu Rina Marlina (Majelis Mawar)',
    status: 'approved',
    interest: null,
    majelis: { kind: 'existing', id: 'mawar' },
    nik: '3201096007920003',
    ktp: true,
    product: 'GL',
    amount: 'Rp2.000.000',
    disburseDate: '24 Juli',
    log: [
      { at: '12 Juli', via: 'manual', status: 'unqualified', interest: 'interested', system: 'Referral dari Ibu Rina Marlina (Majelis Mawar)' },
      { at: '15 Juli', via: 'manual', status: 'submitted', stage: 'kyc', system: 'Produk GL' },
      { at: '16 Juli', via: 'system', status: 'submitted', stage: 'underwriting', system: 'KYC calon mitra selesai, masuk proses underwriting' },
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
    interest: null,
    majelis: { kind: 'existing', id: 'melati' },
    nik: '3201095102900007',
    ktp: true,
    product: 'GL',
    amount: 'Rp2.500.000',
    disburseDate: '18 Juli',
    log: [
      { at: '5 Juli', via: 'manual', status: 'unqualified', interest: 'interested', system: 'Referral dari Bu Yanti (Majelis Melati)' },
      { at: '10 Juli', via: 'manual', status: 'submitted', stage: 'kyc', system: 'Produk GL' },
      { at: '12 Juli', via: 'system', status: 'submitted', stage: 'underwriting', system: 'KYC calon mitra selesai, masuk proses underwriting' },
      { at: '15 Juli', via: 'system', status: 'approved', system: 'Lolos underwriting, cair Rp2.500.000' },
      { at: '18 Juli', via: 'system', status: 'disbursed', system: 'Cair Rp2.500.000, jadi mitra Majelis Melati' },
    ],
  },
  {
    id: 'p9',
    name: 'Wati Ningsih',
    phone: '0819-2278-6605',
    source: 'poi',
    poi: 'Warung Bu Ipah, Cibeuteung',
    referredBy: '',
    status: 'rejected',
    interest: null,
    majelis: { kind: 'existing', id: 'dahlia' },
    nik: '3201096003910004',
    ktp: true,
    product: 'Modal',
    amount: '',
    disburseDate: '',
    log: [
      { at: '4 Juli', via: 'poi', status: 'unqualified', interest: 'interested' },
      { at: '9 Juli', via: 'manual', status: 'submitted', stage: 'kyc', system: 'Produk Modal' },
      { at: '11 Juli', via: 'system', status: 'submitted', stage: 'underwriting', system: 'KYC calon mitra selesai, masuk proses underwriting' },
      { at: '15 Juli', via: 'system', status: 'rejected', system: 'Tidak lolos underwriting, skor kredit tidak memenuhi' },
    ],
  },
  {
    id: 'p10',
    name: 'Ratna Sari',
    phone: '0813-4471-9026',
    source: 'referral',
    referredBy: 'Bu Sari (Majelis Melati)',
    status: 'submitted',
    interest: null,
    subStatus: 'underwriting',
    majelis: { kind: 'existing', id: 'melati' },
    nik: '3201094601910005',
    ktp: true,
    product: 'GL',
    amount: '',
    disburseDate: '',
    log: [
      { at: '13 Juli', via: 'manual', status: 'unqualified', interest: 'interested', system: 'Referral dari Bu Sari (Majelis Melati)' },
      { at: '17 Juli', via: 'telepon', status: 'qualified', interest: 'interested', system: 'KTP dilengkapi' },
      { at: '19 Juli', via: 'manual', status: 'submitted', stage: 'kyc', system: 'Produk GL' },
      { at: '21 Juli', via: 'system', status: 'submitted', stage: 'underwriting', system: 'KYC calon mitra selesai, masuk proses underwriting' },
    ],
  },
]
