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

/** The interest phase — a lead the BP is still working. */
export type Interest = 'interested' | 'undecided' | 'not-interested'

/**
 * A lead's status — a single flat progression, no sub-states:
 *   Interested / Undecided / Not interested  (New — the BP works her)
 *   → Waiting for KYC   (Invited — the pengajuan is filed, she does self-serve KYC)
 *   → Underwriting ongoing  (Form submitted — the system underwrites)
 *   → Approved / Rejected   (Results)
 *   → Disbursed   (After approved — she is a Mitra)
 * Everything from Waiting-KYC on is system-driven; the New statuses are the BP's.
 */
/**
 * A lead's single, flat status — five that move forward and two that stop.
 *
 * The forward five are the funnel: she is written down, she says yes when
 * contacted, a survey is raised for her (by the BP or by herself), it goes in,
 * and it is approved.
 *
 * The two COLD ones are not ends. A "not interested" is a no for now — she goes
 * back to New after a month — and a rejection goes back after six. That is the
 * whole reason they are statuses rather than a deletion: a lead the branch has
 * already met is worth more than a stranger, and the wait is what stops a BP
 * calling her again next Tuesday.
 */
export type LeadStatus =
  | 'new'
  | 'interested'
  | 'survey-created'
  | 'survey-submitted'
  | 'approved'
  | 'not-interested'
  | 'rejected'

/** Who raised the survey — the BP sitting with her, or the mitra on her own phone. */
export type SurveyMode = 'assisted' | 'self'

export const SURVEY_MODE_LABEL: Record<SurveyMode, string> = {
  assisted: 'Assisted',
  self: 'Self-service',
}

/** The two statuses that hold a lead out of the funnel, and for how long. */
export const COLD_STATUSES: LeadStatus[] = ['not-interested', 'rejected']

/** How long a cold status holds before the lead reopens as New. */
export const COLD_WAIT: Partial<Record<LeadStatus, string>> = {
  'not-interested': '1 bulan',
  rejected: '6 bulan',
}

/**
 * Her type — NOT a status. It reads whether her data is complete: `qualified`
 * once she has a valid KTP, `unqualified` while it (or other data) is missing.
 */
export type LeadType = 'qualified' | 'unqualified'

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
  /** The (flat) status recorded at this point. */
  status: LeadStatus
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

/**
 * When a piece of Sales work is due. The Sales page is a schedule before it is a
 * directory: what a BP wants on opening it is what she is doing at 14.00, not an
 * alphabetical roster of everyone she has ever met.
 *
 * `day` is a bucket rather than a date because the list only ever splits two
 * ways — today, and after today. The `when` string is what the card prints.
 */
export type AgendaDay = 'today' | 'upcoming'

export interface Agenda {
  day: AgendaDay
  /** What kind of work it is — "Diproses", "Sosialisasi POI". */
  kind: string
  /** The slot, as the card says it: "14.00", "Tomorrow, 14.00". */
  when: string
  /** Sorts within a day. */
  order: number
}

/** "Diproses - 14.00" — the schedule line at the top of a card. */
export const agendaLine = (a: Agenda): string => `${a.kind} · ${a.when}`

/** "leads age: 3 hari lalu" — how long she has been sitting in the pipeline. */
export function ageLabel(days: number): string {
  if (days <= 0) return 'hari ini'
  if (days === 1) return '1 hari lalu'
  return `${days} hari lalu`
}

/**
 * The aging buckets the filter offers. A lead's age is the one number on the
 * card that gets worse on its own, so it earns a filter of its own: "who has
 * been waiting more than a week" is the question that finds forgotten leads.
 */
export const AGING_BUCKETS: { label: string; value: string; max: number }[] = [
  { label: 'Baru (≤ 3 hari)', value: 'fresh', max: 3 },
  { label: '4–7 hari', value: 'week', max: 7 },
  { label: 'Lebih dari 7 hari', value: 'stale', max: Infinity },
]

