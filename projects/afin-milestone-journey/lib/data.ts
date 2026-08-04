// Static content for the prototype — the numbers and rows that are on screen,
// nothing more. Everything that changes as you tap lives in store.ts.

/** The weekly instalment every screen in the payment flow is denominated in. */
export const WEEKLY_BILL = 150000

/** Her approved credit limit, and how much of it she has already drawn. What
 *  is left is the difference — the same figure the ladder offers as claimable,
 *  because an undrawn limit IS what there is to disburse. */
export const LOAN_LIMIT = 5000000
export const LOAN_DRAWN = 3750000

/** When this week's instalment is due. The same week the record in HISTORY ends
 *  on and the first milestone is dated to, so the bill, the record and the goal
 *  all refer to one week rather than three. */
export const BILL_DUE = '14 Jul 2026'

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

// Twelve weeks, newest first, ending on the week of 14 Jul 2026 — the same week
// the home card and the first milestone are dated to, so the record behind the
// claim lines up with the claim itself.
export const HISTORY: WeekEntry[] = [
  { week: 12, date: '14 Jul 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 11, date: '7 Jul 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 10, date: '30 Jun 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: false },
  { week: 9, date: '23 Jun 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 8, date: '16 Jun 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 7, date: '9 Jun 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 6, date: '2 Jun 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 5, date: '26 Mei 2026', bayar: false, kumpulan: true },
  { week: 4, date: '19 Mei 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 3, date: '12 Mei 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 2, date: '5 Mei 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
  { week: 1, date: '28 Apr 2026', bayar: true, bayarAmount: 'Rp150.000', kumpulan: true },
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
  tone: 'green' | 'blue' | 'orange' | 'red'
}

export interface Milestone {
  /** The milestone's date, e.g. "6 Oktober 2026". */
  label: string
  /** How far off it still is, e.g. "10 minggu lagi". Omitted once reached. */
  countdown?: string
  /** What the rung is about. While it is still ahead of her this is the
   *  instruction — "Cairkan dana". Once the rung has collapsed (collected, or
   *  missed) it is what the rung WAS — "Pencairan tambahan". The two never
   *  appear on the same rung. */
  actionLabel: string
  /** The reward figure, always in the short "Rp1,25jt" form — a ladder is read
   *  by comparing rungs, and full rupiah runs to a different width on every
   *  one. A rung she can act on states one figure, because the amount is
   *  settled; a rung still ahead states the band it is estimated at, with the
   *  upper bound in `amountTo`. */
  amount?: string
  amountTo?: string
  /** What could lift the figure beyond `amount` — on the limit rise, the
   *  majelis's own payment record. Drawn as a tinted band at the card's foot,
   *  with `strong` picked out, so the ceiling is legible without promising it. */
  footnote?: { before: string; strong: string; after: string }
  /** Status pill on an upcoming rung, e.g. "On Track". */
  status?: MilestoneStatus
  state: 'unlocked' | 'next' | 'locked' | 'missed'
  /** The primary button's label when the rung can be acted on now — solid and
   *  purple, e.g. "Cairkan" / "Mulai". Without one, only the `next` rung gets a
   *  control: an outline "Lihat" into its tracker. */
  cta?: string
  /** Screen id of this milestone's dedicated tracker, opened from its card. */
  detail: string
}

/** Every pencairan rung still ahead of her carries the same estimate — the
 *  band the disbursement is expected to land in, not a single figure the
 *  product has not committed to yet. */
const PENCAIRAN_ESTIMATE = { amount: 'Rp1,25jt', amountTo: 'Rp1,5jt' }

/** The majelis condition on the limit rise. Her own record earns the figure on
 *  the card; the majelis's record is what lifts it to the ceiling — so the
 *  ceiling is stated as a possibility, in its own band, rather than as the
 *  headline number. */
const majelisUplift = (ceiling: string) => ({
  before: 'Bisa',
  strong: `s/d ${ceiling}`,
  after: 'jika performa pembayaran Majelis juga bagus',
})

export const MILESTONES: Milestone[] = [
  {
    label: '14 Jul 2026',
    status: { label: 'Sesuai rencana', tone: 'blue' },
    countdown: '2 minggu lagi',
    actionLabel: 'Cairkan dana',
    ...PENCAIRAN_ESTIMATE,
    state: 'next',
    detail: 'milestone-progress',
  },
  {
    label: '6 Okt 2026',
    status: { label: 'Sesuai rencana', tone: 'blue' },
    countdown: '14 minggu lagi',
    actionLabel: 'Cairkan dana',
    ...PENCAIRAN_ESTIMATE,
    state: 'locked',
    detail: 'milestone-progress',
  },
  {
    label: '26 Jan 2027',
    status: { label: 'Sesuai rencana', tone: 'blue' },
    countdown: '30 minggu lagi',
    actionLabel: 'Pelunasan dini dan mulai pinjaman baru',
    state: 'locked',
    detail: 'milestone-pelunasan',
  },
  {
    label: '23 Mar 2027 🏆',
    status: { label: 'Berisiko', tone: 'orange' },
    countdown: '38 minggu lagi',
    actionLabel: 'Peningkatan limit',
    amount: 's/d Rp7jt',
    footnote: majelisUplift('8jt'),
    state: 'locked',
    detail: 'milestone-limit',
  },
]

// --- Journey phases (progress-page demo states) ----------------------------
// Each phase is a snapshot of the ladder at a different point in time. `default`
// is the entry view (MILESTONES above) — today is BEFORE 14 Jul, so nothing has
// been unlocked or missed yet and the first rung is simply the next goal. The
// rest are seeded by the state controls on the progress screen. A rung that has
// been reached but not acted on carries a solid `cta`; once it's cair'd it stays
// on the ladder as a collected rung, and only a closed cycle clears the page.

export type JourneyPhase =
  | 'default'
  | 'sisalimit'
  | 'jul'
  | 'gagal'
  | 'okt'
  | 'jan'
  | 'mar'
  | 'newloan'

export const MILESTONE_SETS: Record<JourneyPhase, Milestone[]> = {
  default: MILESTONES,

  // Still before 14 Jul, but she never drew her whole limit: the leftover sits at the TOP
  // of the ladder as a rung that is already open — no waiting, no habits to
  // keep, the money is hers to take. It is dated the day the loan started
  // rather than a milestone week, because that is when the remainder appeared.
  sisalimit: [
    {
      label: '28 Apr',
      status: { label: 'Terbuka', tone: 'green' },
      actionLabel: 'Dapat dicairkan',
      amount: 'Rp2,5jt',
      state: 'unlocked',
      cta: 'Cairkan',
      detail: 'milestone-unlocked',
    },
    ...MILESTONES,
  ],

  // The week itself: 14 Jul is reached and ready to cair, and 6 Okt becomes the
  // goal ahead.
  jul: [
    {
      label: '14 Jul 2026',
      status: { label: 'Berhasil diraih', tone: 'green' },
      actionLabel: 'Cairkan dana',
      amount: 'Rp1,25jt',
      state: 'unlocked',
      cta: 'Cairkan',
      detail: 'milestone-unlocked',
    },
    {
      label: '6 Okt 2026',
      status: { label: 'Sesuai rencana', tone: 'blue' },
      countdown: '10 minggu lagi',
      actionLabel: 'Cairkan dana',
      ...PENCAIRAN_ESTIMATE,
      state: 'next',
      detail: 'milestone-progress',
    },
    {
      label: '26 Jan 2027',
      status: { label: 'Sesuai rencana', tone: 'blue' },
      countdown: '26 minggu lagi',
      actionLabel: 'Pelunasan dini dan mulai pinjaman baru',
      state: 'locked',
      detail: 'milestone-pelunasan',
    },
    {
      label: '23 Mar 2027 🏆',
      status: { label: 'Berisiko', tone: 'orange' },
      countdown: '34 minggu lagi',
      actionLabel: 'Peningkatan limit',
      amount: 's/d Rp7jt',
      footnote: majelisUplift('8jt'),
      state: 'locked',
      detail: 'milestone-limit',
    },
  ],

  // The first goal was missed — it shows Gagal instead of Berhasil diraih, and
  // the rung collapses: there is no figure to state and nothing left to do.
  gagal: [
    {
      label: '14 Jul 2026',
      status: { label: 'Gagal', tone: 'red' },
      actionLabel: 'Pencairan tambahan',
      state: 'missed',
      detail: 'milestone-missed',
    },
    {
      label: '6 Okt 2026',
      status: { label: 'Sesuai rencana', tone: 'blue' },
      countdown: '10 minggu lagi',
      actionLabel: 'Cairkan dana',
      ...PENCAIRAN_ESTIMATE,
      state: 'next',
      detail: 'milestone-progress',
    },
    {
      label: '26 Jan 2027',
      status: { label: 'Sesuai rencana', tone: 'blue' },
      countdown: '26 minggu lagi',
      actionLabel: 'Pelunasan dini dan mulai pinjaman baru',
      state: 'locked',
      detail: 'milestone-pelunasan',
    },
    {
      label: '23 Mar 2027 🏆',
      status: { label: 'Berisiko', tone: 'orange' },
      countdown: '34 minggu lagi',
      actionLabel: 'Peningkatan limit',
      amount: 's/d Rp7jt',
      footnote: majelisUplift('8jt'),
      state: 'locked',
      detail: 'milestone-limit',
    },
  ],

  // Today is 6 Okt. The 14 Jul rung stays on the ladder as a collected
  // achievement — the cycle's record is the page's whole point, so nothing
  // leaves it until the cycle itself ends. 6 Okt is reached and ready to cair;
  // 26 Jan is the goal she is now working toward.
  //
  // Rungs of the SAME kind accumulate: an earned pencairan she has not drawn
  // yet rolls into the next one, so the newest rung states the whole sum
  // (Rp1,25jt + Rp1,25jt = Rp2,5jt) and the rung it came from gives up its
  // figure and its button. One live amount, in one place — the alternative is
  // two cards each offering money and no way to tell whether taking one
  // forfeits the other.
  okt: [
    {
      label: '14 Jul 2026',
      status: { label: 'Berhasil diraih', tone: 'green' },
      actionLabel: 'Pencairan tambahan',
      state: 'unlocked',
      detail: 'milestone-unlocked',
    },
    {
      label: '6 Okt 2026',
      status: { label: 'Berhasil diraih', tone: 'green' },
      actionLabel: 'Cairkan dana',
      amount: 'Rp2,5jt',
      state: 'unlocked',
      cta: 'Cairkan',
      detail: 'milestone-unlocked',
    },
    {
      label: '26 Jan 2027',
      status: { label: 'Sesuai rencana', tone: 'blue' },
      countdown: '16 minggu lagi',
      actionLabel: 'Pelunasan dini dan mulai pinjaman baru',
      state: 'next',
      detail: 'milestone-pelunasan',
    },
    {
      label: '23 Mar 2027 🏆',
      status: { label: 'Berisiko', tone: 'orange' },
      countdown: '24 minggu lagi',
      actionLabel: 'Peningkatan limit',
      amount: 's/d Rp7jt',
      footnote: majelisUplift('8jt'),
      state: 'locked',
      detail: 'milestone-limit',
    },
  ],

  // Today is 26 Jan: the pelunasan is reached and still awaiting its action,
  // with the limit rise now the goal ahead. The two pencairan rungs behind it
  // have accumulated the same way they do in `okt` — Rp2,5jt on the newest of
  // them, and nothing on the one it absorbed.
  jan: [
    {
      label: '14 Jul 2026',
      status: { label: 'Berhasil diraih', tone: 'green' },
      actionLabel: 'Pencairan tambahan',
      state: 'unlocked',
      detail: 'milestone-unlocked',
    },
    {
      label: '6 Okt 2026',
      status: { label: 'Berhasil diraih', tone: 'green' },
      actionLabel: 'Cairkan dana',
      amount: 'Rp2,5jt',
      state: 'unlocked',
      cta: 'Cairkan',
      detail: 'milestone-unlocked',
    },
    {
      label: '26 Jan 2027',
      status: { label: 'Berhasil diraih', tone: 'green' },
      actionLabel: 'Pelunasan dini dan mulai pinjaman baru',
      state: 'unlocked',
      cta: 'Mulai',
      detail: 'milestone-pelunasan',
    },
    {
      label: '23 Mar 2027 🏆',
      status: { label: 'Berisiko', tone: 'orange' },
      countdown: '8 minggu lagi',
      actionLabel: 'Peningkatan limit',
      amount: 's/d Rp7jt',
      footnote: majelisUplift('8jt'),
      state: 'next',
      detail: 'milestone-limit',
    },
  ],

  // Today is 23 Mar. The limit rise is the last rung of the cycle and nothing
  // sits beyond it, so IT carries the next-goal marker: reached, and still the
  // thing she is here to do. The cycle's earlier rungs stay above it.
  mar: [
    {
      label: '14 Jul 2026',
      status: { label: 'Berhasil diraih', tone: 'green' },
      actionLabel: 'Pencairan tambahan',
      state: 'unlocked',
      detail: 'milestone-unlocked',
    },
    {
      label: '6 Okt 2026',
      status: { label: 'Berhasil diraih', tone: 'green' },
      actionLabel: 'Pencairan tambahan',
      state: 'unlocked',
      detail: 'milestone-unlocked',
    },
    {
      label: '26 Jan 2027',
      status: { label: 'Berhasil diraih', tone: 'green' },
      actionLabel: 'Pelunasan dini',
      state: 'unlocked',
      detail: 'milestone-pelunasan',
    },
    {
      // Reached, so the ceiling is settled and stated flat — no "s/d", and no
      // majelis footnote: there is nothing left to condition it on.
      label: '23 Mar 2027 🏆',
      status: { label: 'Berhasil diraih', tone: 'green' },
      actionLabel: 'Peningkatan limit',
      amount: 'Rp8jt',
      state: 'next',
      cta: 'Cairkan',
      detail: 'milestone-unlocked',
    },
  ],

  // The limit rise was unlocked AND cair'd, so the cycle closed: a fresh ladder
  // every ~12 weeks toward a Rp10jt ceiling, and the previous cycle's rungs
  // leave the page — they are the ONE thing that clears it. They stay reachable
  // through the "capaian siklus sebelumnya" link at the foot of the page.
  newloan: [
    {
      label: '15 Jun 2027',
      status: { label: 'Berhasil diraih', tone: 'green' },
      actionLabel: 'Cairkan dana',
      amount: 'Rp2jt',
      state: 'unlocked',
      cta: 'Cairkan',
      detail: 'milestone-unlocked',
    },
    {
      label: '7 Sep 2027',
      status: { label: 'Sesuai rencana', tone: 'blue' },
      countdown: '12 minggu lagi',
      actionLabel: 'Cairkan dana',
      amount: 'Rp2jt',
      amountTo: 'Rp2,4jt',
      state: 'next',
      detail: 'milestone-progress',
    },
    {
      label: '30 Nov 2027',
      status: { label: 'Sesuai rencana', tone: 'blue' },
      countdown: '24 minggu lagi',
      actionLabel: 'Pelunasan dini dan mulai pinjaman baru',
      state: 'locked',
      detail: 'milestone-pelunasan',
    },
    {
      label: '22 Feb 2028 🏆',
      status: { label: 'Berisiko', tone: 'orange' },
      countdown: '36 minggu lagi',
      actionLabel: 'Peningkatan limit',
      amount: 's/d Rp9jt',
      footnote: majelisUplift('10jt'),
      state: 'locked',
      detail: 'milestone-limit',
    },
  ],
}

/** True once a cycle has closed — the naik-limit milestone unlocked and cair'd.
 *  The ladder starts over, so the page offers a way back to the cycle before it. */
export const hasPreviousCycle = (phase: JourneyPhase) => phase === 'newloan'

/** The rung with money on the table right now, if there is one. A rung only
 *  ever carries a `cta` once it has been reached, so a "Cairkan" that is still
 *  sitting there IS the open limit — already summed, because undrawn pencairan
 *  accumulates onto the newest rung. Home reads this to decide whether to offer
 *  the disbursement row at all; the ladder stays the single source of what she
 *  can take, so the two screens can never disagree about the figure. */
export const claimableOf = (phase: JourneyPhase) =>
  MILESTONE_SETS[phase].find((m) => m.cta === 'Cairkan')

/** The extra capital week 12 opens — the amount the disbursement flow caps at. */
export const MILESTONE_AMOUNT = 1250000
