// The Sales pipeline — the new-concept status model that the Sales tab is built
// on. It sits alongside `leads.ts` (the sosialisasi capture flow) rather than
// replacing it: this is the *record* side, every prospect the BP is carrying
// toward a first loan, drawn as one filterable roster.
//
// The pipeline is a straight line of six statuses. A lead moves along it at each
// follow-up; the status IS the next thing the BP has to do about her, which is
// why the roster leads with it.
//
//   Baru            — a fresh lead, never followed up. From a referral or a POI
//                     visit / sosialisasi.
//   Tertarik        — wants in. Can be submitted within 2 days; follow up fast.
//   Belum memutuskan— still weighing it. Follow up after ~1 week.
//   Tidak tertarik  — a no, for now. Follow up after ~1 month.
//   Diajukan        — handed to the BM, being processed. Nothing left for the BP.
//   Selesai         — closed. Either converted to a Mitra (success) or the
//                     pengajuan failed (failed).
//
// Majelis assignment is orthogonal to status (a lead at ANY status can already
// have a majelis): she joins an existing majelis, a new one the BP is forming,
// or none yet — in which case only the branch she falls to is fixed.

import { MAJELIS_DIRECTORY } from './schedule'

export type PipelineStatus =
  | 'baru'
  | 'tertarik'
  | 'belum-memutuskan'
  | 'tidak-tertarik'
  | 'diajukan'
  | 'selesai'

/** Only meaningful when `status` is `selesai`. */
export type SelesaiOutcome = 'success' | 'failed'

/** Where the lead came from. */
export type LeadSource = 'referral' | 'poi'

/**
 * Which majelis she joins — the three shapes the concept calls out.
 * - `existing` — an active `MAJELIS_DIRECTORY` group.
 * - `new`      — a majelis the BP is forming; `name` is what she is calling it.
 * - `none`     — not assigned to any majelis yet; only her `branch` is fixed.
 */
export type MajelisAssignment =
  | { kind: 'existing'; id: string }
  | { kind: 'new'; name: string }
  | { kind: 'none'; branch: string }

/** How a follow-up was made. `poi` is the first touch, in the field. */
export type Channel = 'poi' | 'wa' | 'telepon'

/** One recorded contact — the lead's history, oldest first. */
export interface PipelineLog {
  /** "14 Juli" — the day it happened. */
  at: string
  via: Channel
  /** One line, already phrased for the next person to read it. */
  outcome: string
  note: string
}

export interface PipelineLead {
  id: string
  name: string
  phone: string
  source: LeadSource
  /** Referral only — who sent her. */
  referredBy: string
  status: PipelineStatus
  /** `selesai` only. */
  outcome: SelesaiOutcome | null
  majelis: MajelisAssignment
  /** Resolved date label — "24 Juli". Null when nothing is scheduled. */
  followUpAt: string | null
  /** 16-digit NIK, captured at Ajukan. Empty until then. */
  nik: string
  /** Foto KTP attached. */
  ktp: boolean
  log: PipelineLog[]
}

// --- Vocabulary ------------------------------------------------------------

/**
 * Each status carries its badge intent, so the roster reads by colour before it
 * reads by word. `order` sorts the roster by what needs the BP first: the two
 * live, actionable states up top, closed ones at the bottom.
 */
export const STATUS_META: Record<
  PipelineStatus,
  {
    label: string
    intent: 'primary' | 'green' | 'yellow' | 'red' | 'blue' | 'neutral'
    order: number
  }
> = {
  baru: { label: 'Baru', intent: 'primary', order: 0 },
  tertarik: { label: 'Tertarik', intent: 'green', order: 1 },
  'belum-memutuskan': { label: 'Belum memutuskan', intent: 'yellow', order: 2 },
  'tidak-tertarik': { label: 'Tidak tertarik', intent: 'red', order: 3 },
  diajukan: { label: 'Diajukan', intent: 'blue', order: 4 },
  selesai: { label: 'Selesai', intent: 'neutral', order: 5 },
}

/** The filter's status list, in the order the concept spells out. */
export const STATUS_FILTER_ORDER: PipelineStatus[] = [
  'baru',
  'tidak-tertarik',
  'belum-memutuskan',
  'tertarik',
  'diajukan',
  'selesai',
]

export const SOURCE_LABEL: Record<LeadSource, string> = {
  referral: 'Referral',
  poi: 'POI Visit',
}

export const CHANNEL_LABEL: Record<Channel, string> = {
  poi: 'POI Visit',
  wa: 'WhatsApp',
  telepon: 'Telepon',
}

/**
 * When the next follow-up is due, per status — the rule the concept sets on
 * each state. Shown as a hint on the record so the BP knows when to come back.
 * Only the states a BP still works carry one.
 */
export const FOLLOWUP_HINT: Partial<Record<PipelineStatus, string>> = {
  tertarik: 'Ajukan dalam 2 hari',
  'belum-memutuskan': 'Follow up minimal 1 minggu lagi',
  'tidak-tertarik': 'Follow up minimal 1 bulan lagi',
}

