// The day, and the directory of groups — the two things the L0 tabs render.
//
// Kept apart from `data.ts` on purpose: that file is the ledger this direction
// is built on (one majelis, one roster, 50 weeks of repayment), and this one is
// the layer above it — where the BP is going today and which groups she carries.
//
// A day carries both kinds of stop: the weekly pelayanan, and the home visits
// that exist because a mitra has fallen far enough behind that a majelis
// collection is no longer going to reach her.

// The day carries FIVE kinds of stop, and the split is between two jobs, not
// five activities: three of them service women who already borrow (a majelis, a
// door, the cash that leaves her hands at the end), and two of them go looking
// for women who don't yet — the sosialisasi that generates leads and the
// follow-up call that decides what becomes of them.
//
// They sit on ONE schedule on purpose. A BP's NTB target and her collection
// target are paid out of the same seven KPI parameters and worked in the same
// eight hours; giving prospecting its own tab would let it be the thing she
// gets to if there is time, which is precisely how it stops happening.
export type TaskKind =
  | 'majelis'
  | 'home-visit'
  | 'setoran'
  | 'sosialisasi'
  | 'follow-up'
  | 'reminder'

export interface Task {
  id: string
  kind: TaskKind
  /** Start of the slot, "HH.MM" — Indonesian clock convention. */
  time: string
  /** End of the slot; shown only on the active card. */
  until: string
  title: string
  /** Where the BP has to physically be. */
  place: string
  /** The single line that says why this task is on the list at all. */
  reason: string
  /** Set on a majelis task — the group it opens. */
  majelisId?: string
  /** Set on a home visit — the mitra whose door it is (a `HOME_MITRA` id). */
  mitraId?: string
  /** Set on a sosialisasi — the session it opens (an `EVENTS` id). */
  eventId?: string
  /** Set on a follow-up — the prospect being called (a `Lead` id). */
  leadId?: string
  /**
   * How far she has to ride, from where she is now. On the card because the
   * order of a day is decided by geography as much as by the clock: two stops
   * in the same kampung get done together whatever their slots say.
   */
  distanceKm?: number
  /**
   * Scored likely to pay if visited today. Only ever set on a HOME VISIT: a
   * majelis is 22 women with 22 different answers, so a single propensity flag
   * on a group is a number that describes nobody in it.
   *
   * It is a PREDICTION, and the card says so by keeping it a small green label
   * rather than a headline — a BP who reads it as a promise and finds an empty
   * house twice stops believing the next one.
   */
  payLikely?: boolean
}

