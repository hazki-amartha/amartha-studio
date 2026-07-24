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
export type TaskKind = 'majelis' | 'home-visit' | 'setoran' | 'sosialisasi' | 'follow-up'

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
  {
    id: 't1',
    kind: 'majelis',
    time: '08.00',
    until: '09.30',
    title: 'Majelis Mawar',
    place: 'Balai RW 04, Ciseeng',
    reason: '3 mitra menunggak · pelayanan rutin',
    majelisId: 'mawar',
    distanceKm: 1.2,
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
    title: 'Follow Up: Ibu Nia Kurniasih',
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
    reason: 'Menunggak 63 hari · Rp 1.500.000',
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
    reason: 'Janji bayar hari ini · Rp 250.000',
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
  // The close. Last on the day by construction, so `nowTask` only surfaces it
  // once every visit is submitted — the deposit cannot be right while there is
  // still cash to collect. It stays reachable early from Berikutnya, where it
  // reads back the running total rather than pretending the day is over.
  {
    id: 't6',
    kind: 'setoran',
    time: '17.45',
    until: '18.00',
    title: 'Setor Setoran Harian',
    place: 'Transfer ke VA cabang Ciseeng',
    reason: 'Batas setor 18.00 · uang tunai hasil penagihan hari ini',
    distanceKm: 0,
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
    reason: 'Janji bayar · Rp 125.000',
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
  va: '8808 2145 7790 1123',
  holder: 'Amartha Cabang Ciseeng',
  due: '18.00',
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
