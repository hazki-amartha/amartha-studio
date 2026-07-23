// Mock data for the Majelis View direction. One majelis, one roster, and — the
// thing that makes this direction different from apartner-task-first — a
// week-by-week repayment record for every mitra.
//
// That record is not decoration. It is the SOURCE of every number the collect
// flow prints: what she owes this week, what she missed, what is left over from
// a part-payment, and therefore what "sisa setelah ini" says as the BP types an
// amount. Deriving all four from one ledger rather than authoring them as four
// separate figures is what stops the screens contradicting each other — which
// the reference mocks do: their week strip and their outstanding breakdown
// don't add up to the same total.

export type WeekStatus = 'lunas' | 'sebagian' | 'lewat' | 'jatuh-tempo'

export interface Week {
  /** 1-based index in the cycle. */
  no: number
  /** "11 Jun" — the date that instalment fell on. */
  date: string
  /** Rupiah actually received that week. 0 = missed. */
  paid: number
  /** What was due that week — the same weekly instalment throughout. */
  due: number
  status: WeekStatus
}

/**
 * A growth opportunity — the third stage's subject. At most one per mitra: the
 * step is a tail on a collection visit, so it stays capped rather than quietly
 * becoming a second queue.
 */
export interface Growth {
  /** What is on offer — "Naik plafon", "Celengan", "PPOB". */
  label: string
  /** Where she stands on it. A FACT, not a pitch; the BP draws the conclusion. */
  status: string
  /** The verb on the button — "Diskusikan", "Buka Celengan", "Aktifkan". */
  action: string
  /** Past tense, for once it has been done. */
  done: string
}

export interface Mitra {
  id: string
  name: string
  /**
   * The product she borrows on. A majelis can carry both at once — a Hybrid
   * group is exactly that — and the two behave differently at the door: a GL
   * mitra's arrears are the group's problem, a Modal mitra's are her own.
   */
  product: 'Modal' | 'GL'
  /**
   * A promise already on file, made before this visit — "janji bayar 24 Jul".
   * It is on the ROSTER rather than only in the collect flow because a BP who
   * walks up to a mitra without knowing she already promised a date is a BP who
   * asks for the whole amount and gets the argument that follows.
   */
  ptp?: string
  /** Approved relief — rescheduled or reduced. Says "do not press her". */
  keringanan?: boolean
  /** The contract's principal — "Pinjaman Rp8.000.000" in the page header. */
  loan: number
  /** The weekly instalment. Constant across the cycle. */
  weekly: number
  /** Days past due; 0 = current. */
  dpd: number
  /** Which week of the cycle this visit falls on. */
  week: number
  /** Cycle length. 50 weeks throughout, per the reference. */
  totalWeeks: number
  /** Her ledger, week 1 up to and including this week. */
  weeks: Week[]
  growth?: Growth
}

export interface Majelis {
  id: string
  name: string
  place: string
  /** The weekly pelayanan slot. */
  schedule: string
  /** The Ketua Majelis — exactly one mitra, and the BP's way into the group. */
  ketuaId: string
  members: Mitra[]
}

// --- Building a ledger -----------------------------------------------------

// Dates run backwards from this week's meeting, so week N carries the date it
// actually fell on. The prototype's "today" is pinned rather than read from the
// clock: a demo that silently re-dates itself overnight is worse than one that
// is honestly fixed.
const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const TODAY = new Date(2026, 6, 21) // Selasa, 21 Juli 2026

