// Data + loan-simulation config for the "alt" screens (Home - alt, Perjalanan
// 48w - alt 2, Cairkan modal tambahan - alt, Milestone minggu 12 - alt,
// Majelis). Kept apart from data.ts so the existing home/journey screens stay
// untouched — nothing here is imported by them.

import { WEEKLY_BILL } from './data'

// --- "Angsuran Anda" card (Home - alt) ------------------------------
//
// Three states, not a derived read off the shared AppState: AWAL (a fresh
// streak, no rumus needed yet), MENDEKATI PENCAIRAN (the next milestone is
// close enough to state a figure and a condition), and MENUNGGAK (an arrears
// alert replaces the hero outright). Kept as its own tiny selector — see
// `cardStateStore` below — so switching it in the states panel can't disturb
// the signals `perjalanan-alt2` and the rest of the shared store still read.

export type CardState =
  | 'awal'
  | 'mendekati'
  | 'menunggak'
  | 'kurang-bayar'
  | 'limit-terbuka'

export const CARD_STATES: Record<
  CardState,
  {
    paidWeeks: number
    totalWeeks: number
  }
> = {
  awal: { paidWeeks: 3, totalWeeks: 48 },
  mendekati: { paidWeeks: 18, totalWeeks: 48 },
  menunggak: { paidWeeks: 17, totalWeeks: 48 },
  'kurang-bayar': { paidWeeks: 18, totalWeeks: 48 },
  'limit-terbuka': { paidWeeks: 12, totalWeeks: 48 },
}

/** AWAL — a streak worth naming, still well short of the next milestone. */
export const AWAL = {
  streak: 3,
  milestoneDate: '1 Okt 2026',
}

/** MENDEKATI PENCAIRAN — close enough to the next milestone to state its
 *  figure and the condition that keeps it on track. `remaining` defaults
 *  here but is stated explicitly by every state that sets `state:
 *  'mendekati'` in cardStateStore (see demo.ts) — never left to carry over
 *  from whichever mendekati state was clicked before it. */
export const MENDEKATI = {
  remaining: 6,
  amount: 1250000,
  milestoneDate: '1 Okt 2026',
  groupUnpaid: 5,
}

/** MENUNGGAK — the arrears block. Never states the pencairan figure (see the
 *  copy rule) — only the overdue instalment and how little a mitra can start
 *  with. */
export const MENUNGGAK = {
  daysLate: 3,
  minPartial: 50000,
}

/** LIMIT TERBUKA — the 12-week milestone is reached and unclaimed. Shows the
 *  offer card above the regular status boxes. */
export const LIMIT_TERBUKA = {
  paidWeeks: 12,
  totalWeeks: 48,
  amount: 1250000,
}

/** KURANG BAYAR — a partial instalment landed this week; the remainder is still
 *  due before kumpulan. Not `menunggak` (which is post-due-date). Year omitted
 *  from milestoneDate because 2026 is still current. */
export const KURANG_BAYAR = {
  paid: 50000,
  remaining: 100000,
  amount: 1250000,
  milestoneDate: '1 Okt',
}

// --- "Pinjaman Ibu" card (Home - alt, New Mitra) ----------------------------
// A mitra who's approved but has never disbursed sees this instead of
// "Angsuran Anda" — there is no journey to show yet, only a plafon
// waiting to be drawn. Not part of the CardState selector above: it is
// switched on `mitraStage === 'new'`, the same signal home-v2.tsx's own
// "Pinjaman Anda" card reads.

export const PINJAMAN_BARU = {
  plafon: 5000000,
}

/** Module store for the card's own selector — a state-panel control, not a
 *  value any screen needs to survive navigation on its own terms. Same
 *  subscribe/get/set shape as `store.ts`, kept separate so this card's demo
 *  states never touch the shared AppState.
 *
 *  `kelompokLancar` only means anything when `state === 'mendekati'` — it is
 *  State 2's own toggle (2a / 2b), not a fourth top-level state. */
export interface CardSelector {
  state: CardState
  kelompokLancar: boolean
  /** State 2's "N kali bayar lagi" — only meaningful when `state ===
   *  'mendekati'`, same as `kelompokLancar`. */
  remaining: number
}

let cardSelector: CardSelector = { state: 'mendekati', kelompokLancar: true, remaining: 6 }
const cardStateListeners = new Set<() => void>()

export const cardStateStore = {
  get: () => cardSelector,
  set(patch: Partial<CardSelector>) {
    cardSelector = { ...cardSelector, ...patch }
    cardStateListeners.forEach((l) => l())
  },
  subscribe(listener: () => void) {
    cardStateListeners.add(listener)
    return () => cardStateListeners.delete(listener)
  },
}

// --- Perjalanan 48w - alt 2 -------------------------------------------------
// The ladder itself is MILESTONE_SETS in data.ts — the same rungs the existing
// Perjalanan 48 minggu draws, off the same journeyPhase. Only the two things
// the alt layout adds are here.

/** A missed rung says "Terlewat", never "Gagal", and never stops at the label:
 *  "Gagal" names an end, and what she needs is the cost and the way back. */
export const MISSED_RECOVERY = {
  label: 'Terlewat',
  consequence: 'Pencairan tahap ini tertunda ke tahap berikutnya.',
  recovery: 'Terbuka lagi setelah 4 minggu angsuran lancar berturut-turut.',
}

// --- Cairkan modal tambahan - alt: loan simulation assumptions --------------
// Flat interest, rounded to the nearest Rp100. Kept in one place to retune.

export const LOAN = {
  floor: 500000,
  ceiling: 1250000,
  default: 800000,
  step: 50000,
  rolloverDate: '26 Jan 2027',
  existingWeekly: WEEKLY_BILL,
  tenors: {
    3: { weeks: 13, flatRate: 0.08, label: '3 bulan' },
    6: { weeks: 26, flatRate: 0.15, label: '6 bulan' },
  },
  /** Combined weekly total (existing + new) below which the affordability band
   *  reads green; above `amberMax` it reads red. Hardcoded per spec. */
  zone: { greenMax: 220000, amberMax: 260000 },
} as const

export type TenorMonths = keyof typeof LOAN.tenors

const round100 = (n: number) => Math.round(n / 100) * 100

export function simulate(amount: number, tenor: TenorMonths) {
  const { weeks, flatRate } = LOAN.tenors[tenor]
  const total = round100(amount * (1 + flatRate))
  const weekly = round100(total / weeks)
  const combined = LOAN.existingWeekly + weekly
  const zone: 'green' | 'orange' | 'red' =
    combined <= LOAN.zone.greenMax ? 'green' : combined <= LOAN.zone.amberMax ? 'orange' : 'red'
  return { weekly, total, combined, zone }
}