export const TASKS: Task[] = [
  // First thing, before any balai opens: one message out to every group meeting
  // today. It sits on the schedule as a task rather than living inside each
  // majelis visit because it is done ONCE for the whole day and it is done from
  // the house — folding it into the visit would ask her to send a reminder to a
  // room she is already standing in.
  {
    id: 't0',
    kind: 'reminder',
    time: '07.00',
    until: '07.15',
    title: 'Ingatkan Majelis Hari Ini',
    place: 'Kirim pesan ke grup WhatsApp majelis',
    reason: '3 majelis ada kumpulan hari ini',
  },
  {
    id: 't1',
    kind: 'majelis',
    time: '08.00',
    until: '09.30',
    title: 'Majelis Mawar',
    place: 'Balai RW 04, Ciseeng',
    reason: '3 mitra menunggak · pelayanan rutin',
    majelisId: 'mawar',
    distanceKm: 1.5,
  },
  {
    id: 't2',
    kind: 'majelis',
    time: '10.00',
    until: '11.30',
    title: 'Majelis Melati',
    place: 'Rumah Bu Yanti, Putat Nutug',
    reason: '1 mitra menunggak · pelayanan rutin',
    majelisId: 'melati',
    distanceKm: 3.8,
  },
  // A phone call, slotted into the gap between the 10.00 balai and the 13.00
  // door rather than given a room of its own. That is where follow-up actually
  // happens — on the motorbike, waiting for a group to gather — and a schedule
  // that pretends otherwise is a schedule she works around.
  {
    id: 't2b',
    kind: 'follow-up',
    time: '11.45',
    until: '12.15',
    // Named plainly. The card now says "Follow Up" on its own line above the
    // title, so a "Follow Up:" prefix here would print the kind twice.
    title: 'Ibu Nia Kurniasih',
    place: 'WhatsApp / telepon',
    reason: 'Minat tinggi · dijanjikan dihubungi hari ini',
    leadId: 'l1',
  },
  {
    id: 't3',
    kind: 'home-visit',
    time: '13.00',
    until: '13.45',
    title: 'Ibu Wati Nurhasanah',
    place: 'Kp. Cibeuteung RT 02',
    reason: 'Menunggak 63 hari · Rp1.500.000',
    mitraId: 'h1',
    distanceKm: 2.4,
  },
  // The one stop on the day that is not about a woman who already borrows.
  {
    id: 't3b',
    kind: 'sosialisasi',
    time: '14.00',
    until: '15.15',
    title: 'Sosialisasi Ciseeng',
    place: 'Warung Bu Ipah, Kp. Cibeuteung RT 03',
    reason: 'Target 10 prospek · desa baru, belum ada majelis',
    eventId: 'e1',
    distanceKm: 2.9,
  },
  {
    id: 't4',
    kind: 'home-visit',
    time: '15.30',
    until: '16.00',
    title: 'Ibu Elin Herlina',
    place: 'Kp. Putat Nutug RT 05',
    reason: 'Janji bayar hari ini · Rp250.000',
    mitraId: 'h2',
    distanceKm: 5.1,
    // She named today herself on last week's call — the strongest signal the
    // score has, and the reason this one carries the label and Wati does not.
    payLikely: true,
  },
  {
    id: 't5',
    kind: 'majelis',
    time: '16.30',
    until: '17.45',
    title: 'Majelis Kenanga',
    place: 'Balai Desa Ciseeng',
    reason: '4 mitra menunggak · pelayanan rutin',
    majelisId: 'kenanga',
    distanceKm: 4.3,
  },
]

// Tomorrow, for the date switcher. Two days is the whole range on purpose: a BP
// plans the evening before ("what am I riding to first tomorrow?") and does not
// plan a week ahead, so a full calendar would be a control nobody turns.
//
// Tomorrow is READ-ONLY. There is no "Sekarang" on a day that hasn't started —
// a focus card there would offer to begin a pelayanan the BP cannot be at.
export const TOMORROW_TASKS: Task[] = [
  {
    id: 'w1',
    kind: 'majelis',
    time: '08.30',
    until: '10.00',
    title: 'Majelis Dahlia',
    place: 'Balai RW 07, Ciseeng',
    reason: '2 mitra menunggak · pelayanan rutin',
    majelisId: 'dahlia',
  },
  {
    id: 'w2',
    kind: 'home-visit',
    time: '11.00',
    until: '11.45',
    title: 'Ibu Eni Nuraeni',
    place: 'Kp. Putat Nutug RT 03',
    reason: 'Janji bayar · Rp125.000',
    mitraId: 'h2',
    distanceKm: 3.2,
    payLikely: true,
  },
  {
    id: 'w3',
    kind: 'majelis',
    time: '14.00',
    until: '15.30',
    title: 'Majelis Anggrek',
    place: 'Rumah Bu Imas, Cibeuteung',
    reason: 'Pelayanan rutin mingguan',
    majelisId: 'anggrek',
  },
]

/**
 * What the day is supposed to bring in — every rupiah due across the three
 * pelayanan and the two doorsteps on today's list.
 *
 * A target, not a total: it is what makes "terkumpul hari ini" a progress
 * figure at 11.00 rather than a receipt at 18.00. Authored rather than summed
 * because two of today's three majelis have no roster in this prototype.
 */
export const TARGET_HARIAN = 6_200_000

/**
 * Where the day's cash goes. A VA rather than a counter: the branch stopped
 * being a place the BP has to reach before it closes, which is the only reason
 * a 17.30 deposit is possible at all after a 16.00 majelis.
 */
