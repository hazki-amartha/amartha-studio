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
import { outstandingOf, rupiah, type Mitra } from './data'
import { IconCalendar, IconChevronRight, IconHome } from './icons'

/**
 * What she owes, and what it is made of. ONE component, used by the mitra page
 * and by the home visit, because they are the same facts read at the same
 * moment — before the BP asks for money — and two drawings of one card is how a
 * prototype ends up arguing with itself in a review.
 *
 * The total leads at full size with its parts under a rule, because the total
 * is what gets said first and the lines under it are what gets said when it is
 * argued with: "seratus lima puluh minggu ini, sisanya sembilan minggu yang
 * belum kebayar."
 *
 * The tunggakan line carries everything overdue — the missed weeks AND whatever
 * is left of a week she part-paid. Two different failures, but the BP does not
 * collect them separately. The week count in its label counts MISSED weeks
 * only, so on a mitra with a part-payment behind her the label is a slight
 * understatement of the amount beside it; the week strip above is where the two
 * are actually told apart.
 */
export function TagihanBreakdown({ mitra, bare }: { mitra: Mitra; bare?: boolean }) {
  const owed = outstandingOf(mitra)
  const overdue = owed.missed + owed.partial

  const body = (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-12 text-caption">Total tagihan</span>
        <span className="text-24 font-bold text-default">{rupiah(owed.total)}</span>
      </div>
      <div className="flex flex-col gap-4 border-t border-default pt-8">
        <TagihanLine label="Angsuran minggu ini" value={rupiah(owed.thisWeek)} />
        {overdue > 0 ? (
          <TagihanLine
            label={owed.missedWeeks > 0 ? `Tunggakan ${owed.missedWeeks} minggu` : 'Tunggakan'}
            value={rupiah(overdue)}
            red
          />
        ) : null}
      </div>
    </div>
  )

  // `bare` drops the Card so the breakdown can sit UNDER an identity block in
  // one card — which is how the collect page opens: who she is and what she
  // owes, read as one object rather than as two cards that happen to be stacked.
  return bare ? body : <Card>{body}</Card>
}

function TagihanLine({ label, value, red }: { label: string; value: string; red?: boolean }) {
  return (
    <div className="flex items-center gap-12">
      <span className="flex-1 text-14 text-caption">{label}</span>
      <span className={`text-14 font-bold ${red ? 'text-red-500' : 'text-default'}`}>{value}</span>
    </div>
  )
}

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

/**
 * A stand-in for the photo of the house. Real prototypes have no image asset,
 * so this is the same honest placeholder as MitraPhoto — a tinted tile with a
 * house glyph — rather than a stock picture pretending to be her door.
 */
export function HousePhoto({ size = 40 }: { size?: 40 | 48 }) {
  const box = size === 48 ? 'h-48 w-48' : 'h-40 w-40'
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-8 bg-neutral-200 text-neutral-500 ${box}`}
      aria-label="Foto rumah"
    >
      <IconHome size={size === 48 ? 24 : 20} />
    </span>
  )
}

/** A Google Maps search link for an address string. */
export function mapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

/**
 * The house, its address, and a route out to maps — one tappable block. The
 * photo says which door before she reads the words, and the "Lihat di peta"
 * link plus the whole tile being an anchor is what makes the address something
 * she taps rather than reads. Used at the doorstep and on the mitra page.
 */
export function HouseLocation({ address }: { address: string }) {
  return (
    <a
      href={mapsUrl(address)}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white p-8"
    >
      <HousePhoto />
      <span className="min-w-0 flex-1 break-words text-12 text-default">{address}</span>
      <span className="shrink-0 text-link">
        <IconChevronRight size={20} />
      </span>
    </a>
  )
}

/**
 * The promise already on file — the reason the door is on today's list. Renders
 * only when the mitra carries both a date and an amount, so it stays a home-visit
 * fact rather than a badge on every card. Reads the visit day for the date,
 * because "janji bayar" on a home visit means the promise falls due today.
 */
export function JanjiBayarCard({ mitra, date }: { mitra: Mitra; date: string }) {
  if (!mitra.ptp || mitra.ptpAmount === undefined) return null
  return (
    <div className="flex items-center gap-12 rounded-12 border border-primary-200 bg-primary-50 p-12">
      <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-neutral-white text-primary-500">
        <IconCalendar size={20} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-12 text-caption">Janji bayar</span>
        <span className="break-words text-14 font-bold text-default">
          {date} · {rupiah(mitra.ptpAmount)}
        </span>
      </div>
    </div>
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
