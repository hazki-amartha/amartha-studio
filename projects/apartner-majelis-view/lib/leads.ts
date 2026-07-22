// The NTB side of the day: prospects, and the two tasks that move them.
//
// Kept apart from `data.ts` for the same reason `schedule.ts` is — that file is
// the ledger of women who ALREADY borrow, and a lead is precisely someone who
// does not yet. She has no majelis, no plafon, no week strip; what she has is a
// name, a number, and how interested she sounded. Modelling her as a Mitra with
// empty fields would have every collection screen quietly ready to bill her.
//
// Two tiers of capture, and the split is the design (see NOTES):
//
//   QUICK — nama, WA, sumber, minat, kapan dihubungi lagi. What a BP can take
//           from someone standing in front of her while nine other women wait.
//   LENGKAP — alamat, majelis tujuan, pinjaman lain. Facts that decide whether
//           she can be submitted at all, and that nobody answers honestly in a
//           crowded warung. Filled on her record page, usually at follow-up.
//
// The count on a sosialisasi task ("4/10 leads") counts the QUICK tier. A name
// and a number is a lead; the rest is homework.

import type { DayKey } from './schedule'

export type LeadSource = 'sosialisasi' | 'referral'

/** Who sent her. Only meaningful when `source` is `referral`. */
export type ReferralKind = 'mitra' | 'keluarga' | 'non-mitra' | 'tokoh'

/**
 * How interested she sounded, in the BP's judgement. Deliberately four levels
 * and not a score: a BP grades a conversation, she does not measure it, and a
 * 1–10 slider would produce numbers nobody can defend a week later.
 */
export type Interest = 'tinggi' | 'sedang' | 'rendah' | 'tidak'

/**
 * Where she stands in the pipeline.
 * - `baru`      — captured, never followed up.
 * - `follow-up` — contacted at least once, still open, has a next date.
 * - `siap`      — qualified. Handed to onboarding; this is where the prototype
 *                 stops (registration and pencairan are out of scope).
 * - `tidak`     — closed with a reason. A no is a RESULT, same as "tidak bayar"
 *                 in the collection flow: it leaves the queue, it doesn't leak
 *                 out of the app onto someone's spreadsheet.
 */
export type LeadStage = 'baru' | 'follow-up' | 'siap' | 'tidak'

/** How the follow-up was attempted, and whether it landed. */
export type ContactResult = 'terhubung' | 'tidak-diangkat' | 'nomor-salah'

export type Channel = 'wa' | 'telepon'

/** One recorded contact. The lead's history, oldest first. */
export interface LeadLog {
  /** "21 Juli" — the day it happened. */
  at: string
  /** Where the contact came from. */
  via: 'sosialisasi' | Channel
  /** One line, already phrased for the next person to read it. */
  outcome: string
  note: string
}

/** An existing loan elsewhere. The single biggest reason a lead cannot proceed. */
export interface OtherLoan {
  /** "BRI KUR", "Bank keliling", "Koperasi" — where from. */
  lender: string
  amount: number
  /** Roughly when it finishes — the thing that dates the follow-up. */
  ends: string
}

export interface Lead {
  id: string

  // --- Quick tier ----------------------------------------------------------
  name: string
  phone: string
  source: LeadSource
  /** Referral only: the name of whoever sent her. */
  referredBy: string
  referralKind: ReferralKind | null
  interest: Interest | null
  /** Resolved date label — "21 Oktober". Null = no follow-up planned. */
  followUpAt: string | null

  // --- Lengkap tier --------------------------------------------------------
  address: string
  /** Which group she would join. A `MAJELIS_DIRECTORY` id. */
  majelisId: string | null
  /** Null = never asked. The tri-state matters: "no loans" ≠ "not checked". */
  hasOtherLoan: boolean | null
  otherLoan: OtherLoan | null

  // --- Running record ------------------------------------------------------
  stage: LeadStage
  /** Why the stage is what it is — a refusal reason, or the shape of the wait. */
  reason: string
  note: string
  /** The sosialisasi she was captured at. Null = walked in as a referral. */
  eventId: string | null
  log: LeadLog[]
}

// --- A sosialisasi ---------------------------------------------------------

/**
 * One lead-generation session. It carries a TARGET because that is how the
 * business sets it — a BP is sent to a village to come back with ten names, and
 * a progress line she can read mid-event is the difference between working the
 * room and discovering at 16.00 that she got four.
 */
export interface SosialisasiEvent {
  id: string
  title: string
  place: string
  target: number
}