export const DEPOSIT = {
  bank: 'BCA Virtual Account',
  holder: 'Amartha Cabang Ciseeng',
  /**
   * The hard ceiling on handovers in a day: three, and no more. There is no
   * clock on it — she can settle whenever she likes — the only limit is the
   * count. The risk being managed cuts both ways: cash on a motorbike wants to
   * be put down often, but every settlement is a reconciliation the branch has
   * to clear, so three is the count that balances the two. It is a DOOR, not a
   * fee: past the third there is nothing to pay because there is no fourth.
   */
  maxPerDay: 3,
}

/**
 * "Tutup Hari Ini" — the closing task, and the last ROW on the day's schedule.
 * The BP does it like any other task: it sits at the foot of the list with a
 * time and a place, she taps it, and the closing screen is where the "every
 * visit done, bag empty" gate actually lives.
 *
 * Kept OUT of the TASKS array on purpose, though. TASKS drives the visit-based
 * logic — the done/sent counts, the sync queue, whether the day can be closed —
 * and closing is not a visit and must not be counted as one (a closing that the
 * day-can-close check waited on could never let the day be closed). So it is a
 * standalone task object the schedule renders after the visits, and its state
 * is `depositDone`, not the done/sent arrays.
 */
export const CLOSING_TASK: Task = {
  id: 'closing',
  kind: 'setoran',
  time: '17.45',
  until: '18.00',
  title: 'Tutup Hari Ini',
  place: 'Setor titipan tunai lalu tutup hari',
  reason: 'Setor semua titipan tunai lalu tutup hari',
}

/**
 * How the cash gets to the company. Two roads, and the BP has to pick before
 * she can transfer: a VA she pays from her own mobile banking, or an agent she
 * hands the physical notes to. They reconcile differently at the other end, so
 * the choice is recorded on the settlement rather than assumed.
 */
export type SettleMethod = 'va' | 'agent'

export const SETTLE_METHOD_LABEL: Record<SettleMethod, string> = {
  va: 'Virtual Account',
  agent: 'Agen AmarthaLink',
}

/**
 * The agent counter, for the BP who would rather put cash across a desk than
 * transfer it. It reconciles against a KODE UNIK she reads out — the agent
 * keys it, the branch matches it — so it is the agent-road twin of the VA
 * number: one identifier per settlement, printed on the screen in front of her.
 */
export const AGENT = {
  name: 'AmarthaLink',
  hint: 'Tunjukkan kode ini ke agen AmarthaLink terdekat, lalu serahkan uang tunainya.',
}

/**
 * A per-mitra cash breakdown for a majelis that has no live roster in this
 * prototype (only Mawar does). It lets the settlement screen open such a majelis
 * into its individual mitra to pick from, just like Mawar. Keyed by task id, and
 * each list sums to that task's banked cash so the roster and the deposit agree.
 */
export const MAJELIS_SETTLE_ROSTER: Record<string, { name: string; cash: number }[]> = {
  // Majelis Melati (t2) — banks Rp1.675.000 in cash.
  t2: [
    { name: 'Ibu Nurhayati', cash: 350_000 },
    { name: 'Ibu Sukaesih', cash: 300_000 },
    { name: 'Ibu Wulan Sari', cash: 425_000 },
    { name: 'Ibu Karti', cash: 275_000 },
    { name: 'Ibu Darsih', cash: 325_000 },
  ],
}

/**
 * One AmarthaLink counter she can walk cash to. The agent road only helps if
 * she knows WHERE the nearest desk is, so the settlement screen offers a way
 * onto this list before she commits to the method.
 *
 * `open` and `closes` are on the row because a counter that shut at 17.00 is
 * not a place to ride to at 17.30 — the whole point of picking one is that it
 * is open when she gets there.
 */
