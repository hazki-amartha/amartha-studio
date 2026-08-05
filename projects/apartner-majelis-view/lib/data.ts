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
  /**
   * Which kind of opportunity this is. Three, and the split matters on the
   * stage-3 card: a RENEWAL rests on how far through her current loan she is, a
   * top-up (`disburse`) on limit she has not drawn, a `celengan` on whether she
   * saves at all. Each one's caption is a different fact.
   */
  kind: 'celengan' | 'disburse' | 'renewal'
  /**
   * What the offer is called. It names the offer on a card that has already been
   * answered — a record of what was put to her.
   */
  label: string
  /**
   * Where SHE stands, as the stage-3 card's CAPTION — the fact the suggestion
   * rests on. A renewal leaves this off: its standing is her position in the
   * current loan, which `growthStat` derives from the ledger so the card and her
   * repayment history can never disagree.
   */
  status?: string
  /**
   * What to SAY — the suggestion, set bold under the caption. The card used to
   * print "Peluang" over her status, which spent the loud line on a label that
   * was the same word on all four cards and left the BP to work out what to do
   * about it. Caption states the fact, value states the move.
   *
   * The MOVE, without its figure — the card appends `value` to it, so the
   * headline reads "Tawarkan renewal Rp9.000.000." in one line. A celengan has
   * no figure to append: what it costs is a weekly amount she chooses, which is
   * a conversation rather than a number the card can state.
   */
  suggestion: string
  /** The headline figure, said out loud when the subject is opened. */
  value: string
  /**
   * WHY this is being put to her, in the BP's own reading order: the fact that
   * triggered the recommendation and what to do about it. It sits under the
   * headline on the stage-3 card, which is where the offer is now decided —
   * the BP answers in the room, so the argument has to be on the card rather
   * than a tap away on a page she no longer opens.
   */
  rationale: string
  /** Past tense, for once it has been done. */
  done: string
}

/**
 * The caption on a stage-3 card: where she stands, in her own numbers. A
 * renewal reads it off the ledger — "Pinjaman ke-1 · minggu 44/50" is the whole
 * argument for renewing, and hardcoding it would let it drift from the
 * repayment history her mitra page draws from the same weeks.
 */
export function growthStat(mitra: Mitra): string {
  const g = mitra.growth
  if (!g) return ''
  if (g.status) return g.status
  return `Pinjaman ke-1 · minggu ${mitra.week}/${mitra.totalWeeks}`
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
  /** The rupiah she promised on that janji bayar — what the visit expects. */
  ptpAmount?: number
  /** Approved relief — rescheduled or reduced. Says "do not press her". */
  keringanan?: boolean
  /**
   * A new mitra whose loan is approved but not yet disbursed. She has no DPD and
   * no ledger to press against — the standing label is the disbursement waiting
   * to happen, not a bucket.
   */
  predisburse?: boolean
  /**
   * She has been granted an early settlement — she may close the contract ahead
   * of its 50 weeks. It rides beside her DPD rather than replacing it: unlike a
   * pre-disbursement mitra she has a real ledger and a real bucket, and the
   * standing fact is what she is ALLOWED to do, not where she stands.
   */
  pelunasanDini?: boolean
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
 * "23 Des 2025" — a date carrying its YEAR, for a list that runs past the turn
 * of one. An instalment schedule 50 weeks long does exactly that, and "23 Des"
 * beside "6 Jan" in the same column is two years pretending to be one.
 */
export function dateWithYear(weeksBack: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - weeksBack * 7)
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
}

const MONTHS_FULL = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

/**
 * "23 April 2025" — the long form, for dates that are read once rather than
 * scanned in a row. The week strip cannot afford it; a disbursement record has
 * nothing else on the line and a bare "23 Apr" there is a date without a year,
 * which on a two-cycle history is exactly the ambiguity that matters.
 */
export function fullDate(weeksBack: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - weeksBack * 7)
  return `${d.getDate()} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`
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

/**
 * The last instalment that actually landed — the most recent week she paid
 * anything on, with the date it fell on and the rupiah received. Read straight
 * off the ledger, so it can never disagree with the week strip above it. Returns
 * null for a mitra who has paid nothing yet.
 */
