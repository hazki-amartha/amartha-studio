'use client'

// The one mitra card, shared by step 1 (kehadiran & pembayaran) and step 2
// (tugas tambahan). The LAYOUT is fixed here — avatar, name, one status line,
// DPD badge, an optional trailing control, a rule, then an action block — so the
// two steps cannot drift apart: a mitra sits in the same shape in both, and the
// BP re-reads nothing.
//
// The slots that vary carry the step's subject. Step 1 puts attendance in the
// trailing slot and payment in the action block; step 2 puts where she stands on
// what's offered in the status line and the recommendation in the action block.
// Same shape, each step's own facts.

import type { ReactNode } from 'react'
import { Badge, Card } from '@/design-system/components'
import type { Mitra } from './data'
import { Avatar } from './ui'

/**
 * Every mitra carries a bucket badge, current ones included. Showing "Lancar"
 * rather than nothing keeps the badge row at a fixed height so cards don't jog
 * as the BP scrolls, and makes "no badge" impossible to misread as "no data".
 */
function DpdBadge({ dpd }: { dpd: number }) {
  // self-start so the pill hugs its text instead of being stretched by the
  // surrounding flex column.
  if (dpd === 0) {
    return (
      <Badge className="self-start" intent="green">
        Lancar
      </Badge>
    )
  }
  return (
    <Badge className="self-start" intent={dpd >= 30 ? 'red' : 'orange'}>
      Menunggak {dpd} hari
    </Badge>
  )
}

export function MitraCard({
  mitra,
  status,
  trailing,
  action,
}: {
  mitra: Mitra
  /** The line under the name — the step's subject. Omitted renders nothing. */
  status?: string
  /** Control pinned to the right of the identity row (step 1: attendance). */
  trailing?: ReactNode
  /** The block under the rule. */
  action: ReactNode
}) {
  return (
    <Card>
      <div className="flex flex-col gap-12">
        <div className="flex items-start gap-12">
          <Avatar name={mitra.name} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="truncate text-14 font-bold text-default">{mitra.name}</span>
            {status ? <span className="text-12 text-caption">{status}</span> : null}
            <DpdBadge dpd={mitra.dpd} />
          </div>
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
        <div className="border-t border-default pt-12">{action}</div>
      </div>
    </Card>
  )
}
