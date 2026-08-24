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

/** The two loan products a submission picks between. */
export type Product = 'GL' | 'Modal'

/** Where the lead came from. */
export type LeadSource = 'referral' | 'poi'

/** Who referred her — a mitra, or one of the non-mitra kinds. */
export type ReferrerKind = 'mitra' | 'employee' | 'neighbor' | 'friend'

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

/** How a contact was made. `poi` is the first touch, in the field. */
export type Channel = 'poi' | 'wa' | 'telepon'

/** One recorded contact — the lead's history, oldest first. */
export interface PipelineLog {
  at: string
  via: Channel
  outcome: string
  note: string
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

  majelis: MajelisAssignment
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
      return 'Menunggu hasil Uji Kelayakan (UK)'
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
      return { title: 'Menunggu hasil Uji Kelayakan (UK)' }
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

/** How a history entry names its channel: field visits vs. follow-up calls. */
export const historyChannel = (via: Channel): string => (via === 'poi' ? 'POI Visit' : 'Follow-up')

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
      { at: '21 Juli', via: 'poi', outcome: 'Lead baru dari POI Visit', note: 'Punya warung sembako, tanya soal modal.' },
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
      { at: '3 Juli', via: 'telepon', outcome: 'Interested', note: '', next: '20 Jul 2026' },
      { at: '20 Juli', via: 'telepon', outcome: 'Undecided', note: 'mau bicara dengan suami', next: '27 Jul 2026' },
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
      { at: '17 Juli', via: 'wa', outcome: 'Not interested · masih ada pinjaman lain', note: 'Keberatan angsuran mingguan.' },
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
      { at: '14 Juli', via: 'poi', outcome: 'Lead baru dari POI Visit', note: '' },
      { at: '18 Juli', via: 'telepon', outcome: 'Qualified · KTP dilengkapi', note: 'Siap ikut Majelis Melati.' },
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
      { at: '15 Juli', via: 'poi', outcome: 'Referral dari Bu Imas', note: 'Mau ajak tetangga bikin majelis baru.' },
      { at: '19 Juli', via: 'wa', outcome: 'Qualified · masih menimbang', note: '' },
    ],
  },
  {
    id: 'p6',
    name: 'Euis Komariah',
    phone: '0813-9987-3320',
    source: 'poi',
    referredBy: '',
    status: 'submitted',
    interest: null,
    majelis: { kind: 'existing', id: 'mawar' },
    nik: '3201094507880002',
    ktp: true,
    product: 'Modal',
    amount: 'Rp3.000.000',
    disburseDate: '',
    log: [
      { at: '16 Juli', via: 'telepon', outcome: 'Qualified · data lengkap', note: '' },
      { at: '20 Juli', via: 'telepon', outcome: 'Pengajuan dikirim · menunggu UK', note: 'Produk Modal, plafon Rp3.000.000.' },
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
      { at: '15 Juli', via: 'telepon', outcome: 'Pengajuan dikirim', note: '' },
      { at: '19 Juli', via: 'telepon', outcome: 'Approved · lolos UK', note: 'Cair Rp2.000.000 pada 24 Juli.' },
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
      { at: '10 Juli', via: 'telepon', outcome: 'Pengajuan dikirim', note: '' },
      { at: '18 Juli', via: 'telepon', outcome: 'Disbursed · jadi mitra Majelis Melati', note: 'Cair Rp2.500.000.' },
    ],
  },
  {
    id: 'p9',
    name: 'Wati Ningsih',
    phone: '0819-2278-6605',
    source: 'poi',
    referredBy: '',
    status: 'rejected',
    interest: null,
    majelis: { kind: 'existing', id: 'dahlia' },
    nik: '3201096003910004',
    ktp: true,
    product: 'Modal',
    amount: 'Rp3.000.000',
    disburseDate: '',
    log: [
      { at: '9 Juli', via: 'telepon', outcome: 'Pengajuan dikirim', note: '' },
      { at: '15 Juli', via: 'telepon', outcome: 'Rejected · tidak lolos UK', note: 'Skor kredit tidak memenuhi.' },
    ],
  },
]
