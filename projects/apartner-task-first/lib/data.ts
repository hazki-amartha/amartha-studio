// Mock data for the task-first direction. Two shapes only: the day's schedule
// (what the BP must do, hour by hour) and one majelis roster (who owes what).
//
// Grounding for the numbers is the insight library — a BP visits 10+ mitra a
// day on a motorbike between 07:00 and 21:00, majelis run ~20 members with a
// weekly angsuran, and DPD recovery today happens on a Google Form outside the
// app entirely. See NOTES.md.

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
  /** Only set for kind: 'majelis' — the roster this task opens. */
  majelisId?: string
}

export interface Mitra {
  id: string
  name: string
  /** Weekly instalment due at this visit, in rupiah. */
  due: number
  /** Days past due; 0 = current. */
  dpd: number
  /** At most ONE offer per mitra — cross-sell is a tail, so it stays capped. */
  offer?: Offer
}

export interface Offer {
  label: string
  /**
   * The mitra's standing on the thing being offered — shown under her name on
   * step 2, in the slot step 1 uses for payment. It is a STATUS, not a pitch:
   * it states where she is ("Belum pernah menabung"), and the recommendation
   * follows from it. The BP reads a fact and draws the obvious conclusion,
   * rather than being told what to think.
   */
  status: string
}

export interface Majelis {
  id: string
  name: string
  place: string
  members: Mitra[]
}

// --- The day ---------------------------------------------------------------

export const TASKS: Task[] = [
  {
    id: 't1',
    kind: 'majelis',
    time: '08.00',
    until: '09.30',
    title: 'Majelis Mawar',
    place: 'Balai RW 04, Ciseeng',
    reason: 'Pelayanan rutin mingguan',
    majelisId: 'mawar',
  },
  {
    id: 't2',
    kind: 'majelis',
    time: '10.00',
    until: '11.30',
    title: 'Majelis Melati',
    place: 'Rumah Bu Yanti, Putat Nutug',
    reason: 'Pelayanan rutin mingguan',
    majelisId: 'melati',
  },
  {
    id: 't3',
    kind: 'home-visit',
    time: '13.00',
    until: '13.45',
    title: 'Ibu Rina Marlina',
    place: 'Kp. Cibeuteung RT 02',
    reason: 'Menunggak 34 hari · Rp 450.000',
  },
  {
    id: 't4',
    kind: 'home-visit',
    time: '14.30',
    until: '15.15',
    title: 'Ibu Sari Handayani',
    place: 'Kp. Cibeuteung RT 05',
    reason: 'Janji bayar hari ini · Rp 200.000',
  },
  {
    id: 't5',
    kind: 'majelis',
    time: '16.00',
    until: '17.30',
    title: 'Majelis Kenanga',
    place: 'Balai Desa Ciseeng',
    reason: 'Pelayanan rutin mingguan',
    majelisId: 'kenanga',
  },
]

// --- The roster ------------------------------------------------------------

const MAWAR_MEMBERS: Mitra[] = [
  {
    id: 'm1',
    name: 'Rina Marlina',
    due: 200_000,
    dpd: 34,
    offer: { label: 'Perpanjangan pinjaman', status: 'Minggu 40 dari 48 di pinjaman terlama' },
  },
  { id: 'm2', name: 'Ani Suryani', due: 150_000, dpd: 7 },
  {
    id: 'm3',
    name: 'Sari Handayani',
    due: 125_000,
    dpd: 0,
    offer: { label: 'Celengan', status: 'Belum pernah menabung' },
  },
  { id: 'm4', name: 'Dewi Lestari', due: 175_000, dpd: 0 },
  {
    id: 'm5',
    name: 'Siti Aminah',
    due: 200_000,
    dpd: 0,
    offer: { label: 'Agent AOne', status: '2 pinjaman aktif' },
  },
  { id: 'm6', name: 'Yanti Rohayati', due: 150_000, dpd: 14 },
  { id: 'm7', name: 'Eni Nuraeni', due: 125_000, dpd: 0 },
]

// The 15 who settled before the BP opened the page — a count and a list, not a
// statistic to interpret. Exported so the store can seed them as hadir + lunas.
export const PREPAID_MITRA: Mitra[] = [
  { id: 'p1', name: 'Nurhayati', due: 150_000, dpd: 0 },
  { id: 'p2', name: 'Tuti Herawati', due: 200_000, dpd: 0 },
  { id: 'p3', name: 'Wiwin Winarti', due: 125_000, dpd: 0 },
  { id: 'p4', name: 'Imas Masitoh', due: 175_000, dpd: 0 },
  { id: 'p5', name: 'Euis Kurniasih', due: 150_000, dpd: 0 },
  { id: 'p6', name: 'Lilis Suryani', due: 200_000, dpd: 0 },
  { id: 'p7', name: 'Ratna Dewi', due: 125_000, dpd: 0 },
  { id: 'p8', name: 'Mimin Mintarsih', due: 150_000, dpd: 0 },
  { id: 'p9', name: 'Cucu Sumiati', due: 175_000, dpd: 0 },
  { id: 'p10', name: 'Ineu Rohaeni', due: 200_000, dpd: 0 },
  { id: 'p11', name: 'Popon Sopiah', due: 125_000, dpd: 0 },
  { id: 'p12', name: 'Yuyun Yuningsih', due: 150_000, dpd: 0 },
  { id: 'p13', name: 'Dedeh Kurniati', due: 175_000, dpd: 0 },
  { id: 'p14', name: 'Neneng Hasanah', due: 200_000, dpd: 0 },
  { id: 'p15', name: 'Ai Nurjanah', due: 125_000, dpd: 0 },
]

export const MAJELIS: Majelis[] = [
  {
    id: 'mawar',
    name: 'Majelis Mawar',
    place: 'Balai RW 04, Ciseeng',
    members: [...MAWAR_MEMBERS, ...PREPAID_MITRA],
  },
]

export const findMajelis = (id: string) => MAJELIS.find((m) => m.id === id) ?? MAJELIS[0]

/** "Rp 1.400.000" — the only number format this prototype prints. */
export function rupiah(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`
}
