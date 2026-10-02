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

export type MajelisStatus = 'belum' | 'lancar' | 'tidak'

export interface HomeVarDState {
  main: CardSlot
  /** The Majelis reward carries its own headline amount, shown between the
   *  card title and the banner — only meaningful when `majelis.kind` is
   *  'progress' (the other kinds carry their own copy already). */
  majelisRewardLabel?: string
  /** Strike the reward through — the bonus is at risk of being lost. */
  majelisRewardStrike?: boolean
  /** Which Bonus majelis page the Majelis card opens — absent when the card is. */
  majelisPage?: string
  /** "Status majelis" shown on the Bonus majelis and Majelis Anda pages. */
  majelisStatus: MajelisStatus
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
    majelisStatus: 'belum',
    majelisPage: 'bonus-majelis-pertama',
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
        bannerDescription: 'Anda baru saja mencairkan Modal. Pembayaran akan dimulai 1 Sep 2026.',
        progressLabel: '0 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('', 48),
        legend: [{ tone: 'paid', label: '0x bayar' }],
      },
    },
    majelisRewardLabel: 'Bonus Cair Tambahan Rp1.5 jt',
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
        bannerDescription: 'Anda baru saja mencairkan Modal. Pembayaran akan dimulai 1 Sep 2026.',
        progressLabel: '0 dari 12',
        progressUnit: 'minggu majelis bayar lancar',
        segments: segments('', 12),
        legend: [{ tone: 'paid', label: '0x lancar' }],
      },
    },
  },

  // Week 1 — first payment made, everything on track.
  'week-1': {
    majelisStatus: 'lancar',
    majelisPage: 'bonus-majelis-pertama',
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
        bannerTitle: 'Anda berpotensi untuk naik limit',
        bannerDescription: 'Terus jaga kelancaran pembayaran Anda.',
        progressLabel: '1 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('P', 48),
        legend: [{ tone: 'paid', label: '1x bayar' }],
        buttonLabel: 'Bayar Angsuran Rp135.000',
      },
    },
    majelisRewardLabel: 'Bonus Cair Tambahan Rp1.5 jt',
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
        bannerTitle: 'Anda berpotensi mendapat hadiah',
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
    majelisStatus: 'lancar',
    majelisPage: 'bonus-majelis-pertama',
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
        bannerTitle: 'Anda berpotensi untuk naik limit',
        bannerDescription: 'Terus jaga kelancaran pembayaran Anda.',
        progressLabel: '5 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('PPPPP', 48),
        legend: [{ tone: 'paid', label: '5x bayar' }],
        buttonLabel: 'Bayar Angsuran Rp135.000',
      },
    },
    majelisRewardLabel: 'Bonus Cair Tambahan Rp1.5 jt',
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
        bannerTitle: 'Anda berpotensi mendapat hadiah',
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
    majelisStatus: 'tidak',
    majelisPage: 'bonus-majelis-pertama',
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
    majelisRewardLabel: 'Bonus Cair Tambahan Rp1.5 jt',
    majelisRewardStrike: true,
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
        bannerDescription: 'Karena Anda tidak bayar angsuran, 1 majelis berpotensi tidak dapat bonus.',
        progressLabel: '6 dari 12',
        progressUnit: 'minggu majelis bayar lancar',
        segments: segments('PPPPPM', 12),
        legend: [
          { tone: 'paid', label: '5x lancar' },
          { tone: 'missed', label: '1x tidak lancar' },
        ],
      },
    },
  },

  // Week 6B — paid on time herself, but other members fell behind
  // (Figma 2992:39214).
  'week-6b': {
    majelisStatus: 'tidak',
    majelisPage: 'bonus-majelis-pertama',
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
        bannerTitle: 'Anda berpotensi untuk naik limit',
        bannerDescription: 'Terus jaga kelancaran pembayaran Anda.',
        progressLabel: '6 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('PPPPPP', 48),
        legend: [{ tone: 'paid', label: '6x bayar' }],
        buttonLabel: 'Bayar Angsuran Rp135.000',
      },
    },
    majelisRewardLabel: 'Bonus Cair Tambahan Rp1.5 jt',
    majelisRewardStrike: true,
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
        bannerTitle: 'Status turun! Bonus bisa hangus',
        bannerDescription: 'Ajak anggota untuk segera bayar agar tetap bisa dapat bonus.',
        progressLabel: '6 dari 12',
        progressUnit: 'minggu majelis bayar lancar',
        segments: segments('PPPPPM', 12),
        legend: [
          { tone: 'paid', label: '5x lancar' },
          { tone: 'missed', label: '1x tidak lancar' },
        ],
        buttonLabel: 'Ingatkan 5 Anggota Majelis',
      },
    },
  },

  // Week 10A — five weeks behind herself; the Majelis bonus is at risk too.
  'week-10': {
    majelisStatus: 'tidak',
    majelisPage: 'bonus-majelis-pertama',
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
    // Majelis bonus at risk — the reward is struck through (Figma 2901:138533).
    majelisRewardLabel: 'Bonus Cair Tambahan Rp1.5 jt',
    majelisRewardStrike: true,
    majelis: {
      kind: 'progress',
      data: {
        tone: 'alert',
        cardTitle: 'Bonus majelis Anda',
        cardSubtitle: 'Dapatkan pada 30 Nov 2026',
        leftLabel: '',
        leftValue: '',
        rightLabel: '',
        rightValue: '',
        bannerTitle: 'Bonus untuk majelis bisa hilang',
        bannerDescription: 'Karena Anda tidak bayar angsuran, 1 majelis berpotensi tidak dapat bonus.',
        progressLabel: '10 dari 12',
        progressUnit: 'minggu majelis bayar lancar',
        segments: segments('PPPPPMMMMM', 12),
        legend: [
          { tone: 'paid', label: '5x lancar' },
          { tone: 'missed', label: '5x tidak lancar' },
        ],
      },
    },
  },

  // Week 10B — paid on time herself, but other members fell behind
  // (Figma 2992:39214).
  'week-10b': {
    majelisStatus: 'tidak',
    majelisPage: 'bonus-majelis-pertama',
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
        bannerTitle: 'Anda berpotensi untuk naik limit',
        bannerDescription: 'Terus jaga kelancaran pembayaran Anda.',
        progressLabel: '10 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('PPPPPPPPPP', 48),
        legend: [{ tone: 'paid', label: '10x bayar' }],
        buttonLabel: 'Bayar Angsuran Rp135.000',
      },
    },
    majelisRewardLabel: 'Bonus Cair Tambahan Rp1.5 jt',
    majelisRewardStrike: true,
    majelis: {
      kind: 'progress',
      data: {
        tone: 'alert',
        cardTitle: 'Bonus majelis Anda',
        cardSubtitle: 'Dapatkan pada 30 Nov 2026',
        leftLabel: '',
        leftValue: '',
        rightLabel: '',
        rightValue: '',
        bannerTitle: 'Status turun lagi! Bonus bisa hilang',
        bannerDescription: 'Ajak anggota untuk segera bayar agar tetap bisa dapat bonus.',
        progressLabel: '10 dari 12',
        progressUnit: 'minggu majelis bayar lancar',
        segments: segments('PPPPPMMMMM', 12),
        legend: [
          { tone: 'paid', label: '5x lancar' },
          { tone: 'missed', label: '5x tidak lancar' },
        ],
        buttonLabel: 'Ingatkan 5 Anggota Majelis',
      },
    },
  },

  // Week 11A — one recovery payment made after weeks 6–10; status still recoverable.
  'week-11': {
    majelisStatus: 'tidak',
    majelisPage: 'bonus-majelis-pertama',
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
    majelisRewardLabel: 'Bonus Cair Tambahan Rp1.5 jt',
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

  // Week 11B — paid on time throughout; the Majelis card is the same as 11A.
  'week-11b': {
    majelisStatus: 'tidak',
    majelisPage: 'bonus-majelis-pertama',
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
        bannerTitle: 'Anda berpotensi untuk naik limit',
        bannerDescription: 'Terus jaga kelancaran pembayaran Anda.',
        progressLabel: '11 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('PPPPPPPPPPP', 48),
        legend: [{ tone: 'paid', label: '11x bayar' }],
        buttonLabel: 'Bayar Angsuran Rp135.000',
      },
    },
    majelisRewardLabel: 'Bonus Cair Tambahan Rp1.5 jt',
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

  // Week 12A — recovered in week 11, late again in week 12: the limit
  // upgrade is at risk again and the first Majelis bonus is lost.
  'week-12a': {
    majelisStatus: 'tidak',
    majelisPage: 'bonus-majelis-gagal',
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
        progressLabel: '12 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('PPPPPMMMMMPM', 48),
        legend: [
          { tone: 'paid', label: '6x bayar' },
          { tone: 'missed', label: '6x tidak bayar' },
        ],
        buttonLabel: 'Bayar Angsuran Rp270.000',
      },
    },
    majelisRewardLabel: 'Bonus Cair Tambahan Rp1.5 jt',
    majelisRewardStrike: true,
    majelis: {
      kind: 'progress',
      data: {
        tone: 'alert',
        cardTitle: 'Bonus majelis Anda',
        cardSubtitle: 'Dapatkan pada 30 Nov 2026',
        leftLabel: '',
        leftValue: '',
        rightLabel: '',
        rightValue: '',
        bannerTitle: 'Bonus majelis hangus',
        bannerDescription: 'Karena Anda telat bayar di minggu ke-12, majelis tidak lancar dan bonus tidak bisa didapatkan.',
        progressLabel: '12 dari 12',
        progressUnit: 'minggu majelis bayar lancar',
        segments: segments('PPPPPMMMMMPM', 12),
        legend: [
          { tone: 'paid', label: '6x lancar' },
          { tone: 'missed', label: '6x tidak lancar' },
        ],
      },
    },
  },

  // Week 12B — paid on time throughout: the first Majelis bonus unlocked.
  'week-12': {
    majelisStatus: 'lancar',
    majelisPage: 'bonus-majelis-berhasil',
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
        bannerTitle: 'Anda berpotensi untuk naik limit',
        bannerDescription: 'Terus jaga kelancaran pembayaran Anda.',
        progressLabel: '12 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('PPPPPPPPPPPP', 48),
        legend: [{ tone: 'paid', label: '12x bayar' }],
        buttonLabel: 'Bayar Angsuran Rp135.000',
      },
    },
    majelis: {
      kind: 'unlocked',
      title: 'Selamat! Anda dapat bonusnya',
      description: { text: 'Limit tambahan ini bisa Anda cairkan hingga 7 Des 2026.' },
      amount: 'Rp1.500.000',
      buttonLabel: 'Cairkan Sekarang',
      nextLabel: 'Lihat bonus berikutnya',
    },
  },

  // Week 13A — still recovering (weeks 6–10 and 12 missed); Bonus ke-2 just started.
  'week-13': {
    majelisStatus: 'lancar',
    majelisPage: 'bonus-majelis-gagal',
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
        segments: segments('PPPPPMMMMMPMP', 48),
        legend: [
          { tone: 'paid', label: '7x bayar' },
          { tone: 'missed', label: '6x tidak bayar' },
        ],
        buttonLabel: 'Bayar Angsuran Rp135.000',
      },
    },
    majelisRewardLabel: 'Bonus Minyak Goreng',
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
        bannerTitle: 'Anda berpotensi mendapat hadiah',
        bannerDescription: 'Pastikan semua anggota membayar dengan lancar.',
        progressLabel: '13 dari 24',
        progressUnit: 'minggu majelis bayar lancar',
        segments: segments('', 12),
        legend: [],
      },
    },
  },

  // Week 13B — paid on time throughout; Bonus ke-1 was claimed.
  'week-13b': {
    majelisStatus: 'lancar',
    majelisPage: 'bonus-majelis-berhasil',
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
        bannerTitle: 'Anda berpotensi untuk naik limit',
        bannerDescription: 'Terus jaga kelancaran pembayaran Anda.',
        progressLabel: '13 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('PPPPPPPPPPPPP', 48),
        legend: [{ tone: 'paid', label: '13x bayar' }],
        buttonLabel: 'Bayar Angsuran Rp135.000',
      },
    },
    majelisRewardLabel: 'Bonus Minyak Goreng',
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
        bannerTitle: 'Anda berpotensi mendapat hadiah',
        bannerDescription: 'Pastikan semua anggota membayar dengan lancar.',
        progressLabel: '13 dari 24',
        progressUnit: 'minggu majelis bayar lancar',
        segments: segments('', 12),
        legend: [],
      },
    },
  },

  // Week 47A — one week from the finish line; a mixed payment history.
  'week-47': {
    majelisStatus: 'lancar',
    majelisPage: 'bonus-majelis-semua-berhasil',
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
        bannerTitle: 'Anda berpotensi untuk naik limit',
        bannerDescription: 'Terus jaga kelancaran pembayaran Anda.',
        progressLabel: '47 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('PPPPPMMMMMPMPWWMPPPPMPPPPPWWWPWWPMPPWPMMPPPPPPP', 48),
        legend: [
          { tone: 'paid', label: '28x bayar' },
          { tone: 'missed', label: '11x tidak bayar' },
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

  // Week 47B — paid on time throughout.
  'week-47b': {
    majelisStatus: 'lancar',
    majelisPage: 'bonus-majelis-semua-berhasil',
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
        bannerTitle: 'Anda berpotensi untuk naik limit',
        bannerDescription: 'Terus jaga kelancaran pembayaran Anda.',
        progressLabel: '47 dari 48',
        progressUnit: 'minggu angsuran',
        segments: segments('PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP', 48),
        legend: [{ tone: 'paid', label: '47x bayar' }],
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
    majelisStatus: 'lancar',
    majelisPage: 'bonus-majelis-semua-berhasil',
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
export const applyWeek6b = () => storeD.set(homeVarDScenarios['week-6b'])
export const applyWeek10 = () => storeD.set(homeVarDScenarios['week-10'])
export const applyWeek10b = () => storeD.set(homeVarDScenarios['week-10b'])
export const applyWeek11 = () => storeD.set(homeVarDScenarios['week-11'])
export const applyWeek11b = () => storeD.set(homeVarDScenarios['week-11b'])
export const applyWeek12a = () => storeD.set(homeVarDScenarios['week-12a'])
export const applyWeek12 = () => storeD.set(homeVarDScenarios['week-12'])
export const applyWeek13 = () => storeD.set(homeVarDScenarios['week-13'])
export const applyWeek13b = () => storeD.set(homeVarDScenarios['week-13b'])
export const applyWeek47 = () => storeD.set(homeVarDScenarios['week-47'])
export const applyWeek47b = () => storeD.set(homeVarDScenarios['week-47b'])
export const applyWeek48 = () => storeD.set(homeVarDScenarios['week-48'])

// Hidden UT shortcut on Home A / Home B (Final): Poket Transfer = next,
// Isi Saldo = prev, wrapping 48 ↔ 0, so states can be switched while the
// prototype is fullscreen. Each Home walks its own user's story:
//   A — pays late       B — pays on time (other members late)
export type HomePath = 'a' | 'b'
export const PATHS: Record<HomePath, string[]> = {
  a: ['week-0', 'week-1', 'week-5', 'week-6', 'week-10', 'week-11', 'week-12a', 'week-13', 'week-47', 'week-48'],
  b: ['week-0', 'week-1', 'week-5', 'week-6b', 'week-10b', 'week-11b', 'week-12', 'week-13b', 'week-47b', 'week-48'],
}

function currentKey() {
  return Object.keys(homeVarDScenarios).find((k) => homeVarDScenarios[k] === stateD) ?? 'week-0'
}

export function stepHomeVarD(delta: 1 | -1, path: HomePath) {
  const order = PATHS[path]
  const i = Math.max(order.indexOf(currentKey()), 0)
  storeD.set(homeVarDScenarios[order[(i + delta + order.length) % order.length]])
}

/** Opening Home B on a path-A Minggu (or vice versa) moves to the same Minggu
 *  on that Home's own path, so every page downstream tells one story. */
export function alignToPath(path: HomePath) {
  const key = currentKey()
  const order = PATHS[path]
  if (order.includes(key)) return
  const other = PATHS[path === 'a' ? 'b' : 'a']
  storeD.set(homeVarDScenarios[order[Math.max(other.indexOf(key), 0)]])
}

// Two small view switches beside the Minggu, each a tiny store so the state
// controls beside the device can flip them while the screen is mounted.
function viewStore<T>(initial: T) {
  let value = initial
  const subs = new Set<() => void>()
  const get = () => value
  const subscribe = (l: () => void) => {
    subs.add(l)
    return () => subs.delete(l)
  }
  return {
    set(next: T) {
      value = next
      subs.forEach((l) => l())
    },
    use: () => useSyncExternalStore(subscribe, get, get),
  }
}

// Which status Majelis Anda shows. Set by whatever opens it — the Bonus
// majelis page passes its own status ("Bonus 1 gagal" is always Tidak Lancar,
// the rest follow the Minggu) — or by Majelis Anda's own state controls.
const majelisView = viewStore<MajelisStatus>('lancar')
export const setMajelisView = majelisView.set
export const useMajelisView = majelisView.use

// Bonus majelis shows the page for the current Minggu, except when the
// "Bonus 1 gagal" state is picked — that page has no Minggu of its own.
const bonusGagal = viewStore(false)
export const setBonusGagal = bonusGagal.set
export const useBonusGagal = bonusGagal.use

// Which disbursement the Pencairan screens show: the first one (Rp5 jt) by
// default, or the bigger one unlocked after 48 weeks — set by "Cairkan
// Sekarang" on Home (Final)'s Minggu 48 card. See lib/pencairan-ui.tsx.
const pencairanLanjutan = viewStore(false)
export const setPencairanLanjutan = pencairanLanjutan.set
export const usePencairanLanjutan = pencairanLanjutan.use

// The Home (A or B) last opened — Pencairan - Diproses goes back to it.
let homePath: HomePath = 'a'
export const setHomePath = (path: HomePath) => {
  homePath = path
}
export const getHomePath = () => homePath
