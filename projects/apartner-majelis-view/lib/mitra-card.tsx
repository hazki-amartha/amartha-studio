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
import { User } from '@/design-system/icons'
import { rupiah, type Mitra } from './data'
import { IconChevronRight } from './icons'

/**
 * Her bucket, as the badge the reference puts top-right of every card.
 *
 * Two wordings, same fact. `long` — "Menunggak 34 hari" — is for the stages,
 * where the card is being read one at a time and the sentence is what the BP
 * says out loud. `short` — "DPD 34" — is for the roster and her page, where the
 * badge is being SCANNED down a column of 22 and the ops term is the shortest
 * thing that still sorts.
 */
export function DpdBadge({ dpd, format = 'long' }: { dpd: number; format?: 'long' | 'short' }) {
  if (dpd === 0) return <Badge intent="green">Lancar</Badge>
  const intent = dpd >= 30 ? 'red' : 'orange'
  return <Badge intent={intent}>{format === 'short' ? `DPD ${dpd}` : `Menunggak ${dpd} hari`}</Badge>
}

/**
 * Her photo, or the slot where one will go. A silhouette rather than initials:
 * a BP standing in a room of 22 women recognises a face, and "SH" is something
 * she has to decode into a name and then match to a person. Initials were the
 * placeholder for a photo the prototype does not have; this one at least says
 * what the real thing is.
 */
export function MitraPhoto({ size = 40 }: { size?: 32 | 40 }) {
  const box = size === 32 ? 'h-32 w-32' : 'h-40 w-40'
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-500 ${box}`}
      aria-hidden
    >
      <User size={size === 32 ? 16 : 20} />
    </span>
  )
}

export function MitraCard({
  mitra,
  meta,
  titleBadge,
  labels,
  trailing,
  action,
  onOpen,
}: {
  mitra: Mitra
  /**
   * Replaces the standing facts when a stage has something more relevant to
   * say in that slot — the collection stage puts what she owes here, because at
   * that moment the bill outranks the contract it came from. Pass `null` for a
   * stage that wants no second line at all; only `undefined` falls back.
   */
  meta?: ReactNode
  /** Sits against the name. For what she IS in the group, not how she is doing. */
  titleBadge?: ReactNode
  /**
   * A wrapping row of small labels under the meta. Kept as a slot rather than
   * derived here so a stage only pays for the ones it needs: the roster wants
   * her product and any standing arrangement, the collection queue does not
   * want a second row of chips on 22 cards it is trying to drain.
   */
  labels?: ReactNode
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
      <MitraPhoto />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex items-center gap-4">
          <span className="truncate text-16 font-bold text-default">{mitra.name}</span>
          {titleBadge}
        </span>
        {meta === undefined ? (
          <>
            <span className="truncate text-12 text-caption">Pinjaman {rupiah(mitra.loan)}</span>
            <span className="truncate text-12 text-caption">
              Angsuran {rupiah(mitra.weekly)}/minggu
            </span>
          </>
        ) : (
          meta
        )}
        {labels ? <span className="flex flex-wrap items-center gap-4">{labels}</span> : null}
      </div>
      {/* The chevron sits at the far RIGHT of the row, not against her name. Next
          to the name it read as decoration on the text; at the edge it is where
          every "this opens" mark in the app lives, and the name is left to be
          the name. */}
      {onOpen ? (
        <span className="shrink-0 text-disabled">
          <IconChevronRight size={20} />
        </span>
      ) : null}
    </>
  )

  return (
    <Card>
      <div className="flex flex-col gap-12">
        {/* Centred, not top-aligned: the identity block is now a name over its
            two badges and nothing taller, so hanging the photo and the chevron
            off the top edge left both sitting high of everything beside them. */}
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
        {action ? <div className="border-t border-default pt-12">{action}</div> : null}
      </div>
    </Card>
  )
}
