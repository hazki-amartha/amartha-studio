// Everything the mitra page knows about one borrower — and, more importantly,
// what it concludes from it.
//
// This direction's premise is that the app synthesises and the BP acts, so the
// centre of gravity here is `actionsFor()`: the record is only raw material for
// the recommendation. The history below it exists to ANSWER a follow-up ("kenapa
// dia telat?"), not to be read on arrival — which is why the page keeps it
// collapsed and this module derives it lazily rather than shipping 24 hand-
// authored profiles.
//
// The numbers are generated deterministically from the mitra's name, so a mitra
// has the same record every time she is opened, and from whichever screen. Two
// rosters use different ids for the same woman (majelis `m1` / home-visit `h1`),
// so the name — not the id — is the seed.

import { HOME_VISITS, MAJELIS, type Mitra } from './data'

/** Stable small integer from a string. Same mitra, same record, every time. */
function hashOf(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) % 100_000
  }
  return h
}

// --- Lookup ----------------------------------------------------------------
// The page is reached from four screens across two rosters, so it resolves a
// mitra by id from anywhere rather than being handed the object.

const ALL_MITRA: Mitra[] = [
  ...MAJELIS.flatMap((m) => m.members),
  ...HOME_VISITS.map((h) => h.mitra),
]

export const findMitra = (id: string): Mitra => ALL_MITRA.find((m) => m.id === id) ?? ALL_MITRA[0]

/** Her majelis, matched by name — the home-visit roster carries no group id. */
export function majelisOf(mitra: Mitra) {
  return MAJELIS.find((g) => g.members.some((m) => m.name === mitra.name)) ?? MAJELIS[0]
}

// --- The record ------------------------------------------------------------

export interface Profile {
  phone: string
  address: string
  /** Which week of the cycle she is in, and how long the cycle runs. */
  week: number
  cycle: number
  /** What she owes across the rest of the cycle, not just this week. */
  outstanding: number
  /** How long she has been a mitra — the thing that earns patience. */
  joined: string
}

const JOINED = ['Maret 2023', 'Agustus 2023', 'Januari 2024', 'Juni 2024', 'Oktober 2024']

export function profileOf(mitra: Mitra): Profile {
  const h = hashOf(mitra.name)
  const cycle = 48
  const week = 12 + (h % 34)
  return {
    phone: `0812-${String(3000 + (h % 6000))}-${String(1000 + (h % 8999))}`,
    address: `Kp. Cibeuteung RT ${String(1 + (h % 8)).padStart(2, '0')} / RW 04, Ciseeng`,
    week,
    cycle,
    outstanding: mitra.due * (cycle - week),
    joined: JOINED[h % JOINED.length],
  }
}

// --- Payment history -------------------------------------------------------

export type InstalmentStatus = 'lunas' | 'telat' | 'belum'

export interface Instalment {
  week: number
  label: string
  amount: number
  status: InstalmentStatus
}

const WEEK_LABELS = [
  '9 Jun',
  '16 Jun',
  '23 Jun',
  '30 Jun',
  '7 Jul',
  '14 Jul',
  '21 Jul',
  '28 Jul',
]

/**
 * The last eight weeks. Her DPD decides the tail: a mitra 34 days down has
 * missed roughly five weeks, so the record has to agree with the badge on her
 * card — a history that contradicts the bucket line is worse than no history.
 */
export function historyOf(mitra: Mitra): Instalment[] {
  const h = hashOf(mitra.name)
  const missed = Math.ceil(mitra.dpd / 7)
  return WEEK_LABELS.map((label, i) => {
    const fromEnd = WEEK_LABELS.length - i
    const status: InstalmentStatus =
      fromEnd <= missed ? 'belum' : (h + i * 7) % 11 === 0 ? 'telat' : 'lunas'
    return { week: i + 1, label, amount: mitra.due, status }
  })
}

// --- Attendance ------------------------------------------------------------

export interface Session {
  label: string
  hadir: boolean
}

export function attendanceOf(mitra: Mitra): Session[] {
  const h = hashOf(mitra.name)
  return WEEK_LABELS.slice(2).map((label, i) => ({
    label,
    // A mitra behind on payments is also the one who stops turning up — the two
    // signals correlate in the field, so they correlate here.
    hadir: !((h + i * 5) % (mitra.dpd > 0 ? 4 : 9) === 0),
  }))
}

export const attendanceRate = (sessions: Session[]): number =>
  Math.round((sessions.filter((x) => x.hadir).length / sessions.length) * 100)

// --- What to do about it ---------------------------------------------------
// The page's whole reason to exist. Each action carries the line that justifies
// it, so the BP is handed a conclusion, never a number to interpret — the same
// move the schedule's "Sekarang" card makes.

export type ActionKind = 'kunjungan' | 'ingatkan' | 'tawarkan' | 'hubungi' | 'rute'

export interface Action {
  id: string
  kind: ActionKind
  label: string
  /** The pre-reasoned justification. Never a raw metric. */
  why: string
}

/**
 * The one thing most worth doing, or null when the honest answer is "nothing".
 * An empty state here is a first-class outcome: a mitra who is current and has
 * nothing to be offered should cost the BP no time at all.
 */
export function primaryActionFor(mitra: Mitra): Action | null {
  if (mitra.dpd >= 30) {
    return {
      id: 'kunjungan',
      kind: 'kunjungan',
      label: 'Jadwalkan kunjungan rumah',
      why: `Menunggak ${mitra.dpd} hari — sudah lewat batas ditagih di majelis`,
    }
  }
  if (mitra.dpd > 0) {
    return {
      id: 'ingatkan',
      kind: 'ingatkan',
      label: 'Ingatkan lewat WhatsApp',
      why: `Menunggak ${mitra.dpd} hari — biasanya bayar setelah diingatkan`,
    }
  }
  if (mitra.offer) {
    return {
      id: 'tawarkan',
      kind: 'tawarkan',
      label: `Tawarkan ${mitra.offer.label}`,
      why: mitra.offer.status,
    }
  }
  return null
}

/** Always available, never recommended — the plumbing of reaching someone. */
export function contactActionsFor(mitra: Mitra): Action[] {
  const p = profileOf(mitra)
  return [
    { id: 'hubungi', kind: 'hubungi', label: 'Chat WhatsApp', why: p.phone },
    { id: 'rute', kind: 'rute', label: 'Rute ke rumah', why: p.address },
  ]
}
