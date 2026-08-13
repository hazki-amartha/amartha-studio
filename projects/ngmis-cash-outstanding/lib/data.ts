// Mock data for the Cash Outstanding & Settlement tab.
//
// One row per BP in the branch roster (a handful — the invisible rows of a
// realistic-scale dataset are pure token cost, §3). Each BP carries the money
// not yet handed in (belum disetor / outstanding) and the money already handed
// in (sudah disetor / settled), each broken down into the tasks it came from.
// The row and summary totals are summed from those items so nothing can drift.

/** Where a settled/outstanding chunk originates. A whole majelis (MV) settles
 *  together — it can't be split per mitra — while an HV is one mitra's own bill. */
export interface OriginRef {
  kind: 'MV' | 'HV'
  label: string
}

/** How a settled chunk reached the company: a Virtual Account transfer, or cash
 *  handed to an Agen AmarthaLink counter. Mirrors the two roads in the APartner
 *  BP New Concept prototype. */
export interface SettlementDest {
  via: 'va' | 'agent'
  /** "Virtual Account" | "Agen AmarthaLink". */
  label: string
  /** The account/counter identifier, e.g. "BCA · 8808 3021 5567". */
  detail: string
}

export interface OutstandingItem {
  origin: OriginRef
  amount: number
  /** The BP has asked to submit this task again (a re-open request the BM can
   *  approve). Surfaced as a red counter beside the cell's "Rincian" link and,
   *  in the dialog, as an inline "Approve" action. */
  resubmitRequested?: boolean
}

export interface SettledItem {
  origin: OriginRef
  dest: SettlementDest
  /** Transfer date, e.g. "23 Juni 2026". */
  date: string
  amount: number
}

export interface BpRow {
  id: string
  name: string
  outstanding: number
  settled: number
  /** ISO datetime of the BP's most recent setoran. */
  lastSetoran: string
  outstandingItems: OutstandingItem[]
  settledItems: SettledItem[]
}

export const WEEK_LABEL = 'Minggu ini, 22 – 27 Juni 2026'

/** The "now" the staleness check reads from — mid-week. */
const NOW = '2026-06-24T12:00:00'
const ONE_DAY = 24 * 60 * 60 * 1000

const mv = (label: string): OriginRef => ({ kind: 'MV', label })
const hv = (label: string): OriginRef => ({ kind: 'HV', label })
const va = (detail: string): SettlementDest => ({ via: 'va', label: 'Virtual Account', detail })
const agent = (detail: string): SettlementDest => ({
  via: 'agent',
  label: 'Agen AmarthaLink',
  detail,
})

interface BpSeed {
  id: string
  name: string
  lastSetoran: string
  outstandingItems: OutstandingItem[]
  settledItems: SettledItem[]
}

