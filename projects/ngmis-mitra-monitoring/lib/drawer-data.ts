// What the BP drawer reads: every mitra under a BP, each with a tindakan log.
// Four mitra per BP, cycled from small pools — enough rows to read as a real
// roster without a dataset nobody scrolls.

import { REPAYMENT_BPS } from './bp-data'
import { BUCKETS, rupiah, type BucketId } from './data'

export type Pelaku = 'BP' | 'AM' | 'BM' | 'DC'

export interface Tindakan {
  date: string
  pelaku: Pelaku
  jenis: 'Telepon' | 'Home visit'
  hasil: string
  /** true = succeeded, false = failed, null = cancelled. */
  ok: boolean | null
  catatan?: string
  /** Money collected. Only a Home visit takes payment — a call can't. */
  dibayar: number
  /** A note on the payment itself, shown under the amount. */
  catatanBayar?: string
  /** A promise made on a call: pay `amount` on `date`. */
  janji?: { date: string; amount: number }
}

export type PaymentStatus = 'full' | 'partial' | 'none'

export interface DrawerMitra {
  id: string
  code: string
  name: string
  majelis: string
  bucket: BucketId
  /** What she paid this week against what was due. */
  payment: PaymentStatus
  tunggakan: number
  loanIds: string[]
  /** Most recent first. */
  tindakan: Tindakan[]
  /** Absent when no next step is booked — the card then skips the box. */
  followUp?: string
  followUpNote?: string
}

export const BP_NAMES = REPAYMENT_BPS.map((b) => b.name)

const MAJELIS_POOL = ['Melati 1', 'Mawar', 'Anggrek', 'Kenanga', 'Dahlia', 'Teratai']

const NAMES = [
  'Sri Wedari', 'Siti Aminah', 'Dewi Lestari', 'Ratna Sari', 'Yuli Astuti', 'Nur Fadilah',
  'Rohmah', 'Ani Marlina', 'Tuti Handayani', 'Nur Hayati', 'Sri Wahyuni', 'Lilis Suryani',
  'Nining Ningsih', 'Rini Suryaningsih', 'Wati Handayani', 'Endang Sulastri', 'Fitri Rahayu',
]

const LOG: Omit<Tindakan, 'dibayar'>[] = [
  { date: '1 Sept 2026, 10:15', pelaku: 'AM', jenis: 'Home visit', hasil: 'Tidak bertemu', ok: false, catatan: 'Kata tetangga, mitra pindah rumah' },
  { date: '30 Aug 2026, 10:15', pelaku: 'BM', jenis: 'Home visit', hasil: 'Tidak bertemu', ok: false, catatan: 'Tidak ada orang dirumah' },
  { date: '28 Aug 2026, 10:15', pelaku: 'BP', jenis: 'Home visit', hasil: 'Bertemu keluarga', ok: true, catatan: 'Mitra sedang keluar rumah' },
  { date: '16 Aug 2026, 10:15', pelaku: 'BP', jenis: 'Home visit', hasil: 'Dibatalkan oleh petugas', ok: null, catatan: 'Petugas tidak punya waktu' },
  { date: '26 Aug 2026, 10:15', pelaku: 'BP', jenis: 'Telepon', hasil: 'Tidak dijawab mitra', ok: false },
  { date: '16 Aug 2026, 10:15', pelaku: 'DC', jenis: 'Telepon', hasil: 'Dijawab mitra', ok: true, janji: { date: '26 Aug 2026', amount: 250_000 } },
]

/** What has been done about a mitra depends on how late she is. DPD 0 is
 *  still repaying on time, so nobody has chased her. A BP phones those 1-7
 *  days late (the DPD 1-30 band opens with calls); past that it takes a home
 *  visit, and the older calls stay in the log from when she was first late. */
function tindakanFor(bucket: BucketId) {
  if (bucket === 'dpd0') return []
  if (bucket === 'dpd130') return [LOG[0], LOG[4], LOG[5]]
  return LOG
}

/** Per BP: 5 mitra at DPD 1-30, 3 at DPD 31-90, 3 at DPD 90+. DPD 0 is left
 *  out of the drawer for now — nobody has been chased, so nothing to read. */
