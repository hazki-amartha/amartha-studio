// Mock data for the Cash Outstanding tab.
//
// One row per BP in the branch roster (a handful — the invisible rows of a
// realistic-scale dataset are pure token cost, §3). Each BP carries the money
// not yet handed in (belum disetor), broken down into the tugas it came from,
// and each tugas is broken down again into the mitra who owe it. Row nominals
// are summed from those items so nothing can drift.

/** Where an outstanding chunk originates. A whole majelis (MV) is a group of
 *  mitra; an HV is one mitra's own bill. */
export interface OriginRef {
  kind: 'MV' | 'HV'
  label: string
}

/** One mitra's share of a tugas — the per-member breakdown shown in the drawer. */
export interface MemberShare {
  name: string
  amount: number
}

export interface OutstandingItem {
  origin: OriginRef
  amount: number
  members: MemberShare[]
}

export interface BpRow {
  id: string
  name: string
  outstanding: number
  /** ISO datetime of the BP's most recent setoran. */
  lastSetoran: string
  outstandingItems: OutstandingItem[]
}

const ONE_DAY = 24 * 60 * 60 * 1000
/** The settlement deadline each day — a BP still holding cash after this is late. */
const DEADLINE_HOUR = 16

const memberSum = (members: MemberShare[]) => members.reduce((total, m) => total + m.amount, 0)

/** A whole-majelis tugas: the amount is the sum of its mitra shares. */
const mvItem = (label: string, members: MemberShare[]): OutstandingItem => ({
  origin: { kind: 'MV', label },
  amount: memberSum(members),
  members,
})

/** A single-mitra tugas: the one member is the mitra herself. */
const hvItem = (name: string, amount: number): OutstandingItem => ({
  origin: { kind: 'HV', label: name },
  amount,
  members: [{ name, amount }],
})

interface BpSeed {
  id: string
  name: string
  lastSetoran: string
  outstandingItems: OutstandingItem[]
}

const SEEDS: BpSeed[] = [
  {
    id: 'bp-a',
    name: 'Sukma Ayuningrum',
    lastSetoran: '2026-08-13T14:00:00',
    outstandingItems: [hvItem('Ibu Siti Aminah', 120_000), hvItem('Ibu Ratih Kumala', 100_000)],
  },
  {
    id: 'bp-b',
    name: 'Diski Tafa Ilham',
    lastSetoran: '2026-08-11T17:30:00',
    outstandingItems: [
      mvItem('Majelis Mawar', [
        { name: 'Ibu Sri Wahyuni', amount: 600_000 },
        { name: 'Ibu Endang Sari', amount: 500_000 },
        { name: 'Ibu Yati Suryani', amount: 400_000 },
      ]),
    ],
  },
  {
    id: 'bp-c',
    name: 'Cenli Cencen',
    lastSetoran: '2026-08-13T16:05:00',
    outstandingItems: [],
  },
  {
    id: 'bp-d',
    name: 'Laili Maulidia',
    lastSetoran: '2026-08-13T14:00:00',
    outstandingItems: [
      mvItem('Majelis Kenanga', [
        { name: 'Ibu Yuni Astuti', amount: 800_000 },
        { name: 'Ibu Retno Wulandari', amount: 700_000 },
        { name: 'Ibu Lestari', amount: 500_000 },
        { name: 'Ibu Fitriani', amount: 400_000 },
      ]),
      hvItem('Ibu Marlina', 800_000),
    ],
  },
  {
    id: 'bp-e',
    name: 'Fadhil Maulana',
    lastSetoran: '2026-08-12T18:00:00',
    outstandingItems: [hvItem('Ibu Ratih Kumala', 850_000)],
  },
  {
    id: 'bp-f',
    name: 'Ainur Rohmah',
    lastSetoran: '2026-08-11T17:15:00',
    outstandingItems: [
      mvItem('Majelis Teratai', [
        { name: 'Ibu Ningsih', amount: 780_000 },
        { name: 'Ibu Wulan Sari', amount: 700_000 },
        { name: 'Ibu Dewi Sartika', amount: 600_000 },
      ]),
    ],
  },
]

export const BP_ROWS: BpRow[] = SEEDS.map((seed) => ({
  ...seed,
  outstanding: seed.outstandingItems.reduce((total, i) => total + i.amount, 0),
}))

/** "7850000" → "Rp7.850.000" — grouped with dots, the way the reference prints money. */
export function rupiah(value: number): string {
  return `Rp${value.toLocaleString('id-ID')}`
}

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** "2026-08-13T14:00:00" → "14:00, 13 Aug 2026". Parsed by string, never via
 *  `Date`, so it renders the same on the server and the client (no timezone
 *  drift, no hydration mismatch). */
export function formatSetoran(iso: string): string {
  const [date, time] = iso.split('T')
  const [y, m, d] = date.split('-')
  const [hh, mm] = time.split(':')
  return `${hh}:${mm}, ${parseInt(d, 10)} ${MONTHS_SHORT[parseInt(m, 10) - 1]} ${y}`
}

/**
 * How late a BP is at settling, driving the timestamp colour, the note, and
 * which row actions are enabled:
 *  - 'onTime'  — nothing left to settle, or still before today's 16.00 deadline.
 *  - 'today'   — still outstanding past today's 16.00 deadline (allows Acknowledge).
 *  - 'overdue' — outstanding and more than a day late (also allows BP mangkir).
 */
export type Lateness = 'onTime' | 'today' | 'overdue'

export function latenessOf(row: BpRow, now: string): Lateness {
  if (row.outstanding <= 0) return 'onTime'
  if (Date.parse(now) - Date.parse(row.lastSetoran) > ONE_DAY) return 'overdue'
  // Not overdue — only late once today's 16.00 deadline has passed.
  const hour = parseInt(now.split('T')[1]?.split(':')[0] ?? '0', 10)
  return hour >= DEADLINE_HOUR ? 'today' : 'onTime'
}

/** "2026-08-13T14:30:00" → "Diperbarui hari ini, 13 Aug 2026, 14.30 WIB". */
export function formatUpdatedAt(iso: string): string {
  const [date, time] = iso.split('T')
  const [y, m, d] = date.split('-')
  const [hh, mm] = time.split(':')
  return `Diperbarui hari ini, ${parseInt(d, 10)} ${MONTHS_SHORT[parseInt(m, 10) - 1]} ${y}, ${hh}.${mm} WIB`
}