const SEEDS: BpSeed[] = [
  {
    id: 'bp-a',
    name: 'Sukma Ayuningrum',
    lastSetoran: '2026-06-24T08:15:00',
    outstandingItems: [
      { origin: hv('Ibu Siti Aminah'), amount: 120_000, resubmitRequested: true },
      { origin: hv('Ibu Ratih Kumala'), amount: 100_000 },
    ],
    settledItems: [
      { origin: mv('Majelis Melati'), dest: va('BCA · 8808 3021 5567'), date: '23 Juni 2026', amount: 2_000_000 },
      { origin: hv('Ibu Dewi Lestari'), dest: agent('Warung Bu Yeni'), date: '23 Juni 2026', amount: 1_450_000 },
    ],
  },
  {
    id: 'bp-b',
    name: 'Diski Tafa Ilham',
    lastSetoran: '2026-06-22T14:30:00',
    outstandingItems: [{ origin: mv('Majelis Mawar'), amount: 1_500_000, resubmitRequested: true }],
    settledItems: [
      { origin: mv('Majelis Mawar'), dest: va('BRI · 8808 7754 1120'), date: '22 Juni 2026', amount: 1_800_000 },
      { origin: hv('Ibu Nurhayati'), dest: agent('Kios Pak Dedi'), date: '22 Juni 2026', amount: 1_000_000 },
    ],
  },
  {
    id: 'bp-c',
    name: 'Cenli Cencen',
    lastSetoran: '2026-06-24T10:05:00',
    outstandingItems: [],
    settledItems: [
      { origin: mv('Majelis Anggrek'), dest: va('BCA · 8808 1190 4432'), date: '24 Juni 2026', amount: 2_600_000 },
      { origin: hv('Ibu Wulandari'), dest: va('BCA · 8808 1190 4432'), date: '24 Juni 2026', amount: 1_500_000 },
    ],
  },
  {
    id: 'bp-d',
    name: 'Laili Maulidia',
    lastSetoran: '2026-06-21T16:20:00',
    outstandingItems: [
      { origin: mv('Majelis Kenanga'), amount: 2_400_000, resubmitRequested: true },
      { origin: hv('Ibu Marlina'), amount: 800_000, resubmitRequested: true },
    ],
    settledItems: [
      { origin: hv('Ibu Siti Aminah'), dest: agent('Warung Bu Yeni'), date: '21 Juni 2026', amount: 1_950_000 },
    ],
  },
  {
    id: 'bp-e',
    name: 'Fadhil Maulana',
    lastSetoran: '2026-06-24T09:40:00',
    outstandingItems: [{ origin: hv('Ibu Ratih Kumala'), amount: 850_000 }],
    settledItems: [
      { origin: mv('Majelis Dahlia'), dest: va('Mandiri · 8808 6621 8890'), date: '24 Juni 2026', amount: 3_320_000 },
      { origin: mv('Majelis Teratai'), dest: va('Mandiri · 8808 6621 8890'), date: '24 Juni 2026', amount: 2_000_000 },
    ],
  },
  {
    id: 'bp-f',
    name: 'Ainur Rohmah',
    lastSetoran: '2026-06-22T11:15:00',
    outstandingItems: [{ origin: mv('Majelis Teratai'), amount: 2_080_000 }],
    settledItems: [
      { origin: hv('Ibu Dewi Lestari'), dest: agent('Kios Pak Dedi'), date: '22 Juni 2026', amount: 1_100_000 },
      { origin: hv('Ibu Nurhayati'), dest: va('BRI · 8808 3345 7781'), date: '22 Juni 2026', amount: 1_500_000 },
    ],
  },
]

const sum = (items: { amount: number }[]) => items.reduce((total, i) => total + i.amount, 0)

export const BP_ROWS: BpRow[] = SEEDS.map((seed) => ({
  ...seed,
  outstanding: sum(seed.outstandingItems),
  settled: sum(seed.settledItems),
}))

export const TOTAL_OUTSTANDING = BP_ROWS.reduce((total, r) => total + r.outstanding, 0)
export const TOTAL_SETTLED = BP_ROWS.reduce((total, r) => total + r.settled, 0)

/** "7850000" → "Rp7.850.000" — grouped with dots, the way the reference prints money. */
export function rupiah(value: number): string {
  return `Rp${value.toLocaleString('id-ID')}`
}

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

/** "2026-06-23T16:40:00" → "16:40, 23 Juni 2026". Parsed by string, never via
 *  `Date`, so it renders the same on the server and the client (no timezone
 *  drift, no hydration mismatch). */
export function formatSetoran(iso: string): string {
  const [date, time] = iso.split('T')
  const [y, m, d] = date.split('-')
  const [hh, mm] = time.split(':')
  return `${hh}:${mm}, ${parseInt(d, 10)} ${MONTHS_ID[parseInt(m, 10) - 1]} ${y}`
}

/** The last setoran is "stale" — shown red — when it is more than a day old AND
 *  the BP still has cash outstanding. Timezone-independent: it compares two
 *  same-zone parses, so only their difference matters. */
export function isSetoranStale(row: BpRow): boolean {
  if (row.outstanding <= 0) return false
  return Date.parse(NOW) - Date.parse(row.lastSetoran) > ONE_DAY
}
