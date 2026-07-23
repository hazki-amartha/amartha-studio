'use client'

// The mitra page — one borrower, opened from her card on any stage.
//
// This is the reference's "Repayment Overview", rebuilt on this project's terms.
// The week strip is the thing the whole direction turns on: it carries the
// AMOUNT inside each week rather than a paid/unpaid dot, which is what lets a BP
// say "Ibu kurang Rp50.000 di minggu 7" instead of "Ibu belum bayar".
//
// The reference's second screen — a full payment-history table — is deliberately
// absent. It was cut on the designer's call, and the strip is the reason it can
// be: a table of 50 rows says the same thing the rail already says, one screen
// further from the conversation that needed it.
//
// The page is now a RECORD and only a record. It used to open on a "Yang perlu
// dilakukan" card that named the bill and offered to collect it; that has been
// taken out, along with the loan and join date in the header. Collecting is
// something the pelayanan queue sends her into with a mitra in front of her —
// carrying a second door into it from a page she opens to LOOK SOMETHING UP put
// the flow's most consequential action behind a browsing gesture. What is left
// is her standing (name, DPD), her ledger, and how to reach her.

import type { ReactNode } from 'react'
import { Badge, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMitra, outstandingBalanceOf, outstandingOf, rupiah } from '../lib/data'
import {
  IconChat,
  IconChevronRight,
  IconPin,
  IconStore,
  IconTrendUp,
  IconUsers,
} from '../lib/icons'
import { ladderOf } from '../lib/ladder'
import { profileOf } from '../lib/profile'
import { DpdBadge } from '../lib/mitra-card'
import { useApp } from '../lib/store'
import { Overline, WeekStrip } from '../lib/ui'

export function MitraScreen() {
  const flow = useFlow()
  const s = useApp()

  const mitra = findMitra(s.openMitra)
  const profile = profileOf(mitra)
  const owed = outstandingOf(mitra)
  const ladder = ladderOf(mitra)

  // The ladder row carries the ladder's own conclusion, so a BP who never opens
  // that screen still leaves with the one fact it holds. It does not repeat the
  // word the badge already shows: the badge says "Tertahan", the line says the
  // number behind it.
  const ladderLine =
    ladder.status === 'tertahan'
      ? `Tunggakan ${rupiah(ladder.arrears)}`
      : ladder.current
        ? `${ladder.current.detail} menuju ${ladder.current.title}`
        : 'Siklus selesai — bisa ajukan pembiayaan baru'

  return (
    <Screen
      topBar={
        // Her name and her bucket ARE the title. They used to sit in a card of
        // their own under a bar that said "Detail Mitra" — a heading that named
        // the screen to someone already looking at it, costing a card to repeat
        // what the bar could have said. The bar is pinned, so the two facts now
        // stay on screen while the ledger scrolls.
        <NavigationHeader
          title={
            <span className="flex min-w-0 items-center gap-8">
              <span className="min-w-0 flex-1 truncate">{mitra.name}</span>
              <DpdBadge dpd={mitra.dpd} format="short" />
            </span>
          }
          onBack={() => flow.back()}
        />
      }
    >
      {/* --- The ledger, and the three numbers it settles. ------------------ */}
      {/* No overline here: the strip's own card is headed "Riwayat Angsuran",
          and an overline above it would print the same words twice. */}
      <section className="flex flex-col gap-8">
        <WeekStrip weeks={mitra.weeks} totalWeeks={mitra.totalWeeks} />
        {/* Three figures, three different questions: what she owes today, what
            she still owes at all, and what one week costs. Side by side rather
            than stacked, because they are read as a SET — the BP quotes the
            three in one breath — and a vertical list of label/value rows makes
            each one a separate line to find. The four-line split of that first
            figure (this week / terlewat / sisa sebagian) lives on the collect
            page, where she is explaining the number rather than reading it. */}
        <div className="flex gap-8 rounded-12 bg-neutral-white p-12">
          <Figure label="Total tagihan" value={rupiah(owed.total)} strong />
          <Figure label="Total outstanding" value={rupiah(outstandingBalanceOf(mitra))} />
          <Figure label="Weekly installment" value={rupiah(mitra.weekly)} />
        </div>
      </section>

      {/* --- Her standing and how to reach her. ---------------------------- */}
      <section className="flex flex-col gap-8 pb-16">
        <Overline>Data mitra</Overline>
        <Card>
          <div className="flex flex-col gap-12">
            <CardRow
              tint="primary"
              icon={<IconTrendUp size={20} />}
              title="Jalur Naik Modal"
              subtitle={ladderLine}
              // Named in both directions. A row that badges only the bad state
              // leaves "no badge" meaning two things — she is fine, or nobody
              // checked — and the BP cannot tell which from the row.
              trailing={
                ladder.status === 'tertahan' ? (
                  <Badge intent="orange">Tertahan</Badge>
                ) : (
                  <Badge intent="green">Lancar</Badge>
                )
              }
              onClick={() => flow.go('ladder')}
              first
            />
            <CardRow
              icon={<IconChat size={20} />}
              title="Chat WhatsApp"
              subtitle={profile.phone}
              onClick={() => undefined}
            />
            <CardRow
              icon={<IconPin size={20} />}
              title="Rute ke rumah"
              subtitle={profile.address}
              onClick={() => undefined}
            />
            {/* Her trading place is a second route, not a detail of the first.
                A BP chasing a warung owner mid-morning wants the warung; the
                house is where she goes in the evening. */}
            <CardRow
              icon={<IconStore size={20} />}
              title="Rute ke tempat usaha"
              subtitle={profile.business}
              onClick={() => undefined}
            />
            {/* The number the BP dials when the mitra doesn't answer hers. It
                sits on the mitra's own page because that is where she is
                standing when the call fails. */}
            <CardRow
              icon={<IconUsers size={20} />}
              title="Chat WhatsApp PJ"
              subtitle={`${profile.pjName} · ${profile.pjPhone}`}
              onClick={() => undefined}
            />
          </div>
        </Card>
      </section>
    </Screen>
  )
}