export const EVENTS: SosialisasiEvent[] = [
  {
    id: 'e1',
    title: 'Sosialisasi Ciseeng',
    place: 'Warung Bu Ipah, Kp. Cibeuteung RT 03',
    target: 10,
  },
  // Last week's, in Putat Nutug. Nothing opens it — it exists so the seeded
  // leads have somewhere to have come from, which is what makes today's
  // follow-up task a continuation rather than an orphan.
  {
    id: 'e0',
    title: 'Sosialisasi Putat Nutug',
    place: 'Balai RW 02, Putat Nutug',
    target: 10,
  },
]

export const findEvent = (id: string): SosialisasiEvent =>
  EVENTS.find((e) => e.id === id) ?? EVENTS[0]

// --- Vocabulary ------------------------------------------------------------

export const SOURCE_LABEL: Record<LeadSource, string> = {
  sosialisasi: 'Sosialisasi',
  referral: 'Referral',
}

export const REFERRAL_KINDS: { value: ReferralKind; label: string }[] = [
  { value: 'mitra', label: 'Mitra aktif' },
  { value: 'keluarga', label: 'Keluarga mitra' },
  { value: 'non-mitra', label: 'Non-mitra' },
  { value: 'tokoh', label: 'Tokoh warga' },
]

export const referralKindLabel = (kind: ReferralKind | null): string =>
  REFERRAL_KINDS.find((k) => k.value === kind)?.label ?? '—'

/**
 * Each level carries what to DO about it, not just what it is. The interest
 * grade is the only thing on a lead card that ranks it, so it has to say what
 * the rank means — otherwise every BP invents her own reading of "sedang".
 */
export const INTEREST_META: Record<
  Interest,
  { label: string; intent: 'green' | 'orange' | 'neutral' | 'red'; hint: string }
> = {
  tinggi: {
    label: 'Minat tinggi',
    intent: 'green',
    hint: 'Siap diajukan begitu data lengkap',
  },
  sedang: {
    label: 'Minat sedang',
    intent: 'orange',
    hint: 'Perlu dihubungi lagi sebelum diajukan',
  },
  rendah: {
    label: 'Minat rendah',
    intent: 'neutral',
    hint: 'Simpan, hubungi saat kebutuhannya muncul',
  },
  tidak: {
    label: 'Tidak tertarik',
    intent: 'red',
    hint: 'Tutup dengan alasan',
  },
}

export const INTEREST_ORDER: Interest[] = ['tinggi', 'sedang', 'rendah', 'tidak']

export const STAGE_META: Record<
  LeadStage,
  { label: string; intent: 'primary' | 'blue' | 'green' | 'red' }
> = {
  baru: { label: 'Belum dihubungi', intent: 'primary' },
  'follow-up': { label: 'Dalam follow up', intent: 'blue' },
  siap: { label: 'Siap diajukan', intent: 'green' },
  tidak: { label: 'Ditutup', intent: 'red' },
}

/**
 * When to come back. Only "besok" lands on a day the schedule can show, which
 * is honest rather than a limitation: the whole point of capturing "3 bulan
 * lagi" is that the BP will not be thinking about her in October, so the app
 * has to be the one holding the date.
 */
export const FOLLOW_UP_OPTIONS: {
  label: string
  /** Resolved date, stored on the lead. Null = no follow-up. */
  value: string | null
  /** Set when the date falls on a day the schedule renders. */
  day: DayKey | null
}[] = [
  { label: 'Besok, 22 Juli', value: '22 Juli', day: 'tomorrow' },
  { label: '1 minggu lagi, 28 Juli', value: '28 Juli', day: null },
  { label: '1 bulan lagi, 21 Agustus', value: '21 Agustus', day: null },
  { label: '3 bulan lagi, 21 Oktober', value: '21 Oktober', day: null },
  { label: 'Tidak perlu', value: null, day: null },
]

/** Where a competing loan came from. The four a BP actually hears. */
export const LENDERS = ['BRI / KUR', 'Bank keliling', 'Koperasi', 'PNM Mekaar', 'Pinjaman online']

/**
 * Why she said no. Kept short and mutually exclusive, and every one of them is
 * a reason ops or the BP can act on later — "sudah punya pinjaman" dates a
 * future call, "keberatan angsuran" is a product objection worth counting.
 */
export const NO_REASONS = [
  'Sudah punya pinjaman lain',
  'Belum butuh modal',
  'Keberatan angsuran mingguan',
  'Keberatan tanggung renteng',
  'Tidak diizinkan keluarga',
]