const PLAN: { bucket: BucketId; payment: PaymentStatus }[] = [
  { bucket: 'dpd130', payment: 'full' },
  { bucket: 'dpd130', payment: 'partial' },
  { bucket: 'dpd130', payment: 'partial' },
  { bucket: 'dpd130', payment: 'none' },
  { bucket: 'dpd130', payment: 'none' },
  { bucket: 'dpd3190', payment: 'partial' },
  { bucket: 'dpd3190', payment: 'none' },
  { bucket: 'dpd3190', payment: 'none' },
  { bucket: 'dpd90', payment: 'none' },
  { bucket: 'dpd90', payment: 'none' },
  { bucket: 'dpd90', payment: 'none' },
  // Clean mitra: current, nothing owed. Nobody has had a reason to visit yet,
  // except the third, whose BP dropped by anyway.
  { bucket: 'dpd0', payment: 'full' },
  { bucket: 'dpd0', payment: 'full' },
  { bucket: 'dpd0', payment: 'full' },
  { bucket: 'dpd0', payment: 'full' },
  { bucket: 'dpd0', payment: 'full' },
]

const BASE: Record<string, number> = { dpd0: 0, dpd130: 300_000, dpd3190: 1_500_000, dpd90: 3_000_000 }

function tindakanOf(i: number, bucket: BucketId, payment: PaymentStatus, tunggakan: number): Tindakan[] {
  // A clean mitra has no history. The one exception got a visit anyway.
  if (bucket === 'dpd0') {
    return i === 13
      ? [
          { date: '29 Aug 2026, 10:15', pelaku: 'AM', jenis: 'Home visit', hasil: 'Bertemu mitra', ok: true, dibayar: 1_520_000 },
          { date: '29 Aug 2026, 10:15', pelaku: 'AM', jenis: 'Home visit', hasil: 'Tidak bertemu mitra', ok: false, dibayar: 0, catatan: 'Tidak ada orang dirumah' },
        ]
      : []
  }
  // Only a Home visit takes money. A mitra who paid has that visit as her
  // latest tindakan — all of her tunggakan for full, half for partial — so
  // the card agrees with the Full / Partial / Not paying counts above it.
  return [
    ...(payment === 'none'
      ? []
      : [
          {
            date: '2 Sept 2026, 10:15',
            pelaku: 'BP' as const,
            jenis: 'Home visit' as const,
            hasil: 'Bertemu mitra',
            ok: true,
            dibayar: payment === 'full' ? tunggakan : Math.round(tunggakan / 2 / 1000) * 1000,
            catatanBayar: payment === 'partial' ? 'Warung sedang sepi pembeli' : undefined,
          },
        ]),
    ...tindakanFor(bucket).map((l) => ({ ...l, dibayar: 0 })),
  ]
}

export function drawerMitraFor(bpName: string): DrawerMitra[] {
  const start = Math.max(0, BP_NAMES.indexOf(bpName))
  const majelisOfBp = [0, 1, 2].map((k) => MAJELIS_POOL[(start + k) % MAJELIS_POOL.length])
  return PLAN.map(({ bucket, payment }, i) => {
    const name = NAMES[(start + i) % NAMES.length]
    const loans = 1 + ((start + i) % 3)
    const tunggakan =
      bucket === 'dpd0' ? 0 : name === 'Sri Wedari' ? 600_000 : BASE[bucket] + ((start + i) % 5) * 250_000
    return {
      id: `${bpName}-${i}`,
      code: String(i + 2).padStart(3, '0'),
      name,
      majelis: majelisOfBp[i % majelisOfBp.length],
      bucket,
      payment,
      tunggakan,
      loanIds: Array.from({ length: loans }, (_, k) => String(29264444 - k * 1000000 - i)),
      // Only a Home visit takes money. A mitra who paid has that visit as her
      // latest tindakan — all of her tunggakan for full, half for partial — so
      // the card agrees with the Full / Partial / Not paying counts above it.
      tindakan: tindakanOf(i, bucket, payment, tunggakan),
      followUp: `Home Visit oleh BP, sebelum ${10 + (i % 10)} Sep 2026`,
      followUpNote: `Janji bayar ${25 - (i % 10)} Des 2026, Rp${rupiah(100_000)}`,
    }
  })
}

/** A mitra who paid everything she owed is current again — DPD 0. */
export const bucketNow = (m: DrawerMitra): BucketId => (m.payment === 'full' ? 'dpd0' : m.bucket)

/** What is still owed after this week's payments. */
export const tunggakanNow = (m: DrawerMitra) =>
  Math.max(0, m.tunggakan - m.tindakan.reduce((n, t) => n + t.dibayar, 0))