export function lastPaymentOf(mitra: Mitra): { date: string; amount: number } | null {
  for (let i = mitra.weeks.length - 1; i >= 0; i -= 1) {
    const w = mitra.weeks[i]
    if (w.paid > 0) return { date: w.date, amount: w.paid }
  }
  return null
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
    keringanan: true,
    loan: 8_000_000,
    weekly: 200_000,
    dpd: 34,
    week: 9,
    totalWeeks: 50,
    weeks: ledger(200_000, 9, [6, 8], { 7: 150_000 }),
    growth: {
      kind: 'celengan',
      label: 'Celengan',
      status: 'Belum pernah menabung',
      suggestion: 'Tawarkan celengan',
      value: 'Mulai Rp10.000/minggu',
      done: 'Celengan dibuka',
      rationale:
        'Mitra belum pernah menabung di Amartha. Ajak mulai dari Rp10.000 per minggu, disetor bersama angsuran.',
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
      kind: 'celengan',
      label: 'Celengan',
      status: 'Celengan berhenti 3 minggu',
      suggestion: 'Lanjutkan celengan',
      value: 'Mulai Rp10.000/minggu',
      done: 'Celengan dilanjutkan',
      rationale:
        'Setoran celengan mitra sudah berhenti selama 3 minggu. Ajak kembali menabung supaya kebiasaannya tidak putus.',
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
      kind: 'disburse',
      label: 'Tambahan Pembiayaan',
      status: 'Limit tersedia Rp5.000.000',
      suggestion: 'Tawarkan disbursement',
      value: 'Rp5.000.000',
      done: 'Pengajuan dikirim',
      rationale:
        'Limit mitra masih tersedia Rp5.000.000 dan angsurannya lancar. Tawarkan bertahap untuk menjaga kualitas angsuran.',
    },
  },
  {
    id: 'm4',
    name: 'Dewi Lestari',
    product: 'GL',
    loan: 7_000_000,
    weekly: 175_000,
    dpd: 0,
    // The one mitra late in her cycle. Everyone else on this roster is at week
    // 9, which is right for the collection stages — a group takes a loan
    // together — but it left the offer stage with no honest renewal case: at
    // week 9 the only thing worth putting to her is a top-up. Dewi is six weeks
    // from the end, which is what makes "Tawarkan renewal" a real sentence.
    week: 44,
    totalWeeks: 50,
    weeks: ledger(175_000, 44),
    growth: {
      kind: 'renewal',
      label: 'Perpanjangan Pinjaman',
      // No `status`: her standing IS her position in the loan, derived.
      suggestion: 'Tawarkan renewal',
      value: 'Rp9.000.000',
      done: 'Pengajuan dikirim',
      rationale:
        'Pinjaman mitra tinggal 6 minggu lagi. Ajukan perpanjangan sebelum siklus habis supaya modal usahanya tidak berhenti.',
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

/**
 * The roster order, and the one rule behind it: **payment status must not touch
 * it.** The list used to be `[...ACTIVE, ...PREPAID]`, which is not a sort — it
 * is just how the fixture was written — but it had exactly the effect of one:
 * every mitra who had already paid sat in a block at the bottom of all three
 * stages. A register read in a room is ordered by membership; the moment it
 * groups by who has settled, the BP is reading a different list on stage 2 than
 * the one she marked attendance on, and the woman in front of her has moved.
 *
 * So the two groups are interleaved by SHARE — each list gives up its next
 * member whenever it has fallen behind its proportion of the roster — which
 * spreads the 15 pre-paid through the 7 the BP has to collect from, in a fixed
 * order that never changes as outcomes are recorded. Ties go to the active
 * list, so Rina (the hero case) stays first.
 */
function rosterOrder(active: Mitra[], prepaid: Mitra[]): Mitra[] {
  const out: Mitra[] = []
  let i = 0
  let j = 0
  while (i < active.length || j < prepaid.length) {
    const activeShare = active.length ? i / active.length : 1
    const prepaidShare = prepaid.length ? j / prepaid.length : 1
    if (i < active.length && (activeShare <= prepaidShare || j >= prepaid.length)) {
      out.push(active[i])
      i += 1
    } else {
      out.push(prepaid[j])
      j += 1
    }
  }
  return out
}

// Sari is the chair: current, mid-tenure, and the one the BP calls when the
// group needs telling something. A KM in arrears is a different prototype.
const KETUA_ID = 'm3'

/**
 * The Ketua Majelis leads the roster, on every list that draws it.
 *
 * The one exception to "order by membership, never by outcome" — and it is not
 * an exception to the rule behind it, which is that the order must not move
 * under the BP's thumb. The KM is fixed for the whole cycle: she opens the
 * kumpulan, she is who the BP checks in with on arrival, and she is who answers
 * for anyone missing. Finding her by scrolling a list of 22 is a hunt the room
 * never makes anyone do.
 */
function ketuaFirst(members: Mitra[], ketuaId: string): Mitra[] {
  const ketua = members.find((m) => m.id === ketuaId)
  if (!ketua) return members
  return [ketua, ...members.filter((m) => m.id !== ketuaId)]
}

export const MAJELIS: Majelis = {
  id: 'mawar',
  name: 'Majelis Mawar',
  place: 'Balai RW 04, Ciseeng',
  schedule: 'Selasa, 08.00 · 21 Juli 2026',
  ketuaId: KETUA_ID,
  members: ketuaFirst(rosterOrder(ACTIVE, PREPAID), KETUA_ID),
}

/** Is this the group's chair? Drawn as a badge wherever her card appears. */
export const isKetua = (mitra: Mitra): boolean => mitra.id === KETUA_ID

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
    ptp: 'hari ini',
    ptpAmount: 500_000,
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
    ptpAmount: 250_000,
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

/**
 * Mitra who exist in the DIRECTORY only — they carry a real record and open a
 * real page, but they are not on Mawar's roster, so they never join the majelis
 * visit's attendance gate or its recap. That separation is the point: the Mitra
 * tab has to be able to show a standing a pelayanan flow has no way to reach.
 */
export const DIRECTORY_MITRA: Mitra[] = [
  {
    id: 'd1',
    name: 'Naura Nugroho',
    product: 'Modal',
    // Lancar — nothing missed, so the ledger runs clean and DPD is 0.
    dpd: 0,
    pelunasanDini: true,
    loan: 8_000_000,
    weekly: 200_000,
    // Week 40 of 50 — exactly the 10-bulan rung, where pelunasan dini opens.
    // She is standing ON it rather than short of it, so the offer is something
    // the BP can put to her in the room today.
    week: 40,
    totalWeeks: 50,
    weeks: ledger(200_000, 40),
    growth: {
      kind: 'renewal',
      label: 'Pelunasan Dini',
      suggestion: 'Pelunasan dini dan naik limit menjadi',
      value: 'Rp8.000.000',
      done: 'Pelunasan dini diajukan',
      rationale:
        'Selama ini pembayaran lancar dan mitra sudah di minggu 40 dari 50, jadi ia sudah bisa mengambil pelunasan dini sekaligus kenaikan limit.',
    },
  },
]

export const findMitra = (id: string): Mitra =>
  MAJELIS.members.find((m) => m.id === id) ??
  HOME_MITRA.find((m) => m.id === id) ??
  DIRECTORY_MITRA.find((m) => m.id === id) ??
  MAJELIS.members[0]

/**
 * Everyone with something to offer — the third stage's list.
 *
 * Directory mitra slot in SECOND, not last: the stage is a queue the BP works
 * top-down in the room, so an offer that lands at the bottom of it is the one
 * she runs out of time for. Second rather than first leaves the roster's own
 * opener where it was.
 */
export const growthMembers = (): Mitra[] => {
  const roster = MAJELIS.members.filter((m) => m.growth)
  const directory = DIRECTORY_MITRA.filter((m) => m.growth)
  return [...roster.slice(0, 1), ...directory, ...roster.slice(1)]
}

/**
 * "Rp1.400.000" — the format everywhere the number is the subject.
 *
 * No space after the prefix. It is how Amartha writes an amount, and it is the
 * same shape the short form has always used ("Rp200rb"), so the two stopped
 * agreeing the moment one of them carried a gap.
 */
export function rupiah(value: number): string {
  return `Rp${value.toLocaleString('id-ID')}`
}

/**
 * "Rp200rb" — the short form, used ONLY inside the week strip, where a 48px
 * cell cannot hold "Rp200.000" and 50 of them sit side by side. Everywhere the
 * amount is something the BP says out loud or types, it is printed in full.
 */
export function ringkas(value: number): string {
  if (value === 0) return 'Rp0'
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toLocaleString('id-ID')}jt`
  return `Rp${Math.round(value / 1000)}rb`
}