export interface AgentLocation {
  id: string
  /** The warung or kiosk the counter sits in — what she looks for on arrival. */
  place: string
  address: string
  distanceKm: number
  /** "07.00–21.00" — the counter's hours, said in full. */
  hours: string
  /** When it shuts, for the "tutup HH.MM" line on a counter still open now. */
  closes: string
  open: boolean
  /**
   * How long the ride takes, as a range rather than a figure — "2-5 menit".
   * Distance alone under-describes the errand on a kampung road, where 500m of
   * gang and 500m of jalan raya are not the same two minutes.
   */
  eta: string
  /**
   * How recently the counter transacted — "13 menit yang lalu". A desk with a
   * warm till has someone behind it; the hours only say when it is SUPPOSED to
   * be open, which is a different claim and the weaker of the two.
   */
  lastActive: string
  /**
   * The agent takes the subsidy, so the handover costs her nothing. Not every
   * counter does, and it is the one fact that can make a further desk the
   * better one to ride to.
   */
  freeAdmin?: boolean
}

/**
 * The counters near her route today, nearest first. A short list on purpose —
 * she is choosing between the two or three she could actually reach, not
 * browsing a directory (CLAUDE.md §3: only what is on screen).
 */
export const NEAREST_AGENTS: AgentLocation[] = [
  {
    id: 'ag1',
    place: 'Warung Bu Ipah',
    address: 'Kp. Cibeuteung RT 03, Ciseeng',
    distanceKm: 0.4,
    hours: '07.00–21.00',
    closes: '21.00',
    open: true,
    eta: '2-5 menit',
    lastActive: '13 menit yang lalu',
    freeAdmin: true,
  },
  {
    id: 'ag2',
    place: 'Toko Berkah Jaya',
    address: 'Jl. Raya Ciseeng No. 12',
    distanceKm: 1.1,
    hours: '08.00–20.00',
    closes: '20.00',
    open: true,
    eta: '5-10 menit',
    lastActive: '1 jam yang lalu',
    // 700m further than the nearest, and still worth the ride: it takes the
    // subsidy, so the handover costs her nothing.
    freeAdmin: true,
  },
  {
    id: 'ag3',
    place: 'Konter Rizki Cell',
    address: 'Pasar Ciseeng, Blok C',
    distanceKm: 2.3,
    hours: '08.00–17.00',
    closes: '17.00',
    open: true,
    eta: '10-15 menit',
    lastActive: '17 menit yang lalu',
  },
  {
    id: 'ag4',
    place: 'Warung Sembako Nia',
    address: 'Kp. Putat Nutug RT 05',
    distanceKm: 3.6,
    hours: '06.00–22.00',
    closes: '22.00',
    open: true,
    eta: '> 15 menit',
    lastActive: '1 hari yang lalu',
  },
]

/**
 * A fresh unique code per settlement, for the same reason the VA is fresh: two
 * cash drops keyed under one code are two deposits the branch cannot tell
 * apart. Derived from the settlement number so it is stable for one handover.
 */
export const agentCodeFor = (no: number): string => {
  const n = 482100 + no * 1373
  return `AL ${String(n).slice(0, 3)} ${String(n).slice(3)}`
}

/**
 * A fresh VA per settlement.
 *
 * Not decoration: a virtual account is what the branch reconciles against, and
 * reusing one number for three transfers in a day makes three deposits
 * indistinguishable at the other end. The BP transfers to the number on the
 * screen in front of her, and that number is the receipt.
 */
export const vaFor = (no: number, part = 1): string =>
  `8808 2145 77${90 + no} ${1123 + no * 7 + (part - 1) * 3}`

/**
 * Splits a VA deposit into two transfers. A single VA transfer at the branch
 * bank caps below a full day's collections, so the settlement goes as two
 * round-numbered halves to two different VA numbers — the second carries any
 * remainder so the pair always sums back to the total. The agent road has no
 * such cap: a counter takes the whole amount at once, so it stays one figure.
 */
export const splitDeposit = (total: number): [number, number] => {
  const first = Math.min(total, Math.round(total / 2 / 1000) * 1000)
  return [first, total - first]
}

/**
 * "MV", "HV" — the KIND of a task, in the shorthand a BP and her BM speak.
 *
 * Not numbered. The settlement breakdown puts this beside the group's own name
 * ("MV · Majelis Mawar"), so an ordinal would be a second identifier for a row
 * that is already named — and "MV 1" invites the question of what happened to
 * an MV 2 that may not be in this settlement at all.
 */
