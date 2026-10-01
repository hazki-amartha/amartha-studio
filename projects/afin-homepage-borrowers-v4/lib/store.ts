'use client'

// Module store for Home Var B only (screens/home-var-b.tsx) — which weekly
// payment scenario the "Bayar angsuran" checklist is showing. Lives outside
// the screen because the five scenarios are picked from the desktop state
// controls beside the device (see index.ts `states`), which call these
// setters after the screen has already mounted; a screen-local useState would
// be lost the moment the control re-renders the screen.

import { useSyncExternalStore } from 'react'

export type WeekStatus = 'lunas' | 'partial' | 'kosong'
export type LoanStatus = 'lancar' | 'bahaya'

export interface HomeVarBState {
  /** One entry per week elapsed on this loan, oldest first. */
  weeks: WeekStatus[]
  status: LoanStatus
}

const week1Paid: HomeVarBState = { weeks: ['lunas'], status: 'lancar' }

const fiveWeeksLancar: HomeVarBState = { weeks: Array(5).fill('lunas'), status: 'lancar' }

const eightWeeksLancar: HomeVarBState = { weeks: Array(8).fill('lunas'), status: 'lancar' }

const eightWeeksPartial78: HomeVarBState = {
  weeks: [...Array(6).fill('lunas'), 'partial', 'partial'],
  status: 'bahaya',
}

const eightWeeksEmpty7Partial8: HomeVarBState = {
  weeks: [...Array(6).fill('lunas'), 'kosong', 'partial'],
  status: 'bahaya',
}

let state: HomeVarBState = week1Paid

const listeners = new Set<() => void>()