/** Why the call didn't land, per contact result. */
export const CONTACT_RESULTS: { value: ContactResult; title: string; description: string }[] = [
  {
    value: 'terhubung',
    title: 'Terhubung',
    description: 'Sempat bicara — catat minat dan langkah berikutnya',
  },
  {
    value: 'tidak-diangkat',
    title: 'Tidak diangkat / tidak dibalas',
    description: 'Jadwalkan percobaan berikutnya',
  },
  {
    value: 'nomor-salah',
    title: 'Nomor tidak aktif / salah',
    description: 'Prospek ditutup kecuali ada nomor lain',
  },
]

// --- Seed ------------------------------------------------------------------
// Three leads from last week's Putat Nutug session, so today's follow-up task
// opens onto a real history instead of an empty record. `l1` is the one the
// schedule sends her to at 11.45.

export const SEED_LEADS: Lead[] = [
  {
    id: 'l1',
    name: 'Nia Kurniasih',
    phone: '0812-8834-2201',
    source: 'sosialisasi',
    referredBy: '',
    referralKind: null,
    interest: 'tinggi',
    followUpAt: '21 Juli',
    address: 'Kp. Putat Nutug RT 02 / RW 05',
    majelisId: 'melati',
    hasOtherLoan: true,
    otherLoan: { lender: 'BRI / KUR', amount: 4_000_000, ends: 'Oktober 2026' },
    stage: 'follow-up',
    reason: 'Menunggu pinjaman BRI lunas',
    note: 'Jualan sembako di depan rumah. Minta angsuran mingguan, bukan bulanan.',
    eventId: 'e0',
    log: [
      {
        at: '14 Juli',
        via: 'sosialisasi',
        outcome: 'Minat tinggi · janji dihubungi minggu depan',
        note: 'Ikut sampai selesai, banyak bertanya soal tanggung renteng.',
      },
    ],
  },
  {
    id: 'l2',
    name: 'Siti Maesaroh',
    phone: '0857-2290-7714',
    source: 'referral',
    referredBy: 'Ibu Rina Marlina (Majelis Mawar)',
    referralKind: 'mitra',
    interest: 'sedang',
    followUpAt: '28 Juli',
    address: '',
    majelisId: 'mawar',
    hasOtherLoan: null,
    otherLoan: null,
    stage: 'follow-up',
    reason: '',
    note: 'Tetangga Bu Rina. Belum sempat ditanya alamat lengkap.',
    eventId: 'e0',
    log: [
      {
        at: '14 Juli',
        via: 'sosialisasi',
        outcome: 'Minat sedang · masih menimbang',
        note: 'Datang menemani Bu Rina, tidak berencana ikut.',
      },
    ],
  },
  {
    id: 'l3',
    name: 'Yuyun Wahyuni',
    phone: '0813-6612-4408',
    source: 'sosialisasi',
    referredBy: '',
    referralKind: null,
    interest: 'rendah',
    followUpAt: '21 Agustus',
    address: 'Kp. Putat Nutug RT 04',
    majelisId: null,
    hasOtherLoan: true,
    otherLoan: { lender: 'Bank keliling', amount: 1_500_000, ends: 'September 2026' },
    stage: 'follow-up',
    reason: 'Masih terikat bank keliling',
    note: '',
    eventId: 'e0',
    log: [
      {
        at: '14 Juli',
        via: 'sosialisasi',
        outcome: 'Minat rendah · ada pinjaman berjalan',
        note: '',
      },
    ],
  },
]

// --- Derivations -----------------------------------------------------------

/** What is still missing before she can be submitted. Drives "Lengkapi data". */
export function missingFields(lead: Lead): string[] {
  const gaps: string[] = []
  if (!lead.address) gaps.push('Alamat rumah')
  if (!lead.majelisId) gaps.push('Majelis tujuan')
  if (lead.hasOtherLoan === null) gaps.push('Pinjaman lain')
  return gaps
}

export const isComplete = (lead: Lead): boolean => missingFields(lead).length === 0

/** The one line a lead card carries under her name. */
export function leadSubtitle(lead: Lead): string {
  if (lead.stage === 'tidak') return lead.reason || 'Ditutup'
  if (lead.stage === 'siap') return 'Siap diajukan ke onboarding'
  if (lead.followUpAt) return `Follow up ${lead.followUpAt}`
  return 'Belum dijadwalkan'
}