export const taskCode = (taskId: string): string => {
  const kind = TASKS.find((t) => t.id === taskId)?.kind
  if (!kind) return ''
  return {
    majelis: 'MV',
    'home-visit': 'HV',
    sosialisasi: 'Sos',
    'follow-up': 'FU',
    setoran: 'Setor',
    reminder: 'Ingat',
  }[kind]
}

/**
 * The BP herself. Her own record is the one thing on the Profil tab that is
 * about her rather than about her portfolio, and it is authored here rather
 * than in the profile screen so the branch matches the VA the deposit goes to.
 */
export const BP = {
  name: 'Siti Rahayu',
  initials: 'SR',
  role: 'Business Partner · BP-10482',
  branch: 'Cabang Ciseeng, Bogor',
  version: 'A-Partner v2.0.0',
}

/** Which day the schedule tab is showing. */
export type DayKey = 'today' | 'tomorrow'

export const DAYS: { key: DayKey; label: string; date: string }[] = [
  { key: 'today', label: 'Hari ini', date: 'Selasa, 21 Juli' },
  { key: 'tomorrow', label: 'Besok', date: 'Rabu, 22 Juli' },
]

/** "2,4 km" — Indonesian decimal comma, one place, and 0 reads as "di sini". */
export const km = (v: number): string =>
  v === 0 ? 'Di lokasi Anda' : `${v.toFixed(1).replace('.', ',')} km dari lokasi Anda`

/** The same distance as a chip — "1,2 km". The pill has no room for the rest of
 *  the sentence, and beside an address it does not need it. */
export const kmShort = (v: number): string =>
  v === 0 ? 'Di lokasi' : `${v.toFixed(1).replace('.', ',')} km`

export const findDay = (key: DayKey) => DAYS.find((d) => d.key === key) ?? DAYS[0]

// --- The majelis directory -------------------------------------------------
// What the Majelis tab lists: every group the BP carries, not just today's.
// That is the one thing the schedule genuinely cannot do — a BM asks "kapan
// majelis Anggrek?", or a visit gets moved, and without this tab the only route
// to a group is waiting for the schedule to send you there.
//
// It stays a DIRECTORY, not a dashboard: what a group is, when it meets, and
// how many mitra are behind. No portfolio percentages — those are BM numbers.
//
// Only `mawar` has a real roster (see NOTES); the others carry their standing
// facts so the directory is honest about the portfolio without pretending to
// data this prototype does not have.

/**
 * The product the group runs on. Three of them, and a BP has to know which
 * before she opens her mouth: a Group Loan majelis answers for each other's
 * arrears, a Modal majelis does not, and Hybrid does both at once.
 */
export type MajelisType = 'Modal' | 'GL' | 'Hybrid'

/**
 * `draft` is a group being ASSEMBLED — recruited, not yet disbursed. It is on
 * this list because it is the BP's own work in progress, and a directory that
 * only shows finished groups hides the ones that need her this week.
 */
export type MajelisStatus = 'draft' | 'aktif'

/** What a draft has to reach before it can be disbursed. */
export const MIN_MEMBERS = 15

/** How many more women a draft needs. 0 once it is ready to activate. */
export const shortfallOf = (entry: MajelisEntry): number =>
  Math.max(0, MIN_MEMBERS - entry.members)

export interface MajelisEntry {
  id: string
  name: string
  place: string
  /** The weekly pelayanan slot — the answer to "kapan majelis ini?". */
  day: string
  time: string
  members: number
  /** Mitra in this group currently behind. The one number worth listing. */
  menunggak: number
  type: MajelisType
  status: MajelisStatus
}

/** The days a kumpulan can fall on. Saturday and Sunday are not worked. */
export const KUMPULAN_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']

