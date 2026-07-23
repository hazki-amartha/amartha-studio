// Static content for the prototype — the numbers and rows that are on screen,
// nothing more. Everything that changes as you tap lives in store.ts.

/** The weekly instalment every screen in the payment flow is denominated in. */
export const WEEKLY_BILL = 150000

/** Rupiah, Indonesian grouping. The only number formatter this project uses. */
export const rupiah = (n: number) => `Rp${Math.round(n).toLocaleString('id-ID')}`

// --- Payment methods -------------------------------------------------------

export type MethodId =
  | 'poket'
  | 'va-bca'
  | 'va-mandiri'
  | 'transfer'
  | 'indomaret'
  | 'amartha-link'

export interface PaymentMethod {
  id: MethodId
  name: string
  /** Second line under the name. Poket's is generated from the live balance. */
  sub?: string
  badge?: string
}

export const METHODS: PaymentMethod[] = [
  { id: 'poket', name: 'Poket', badge: 'Amartha Wallet' },
  { id: 'va-bca', name: 'Virtual Account BCA', sub: 'ATM, m-BCA, atau BCA mobile' },
  { id: 'va-mandiri', name: 'Virtual Account Mandiri', sub: "ATM atau Livin' by Mandiri" },
  { id: 'transfer', name: 'Transfer bank', sub: 'Konfirmasi otomatis 5–15 menit' },
  { id: 'indomaret', name: 'Indomaret / Alfamart', sub: 'Bayar tunai di kasir minimarket' },
  { id: 'amartha-link', name: 'Agen Amartha Link', sub: 'Bayar tunai ke agen terdekat' },
]

export const methodName = (id: MethodId | null) =>
  METHODS.find((m) => m.id === id)?.name ?? ''

// --- Payment & attendance history -----------------------------------------

export interface WeekEntry {
  week: number
  date: string
  bayar: boolean
  /** Only set when `bayar` — the history table prints the amount, not a tick. */
  bayarAmount?: string
  kumpulan: boolean
}

export const HISTORY: WeekEntry[] = [
  { week: 14, date: '19 Agu 2024', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 13, date: '12 Agu 2024', bayar: true, bayarAmount: 'Rp150.000', kumpulan: false },
  { week: 12, date: '5 Agu 2024', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 11, date: '29 Jul 2024', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 10, date: '22 Jul 2024', bayar: false, kumpulan: true },
  { week: 9, date: '15 Jul 2024', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 8, date: '8 Jul 2024', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
]

// --- Majelis roster --------------------------------------------------------
// Shown for the current week only, so `hadir` / `bayar` are this week's facts
// and the summary pill at the top is derived from them.

export interface Member {
  initials: string
  name: string
  hadir: boolean
  bayar: boolean
}

export const MEMBERS: Member[] = [
  { initials: 'IS', name: 'Ibu Siti (Ketua Majelis)', hadir: true, bayar: true },
  { initials: 'ML', name: 'Marlina', hadir: false, bayar: true },
  { initials: 'NH', name: 'Nur Hasanah', hadir: false, bayar: false },
  { initials: 'YL', name: 'Yulianti', hadir: false, bayar: false },
  { initials: 'SR', name: 'Siti Rahayu', hadir: true, bayar: true },
]

// --- Milestone ladder ------------------------------------------------------

export interface Milestone {
  label: string
  /** What the week unlocks, in the mitra's words. */
  actionLabel: string
  amount?: string
  tag?: string
  weeksLeft?: string
  /** Fill of the progress meter, 0–100. Only set alongside `weeksLeft`. */
  pct?: number
  state: 'unlocked' | 'next' | 'locked'
  /** Present on the one rung that can be acted on now. */
  cta?: string
}

export const MILESTONES: Milestone[] = [
  {
    label: 'Minggu 12',
    actionLabel: 'Cairkan dana',
    amount: '+Rp1.250.000',
    state: 'unlocked',
    cta: 'Cairkan sekarang',
  },
  {
    label: 'Minggu 24',
    tag: '🎯 Target berikutnya',
    actionLabel: 'Cairkan dana',
    amount: '+Rp1.250.000',
    weeksLeft: '10 minggu tersisa',
    pct: 17,
    state: 'next',
  },
  {
    label: 'Minggu 40',
    actionLabel: 'Pelunasan dini dan kesempatan naik limit',
    state: 'locked',
  },
  {
    label: 'Minggu 48 🏆',
    actionLabel: 'Limit baru',
    amount: 'Rp8jt',
    state: 'locked',
  },
]

/** The extra capital week 12 opens — the amount the disbursement flow caps at. */
export const MILESTONE_AMOUNT = 1250000