/**
 * One of the three figures under the strip. Divided by a hairline rather than
 * spaced apart, because three amounts with nothing between them read as one
 * number split three ways — which is exactly what they are not.
 */
function Figure({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 border-l border-default pl-8 first:border-l-0 first:pl-0">
      <span className="text-10 text-caption">{label}</span>
      <span className={`text-14 font-bold ${strong ? 'text-default' : 'text-neutral-700'}`}>
        {value}
      </span>
    </div>
  )
}

/**
 * A tappable row inside the data card. The hairline above each row is what lets
 * three different kinds of thing share one card without the groupings
 * dissolving; it is full-bleed (`-mx-12` against the card's 12px padding) so it
 * reads as a division of the card rather than an underline on the row.
 *
 * `border-default`, not `border-light`: light is neutral-50, which on a white
 * card is invisible.
 */
function CardRow({
  icon,
  title,
  subtitle,
  trailing,
  onClick,
  tint = 'neutral',
  first = false,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  trailing?: ReactNode
  onClick: () => void
  tint?: 'neutral' | 'primary'
  /** The first row needs no divider above it — the card edge is the division. */
  first?: boolean
}) {
  const tone =
    tint === 'primary' ? 'bg-primary-50 text-primary-500' : 'bg-neutral-50 text-neutral-600'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mx-12 flex items-center gap-12 px-12 text-left ${first ? '' : 'border-t border-default pt-12'}`}
    >
      <span className={`flex h-32 w-32 shrink-0 items-center justify-center rounded-8 ${tone}`}>
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-14 font-bold text-default">{title}</span>
        <span className="truncate text-12 text-caption">{subtitle}</span>
      </div>
      {trailing}
      <span className="shrink-0 text-disabled">
        <IconChevronRight size={20} />
      </span>
    </button>
  )
}
