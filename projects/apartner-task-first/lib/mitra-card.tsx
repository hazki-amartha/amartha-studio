'use client'

// The one mitra card, shared by step 1 (kehadiran & pembayaran) and step 2
// (tugas tambahan). The identity block — avatar, name, subtitle, DPD badge —
// is computed HERE from state rather than passed in, so the two steps cannot
// drift apart: a mitra looks identical in both, and only the action row below
// the rule changes. That sameness is the point. The BP is looking at the same
// people twice, doing a different thing to them.

import type { ReactNode } from 'react'
import { Badge, Card } from '@/design-system/components'
import { rupiah, type Mitra } from './data'
import { paidOf, paymentStatus, type AppState } from './store'
import { Avatar } from './ui'

/** DPD is the only status worth a badge — "current" needs no decoration. */
function DpdBadge({ dpd }: { dpd: number }) {
  if (dpd === 0) return null
  // self-start so the pill hugs its text instead of being stretched by the
  // surrounding flex column.
  return (
    <Badge className="self-start" intent={dpd >= 30 ? 'red' : 'orange'}>
      Menunggak {dpd} hari
    </Badge>
  )
}

export function MitraCard({
  mitra,
  state,
  action,
}: {
  mitra: Mitra
  state: AppState
  /** The single row under the rule — the ONLY thing that differs per step. */
  action: ReactNode
}) {
  const status = paymentStatus(state, mitra)
  const paid = paidOf(state, mitra)

  const subtitle =
    status === 'sebagian'
      ? `Dibayar ${rupiah(paid)} dari ${rupiah(mitra.due)}`
      : status === 'lunas'
        ? `Lunas ${rupiah(mitra.due)}`
        : `Tagihan ${rupiah(mitra.due)}`

  return (
    <Card>
      <div className="flex flex-col gap-12">
        <div className="flex items-start gap-12">
          <Avatar name={mitra.name} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="truncate text-14 font-bold text-default">{mitra.name}</span>
            <span className="text-12 text-caption">{subtitle}</span>
            <DpdBadge dpd={mitra.dpd} />
          </div>
        </div>
        <div className="border-t border-default pt-12">{action}</div>
      </div>
    </Card>
  )
}