export const store = {
  get: () => state,
  set(next: HomeVarBState) {
    state = next
    listeners.forEach((l) => l())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export function useHomeVarB(): HomeVarBState {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}

// --- Scenario setters, referenced from index.ts `states[].apply` -----------

export const applyWeek1Paid = () => store.set(week1Paid)
export const applyFiveWeeksLancar = () => store.set(fiveWeeksLancar)
export const applyEightWeeksLancar = () => store.set(eightWeeksLancar)
export const applyEightWeeksPartial78 = () => store.set(eightWeeksPartial78)
export const applyEightWeeksEmpty7Partial8 = () => store.set(eightWeeksEmpty7Partial8)

// --- Home Var D (screens/home-var-d.tsx) — the 10-state "Progress limit
// Anda" / Majelis bonus card pair, sourced from Figma section 2918:10990.
// Ten loan-week milestones, switchable from the desktop state controls (see
// index.ts `states`). Each milestone can carry a main loan-progress card and,
// separately, a Majelis card that is either a matching progress card, a
// reward-unlocked hero, a reward-ended notice, or absent — see `CardSlot`.

export type CardTone = 'neutral' | 'success' | 'warning' | 'alert'
export type SegmentTone = 'paid' | 'missed' | 'partial' | 'upcoming'

export interface BannerText {
  text: string
  /** Bold primary-coloured fragment appended after `text`, e.g. "Lihat detail". */
  linkLabel?: string
}

export interface ProgressCardData {
  tone: CardTone
  cardTitle: string
  cardSubtitle: string
  leftLabel: string
  leftValue: string
  rightLabel: string
  rightValue: string
  rightStrike?: boolean
  bannerTitle: string
  bannerDescription: string
  progressLabel: string
  progressUnit: string
  segments: SegmentTone[]
  legend: { tone: SegmentTone; label: string }[]
  buttonLabel?: string
}

export type CardSlot =
  | { kind: 'progress'; data: ProgressCardData }
  | { kind: 'unlocked'; title: string; description: BannerText; amount: string; buttonLabel: string; nextLabel?: string }
  | { kind: 'ended'; title: string; description: string; linkLabel: string }
  | { kind: 'none' }

export interface HomeVarDState {
  main: CardSlot
  /** The Majelis reward carries its own headline amount, shown between the
   *  card title and the banner — only meaningful when `majelis.kind` is
   *  'progress' (the other kinds carry their own copy already). */
  majelisRewardLabel?: string
  majelis: CardSlot
}

/** Parses a compact P/M/W/. pattern (paid/missed/partial/upcoming) into a
 *  segment array, right-padded with upcoming weeks to `total`. Matches the
 *  Figma bar-track colours one character per bar — see NOTES.md. */
function segments(pattern: string, total: number): SegmentTone[] {
  const map: Record<string, SegmentTone> = { P: 'paid', M: 'missed', W: 'partial', '.': 'upcoming' }
  const chars = pattern.padEnd(total, '.').split('').map((c) => map[c])
  return chars
}

const homeVarDScenarios: Record<string, HomeVarDState> = {
  // Week 0 — loan just disbursed, nothing due yet.
  'week-0': {
    main: {
      kind: 'progress',
      data: {
        tone: 'neutral',
        cardTitle: 'Progress limit Anda',
        cardSubtitle: 'Limit baru diberikan 28 Aug 2027',
        leftLabel: 'Limit saat ini',
        leftValue: 'Rp5 jt',
        rightLabel: 'Potensi limit baru',
        rightValue: 'Rp6 - 8 jt',
        bannerTitle: 'Pembayaran belum dimulai',
        bannerDescription: 'Anda baru saja mencairkan Modal. Pembayaran akan dimulai 1 Sep 2027.',
        progressLabel: '0 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('', 48),
        legend: [{ tone: 'paid', label: '0x bayar' }],
      },
    },
    majelisRewardLabel: 'Bonus: Cair Tambahan Rp 1.5jt',
    majelis: {
      kind: 'progress',
      data: {
        tone: 'neutral',
        cardTitle: 'Bonus majelis Anda',
        cardSubtitle: 'Dapatkan pada 30 Nov 2026',
        leftLabel: '',
        leftValue: '',
        rightLabel: '',
        rightValue: '',
        bannerTitle: 'Pembayaran belum dimulai',
        bannerDescription: 'Anda baru saja mencairkan Modal. Pembayaran akan dimulai 1 Sep 2027.',
        progressLabel: '0 dari 12',
        progressUnit: 'minggu majelis bayar lancar',
        segments: segments('', 12),
        legend: [{ tone: 'paid', label: '0x lancar' }],
      },
    },
  },

  // Week 1 — first payment made, everything on track.
  'week-1': {
    main: {
      kind: 'progress',
      data: {
        tone: 'success',
        cardTitle: 'Progress limit Anda',
        cardSubtitle: 'Dapatkan pada 28 Aug 2027',
        leftLabel: 'Limit saat ini',
        leftValue: 'Rp5 jt',
        rightLabel: 'Potensi limit baru',
        rightValue: 'Rp6 - 8 jt',
        bannerTitle: 'Kamu berpotensi untuk naik limit',
        bannerDescription: 'Terus jaga kelancaran pembayaran kamu.',
        progressLabel: '1 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('P', 48),
        legend: [{ tone: 'paid', label: '1x bayar' }],
        buttonLabel: 'Bayar Angsuran Rp125.000',
      },
    },
    majelisRewardLabel: 'Bonus: Cair Tambahan Rp 1.5jt',
    majelis: {
      kind: 'progress',
      data: {
        tone: 'success',
        cardTitle: 'Bonus majelis Anda',
        cardSubtitle: 'Dapatkan pada 30 Nov 2026',
        leftLabel: '',
        leftValue: '',
        rightLabel: '',
        rightValue: '',
        bannerTitle: 'Kamu berpotensi mendapat hadiah',
        bannerDescription: 'Pastikan semua anggota membayar dengan lancar.',
        progressLabel: '1 dari 12',
        progressUnit: 'minggu majelis bayar lancar',
        segments: segments('P', 12),
        legend: [{ tone: 'paid', label: '1x lancar' }],
      },
    },
  },

  // Week 5 — still on track.
  'week-5': {
    main: {
      kind: 'progress',
      data: {
        tone: 'success',
        cardTitle: 'Progress limit Anda',
        cardSubtitle: 'Dapatkan pada 28 Aug 2027',
        leftLabel: 'Limit saat ini',
        leftValue: 'Rp5 jt',
        rightLabel: 'Potensi limit baru',
        rightValue: 'Rp6 - 8 jt',
        bannerTitle: 'Kamu berpotensi untuk naik limit',
        bannerDescription: 'Terus jaga kelancaran pembayaran kamu.',
        progressLabel: '5 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('PPPPP', 48),
        legend: [{ tone: 'paid', label: '5x bayar' }],
        buttonLabel: 'Bayar Angsuran Rp135.000',
      },
    },
    majelisRewardLabel: 'Bonus: Cair Tambahan Rp 1.5jt',
    majelis: {
      kind: 'progress',
      data: {
        tone: 'success',
        cardTitle: 'Bonus majelis Anda',
        cardSubtitle: 'Dapatkan pada 30 Nov 2026',
        leftLabel: '',
        leftValue: '',
        rightLabel: '',
        rightValue: '',
        bannerTitle: 'Kamu berpotensi mendapat hadiah',
        bannerDescription: 'Pastikan semua anggota membayar dengan lancar.',
        progressLabel: '5 dari 12',
        progressUnit: 'minggu majelis bayar lancar',
        segments: segments('PPPPP', 12),
        legend: [{ tone: 'paid', label: '5x lancar' }],
      },
    },
  },

  // Week 6 — individual on track, but missed this week and Majelis is now at risk.
  'week-6': {
    main: {
      kind: 'progress',
      data: {
        tone: 'warning',
        cardTitle: 'Progress limit Anda',
        cardSubtitle: 'Dapatkan pada 28 Aug 2027',
        leftLabel: 'Limit saat ini',
        leftValue: 'Rp5 jt',
        rightLabel: 'Limit baru hangus',
        rightValue: 'Rp6 - 8 jt',
        rightStrike: true,
        bannerTitle: 'Naik Limit berpotensi gagal',
        bannerDescription: 'Yah, pembayaran Anda terlambat! Segera bayar, ya, supaya tetap bisa naik limit.',
        progressLabel: '6 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('PPPPPM', 48),
        legend: [
          { tone: 'paid', label: '5x bayar' },
          { tone: 'missed', label: '1x tidak bayar' },
        ],
        buttonLabel: 'Bayar Angsuran Rp270.000',
      },
    },
    majelisRewardLabel: 'Bonus Cair Tambahan Rp 1.5jt',
    majelis: {
      kind: 'progress',
      data: {
        tone: 'warning',
        cardTitle: 'Bonus majelis Anda',
        cardSubtitle: 'Dapatkan pada 30 Nov 2026',
        leftLabel: '',
        leftValue: '',
        rightLabel: '',
        rightValue: '',
        bannerTitle: 'Bonus berpotensi hangus',
        bannerDescription: 'Karena anda tidak bayar angsuran, 1 majelis berpotensi tidak dapat bonus.',
        progressLabel: '6 dari 12',
        progressUnit: 'minggu majelis bayar lancar',
        segments: segments('PPPPPM', 12),
        legend: [
          { tone: 'paid', label: '5x lancar' },
          { tone: 'missed', label: '1x tidak lancar' },
        ],
        buttonLabel: 'Ingatkan 2 Anggota Majelis',
      },
    },
  },

  // Week 10 — five weeks behind; Majelis card drops out entirely.
  'week-10': {
    main: {
      kind: 'progress',
      data: {
        tone: 'alert',
        cardTitle: 'Progress limit Anda',
        cardSubtitle: 'Dapatkan pada 28 Aug 2027',
        leftLabel: 'Limit saat ini',
        leftValue: 'Rp5 jt',
        rightLabel: 'Limit baru hangus',
        rightValue: 'Rp6 - 8 jt',
        rightStrike: true,
        bannerTitle: 'Anda berpotensi tidak naik limit',
        bannerDescription: 'Pembayaran sudah telat 5 minggu. Bayar sekarang agar bisa naik limit.',
        progressLabel: '10 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('PPPPPMMMMM', 48),
        legend: [
          { tone: 'paid', label: '5x bayar' },
          { tone: 'missed', label: '5x tidak bayar' },
        ],
        buttonLabel: 'Bayar Angsuran Rp810.000',
      },
    },
    majelis: { kind: 'none' },
  },

  // Week 11 — one recovery payment made; status still recoverable.
  'week-11': {
    main: {
      kind: 'progress',
      data: {
        tone: 'warning',
        cardTitle: 'Progress limit Anda',
        cardSubtitle: 'Dapatkan pada 28 Aug 2027',
        leftLabel: 'Limit saat ini',
        leftValue: 'Rp5 jt',
        rightLabel: 'Potensi limit baru',
        rightValue: 'Rp6 - 8 jt',
        bannerTitle: 'Status masih bisa diperbaiki!',
        bannerDescription: 'Yuk, jaga kelancaran untuk bisa naik limit 33 minggu lagi.',
        progressLabel: '11 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('PPPPPMMMMMP', 48),
        legend: [
          { tone: 'paid', label: '6x bayar' },
          { tone: 'missed', label: '5x tidak bayar' },
        ],
        buttonLabel: 'Bayar Angsuran Rp135.000',
      },
    },
    majelisRewardLabel: 'Bonus Cair Tambahan Rp 1.5jt',
    majelis: {
      kind: 'progress',
      data: {
        tone: 'warning',
        cardTitle: 'Bonus majelis Anda',
        cardSubtitle: 'Dapatkan pada 30 Nov 2026',
        leftLabel: '',
        leftValue: '',
        rightLabel: '',
        rightValue: '',
        bannerTitle: 'Masih berpotensi dapat bonus',
        bannerDescription: 'Pertahankan pembayaran 1 minggu lagi untuk bisa dapat bonus.',
        progressLabel: '11 dari 12',
        progressUnit: 'minggu majelis bayar lancar',
        segments: segments('PPPPPMMMMMP', 12),
        legend: [
          { tone: 'paid', label: '6x lancar' },
          { tone: 'missed', label: '5x tidak lancar' },
        ],
      },
    },
  },

  // Week 12 — loan still recovering, but the Majelis reward just unlocked.
  'week-12': {
    main: {
      kind: 'progress',
      data: {
        tone: 'warning',
        cardTitle: 'Progress limit Anda',
        cardSubtitle: 'Dapatkan pada 28 Aug 2027',
        leftLabel: 'Limit saat ini',
        leftValue: 'Rp5 jt',
        rightLabel: 'Potensi limit baru',
        rightValue: 'Rp6 - 8 jt',
        bannerTitle: 'Status masih bisa diperbaiki!',
        bannerDescription: 'Yuk, jaga kelancaran untuk bisa naik limit 33 minggu lagi.',
        progressLabel: '12 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('PPPPPMMMMMPP', 48),
        legend: [
          { tone: 'paid', label: '7x bayar' },
          { tone: 'missed', label: '5x tidak bayar' },
        ],
        buttonLabel: 'Bayar Angsuran Rp135.000',
      },
    },
    majelis: {
      kind: 'unlocked',
      title: 'Selamat! Anda dapat bonusnya',
      description: { text: 'Limit tambahan ini bisa Anda cairkan hingga 7 Des 2026.' },
      amount: 'Rp1.000.000',
      buttonLabel: 'Cairkan Sekarang',
      nextLabel: 'Lihat bonus berikutnya',
    },
  },

  // Week 13 — loan still recovering; a fresh Majelis reward cycle just started.
  'week-13': {
    main: {
      kind: 'progress',
      data: {
        tone: 'warning',
        cardTitle: 'Progress limit Anda',
        cardSubtitle: 'Dapatkan pada 28 Aug 2027',
        leftLabel: 'Limit saat ini',
        leftValue: 'Rp5 jt',
        rightLabel: 'Potensi limit baru',
        rightValue: 'Rp6 - 8 jt',
        bannerTitle: 'Status masih bisa diperbaiki!',
        bannerDescription: 'Yuk, jaga kelancaran untuk bisa naik limit 33 minggu lagi.',
        progressLabel: '13 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('PPPPPMMMMMPPP', 48),
        legend: [
          { tone: 'paid', label: '7x bayar' },
          { tone: 'missed', label: '5x tidak bayar' },
        ],
        buttonLabel: 'Bayar Angsuran Rp135.000',
      },
    },
    majelisRewardLabel: 'Bonus: Sembako Minyak Goreng',
    majelis: {
      kind: 'progress',
      data: {
        tone: 'success',
        cardTitle: 'Bonus majelis Anda',
        cardSubtitle: 'Dapatkan pada 30 Nov 2026',
        leftLabel: '',
        leftValue: '',
        rightLabel: '',
        rightValue: '',
        bannerTitle: 'Kamu berpotensi mendapat hadiah',
        bannerDescription: 'Pastikan semua anggota membayar dengan lancar.',
        progressLabel: '13 dari 24',
        progressUnit: 'minggu majelis bayar lancar',
        segments: segments('', 12),
        legend: [],
      },
    },
  },

  // Week 47 — one week from the finish line; a mixed payment history.
  'week-47': {
    main: {
      kind: 'progress',
      data: {
        tone: 'success',
        cardTitle: 'Progress limit Anda',
        cardSubtitle: 'Dapatkan pada 28 Aug 2027',
        leftLabel: 'Limit saat ini',
        leftValue: 'Rp5 jt',
        rightLabel: 'Potensi limit baru',
        rightValue: 'Rp6 - 8 jt',
        bannerTitle: 'Kamu berpotensi untuk naik limit',
        bannerDescription: 'Terus jaga kelancaran pembayaran kamu.',
        progressLabel: '47 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('PPPPPMMMMMPPPWWMPPPPMPPPPPWWWPWWPMPPWPMMPPPPPPP', 48),
        legend: [
          { tone: 'paid', label: '29x bayar' },
          { tone: 'missed', label: '10x tidak bayar' },
          { tone: 'partial', label: '8x sebagian' },
        ],
        buttonLabel: 'Bayar Angsuran Rp135.000',
      },
    },
    majelis: {
      kind: 'ended',
      title: 'Bonus majelis berakhir',
      description: 'Tidak ada lagi bonus yang tersisa.',
      linkLabel: 'Lihat riwayat',
    },
  },

  // Week 48 — loan complete; the main card is replaced by the upgraded-limit hero.
  'week-48': {
    main: {
      kind: 'unlocked',
      title: 'Selamat, Anda berhasil naik limit lebih besar!',
      description: { text: 'Segera cairkan limit nya, biar bisa Anda gunakan', linkLabel: 'Lihat detail' },
      amount: 'Rp7.200.000',
      buttonLabel: 'Cairkan Sekarang',
    },
    majelis: {
      kind: 'ended',
      title: 'Bonus majelis berakhir',
      description: 'Tidak ada lagi bonus yang tersisa.',
      linkLabel: 'Lihat riwayat',
    },
  },
}

let stateD: HomeVarDState = homeVarDScenarios['week-0']

const listenersD = new Set<() => void>()

export const storeD = {
  get: () => stateD,
  set(next: HomeVarDState) {
    stateD = next
    listenersD.forEach((l) => l())
  },
  subscribe(listener: () => void) {
    listenersD.add(listener)
    return () => listenersD.delete(listener)
  },
}

export function useHomeVarD(): HomeVarDState {
  return useSyncExternalStore(storeD.subscribe, storeD.get, storeD.get)
}

// --- Scenario setters, referenced from index.ts `states[].apply` -----------

export const applyWeek0 = () => storeD.set(homeVarDScenarios['week-0'])
export const applyWeek1 = () => storeD.set(homeVarDScenarios['week-1'])
export const applyWeek5 = () => storeD.set(homeVarDScenarios['week-5'])
export const applyWeek6 = () => storeD.set(homeVarDScenarios['week-6'])
export const applyWeek10 = () => storeD.set(homeVarDScenarios['week-10'])
export const applyWeek11 = () => storeD.set(homeVarDScenarios['week-11'])
export const applyWeek12 = () => storeD.set(homeVarDScenarios['week-12'])
export const applyWeek13 = () => storeD.set(homeVarDScenarios['week-13'])
export const applyWeek47 = () => storeD.set(homeVarDScenarios['week-47'])
export const applyWeek48 = () => storeD.set(homeVarDScenarios['week-48'])

// Hidden UT shortcut: the Poket widget's Transfer / Isi Saldo buttons on Home
// Var D step forward / back through the milestones above, wrapping 48 ↔ 0, so
// states can be switched while the prototype is fullscreen.
const weekOrder = Object.values(homeVarDScenarios)

export function stepHomeVarD(delta: 1 | -1) {
  const i = weekOrder.indexOf(stateD)
  storeD.set(weekOrder[(i + delta + weekOrder.length) % weekOrder.length])
}