export function inAgingBucket(days: number, value: string): boolean {
  if (value === 'fresh') return days <= 3
  if (value === 'week') return days > 3 && days <= 7
  return days > 7
}

export interface PipelineLead {
  id: string
  name: string
  phone: string
  /** Her home address — kecamatan + desa + pin + free text. */
  address?: LeadAddress
  /** The field officer this lead belongs to. */
  fo: string
  /** A photo taken at capture, standing in as evidence the visit happened. */
  photo: boolean
  source: LeadSource
  /** POI only — which point of interest she was met at. */
  poi?: string
  /** Referral only — who sent her. */
  referredBy: string
  /** Referral only — what kind of person the referrer is. */
  referrerKind?: ReferrerKind | null

  /** Her single, flat status. Type (qualified/unqualified) is derived, not stored. */
  status: LeadStatus
  /** Only on `survey-created` — who raised it. */
  surveyMode?: SurveyMode
  /** Days since she was written down. Drives "leads age" and the Aging filter. */
  ageDays: number
  /** When she is due to be worked. Absent means she is not on the schedule. */
  agenda?: Agenda

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

type BadgeIntent = 'primary' | 'green' | 'yellow' | 'red' | 'blue' | 'orange' | 'neutral'

/**
 * Each status carries its badge intent and an `order` the roster sorts by — the
 * ones the BP still works at the top, the system-driven and closed ones below.
 */
/**
 * The label a status wears, and the colour it earns.
 *
 * `full` is the long name from the model ("Contacted: Interested"); `label` is
 * what fits on a card. The card is read at arm's length in a list of ten, so it
 * gets the short one — "Contacted:" is the same word on every row that has it,
 * and a prefix repeated ten times is not information.
 */
export const STATUS_META: Record<
  LeadStatus,
  { label: string; full: string; intent: BadgeIntent; order: number }
> = {
  new: { label: 'New', full: 'New', intent: 'blue', order: 0 },
  interested: { label: 'Interested', full: 'Contacted: Interested', intent: 'green', order: 1 },
  'survey-created': {
    label: 'Survey created',
    full: 'Survey created',
    intent: 'orange',
    order: 2,
  },
  'survey-submitted': {
    label: 'Survey submitted',
    full: 'Survey submitted',
    intent: 'orange',
    order: 3,
  },
  approved: { label: 'Approved', full: 'Approved', intent: 'green', order: 4 },
  'not-interested': {
    label: 'Not interested',
    full: 'Contacted: Not interested',
    intent: 'red',
    order: 5,
  },
  rejected: { label: 'Rejected', full: 'Rejected', intent: 'red', order: 6 },
}

export const STATUS_ORDER: LeadStatus[] = [
  'new',
  'interested',
  'survey-created',
  'survey-submitted',
  'approved',
  'not-interested',
  'rejected',
]

/** The statuses a BP is actively working — the roster's default cut. */
export const ACTIVE_STATUSES: LeadStatus[] = [
  'new',
  'interested',
  'survey-created',
  'survey-submitted',
]

export const TYPE_LABEL: Record<LeadType, string> = {
  qualified: 'Qualified',
  unqualified: 'Unqualified',
}

export const TYPE_ORDER: LeadType[] = ['qualified', 'unqualified']

/** Shown on an unqualified lead's card — her data isn't complete yet. */
export const INCOMPLETE_LABEL = 'Belum ada KTP'

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

// A reason is MANDATORY when a lead lands on Undecided or Not interested — those
// two statuses are the ones a later BP (or the BM) has to act on, and "kenapa"
// is the whole of what makes them actionable. Interested needs none. `Lainnya`
// is always last and opens a free-text field.
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

/** The reason options for a status, or null when no reason is required. */
export function statusReasons(interest: Interest): string[] | null {
  if (interest === 'not-interested') return NOT_INTERESTED_REASONS
  if (interest === 'undecided') return UNDECIDED_REASONS
  return null
}

/** Title for the "why" sheet/section, per the status being recorded. */
export const REASON_TITLE: Partial<Record<Interest, string>> = {
  undecided: 'Kenapa masih ragu?',
  'not-interested': 'Kenapa tidak berminat?',
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

/**
 * Her home address, as the form asks for it: an administrative pair the branch
 * files her under, a pin, and the free text that gets a motorbike to the door.
 *
 * Kecamatan and desa are PICKED, not typed. They are what the branch routes and
 * reports on, and a typed "Ciseeng" that is sometimes "Cisiung" is a lead that
 * quietly leaves the district it belongs to.
 */
export interface LeadAddress {
  kecamatan: string
  desa: string
  /** Kampung / RT / RW — the half of an address no dropdown can hold. */
  detail: string
  /** The pin. Empty until she marks it on the map. */
  mapsCoord: string
}

export const EMPTY_ADDRESS: LeadAddress = { kecamatan: '', desa: '', detail: '', mapsCoord: '' }

/** The desa in each kecamatan the branch covers. */
export const WILAYAH: Record<string, string[]> = {
  Ciseeng: ['Putat Nutug', 'Cibeuteung Udik', 'Karihkil', 'Ciseeng'],
  'Gunung Sindur': ['Pengasinan', 'Curug', 'Cibadung'],
  Parung: ['Iwul', 'Bojong Sempu', 'Waru'],
}

export const KECAMATAN_LIST = Object.keys(WILAYAH)

/** Everything filled in? The lead form requires the whole address. */
export const addressComplete = (a: LeadAddress): boolean =>
  a.kecamatan !== '' && a.desa !== '' && a.mapsCoord !== ''

/** "Kp. Cibeuteung RT 02, Desa Putat Nutug, Kec. Ciseeng" — one readable line. */
export function addressLine(a: LeadAddress | undefined): string {
  if (!a || !a.kecamatan) return ''
  const parts = [a.detail.trim(), `Desa ${a.desa}`, `Kec. ${a.kecamatan}`]
  return parts.filter(Boolean).join(', ')
}

/**
 * The field officers a lead can be assigned to. A lead belongs to a person from
 * the moment it is written down — an unassigned one is a name nobody calls.
 */
export const FIELD_OFFICERS = ['Nurhayati', 'Siti Aminah', 'Dewi Lestari', 'Rina Marlina']

/** Whoever is holding the phone. The default assignee on a new lead. */
export const CURRENT_FO = FIELD_OFFICERS[0]

/** A short roster of mitra, for the searchable referral picker. */
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
  'Sari Handayani (BP-10482)',
  'Rina Marlina (BP-10517)',
  'Ani Suryani (BP-10603)',
  'Dewi Lestari (BP-10644)',
  'Nurhayati (BM-2041)',
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

/**
 * Still the BP's to work by hand — before a survey exists for her. After that
 * the record is the system's, and what she does is chase it rather than edit it.
 */
export const isNew = (status: LeadStatus): boolean =>
  status === 'new' || status === 'interested' || status === 'not-interested'

/** Is this a status the follow-up screen's interest vocabulary covers? */
export const isInterest = (status: LeadStatus): boolean =>
  status === 'interested' || status === 'not-interested'

/**
 * Her type — derived, not stored: qualified once she has a valid KTP, otherwise
 * unqualified (data still incomplete).
 */
export function leadType(lead: PipelineLead): LeadType {
  return lead.ktp && lead.nik.replace(/\D/g, '').length === 16 ? 'qualified' : 'unqualified'
}

/** The status badge a lead wears — her single flat status, coloured. */
export function statusBadge(lead: PipelineLead): { label: string; intent: BadgeIntent } {
  const meta = STATUS_META[lead.status]
  return { label: meta.label, intent: meta.intent }
}

/** The one line of "what to do" for a lead, by status. */
export function statusAction(lead: PipelineLead): string {
  switch (lead.status) {
    case 'new':
      return 'Belum dihubungi — hubungi hari ini'
    case 'interested':
      return INTEREST_META.interested.hint
    case 'survey-created':
      return lead.surveyMode === 'self'
        ? 'Calon mitra mengisi survey sendiri di AFin — pantau'
        : 'Lanjutkan survey bersama calon mitra'
    case 'survey-submitted':
      return 'Survey sudah masuk — menunggu keputusan'
    case 'approved':
      return 'Menunggu pencairan'
    case 'not-interested':
      return `Follow up setelah ${COLD_WAIT['not-interested']}`
    case 'rejected':
      return `Follow up setelah ${COLD_WAIT.rejected}`
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
  return 'Belum ada majelis'
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
export function followUpDateFor(status: Interest): string {
  return dateFromToday(status === 'interested' ? 3 : status === 'undecided' ? 7 : 30)
}

/**
 * When a cold lead comes back to the roster as New — one month after a "not
 * interested", six after a rejection.
 */
export function coldReactivationDate(months: number): string {
  const d = new Date(TODAY)
  d.setMonth(d.getMonth() + months)
  return fmtDate(d)
}

/**
 * The "action selanjutnya" block: a bold headline with the concrete date on top,
 * and a clarifying statement beneath it. What each says depends on the status.
 */
export function actionDetail(lead: PipelineLead): { title: string; sub?: string } {
  if (lead.status === 'interested') {
    const date = lead.nextFollowUp ?? followUpDateFor('interested')
    return {
      title: `Follow up · ${date}`,
      sub: `${CADENCE_DURATION.interested} setelah interested di follow-up terakhir`,
    }
  }
  switch (lead.status) {
    case 'new':
      return { title: 'Hubungi calon mitra', sub: 'Belum pernah dihubungi sejak didata' }
    case 'survey-created':
      return lead.surveyMode === 'self'
        ? {
            title: 'Menunggu calon mitra mengisi survey',
            sub: 'Survey dikirim ke AFin — calon mitra mengisi sendiri',
          }
        : { title: 'Lanjutkan survey', sub: 'Survey dibuat bersama calon mitra (assisted)' }
    case 'survey-submitted':
      return { title: 'Survey sudah masuk', sub: 'Menunggu keputusan — tanpa aksi BP' }
    case 'approved':
      return {
        title: 'Menunggu pencairan',
        sub: lead.disburseDate ? `Perkiraan cair ${lead.disburseDate}` : undefined,
      }
    // The two cold statuses. Neither is an end: the date is when she comes back
    // to the roster as New, and it is on the record so the BP can see that the
    // "no" she is looking at expires.
    case 'not-interested':
      return {
        title: `Aktif kembali · ${coldReactivationDate(1)}`,
        sub: `Setelah ${COLD_WAIT['not-interested']}, lead otomatis kembali jadi New`,
      }
    case 'rejected':
      return {
        title: `Aktif kembali · ${coldReactivationDate(6)}`,
        sub: `Setelah ${COLD_WAIT.rejected}, lead otomatis kembali jadi New`,
      }
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

/** Line 2 of a history card: the (flat) status recorded at that point. */
export function historyStatusLabel(entry: PipelineLog): string {
  return STATUS_META[entry.status].label
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
    fo: 'Nurhayati',
    photo: true,
    address: { kecamatan: 'Ciseeng', desa: 'Cibeuteung Udik', detail: 'Kp. Cibeuteung RT 02/RW 05', mapsCoord: 'pinned' },
    status: 'interested',
    ageDays: 1,
    agenda: { day: 'today', kind: 'Diproses', when: '13.00', order: 2 },
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
  // Pre-recorded by the creator (BM/AM) before the visit — Bu Ipah, the warung
  // owner, is the anchor the sosialisasi is built around. She shows on the
  // Warung Bu Ipah POI leads list from the start (1/9).
  {
    id: 'pipah',
    name: 'Ibu Ipah',
    phone: '0813-2245-8890',
    source: 'poi',
    poi: 'Warung Bu Ipah, Cibeuteung',
    referredBy: '',
    fo: 'Siti Aminah',
    photo: true,
    address: { kecamatan: 'Ciseeng', desa: 'Cibeuteung Udik', detail: 'Warung, Jl. Batu Sangkar VII No.15', mapsCoord: 'pinned' },
    status: 'survey-created',
    surveyMode: 'assisted',
    ageDays: 3,
    agenda: { day: 'today', kind: 'Diproses', when: '14.00', order: 1 },
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
        system: 'Didaftarkan oleh BM/AM',
        note: 'Pemilik warung; punya 8 teman yang juga tertarik.',
      },
    ],
  },
  {
    id: 'p2',
    name: 'Sri Mulyani',
    phone: '0858-7712-2043',
    source: 'poi',
    poi: 'Pasar Cibeuteung',
    referredBy: '',
    fo: 'Nurhayati',
    photo: false,
    status: 'interested',
    ageDays: 12,
    agenda: { day: 'today', kind: 'Follow up', when: '15.30', order: 3 },
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
      { at: '10 Juli', via: 'telepon', status: 'interested', note: 'Mau diskusi dengan suami lagi' },
    ],
  },
  {
    id: 'p3',
    name: 'Halimah',
    phone: '0821-4456-9910',
    source: 'referral',
    referredBy: 'Ibu Yanti (Majelis Kenanga)',
    fo: 'Dewi Lestari',
    photo: true,
    address: { kecamatan: 'Ciseeng', desa: 'Putat Nutug', detail: 'Kp. Nutug RT 01/RW 02', mapsCoord: 'pinned' },
    status: 'not-interested',
    ageDays: 21,
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
    fo: 'Nurhayati',
    photo: true,
    status: 'new',
    ageDays: 2,
    agenda: { day: 'today', kind: 'Diproses', when: '16.00', order: 4 },
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
    fo: 'Rina Marlina',
    photo: false,
    address: { kecamatan: 'Gunung Sindur', desa: 'Pengasinan', detail: 'Kp. Pengasinan RT 04/RW 01', mapsCoord: 'pinned' },
    status: 'interested',
    ageDays: 6,
    agenda: { day: 'upcoming', kind: 'Follow up', when: 'Rabu, 10.00', order: 1 },
    majelis: { kind: 'new', name: 'Majelis Cibeuteung' },
    nik: '3201095203910022',
    ktp: true,
    product: null,
    amount: '',
    disburseDate: '',
    log: [
      { at: '15 Juli', via: 'manual', status: 'interested', system: 'Referral dari Bu Imas', note: 'Mau ajak tetangga bikin majelis baru.' },
      { at: '18 Juli', via: 'telepon', status: 'interested', system: 'KTP dilengkapi' },
      { at: '19 Juli', via: 'telepon', status: 'interested', note: 'Masih menimbang.' },
    ],
  },
  {
    id: 'p6',
    name: 'Euis Komariah',
    phone: '0813-9987-3320',
    source: 'poi',
    poi: 'Balai Desa Ciseeng',
    referredBy: '',
    fo: 'Nurhayati',
    photo: true,
    status: 'survey-created',
    surveyMode: 'self',
    ageDays: 5,
    agenda: { day: 'upcoming', kind: 'Diproses', when: 'Rabu, 13.00', order: 2 },
    majelis: { kind: 'existing', id: 'mawar' },
    nik: '3201094507880002',
    ktp: true,
    product: 'Modal',
    amount: '',
    disburseDate: '',
    log: [
      { at: '14 Juli', via: 'poi', status: 'interested' },
      { at: '16 Juli', via: 'telepon', status: 'interested', system: 'KTP dilengkapi' },
      { at: '20 Juli', via: 'manual', status: 'survey-created', system: 'Produk Modal' },
    ],
  },
  {
    id: 'p7',
    name: 'Rohaya',
    phone: '0857-2290-1188',
    source: 'referral',
    referredBy: 'Ibu Rina Marlina (Majelis Mawar)',
    fo: 'Siti Aminah',
    photo: true,
    status: 'approved',
    ageDays: 18,
    majelis: { kind: 'existing', id: 'mawar' },
    nik: '3201096007920003',
    ktp: true,
    product: 'GL',
    amount: 'Rp2.000.000',
    disburseDate: '24 Juli',
    log: [
      { at: '12 Juli', via: 'manual', status: 'interested', system: 'Referral dari Ibu Rina Marlina (Majelis Mawar)' },
      { at: '15 Juli', via: 'manual', status: 'survey-created', system: 'Produk GL' },
      { at: '16 Juli', via: 'system', status: 'survey-submitted', system: 'KYC calon mitra selesai, masuk proses underwriting' },
      { at: '19 Juli', via: 'system', status: 'approved', system: 'Lolos underwriting, cair Rp2.000.000 pada 24 Juli' },
    ],
  },
  {
    id: 'p8',
    name: 'Siti Aisyah',
    phone: '0856-1123-8842',
    source: 'referral',
    referredBy: 'Bu Yanti (Majelis Melati)',
    fo: 'Nurhayati',
    photo: false,
    status: 'approved',
    ageDays: 24,
    majelis: { kind: 'existing', id: 'melati' },
    nik: '3201095102900007',
    ktp: true,
    product: 'GL',
    amount: 'Rp2.500.000',
    disburseDate: '18 Juli',
    log: [
      { at: '5 Juli', via: 'manual', status: 'interested', system: 'Referral dari Bu Yanti (Majelis Melati)' },
      { at: '10 Juli', via: 'manual', status: 'survey-created', system: 'Produk GL' },
      { at: '12 Juli', via: 'system', status: 'survey-submitted', system: 'KYC calon mitra selesai, masuk proses underwriting' },
      { at: '15 Juli', via: 'system', status: 'approved', system: 'Lolos underwriting, cair Rp2.500.000' },
      { at: '18 Juli', via: 'system', status: 'approved', system: 'Cair Rp2.500.000, jadi mitra Majelis Melati' },
    ],
  },
  {
    id: 'p9',
    name: 'Wati Ningsih',
    phone: '0819-2278-6605',
    source: 'poi',
    poi: 'Balai Desa Ciseeng',
    referredBy: '',
    fo: 'Dewi Lestari',
    photo: true,
    status: 'rejected',
    ageDays: 30,
    majelis: { kind: 'existing', id: 'dahlia' },
    nik: '3201096003910004',
    ktp: true,
    product: 'Modal',
    amount: '',
    disburseDate: '',
    log: [
      { at: '4 Juli', via: 'poi', status: 'interested' },
      { at: '9 Juli', via: 'manual', status: 'survey-created', system: 'Produk Modal' },
      { at: '11 Juli', via: 'system', status: 'survey-submitted', system: 'KYC calon mitra selesai, masuk proses underwriting' },
      { at: '15 Juli', via: 'system', status: 'rejected', system: 'Tidak lolos underwriting, skor kredit tidak memenuhi' },
    ],
  },
  {
    id: 'p10',
    name: 'Ratna Sari',
    phone: '0813-4471-9026',
    source: 'referral',
    referredBy: 'Bu Sari (Majelis Melati)',
    fo: 'Nurhayati',
    photo: true,
    status: 'survey-submitted',
    ageDays: 9,
    agenda: { day: 'upcoming', kind: 'Diproses', when: 'Kamis, 09.00', order: 3 },
    majelis: { kind: 'existing', id: 'melati' },
    nik: '3201094601910005',
    ktp: true,
    product: 'GL',
    amount: '',
    disburseDate: '',
    log: [
      { at: '13 Juli', via: 'manual', status: 'interested', system: 'Referral dari Bu Sari (Majelis Melati)' },
      { at: '17 Juli', via: 'telepon', status: 'interested', system: 'KTP dilengkapi' },
      { at: '19 Juli', via: 'manual', status: 'survey-created', system: 'Produk GL' },
      { at: '21 Juli', via: 'system', status: 'survey-submitted', system: 'KYC calon mitra selesai, masuk proses underwriting' },
    ],
  },
]
