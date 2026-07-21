// The day, and the directory of groups — the two things the L0 tabs render.
//
// Kept apart from `data.ts` on purpose: that file is the ledger this direction
// is built on (one majelis, one roster, 50 weeks of repayment), and this one is
// the layer above it — where the BP is going today and which groups she carries.
//
// A day carries both kinds of stop: the weekly pelayanan, and the home visits
// that exist because a mitra has fallen far enough behind that a majelis
// collection is no longer going to reach her.

export type TaskKind = 'majelis' | 'home-visit'

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
  },
  {
    id: 't4',
    kind: 'home-visit',
    time: '14.30',
    until: '15.15',
    title: 'Ibu Elin Herlina',
    place: 'Kp. Putat Nutug RT 05',
    reason: 'Janji bayar hari ini · Rp 250.000',
    mitraId: 'h2',
  },
  {
    id: 't5',
    kind: 'majelis',
    time: '16.00',
    until: '17.30',
    title: 'Majelis Kenanga',
    place: 'Balai Desa Ciseeng',
    reason: '4 mitra menunggak · pelayanan rutin',
    majelisId: 'kenanga',
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

/** Which day the schedule tab is showing. */
export type DayKey = 'today' | 'tomorrow'

export const DAYS: { key: DayKey; label: string; date: string }[] = [
  { key: 'today', label: 'Hari ini', date: 'Selasa, 21 Juli' },
  { key: 'tomorrow', label: 'Besok', date: 'Rabu, 22 Juli' },
]

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
}

export const MAJELIS_DIRECTORY: MajelisEntry[] = [
  {
    id: 'mawar',
    name: 'Majelis Mawar',
    place: 'Balai RW 04, Ciseeng',
    day: 'Selasa',
    time: '08.00',
    members: 22,
    menunggak: 3,
  },
  {
    id: 'melati',
    name: 'Majelis Melati',
    place: 'Rumah Bu Yanti, Putat Nutug',
    day: 'Selasa',
    time: '10.00',
    members: 18,
    menunggak: 1,
  },
  {
    id: 'kenanga',
    name: 'Majelis Kenanga',
    place: 'Balai Desa Ciseeng',
    day: 'Selasa',
    time: '16.00',
    members: 25,
    menunggak: 4,
  },
  {
    id: 'anggrek',
    name: 'Majelis Anggrek',
    place: 'Rumah Bu Imas, Cibeuteung',
    day: 'Rabu',
    time: '14.00',
    members: 20,
    menunggak: 0,
  },
  {
    id: 'dahlia',
    name: 'Majelis Dahlia',
    place: 'Balai RW 07, Ciseeng',
    day: 'Rabu',
    time: '08.30',
    members: 16,
    menunggak: 2,
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