/**
 * What recording a call can change a lead into, per current status — the
 * branches the concept draws off each state. `ajukan` is not a status: it opens
 * the Submit-ke-BM form, which is what moves her to `diajukan`. `diajukan` and
 * `selesai` are absent: once handed to the BM, nothing here is the BP's to do.
 */
export type CallOutcome = PipelineStatus | 'ajukan'

export const CALL_OUTCOMES: Partial<Record<PipelineStatus, { value: CallOutcome; label: string }[]>> = {
  baru: [
    { value: 'tertarik', label: 'Tertarik' },
    { value: 'belum-memutuskan', label: 'Belum memutuskan' },
    { value: 'tidak-tertarik', label: 'Tidak tertarik' },
  ],
  tertarik: [
    { value: 'ajukan', label: 'Ajukan ke BM' },
    { value: 'belum-memutuskan', label: 'Belum memutuskan' },
    { value: 'tidak-tertarik', label: 'Tidak jadi mengajukan' },
  ],
  'belum-memutuskan': [
    { value: 'tertarik', label: 'Tertarik' },
    { value: 'belum-memutuskan', label: 'Masih belum memutuskan' },
    { value: 'tidak-tertarik', label: 'Tidak tertarik' },
  ],
  'tidak-tertarik': [
    { value: 'tertarik', label: 'Tertarik' },
    { value: 'belum-memutuskan', label: 'Belum memutuskan' },
    { value: 'tidak-tertarik', label: 'Masih tidak tertarik' },
  ],
}

/** Whether the BP can still act on a lead in this status. */
export const isActionable = (status: PipelineStatus): boolean =>
  status !== 'diajukan' && status !== 'selesai'

// --- Special majelis-filter values -----------------------------------------
// Beyond each existing group, the majelis filter carries a "Tanpa majelis"
// bucket, and one entry per NEW majelis — listed by its own name so a group the
// BP is still forming filters exactly like an existing one, just marked (Baru).

export const MAJELIS_FILTER_NONE = '__none__'

const NEW_PREFIX = 'new:'

/** The filter value for a new majelis, keyed by its name. */
export const newMajelisFilterValue = (name: string): string => `${NEW_PREFIX}${name}`

// --- Derivations -----------------------------------------------------------

/**
 * The one line under her name: which majelis she is bound for. A new majelis
 * reads as its own name with "(Baru)" beside it — "Majelis Cibeuteung (Baru)" —
 * so it names the group like any other, just marked as still being formed.
 */
export function majelisLine(lead: PipelineLead): string {
  const m = lead.majelis
  if (m.kind === 'existing') {
    return MAJELIS_DIRECTORY.find((g) => g.id === m.id)?.name ?? 'Majelis'
  }
  if (m.kind === 'new') return `${m.name} (Baru)`
  // Branch is intentionally not shown: every lead on this surface already
  // belongs to this BP, so naming her branch on every row says nothing.
  return 'Tanpa majelis'
}

/**
 * The one status badge a lead wears — on her row and at the top of her record.
 * A finished lead reads as its RESULT, one badge: "Berhasil" if she converted,
 * "Gagal" if the pengajuan fell through. Every other status shows its own name.
 */
export function statusBadge(lead: PipelineLead): {
  label: string
  intent: 'primary' | 'green' | 'yellow' | 'red' | 'blue' | 'neutral'
} {
  if (lead.status === 'selesai') {
    return lead.outcome === 'failed'
      ? { label: 'Gagal', intent: 'red' }
      : { label: 'Berhasil', intent: 'green' }
  }
  const meta = STATUS_META[lead.status]
  return { label: meta.label, intent: meta.intent }
}

/** Does this lead pass the chosen majelis filter value? */
export function matchesMajelis(lead: PipelineLead, value: string): boolean {
  const m = lead.majelis
  if (value === MAJELIS_FILTER_NONE) return m.kind === 'none'
  if (value.startsWith(NEW_PREFIX)) return m.kind === 'new' && m.name === value.slice(NEW_PREFIX.length)
  return m.kind === 'existing' && m.id === value
}

// --- Seed ------------------------------------------------------------------
// Nine leads spanning every status and every majelis shape (existing / new /
// none), so the roster and its two filters have something real to sort.

