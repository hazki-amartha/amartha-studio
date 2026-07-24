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
import {
  ArrowsClockwise,
  CheckCircle,
  Coins,
  HandCoins,
  User,
  Warning,
} from '@/design-system/icons'
import { outstandingOf, rupiah, type Mitra } from './data'
import { IconChevronRight } from './icons'
import { RepaymentStrip } from './ui'

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
 * The one payment card the mitra page and the collect page both open on: the
 * recent cycle as a fixed eight-week strip, then what she owes, in one bordered
 * box. It merges the week rail and the tagihan breakdown that used to be two
 * stacked cards — they are read together, in one glance, before the BP asks for
 * money, so they are one card.
 *
 * `onSeeAll` renders the "Lihat Semua" link into the full ledger; the collect
 * page omits it, because the whole history is not a place to wander off to with
 * a mitra waiting to hand over cash.
 */
export function AngsuranCard({ mitra, onSeeAll }: { mitra: Mitra; onSeeAll?: () => void }) {
  const owed = outstandingOf(mitra)
  const overdue = owed.missed + owed.partial
  return (
    // Two stacked panels in one bordered card, told apart by fill rather than a
    // rule: the recent cycle on a lightest-grey ground up top, and what it leaves
    // owed on white beneath. The colour change IS the division — the strip is the
    // history, the white block is the money to collect against it.
    <div className="overflow-hidden rounded-12 border border-default">
      <div className="flex flex-col gap-12 bg-neutral-50 p-12">
        <div className="flex items-center gap-8">
          <span className="min-w-0 flex-1 truncate text-16 font-bold text-default">
            Angsuran {mitra.product}
          </span>
          {onSeeAll ? (
            <button
              type="button"
              onClick={onSeeAll}
              className="flex shrink-0 items-center gap-2 text-12 font-bold text-link"
            >
              Lihat Semua
              <IconChevronRight size={16} />
            </button>
          ) : null}
        </div>

        <RepaymentStrip weeks={mitra.weeks} />
      </div>

      <div className="flex flex-col gap-8 bg-neutral-white p-12">
        {/* Always shown, even at Rp0: a mitra reads "Tunggakan Rp0" as the good
            news it is, and a line that appears only when she is behind makes its
            absence do the talking — which a BP scanning the card can't rely on.
            Red only when there is something to be red about. */}
        <TagihanLine
          label={owed.missedWeeks > 0 ? `Tunggakan ${owed.missedWeeks} minggu` : 'Tunggakan'}
          value={rupiah(overdue)}
          red={overdue > 0}
        />
        <TagihanLine label="Angsuran minggu ini" value={rupiah(owed.thisWeek)} />
        <div className="flex items-center gap-12 pt-4">
          <span className="flex-1 text-14 text-caption">Total tagihan</span>
          <span className="text-20 font-bold text-default">{rupiah(owed.total)}</span>
        </div>
      </div>
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
 * An outlined status pill with a leading glyph — the flatter, icon-led chip the
 * mitra page's header uses, where a whole ROW of standing facts sits under her
 * name and each one needs to be told apart at a glance. The filled `Badge` is
 * still right where a single status is scanned down a column (the roster, the
 * queue); this is for the place where product, bucket and any relief line up
 * together and the icon is what the eye lands on first.
 */
const CHIP_TONE = {
  blue: 'border-blue-200 text-blue-500',
  primary: 'border-primary-200 text-primary-500',
  orange: 'border-orange-200 text-orange-500',
  red: 'border-red-200 text-red-500',
  green: 'border-green-200 text-green-500',
  neutral: 'border-neutral-200 text-neutral-700',
} as const

function StatusChip({
  tone,
  icon,
  children,
}: {
  tone: keyof typeof CHIP_TONE
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-4 rounded-full border bg-neutral-white px-8 py-4 text-12 font-bold ${CHIP_TONE[tone]}`}
    >
      {icon}
      {children}
    </span>
  )
}

/**
 * Her standing facts as a wrapping row of chips: the product she is on, her DPD
 * bucket, and whichever exception applies — approved relief, or a loan approved
 * but not yet disbursed. New labels drop in here rather than crowding the top
 * bar, which is why the name and badges moved off the nav and onto the page.
 *
 * A pre-disbursement mitra has no bucket to show, so her DPD chip is replaced by
 * the disbursement she is waiting on rather than sitting beside it.
 */
export function MitraBadges({ mitra }: { mitra: Mitra }) {
  return (
    <>
      <StatusChip tone={mitra.product === 'Modal' ? 'blue' : 'primary'} icon={<Coins size={16} />}>
        {mitra.product}
      </StatusChip>

      {mitra.predisburse ? (
        <StatusChip tone="blue" icon={<HandCoins size={16} />}>
          Ready to Disburse
        </StatusChip>
      ) : mitra.dpd === 0 ? (
        <StatusChip tone="green" icon={<CheckCircle size={16} />}>
          Lancar
        </StatusChip>
      ) : (
        <StatusChip tone={mitra.dpd >= 30 ? 'red' : 'orange'} icon={<Warning size={16} />}>
          DPD {mitra.dpd}
        </StatusChip>
      )}

      {mitra.keringanan ? (
        <StatusChip tone="neutral" icon={<ArrowsClockwise size={16} />}>
          Dapat Keringanan
        </StatusChip>
      ) : null}
    </>
  )
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
