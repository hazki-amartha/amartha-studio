'use client'

// The active-majelis mitra roster — a project-local port of the BP New Concept
// mitra card (§4). An active group's Halaman Majelis lists its running mitra
// with the two facts the BP scans for: her product, any arrangement in place
// (keringanan / janji bayar), and her DPD bucket (or "Lancar").
//
// A representative roster at on-screen scale (§3): five mitra covering the
// states the reference shows, not a full 22-row group.

import { Badge } from '@/design-system/components'
import type { BadgeIntent } from '@/design-system/components/Badge'
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

// --- Draft potential members ------------------------------------------------
// A draft majelis (Kenari, Teratai) has no active mitra yet — it is a group
// being gathered, so its members are calon mitra at various survey stages. A
// representative stand-in list (§3), shown on the draft majelis page in place of
// the active roster.

export type PotentialStatus = 'ongoing' | 'submitted' | 'approved'

export interface PotentialMitra {
  id: string
  name: string
  status: PotentialStatus
}

// Per-draft potential members, keyed by directory id. A majelis activates only
// once at least MIN_MEMBERS of them are "survey approved" (cleared underwriting):
//   - Teratai — 6 gathered, all 6 approved → ready to activate.
//   - Kenari  — 11 gathered but only 4 approved so far → still short.
// All approved members are listed explicitly; the remaining not-yet-approved
// ones beyond this list fold into "dan N lainnya" on the page.
export const DRAFT_POTENTIAL: Record<string, PotentialMitra[]> = {
  teratai: [
    { id: 'te1', name: 'Yayah Suryani', status: 'approved' },
    { id: 'te2', name: 'Imas Masitoh', status: 'approved' },
    { id: 'te3', name: 'Neneng Hasanah', status: 'approved' },
    { id: 'te4', name: 'Titin Kartika', status: 'approved' },
    { id: 'te5', name: 'Wiwi Winarti', status: 'approved' },
    { id: 'te6', name: 'Eneng Rohaeti', status: 'approved' },
  ],
  kenari: [
    { id: 'ke1', name: 'Sukaesih', status: 'approved' },
    { id: 'ke2', name: 'Rohimah', status: 'approved' },
    { id: 'ke3', name: 'Darsih', status: 'approved' },
    { id: 'ke4', name: 'Enok Suryani', status: 'approved' },
    { id: 'ke5', name: 'Marlina Dewi', status: 'submitted' },
    { id: 'ke6', name: 'Yuyun Yuningsih', status: 'ongoing' },
  ],
}

/** The gathered potential members of a draft directory majelis. */
export function draftPotential(id: string): PotentialMitra[] {
  return DRAFT_POTENTIAL[id] ?? []
}

/** How many of a draft majelis' members have cleared underwriting (approved). */
export function draftApprovedCount(id: string): number {
  return draftPotential(id).filter((m) => m.status === 'approved').length
}

const POTENTIAL_BADGE: Record<PotentialStatus, { label: string; intent: BadgeIntent }> = {
  ongoing: { label: 'Survey ongoing', intent: 'orange' },
  submitted: { label: 'Survey submitted', intent: 'blue' },
  approved: { label: 'Survey approved', intent: 'green' },
}

/** One potential-member row for a draft majelis — name-initial avatar + status. */
export function PotentialMemberRow({ member, divider }: { member: PotentialMitra; divider?: boolean }) {
  const b = POTENTIAL_BADGE[member.status]
  return (
    <div className={`flex items-center gap-12 py-8 ${divider ? 'border-t border-default' : ''}`}>
      <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-primary-50 text-12 font-bold text-primary-500">
        {member.name.charAt(0)}
      </span>
      <span className="min-w-0 flex-1 truncate text-14 text-default">{member.name}</span>
      <Badge intent={b.intent} size="sm">
        {b.label}
      </Badge>
    </div>
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
