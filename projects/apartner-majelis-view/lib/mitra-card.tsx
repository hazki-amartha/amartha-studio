'use client'

// The one mitra card, shared by the roster, the attendance stage and the
// collection stage. The LAYOUT is fixed here — avatar, name, the two standing
// facts, a status badge, then an optional action row — so the three surfaces
// cannot drift apart: a mitra sits in the same shape everywhere and the BP
// re-reads nothing as she moves between stages.
//
// The two standing facts are the direction's own requirement: the reference is
// explicit that a member card should carry her loan and her weekly instalment
// alongside her DPD, because those are the numbers she asks about ("berapa sisa
// saya, Bu?") and a BP who has to leave the queue to answer has left the queue.

import type { ReactNode } from 'react'
import { Badge, Card } from '@/design-system/components'
import { rupiah, type Mitra } from './data'
import { IconChevronRight } from './icons'
import { Avatar } from './ui'

/** Her bucket, as the badge the reference puts top-right of every card. */
export function DpdBadge({ dpd }: { dpd: number }) {
  if (dpd === 0) return <Badge intent="green">Lancar</Badge>
  return <Badge intent={dpd >= 30 ? 'red' : 'orange'}>Menunggak {dpd} hari</Badge>
}

export function MitraCard({
  mitra,
  meta,
  trailing,
  action,
  onOpen,
}: {
  mitra: Mitra
  /**
   * Replaces the standing facts when a stage has something more relevant to
   * say in that slot — the collection stage puts what she owes here, because at
   * that moment the bill outranks the contract it came from.
   */
  meta?: ReactNode
  /** Control pinned right of the identity row. */
  trailing?: ReactNode
  /** The row under the rule. Omitted renders no rule and no row. */
  action?: ReactNode
  /**
   * Opens her page. This is the identity BLOCK, not an added button: a separate
   * control would cost a row on every one of 22 cards. The chevron is the tell.
   */
  onOpen?: () => void
}) {
  const identity = (
    <>
      <Avatar name={mitra.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-4">
          <span className="truncate text-16 font-bold text-default">{mitra.name}</span>
          {onOpen ? (
            <span className="shrink-0 text-disabled">
              <IconChevronRight size={16} />
            </span>
          ) : null}
        </span>
        {meta ?? (
          <>
            <span className="truncate text-12 text-caption">Pinjaman {rupiah(mitra.loan)}</span>
            <span className="truncate text-12 text-caption">
              Angsuran {rupiah(mitra.weekly)}/minggu
            </span>
          </>
        )}
      </div>
    </>
  )

  return (
    <Card>
      <div className="flex flex-col gap-12">
        <div className="flex items-start gap-12">
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              aria-label={`Buka halaman ${mitra.name}`}
              className="flex min-w-0 flex-1 items-start gap-12 text-left"
            >
              {identity}
            </button>
          ) : (
            identity
          )}
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
        {action ? <div className="border-t border-default pt-12">{action}</div> : null}
      </div>
    </Card>
  )
}
