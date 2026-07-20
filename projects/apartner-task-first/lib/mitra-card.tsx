'use client'

// The one mitra card, shared by step 1 (kehadiran & pembayaran) and step 2
// (tugas tambahan). The LAYOUT is fixed here — avatar, name, bucket line, an
// optional trailing control, a rule, then an action row — so the two steps
// cannot drift apart: a mitra sits in the same shape in both, and the BP
// re-reads nothing.
//
// Everything on the card sits on a 32px rhythm: the avatar, the attendance
// circles, and both action buttons are all 32px tall, so the two rows read as
// two clean bands rather than a ragged stack.
//
// The slots that vary carry the step's subject. Step 1 puts attendance in the
// trailing slot and the bill + payment actions in the action row; step 2 puts
// where she stands on what's offered in the status line and the recommendation
// in the action row.

import type { ReactNode } from 'react'
import { Card } from '@/design-system/components'
import type { Mitra } from './data'
import { IconChevronRight } from './icons'
import { Avatar } from './ui'

/**
 * The bucket, as coloured text rather than a pill. Every mitra carries one,
 * current ones included: "Lancar" rather than nothing keeps the line at a fixed
 * height so cards don't jog as the BP scrolls, and makes "no label" impossible
 * to misread as "no data".
 */
function BucketLine({ dpd }: { dpd: number }) {
  if (dpd === 0) {
    return <span className="text-12 font-bold text-green-500">Lancar</span>
  }
  return (
    <span className={`text-12 font-bold ${dpd >= 30 ? 'text-red-500' : 'text-orange-500'}`}>
      Menunggak {dpd} hari
    </span>
  )
}

export function MitraCard({
  mitra,
  status,
  trailing,
  action,
  onOpen,
}: {
  mitra: Mitra
  /** Extra line under the name — the step's subject. Omitted renders nothing. */
  status?: string
  /** Control pinned to the right of the identity row (step 1: attendance). */
  trailing?: ReactNode
  /** The row under the rule. */
  action: ReactNode
  /**
   * Opens her mitra page. This is the identity BLOCK, not an added button: a
   * separate control would cost a row on every one of 22 cards, which is the
   * "ribet" failure mode this direction exists to avoid. A chevron beside the
   * name is the tell, the same one the schedule's "Berikutnya" rows use.
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
        {status ? <span className="truncate text-12 text-caption">{status}</span> : null}
        <BucketLine dpd={mitra.dpd} />
      </div>
    </>
  )

  return (
    <Card>
      <div className="flex flex-col gap-12">
        <div className="flex items-center gap-12">
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              aria-label={`Buka halaman ${mitra.name}`}
              className="flex min-w-0 flex-1 items-center gap-12 text-left"
            >
              {identity}
            </button>
          ) : (
            identity
          )}
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
        <div className="border-t border-default pt-12">{action}</div>
      </div>
    </Card>
  )
}
