// The day, and the directory of groups — the two things the L0 tabs render.
//
// Kept apart from `data.ts` on purpose: that file is the ledger this direction
// is built on (one majelis, one roster, 50 weeks of repayment), and this one is
// the layer above it — where the BP is going today and which groups she carries.
//
// EVERY task here is a majelis pelayanan. `apartner-task-first` also schedules
// home visits, and a real BP does them; this direction does not model one, and
// a schedule row that opens nothing is worse than a schedule that is honest
// about its scope. See NOTES.md.

export interface Task {
  id: string
  /** Start of the slot, "HH.MM" — Indonesian clock convention. */
  time: string
  /** End of the slot; shown only on the active card. */
  until: string
  title: string
  /** Where the BP has to physically be. */
  place: string
  /** The single line that says why this task is on the list at all. */
  reason: string
  /** The group this task opens. */
  majelisId: string
}

export const TASKS: Task[] = [
  {
    id: 't1',
    time: '08.00',
    until: '09.30',
    title: 'Majelis Mawar',
    place: 'Balai RW 04, Ciseeng',
    reason: '3 mitra menunggak · pelayanan rutin',
    majelisId: 'mawar',
  },
  {
    id: 't2',
    time: '10.00',
    until: '11.30',
    title: 'Majelis Melati',
    place: 'Rumah Bu Yanti, Putat Nutug',
    reason: '1 mitra menunggak · pelayanan rutin',
    majelisId: 'melati',
  },
  {
    id: 't3',
    time: '13.30',
    until: '15.00',
    title: 'Majelis Kenanga',
    place: 'Balai Desa Ciseeng',
    reason: '4 mitra menunggak · pelayanan rutin',
    majelisId: 'kenanga',
  },
  {
    id: 't4',
    time: '16.00',
    until: '17.30',
    title: 'Majelis Anggrek',
    place: 'Rumah Bu Imas, Cibeuteung',
    reason: 'Pelayanan rutin mingguan',
    majelisId: 'anggrek',
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
    time: '08.30',
    until: '10.00',
    title: 'Majelis Dahlia',
    place: 'Balai RW 07, Ciseeng',
    reason: '2 mitra menunggak · pelayanan rutin',
    majelisId: 'dahlia',
  },
  {
    id: 'w2',
    time: '11.00',
    until: '12.30',
    title: 'Majelis Melati',
    place: 'Rumah Bu Yanti, Putat Nutug',
    reason: 'Pelayanan rutin mingguan',
    majelisId: 'melati',
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
    time: '13.30',
    members: 25,
    menunggak: 4,
  },
  {
    id: 'anggrek',
    name: 'Majelis Anggrek',
    place: 'Rumah Bu Imas, Cibeuteung',
    day: 'Selasa',
    time: '16.00',
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