export const MAJELIS_DIRECTORY: MajelisEntry[] = [
  {
    id: 'seruni',
    name: 'Majelis Seruni',
    place: 'Balai RW 02, Putat Nutug',
    day: 'Senin',
    time: '09.00',
    members: 21,
    menunggak: 0,
    type: 'Hybrid',
    status: 'aktif',
  },
  {
    id: 'mawar',
    name: 'Majelis Mawar',
    place: 'Balai RW 04, Ciseeng',
    day: 'Selasa',
    time: '08.00',
    members: 22,
    menunggak: 3,
    // Hybrid, and it has to be: Mawar is the only group with a real roster, and
    // that roster carries both products. A directory that called it Modal would
    // be contradicted by the first card inside it.
    type: 'Hybrid',
    status: 'aktif',
  },
  {
    id: 'melati',
    name: 'Majelis Melati',
    place: 'Rumah Bu Yanti, Putat Nutug',
    day: 'Selasa',
    time: '10.00',
    members: 18,
    menunggak: 1,
    type: 'GL',
    status: 'aktif',
  },
  {
    id: 'kenanga',
    name: 'Majelis Kenanga',
    place: 'Balai Desa Ciseeng',
    day: 'Selasa',
    time: '16.00',
    members: 25,
    menunggak: 4,
    type: 'Hybrid',
    status: 'aktif',
  },
  {
    id: 'dahlia',
    name: 'Majelis Dahlia',
    place: 'Balai RW 07, Ciseeng',
    day: 'Rabu',
    time: '08.30',
    members: 16,
    menunggak: 2,
    type: 'GL',
    status: 'aktif',
  },
  {
    id: 'anggrek',
    name: 'Majelis Anggrek',
    place: 'Rumah Bu Imas, Cibeuteung',
    day: 'Rabu',
    time: '14.00',
    members: 20,
    menunggak: 0,
    type: 'Modal',
    status: 'aktif',
  },
  // The two she is still building. Nearly-there and barely-started, so the
  // shortfall reads as a real range rather than one decorative case.
  {
    id: 'kenari',
    name: 'Majelis Kenari',
    place: 'Warung Bu Ipah, Cibeuteung',
    day: 'Kamis',
    time: '08.00',
    members: 11,
    menunggak: 0,
    type: 'Modal',
    status: 'draft',
  },
  {
    id: 'teratai',
    name: 'Majelis Teratai',
    place: 'Rumah Bu Eem, Ciseeng',
    day: 'Jumat',
    time: '10.00',
    members: 6,
    menunggak: 0,
    type: 'GL',
    status: 'draft',
  },
]

/** "Selasa, 08.00 · 21 Juli 2026" — the subtitle every visit screen carries. */
export const majelisWhen = (entry: MajelisEntry): string =>
  `${entry.day}, ${entry.time} · 21 Juli 2026`

export const findMajelisEntry = (id: string): MajelisEntry =>
  MAJELIS_DIRECTORY.find((m) => m.id === id) ?? MAJELIS_DIRECTORY[0]

/** The schedule row behind a visit — carries the pre-reasoned "why now" line. */
export const findTask = (id: string | null): Task | undefined =>
  id ? TASKS.find((t) => t.id === id) : undefined

/**
 * Every majelis with a kumpulan on today's schedule — who the reminder goes to.
 *
 * Derived from TASKS rather than listed again, so the reminder screen and the
 * agenda can never disagree about which groups are meeting: move a pelayanan to
 * tomorrow and the group drops off the reminder by itself.
 */
/** The morning reminder's own row on the schedule. */
export const REMINDER_TASK_ID = 't0'

/**
 * The scheduled pelayanan for a group, if the day has one. This is what lets a
 * visit started from the Majelis tab still tick the schedule: the BP did the
 * work she was rostered for, and the route she took to it is not the point.
 */
export const taskForMajelis = (majelisId: string): Task | undefined =>
  TASKS.find((t) => t.majelisId === majelisId)

/**
 * Merges follow-ups the BP scheduled today into a day's rostered list, in clock
 * order. This is what makes "hubungi lagi besok" a real commitment rather than
 * a note: the call she promised appears on tomorrow's agenda beside the
 * majelis, made by the same act that recorded the promise.
 */
export const withScheduled = (base: Task[], extra: Task[]): Task[] =>
  [...base, ...extra].sort((a, b) => a.time.localeCompare(b.time))