function weekDate(weeksBack: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - weeksBack * 7)
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]}`
}

/**
 * Builds the ledger for one mitra.
 *
 * `missed` lists the week numbers she paid nothing on; `partial` maps a week
 * number to what she actually handed over. Every other week was paid in full.
 * The CURRENT week is always `jatuh-tempo` — it is the bill this visit exists
 * to collect, and nothing has answered it yet.
 */
function ledger(
  weekly: number,
  week: number,
  missed: number[] = [],
  partial: Record<number, number> = {},
): Week[] {
  const out: Week[] = []
  for (let no = 1; no <= week; no += 1) {
    const date = weekDate(week - no)
    if (no === week) {
      out.push({ no, date, paid: 0, due: weekly, status: 'jatuh-tempo' })
    } else if (missed.includes(no)) {
      out.push({ no, date, paid: 0, due: weekly, status: 'lewat' })
    } else if (partial[no] !== undefined) {
      out.push({ no, date, paid: partial[no], due: weekly, status: 'sebagian' })
    } else {
      out.push({ no, date, paid: weekly, due: weekly, status: 'lunas' })
    }
  }
  return out
}

// --- What she owes ---------------------------------------------------------
// Three separate debts, and the collect page names all three rather than
// printing one fused total. "Rp650.000" on its own is a number to be argued
// with; "this week 200 + two missed weeks 400 + a 50 shortfall" is a number to
// be explained, which is what the BP is actually doing at the door.

export interface Outstanding {
  /** This week's instalment. */
  thisWeek: number
  /** The weeks she paid nothing on. */
  missed: number
  missedWeeks: number
  /** What is left over from weeks she part-paid. */
  partial: number
  /** The sum — what "Bayar Penuh" collects. */
  total: number
}

/**
 * What is left of the whole loan — principal minus every rupiah received so far.
 *
 * A different question from `outstandingOf`, and the mitra page prints both
 * side by side: "total tagihan" is what she owes TODAY, "total outstanding" is
 * what she still owes at all. Derived from the same ledger as everything else,
 * so the two lines can never drift apart.
 */
export function outstandingBalanceOf(mitra: Mitra): number {
  const paid = mitra.weeks.reduce((sum, w) => sum + w.paid, 0)
  return Math.max(0, mitra.loan - paid)
}

export function outstandingOf(mitra: Mitra): Outstanding {
  let missed = 0
  let missedWeeks = 0
  let partial = 0
  mitra.weeks.forEach((w) => {
    if (w.status === 'lewat') {
      missed += w.due
      missedWeeks += 1
    } else if (w.status === 'sebagian') {
      partial += w.due - w.paid
    }
  })
  const thisWeek = mitra.weekly
  return { thisWeek, missed, missedWeeks, partial, total: thisWeek + missed + partial }
}

// --- The roster ------------------------------------------------------------
// Rina is the hero case, and her ledger is authored to land on exactly the
// reference's arithmetic: this week 200.000 + two missed weeks 400.000 + a
// 50.000 shortfall = 650.000. So "minggu ini saja" leaves 450.000 and a custom
// 300.000 leaves 350.000 — both figures appear in the reference, and neither is
// hardcoded here; they fall out of the ledger.

const ACTIVE: Mitra[] = [
  {
    id: 'm1',
    name: 'Rina Marlina',
    product: 'Modal',
    loan: 8_000_000,
    weekly: 200_000,
    dpd: 34,
    week: 9,
    totalWeeks: 50,
    weeks: ledger(200_000, 9, [6, 8], { 7: 150_000 }),
    growth: {
      label: 'Naik plafon',
      status: 'Layak naik ke Rp10.000.000',
      action: 'Diskusikan',
      done: 'Sudah didiskusikan',
    },
  },
  {
    id: 'm2',
    name: 'Ani Suryani',
    product: 'GL',
    ptp: '24 Jul',
    loan: 6_000_000,
    weekly: 150_000,
    dpd: 7,
    week: 9,
    totalWeeks: 50,
    weeks: ledger(150_000, 9, [8]),
    growth: {
      label: 'Celengan',
      status: 'Belum pernah menabung',
      action: 'Buka Celengan',
      done: 'Celengan dibuka',
    },
  },
  {
    id: 'm3',
    name: 'Sari Handayani',
    product: 'Modal',
    loan: 5_000_000,
    weekly: 125_000,
    dpd: 0,
    week: 9,
    totalWeeks: 50,
    weeks: ledger(125_000, 9),
    growth: {
      label: 'PPOB',
      status: 'Belum ada transaksi digital',
      action: 'Aktifkan',
      done: 'PPOB diaktifkan',
    },
  },
  {
    id: 'm4',
    name: 'Dewi Lestari',
    product: 'GL',
    loan: 7_000_000,
    weekly: 175_000,
    dpd: 0,
    week: 9,
    totalWeeks: 50,
    weeks: ledger(175_000, 9),
    growth: {
      label: 'Naik plafon',
      status: 'Layak naik ke Rp9.000.000',
      action: 'Diskusikan',
      done: 'Sudah didiskusikan',
    },
  },
  {
    id: 'm5',
    name: 'Siti Aminah',
    product: 'Modal',
    loan: 6_500_000,
    weekly: 200_000,
    dpd: 0,
    week: 9,
    totalWeeks: 50,
    weeks: ledger(200_000, 9),
  },
  {
    id: 'm6',
    name: 'Yanti Rohayati',
    product: 'GL',
    keringanan: true,
    loan: 5_500_000,
    weekly: 150_000,
    dpd: 14,
    week: 9,
    totalWeeks: 50,
    weeks: ledger(150_000, 9, [7, 8]),
  },
  {
    id: 'm7',
    name: 'Eni Nuraeni',
    product: 'Modal',
    loan: 4_000_000,
    weekly: 125_000,
    dpd: 0,
    week: 9,
    totalWeeks: 50,
    weeks: ledger(125_000, 9),
  },
]

/**
 * The 15 who settled before the BP opened the page — through the app, or handed
 * to the ketua earlier in the week.
 *
 * They are seeded as PRESENT as well as paid. A blocking attendance step that
 * demanded 22 taps before any money could be collected would make the gate the
 * most annoying screen in the flow for no information gained; a mitra who paid
 * this week is the safest available default for "she was here", and the BP can
 * still change any of them.
 */
const PREPAID_NAMES = [
  'Nurhayati',
  'Tuti Herawati',
  'Wiwin Winarti',
  'Imas Masitoh',
  'Euis Kurniasih',
  'Lilis Suryani',
  'Ratna Dewi',
  'Mimin Mintarsih',
  'Cucu Sumiati',
  'Ineu Rohaeni',
  'Popon Sopiah',
  'Yuyun Yuningsih',
  'Dedeh Kurniati',
  'Neneng Hasanah',
  'Ai Nurjanah',
]

const WEEKLY_STEPS = [125_000, 150_000, 175_000, 200_000]

export const PREPAID: Mitra[] = PREPAID_NAMES.map((name, i) => {
  const weekly = WEEKLY_STEPS[i % WEEKLY_STEPS.length]
  return {
    id: `p${i + 1}`,
    name,
    // Alternating, so the roster shows a Hybrid majelis as one actually is:
    // two products in one room, not a label on the group.
    product: i % 2 === 0 ? ('Modal' as const) : ('GL' as const),
    loan: weekly * 40,
    weekly,
    dpd: 0,
    week: 9,
    totalWeeks: 50,
    weeks: ledger(weekly, 9),
  }
})

/**
 * She paid without the BP in the room — the app, an agent, a transfer to the
 * ketua. The flow needs to tell that apart from money the BP collected, so the
 * penagihan queue can skip her outright instead of asking for a tagih that
 * already happened.
 */
export const isSelfServe = (mitra: Mitra): boolean => mitra.id.startsWith('p')

export const MAJELIS: Majelis = {
  id: 'mawar',
  name: 'Majelis Mawar',
  place: 'Balai RW 04, Ciseeng',
  schedule: 'Selasa, 08.00 · 21 Juli 2026',
  // Sari is the chair: current, mid-tenure, and the one the BP calls when the
  // group needs telling something. A KM in arrears is a different prototype.
  ketuaId: 'm3',
  members: [...ACTIVE, ...PREPAID],
}

// --- Home visits -----------------------------------------------------------
// The single-mitra counterpart to a pelayanan: the BP rides to ONE borrower's
// house, because she is far enough behind that a majelis collection is no
// longer going to reach her.
//
// They get the SAME ledger every majelis member has, which is the whole reason
// this direction can carry a home visit at all: the doorstep amount, the
// shortfall, the week strip on her page and the "sisa setelah ini" line are all
// derived from the record rather than authored as a figure per screen.

export const HOME_MITRA: Mitra[] = [
  {
    id: 'h1',
    name: 'Wati Nurhasanah',
    product: 'Modal',
    loan: 6_000_000,
    weekly: 150_000,
    dpd: 63,
    week: 20,
    totalWeeks: 50,
    // Nine straight weeks with nothing paid — 63 days, past the point a weekly
    // pelayanan recovers her, which is why she is a home visit at all.
    weeks: ledger(150_000, 20, [11, 12, 13, 14, 15, 16, 17, 18, 19]),
  },
  {
    id: 'h2',
    name: 'Elin Herlina',
    product: 'GL',
    ptp: 'hari ini',
    loan: 5_000_000,
    weekly: 125_000,
    dpd: 7,
    week: 20,
    // One missed week and a promise she made for today — the ordinary case,
    // where the visit is a nudge rather than a recovery.
    totalWeeks: 50,
    weeks: ledger(125_000, 20, [19]),
  },
]

export const findMitra = (id: string): Mitra =>
  MAJELIS.members.find((m) => m.id === id) ??
  HOME_MITRA.find((m) => m.id === id) ??
  MAJELIS.members[0]

/** Everyone with something to offer — the third stage's list. */
export const growthMembers = (): Mitra[] => MAJELIS.members.filter((m) => m.growth)

/** "Rp 1.400.000" — the format everywhere the number is the subject. */
export function rupiah(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`
}

/**
 * "Rp200rb" — the short form, used ONLY inside the week strip, where a 48px
 * cell cannot hold "Rp 200.000" and 50 of them sit side by side. Everywhere the
 * amount is something the BP says out loud or types, it is printed in full.
 */
export function ringkas(value: number): string {
  if (value === 0) return 'Rp0'
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toLocaleString('id-ID')}jt`
  return `Rp${Math.round(value / 1000)}rb`
}
