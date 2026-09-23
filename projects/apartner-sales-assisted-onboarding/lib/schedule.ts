// The majelis directory the Sales pipeline assigns leads into.
//
// Carried over from the BP project's `schedule.ts`, minus the day's task list:
// this prototype is the Sales module on its own, so a lead can be assigned to a
// group but there is no route of visits behind it. `FU_TASK_FOR_LEAD` and
// `findTask` survive as the thin stub the follow-up screens read a TIME off.

export type MajelisType = 'Modal' | 'GL' | 'Hybrid'

/**
 * `draft` is a group being ASSEMBLED — recruited, not yet disbursed. It is on
 * this list because it is the BP's own work in progress, and a directory that
 * only shows finished groups hides the ones that need her this week.
 */
export type MajelisStatus = 'draft' | 'aktif'

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

/**
 * Which majelis a page is about: an active directory group by id, or a new
 * (draft) majelis being formed from onboarding leads, keyed by its name (it has
 * no directory entry yet).
 */
export type MajelisRef = { kind: 'existing'; id: string } | { kind: 'draft'; name: string }

/** The kumpulan days a majelis can meet — the day filter's options. */
export const KUMPULAN_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']

/**
 * Kumpulan schedule for a draft (new) majelis, keyed by its name. A draft has no
 * directory entry, so its agreed day/time lives here until the group is
 * activated and moves into `MAJELIS_DIRECTORY`.
 */
export const DRAFT_SCHEDULE: Record<string, { day: string; time: string }> = {
  'Majelis Batu Sangkar': { day: 'Kamis', time: '08.00' },
}

/** The smallest active majelis; a draft is this many mitra short of running. */
export const MIN_MEMBERS = 5

/** How many mitra a draft still needs to become active (0 for an active group). */
export const shortfallOf = (entry: MajelisEntry): number =>
  Math.max(0, MIN_MEMBERS - entry.members)

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

/**
 * Pipeline lead id → the follow-up booked for her today. In the BP project this
 * points at a row on the day's schedule; here it is just the fact that a call is
 * due, plus the slot it sits in.
 */
export const FU_TASK_FOR_LEAD: Record<string, string> = { p4: 't2b', p2: 't2c' }

export interface Task {
  id: string
  /** Start of the slot, "HH.MM" — Indonesian clock convention. */
  time: string
}

const TASKS: Task[] = [
  { id: 't2b', time: '11.45' },
  { id: 't2c', time: '13.30' },
  // The sosialisasi slot.
  { id: 't3', time: '14.00' },
]

export const findTask = (id: string | null): Task | undefined =>
  TASKS.find((t) => t.id === id)

/** A stable mock distance (km) for a majelis from the lead's location, 0.4–6.2.
 *  There is no real geodata in the prototype — the id seeds a fixed value. */
export function majelisDistanceKm(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return Math.round(((h % 59) / 10 + 0.4) * 10) / 10
}
