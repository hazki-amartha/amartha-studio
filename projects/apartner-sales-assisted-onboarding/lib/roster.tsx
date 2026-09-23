'use client'

// The active-majelis mitra roster — a project-local port of the BP New Concept
// mitra card (§4). An active group's Halaman Majelis lists its running mitra
// with the two facts the BP scans for: her product, any arrangement in place
// (keringanan / janji bayar), and her DPD bucket (or "Lancar").
//
// A representative roster at on-screen scale (§3): five mitra covering the
// states the reference shows, not a full 22-row group.

import { Badge } from '@/design-system/components'
import { User } from '@/design-system/icons'
import { ProductBadge } from './ui'

export interface RosterMitra {
  id: string
  name: string
  product: 'Modal' | 'GL'
  /** Days past due — 0 is "Lancar". */
  dpd: number
  /** An approved relief on her arrears. */
  keringanan?: boolean
  /** A promise-to-pay date already on file. */
  ptp?: string
}

export const MAJELIS_ROSTER: RosterMitra[] = [
  { id: 'r1', name: 'Rina Marlina', product: 'Modal', dpd: 32, keringanan: true },
  { id: 'r2', name: 'Yanti Rohayati', product: 'GL', dpd: 10, keringanan: true },
  { id: 'r3', name: 'Ani Suryani', product: 'GL', dpd: 4, ptp: '24 Jul' },
  { id: 'r4', name: 'Ai Nurjanah', product: 'Modal', dpd: 0 },
  { id: 'r5', name: 'Cucu Sumiati', product: 'Modal', dpd: 0 },
]

/** The 7-day bucket a DPD falls in — 32 days late is "DPD 29-35". */
function dpdBucket(dpd: number): string {
  const band = Math.ceil(dpd / 7)
  return `DPD ${(band - 1) * 7 + 1}-${band * 7}`
}

export function DpdBadge({ dpd }: { dpd: number }) {
  if (dpd === 0) {
    return (
      <Badge intent="green" variant="outline">
        Lancar
      </Badge>
    )
  }
  const intent = dpd > 37 ? 'red' : dpd <= 7 ? 'yellow' : 'orange'
  return (
    <Badge intent={intent} variant="outline">
      {dpdBucket(dpd)}
    </Badge>
  )
}

export function MitraRosterCard({ mitra }: { mitra: RosterMitra }) {
  return (
    <div className="flex items-center gap-12 rounded-12 border border-default bg-neutral-white p-12">
      <span
        className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-500"
        aria-hidden
      >
        <User size={20} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="truncate text-16 font-bold text-default">{mitra.name}</span>
        <span className="flex flex-wrap items-center gap-4">
          <ProductBadge product={mitra.product} />
          {mitra.ptp ? <Badge intent="blue">Janji bayar {mitra.ptp}</Badge> : null}
          {mitra.keringanan ? <Badge intent="yellow">Dapat keringanan</Badge> : null}
        </span>
      </div>
      <span className="shrink-0">
        <DpdBadge dpd={mitra.dpd} />
      </span>
    </div>
  )
}
