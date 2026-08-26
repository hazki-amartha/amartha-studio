// Mock data for Setor tunai, ported from ngmis-cash-outstanding's Cash
// outstanding tab (§1: copied, not imported — see NOTES.md). Kept on this
// project's own ten-BP roster rather than that project's, so a BP reads the
// same wherever she appears across tabs; the outstanding breakdowns and
// amounts otherwise carry across unchanged.
//
// Each BP's belum-disetor money is broken down into the tugas it came from,
// and each tugas is broken down again into the mitra who owe it. A row's
// total is summed from those items so nothing can drift out of agreement.

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

export interface CashBpRow {
  id: string
  name: string
  /** ISO datetime of the BP's most recent setoran. */
  lastSetoran: string
  outstandingItems: OutstandingItem[]
}

const ONE_DAY = 24 * 60 * 60 * 1000
/** The settlement deadline each day — a BP still holding cash after this is late. */
const DEADLINE_HOUR = 16

/** The moment the report reads "now" — fixed for the prototype rather than
 *  read from the clock, so the lateness split is the same every load. */
export const NOW = '2026-06-26T22:49:00'

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

/** Same ids and names as `REPAYMENT_BPS` in data.ts, so a BP is the same
 *  person on every tab. */
export const CASH_BPS: CashBpRow[] = [
  {
    id: 'bp-sukma', name: 'Sukma Ayuningrum', lastSetoran: '2026-06-26T14:00:00',
    outstandingItems: [hvItem('Ibu Siti Aminah', 120_000), hvItem('Ibu Ratih Kumala', 100_000)],
  },
  {
    id: 'bp-diski', name: 'Diski Tafa Ilham', lastSetoran: '2026-06-24T17:30:00',
    outstandingItems: [
      mvItem('Majelis Mawar', [
        { name: 'Ibu Sri Wahyuni', amount: 600_000 },
        { name: 'Ibu Endang Sari', amount: 500_000 },
        { name: 'Ibu Yati Suryani', amount: 400_000 },
      ]),
    ],
  },
  { id: 'bp-cenli', name: 'Cenli Cencen', lastSetoran: '2026-06-26T16:05:00', outstandingItems: [] },
  {
    id: 'bp-laili', name: 'Laili Maulidia', lastSetoran: '2026-06-26T14:00:00',
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
    id: 'bp-fadhil', name: 'Fadhil Maulana', lastSetoran: '2026-06-25T18:00:00',
    outstandingItems: [hvItem('Ibu Ratih Kumala', 850_000)],
  },
  {
    id: 'bp-ainur', name: 'Ainur Rohmah', lastSetoran: '2026-06-24T17:15:00',
    outstandingItems: [
      mvItem('Majelis Teratai', [
        { name: 'Ibu Ningsih', amount: 780_000 },
        { name: 'Ibu Wulan Sari', amount: 700_000 },
        { name: 'Ibu Dewi Sartika', amount: 600_000 },
      ]),
    ],
  },
  { id: 'bp-rudi', name: 'Rudi Hartono', lastSetoran: '2026-06-26T16:00:00', outstandingItems: [] },
  { id: 'bp-budi', name: 'Budi Ngurah', lastSetoran: '2026-06-26T15:30:00', outstandingItems: [] },
  {
    id: 'bp-alif', name: 'M. Alif Rizqi', lastSetoran: '2026-06-26T14:30:00',
    outstandingItems: [hvItem('Ibu Yanti Kurnia', 450_000)],
  },
  { id: 'bp-fauzan', name: 'Fauzan Aditama', lastSetoran: '2026-06-26T15:45:00', outstandingItems: [] },
]

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

/** "2026-06-26T14:00:00" → "14:00, 26 Jun 2026". Parsed by string, never via
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
 *  - 'today'   — still outstanding past today's 16.00 deadline (allows Ack).
 *  - 'overdue' — outstanding and more than a day late (also allows BP mangkir).
 */
export type Lateness = 'onTime' | 'today' | 'overdue'

export function latenessOf(outstanding: number, lastSetoran: string, now: string): Lateness {
  if (outstanding <= 0) return 'onTime'
  if (Date.parse(now) - Date.parse(lastSetoran) > ONE_DAY) return 'overdue'
  const hour = parseInt(now.split('T')[1]?.split(':')[0] ?? '0', 10)
  return hour >= DEADLINE_HOUR ? 'today' : 'onTime'
}

/** "HV - Ibu Marlina" / "MV - Majelis Kenanga". */
export function originText(origin: OriginRef): string {
  return `${origin.kind} - ${origin.label}`
}
