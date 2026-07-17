'use client'

// The one mitra card, shared by step 1 (kehadiran & pembayaran) and step 2
// (tugas tambahan). The LAYOUT is fixed here — avatar, name, one status line,
// DPD badge, a rule, then an action row — so the two steps cannot drift apart:
// a mitra sits in the same shape in both, and the BP re-reads nothing.
//
// The two slots that vary are the ones carrying the step's subject: the status
// line and the action row. Step 1 fills the status line from payment ("Tagihan
// Rp 200.000"); step 2 fills it from the mitra's standing on what's being
// offered ("Belum pernah menabung"). Same slot, same shape, step's own fact.

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
  status,
  action,
}: {
  mitra: Mitra
  state: AppState
  /** The line under the name. Defaults to payment standing (step 1's subject). */
  status?: string
  /** The single row under the rule. */
  action: ReactNode
}) {
  const payment = paymentStatus(state, mitra)
  const paid = paidOf(state, mitra)

  const subtitle =
    status ??
    (payment === 'sebagian'
      ? `Dibayar ${rupiah(paid)} dari ${rupiah(mitra.due)}`
      : payment === 'lunas'
        ? `Lunas ${rupiah(mitra.due)}`
        : `Tagihan ${rupiah(mitra.due)}`)

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
