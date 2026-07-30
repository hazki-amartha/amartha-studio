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
// `bayar` is the member's payment health this cycle — lancar when true, tidak
// lancar when false; the summary pill and reminders are derived from it. Ibu
// Siti (the mitra using the app) is the ketua, flagged with `ketua`.

export interface Member {
  initials: string
  name: string
  hadir: boolean
  bayar: boolean
  ketua?: boolean
}

export const MEMBERS: Member[] = [
  { initials: 'IS', name: 'Ibu Siti', hadir: true, bayar: true, ketua: true },
  { initials: 'AK', name: 'Alen Kurnia', hadir: true, bayar: true },
  { initials: 'AN', name: 'Arin Nita', hadir: false, bayar: false },
  { initials: 'SY', name: 'Suyamti', hadir: true, bayar: false },
  { initials: 'DS', name: 'Dewi Sartika', hadir: true, bayar: true },
  { initials: 'RW', name: 'Ratna Wati', hadir: false, bayar: false },
  { initials: 'SW', name: 'Sri Wahyuni', hadir: true, bayar: true },
  { initials: 'FH', name: 'Fitri Handayani', hadir: true, bayar: false },
  { initials: 'NH', name: 'Nurul Hidayah', hadir: false, bayar: false },
  { initials: 'ML', name: 'Marlina', hadir: true, bayar: true },
]

// --- Milestone ladder ------------------------------------------------------

/** The health read shown as a pill on an upcoming rung — mirrors the worst
 *  habit on that milestone's tracker page. */
export interface MilestoneStatus {
  label: string
  tone: 'green' | 'orange' | 'red'
}

export interface Milestone {
  /** The milestone's date, e.g. "6 Oktober 2026". */
  label: string
  /** How far off it still is, e.g. "10 minggu lagi". Omitted once reached. */
  countdown?: string
  /** What the week unlocks, in the mitra's words. */
  actionLabel: string
  amount?: string
  /** Status pill on an upcoming rung, e.g. "On Track". */
  status?: MilestoneStatus
  state: 'unlocked' | 'next' | 'locked'
  /** Present on the one rung that can be acted on now. */
  cta?: string
  /** Screen id of this milestone's dedicated tracker, opened from its card. */
  detail: string
}

export const MILESTONES: Milestone[] = [
  {
    label: '14 Jul 2026',
    status: { label: 'Terbuka', tone: 'green' },
    actionLabel: 'Cairkan dana',
    amount: '+Rp1.250.000',
    state: 'unlocked',
    cta: 'Cairkan sekarang',
    detail: 'milestone-unlocked',
  },
  {
    label: '6 Okt 2026',
    status: { label: 'Sehat', tone: 'green' },
    countdown: '10 minggu lagi',
    actionLabel: 'Cairkan dana',
    amount: '+Rp1.250.000',
    state: 'next',
    detail: 'milestone-progress',
  },
  {
    label: '26 Jan 2027',
    status: { label: 'Sehat', tone: 'green' },
    countdown: '26 minggu lagi',
    actionLabel: 'Pelunasan dini dan mulai pinjaman baru',
    state: 'locked',
    detail: 'milestone-pelunasan',
  },
  {
    label: '23 Mar 2027 🏆',
    status: { label: 'Berisiko', tone: 'orange' },
    countdown: '34 minggu lagi',
    actionLabel: 'Peluang limit baru',
    amount: 's/d Rp8jt',
    state: 'locked',
    detail: 'milestone-limit',
  },
]

/** The extra capital week 12 opens — the amount the disbursement flow caps at. */
export const MILESTONE_AMOUNT = 1250000