export const SEED_PIPELINE: PipelineLead[] = [
  {
    id: 'p1',
    name: 'Dewi Anggraeni',
    phone: '0812-8834-6721',
    source: 'poi',
    referredBy: '',
    status: 'baru',
    outcome: null,
    majelis: { kind: 'none', branch: 'BP Ciseeng' },
    followUpAt: null,
    nik: '',
    ktp: false,
    log: [
      { at: '21 Juli', via: 'poi', outcome: 'Lead baru dari POI Visit', note: 'Punya warung sembako, tanya soal modal usaha.' },
    ],
  },
  {
    id: 'p2',
    name: 'Rohaya',
    phone: '0857-2290-1188',
    source: 'referral',
    referredBy: 'Ibu Rina Marlina (Majelis Mawar)',
    status: 'baru',
    outcome: null,
    majelis: { kind: 'existing', id: 'mawar' },
    followUpAt: null,
    nik: '',
    ktp: false,
    log: [
      { at: '21 Juli', via: 'poi', outcome: 'Referral dari Bu Rina', note: 'Tetangga Bu Rina, belum sempat dihubungi.' },
    ],
  },
  {
    id: 'p3',
    name: 'Nia Kurniasih',
    phone: '0813-6612-4408',
    source: 'poi',
    referredBy: '',
    status: 'tertarik',
    outcome: null,
    majelis: { kind: 'existing', id: 'melati' },
    followUpAt: '22 Juli',
    nik: '',
    ktp: false,
    log: [
      { at: '14 Juli', via: 'poi', outcome: 'Lead baru dari POI Visit', note: 'Banyak bertanya soal tanggung renteng.' },
      { at: '18 Juli', via: 'telepon', outcome: 'Tertarik · minta diajukan minggu ini', note: 'Siap ikut Majelis Melati.' },
    ],
  },
  {
    id: 'p4',
    name: 'Yuyun Wahyuni',
    phone: '0812-3390-5514',
    source: 'referral',
    referredBy: 'Bu Imas (tokoh warga)',
    status: 'tertarik',
    outcome: null,
    majelis: { kind: 'new', name: 'Majelis Cibeuteung' },
    followUpAt: '23 Juli',
    nik: '',
    ktp: false,
    log: [
      { at: '15 Juli', via: 'poi', outcome: 'Referral dari Bu Imas', note: 'Mau ajak 4 tetangga bikin majelis baru.' },
      { at: '19 Juli', via: 'wa', outcome: 'Tertarik · sedang kumpulkan anggota', note: '' },
    ],
  },
  {
    id: 'p5',
    name: 'Sri Mulyani',
    phone: '0858-7712-2043',
    source: 'poi',
    referredBy: '',
    status: 'belum-memutuskan',
    outcome: null,
    majelis: { kind: 'none', branch: 'BP Ciseeng' },
    followUpAt: '28 Juli',
    nik: '',
    ktp: false,
    log: [
      { at: '14 Juli', via: 'poi', outcome: 'Lead baru dari POI Visit', note: '' },
      { at: '20 Juli', via: 'telepon', outcome: 'Belum memutuskan · mau bicara dengan suami', note: 'Hubungi lagi minggu depan.' },
    ],
  },
  {
    id: 'p6',
    name: 'Halimah',
    phone: '0821-4456-9910',
    source: 'referral',
    referredBy: 'Ibu Yanti (Majelis Kenanga)',
    status: 'tidak-tertarik',
    outcome: null,
    majelis: { kind: 'existing', id: 'kenanga' },
    followUpAt: '21 Agustus',
    nik: '',
    ktp: false,
    log: [
      { at: '13 Juli', via: 'poi', outcome: 'Referral dari Bu Yanti', note: '' },
      { at: '17 Juli', via: 'wa', outcome: 'Tidak tertarik · masih ada pinjaman lain', note: 'Keberatan angsuran mingguan.' },
    ],
  },
  {
    id: 'p7',
    name: 'Euis Komariah',
    phone: '0813-9987-3320',
    source: 'poi',
    referredBy: '',
    status: 'diajukan',
    outcome: null,
    majelis: { kind: 'existing', id: 'mawar' },
    followUpAt: null,
    nik: '3201094507880002',
    ktp: true,
    log: [
      { at: '12 Juli', via: 'poi', outcome: 'Lead baru dari POI Visit', note: '' },
      { at: '16 Juli', via: 'telepon', outcome: 'Tertarik · data dilengkapi', note: '' },
      { at: '20 Juli', via: 'telepon', outcome: 'Diajukan ke BM', note: 'Plafon Rp3.000.000, Majelis Mawar.' },
    ],
  },
  {
    id: 'p8',
    name: 'Siti Aisyah',
    phone: '0856-1123-8842',
    source: 'referral',
    referredBy: 'Bu Yanti (Majelis Melati)',
    status: 'selesai',
    outcome: 'success',
    majelis: { kind: 'existing', id: 'melati' },
    followUpAt: null,
    nik: '3201095102900007',
    ktp: true,
    log: [
      { at: '5 Juli', via: 'poi', outcome: 'Referral dari Bu Yanti', note: '' },
      { at: '10 Juli', via: 'telepon', outcome: 'Diajukan ke BM', note: '' },
      { at: '18 Juli', via: 'telepon', outcome: 'Berhasil · jadi mitra Majelis Melati', note: '' },
    ],
  },
  {
    id: 'p9',
    name: 'Wati Ningsih',
    phone: '0819-2278-6605',
    source: 'poi',
    referredBy: '',
    status: 'selesai',
    outcome: 'failed',
    majelis: { kind: 'existing', id: 'dahlia' },
    followUpAt: null,
    nik: '3201096003910004',
    ktp: true,
    log: [
      { at: '4 Juli', via: 'poi', outcome: 'Lead baru dari POI Visit', note: '' },
      { at: '9 Juli', via: 'telepon', outcome: 'Diajukan ke BM', note: '' },
      { at: '15 Juli', via: 'telepon', outcome: 'Gagal · tidak lolos pengajuan', note: 'Skor kredit tidak memenuhi.' },
    ],
  },
]
