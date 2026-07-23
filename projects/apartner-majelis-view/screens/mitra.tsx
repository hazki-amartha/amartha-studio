'use client'

// The mitra page — one borrower, opened from her card on any stage.
//
// This is the reference's "Repayment Overview", rebuilt on this project's terms.
// The week strip is the thing the whole direction turns on: it carries the
// AMOUNT inside each week rather than a paid/unpaid dot, which is what lets a BP
// say "Ibu kurang Rp50.000 di minggu 7" instead of "Ibu belum bayar".
//
// The page is a RECORD and only a record. It used to open on a "Yang perlu
// dilakukan" card that named the bill and offered to collect it; that has been
// taken out. Collecting is something the pelayanan queue sends her into with a
// mitra in front of her — carrying a second door into it from a page she opens
// to LOOK SOMETHING UP put the flow's most consequential action behind a
// browsing gesture.
//
// What is left is ordered by how often it is wanted: her standing, the recent
// ledger, what she owes today, the ladder, and — last, because it is looked up
// rather than read — everything else on file about her.

import { Badge, Card } from '@/design-system/components'
import { ArrowLeft } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMitra, outstandingOf, rupiah } from '../lib/data'
import { IconChat, IconChevronRight, IconPin, IconTrendUp } from '../lib/icons'
import { ladderOf } from '../lib/ladder'
import { profileOf } from '../lib/profile'
import { DpdBadge } from '../lib/mitra-card'
import { openMajelisEntry, store, useApp } from '../lib/store'
import { HeaderAction, Overline, StatRows, WeekStrip } from '../lib/ui'

export function MitraScreen() {
  const flow = useFlow()
  const s = useApp()

  const mitra = findMitra(s.openMitra)
  const profile = profileOf(mitra)
  const owed = outstandingOf(mitra)
  const ladder = ladderOf(mitra)
  const group = openMajelisEntry(s)

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

  // A project-local header rather than NavigationHeader, for one reason: this
  // screen needs TWO icon buttons and a chip under the title, and the system
  // header's trailing slot renders decorative spans, not controls.
  //
  // Chat and route are up here now instead of being rows further down. They are
  // the two things a BP does WITH a mitra rather than reads about her, and a
  // pinned control is reachable from wherever she has scrolled to.
  const header = (
    <header className="flex shrink-0 items-center gap-8 border-b border-default bg-neutral-white px-16 py-8">
      <button
        type="button"
        onClick={() => flow.back()}
        aria-label="Kembali"
        className="-ml-4 flex h-32 w-32 shrink-0 items-center justify-center text-default"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="truncate text-16 font-bold text-default">{mitra.name}</span>
        {/* The chip drops below the name rather than sitting beside it: on a
            long name the two were competing for the same line, and her status
            is a fact ABOUT the name, not a second title. */}
        <span className="flex">
          <DpdBadge dpd={mitra.dpd} format="short" />
        </span>
      </div>
      <HeaderAction label={`Chat WhatsApp ${mitra.name}`} onClick={() => undefined}>
        <IconChat size={20} />
      </HeaderAction>
      <HeaderAction label={`Rute ke rumah ${mitra.name}`} onClick={() => undefined}>
        <IconPin size={20} />
      </HeaderAction>
    </header>
  )

  return (
    <Screen topBar={header}>
      {/* --- The recent ledger. No overline: the card names itself. --------- */}
      <WeekStrip
        weeks={mitra.weeks}
        totalWeeks={mitra.totalWeeks}
        onSeeAll={() => flow.go('loans')}
      />

      {/* --- What she owes today, and what it is made of. ------------------- */}
      {/* One figure with its parts under it, rather than three figures side by
          side. Total outstanding and the weekly instalment were facts about the
          CONTRACT; this is the only number the BP is about to act on, and the
          lines beneath it are the sentence she says when it gets argued with:
          "minggu ini dua ratus, dua minggu terlewat empat ratus."
          The shortfall line only appears when there is one — but it does appear,
          because without it the parts do not add up to the total, which is the
          exact contradiction this project was built to avoid. */}
      <section className="flex flex-col gap-8">
        <Overline>Total tagihan</Overline>
        <div className="flex flex-col gap-2 rounded-12 bg-neutral-white p-12">
          <span className="text-24 font-bold text-default">{rupiah(owed.total)}</span>
        </div>
        <StatRows
          rows={[
            { label: 'Minggu ini', value: rupiah(owed.thisWeek) },
            {
              label: owed.missedWeeks > 0 ? `Terlewat (${owed.missedWeeks} minggu)` : 'Terlewat',
              value: rupiah(owed.missed),
              tone: owed.missed > 0 ? 'red' : 'default',
            },
            ...(owed.partial > 0
              ? [
                  {
                    label: 'Sisa bayar sebagian',
                    value: rupiah(owed.partial),
                    tone: 'orange' as const,
                  },
                ]
              : []),
          ]}
        />
      </section>

      {/* --- The ladder, on its own. --------------------------------------- */}
      {/* It used to be the first row inside a "Data mitra" card, sharing a
          container with a phone number and two addresses. It is not a datum
          about her — it is a conversation the BP is meant to have, and the only
          thing on this page that leads anywhere she does something. */}
      <button
        type="button"
        onClick={() => flow.go('ladder')}
        className="flex items-center gap-12 rounded-12 border border-primary-200 bg-primary-50 p-12 text-left"
      >
        <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-neutral-white text-primary-500">
          <IconTrendUp size={20} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-14 font-bold text-default">Jalur Naik Modal</span>
          <span className="truncate text-12 text-caption">{ladderLine}</span>
        </div>
        {/* Named in both directions. A row that badges only the bad state leaves
            "no badge" meaning two things — she is fine, or nobody checked. */}
        {ladder.status === 'tertahan' ? (
          <Badge intent="orange">Tertahan</Badge>
        ) : (
          <Badge intent="green">Lancar</Badge>
        )}
        <span className="shrink-0 text-primary-500">
          <IconChevronRight size={20} />
        </span>
      </button>

      {/* --- Everything else on file. Last, because it is looked up. -------- */}
      {/* These were five tappable rows called "Data mitra". Four of them opened
          nothing that isn't now a header button, so what survives is the
          CONTENT: the details a BP reads out when ops asks, or checks before
          she rides. Read-only rows, because that is what they always were. */}
      <section className="flex flex-col gap-8 pb-16">
        <Overline>Informasi tambahan</Overline>
        <Card>
          <div className="flex flex-col gap-12">
            {[
              { label: 'Majelis', value: `${group.name} · ${group.day}, ${group.time}` },
              { label: 'Produk', value: mitra.product },
              { label: 'Mitra sejak', value: profile.joined },
              { label: 'Nomor HP', value: profile.phone },
              { label: 'Alamat rumah', value: profile.address },
              { label: 'Tempat usaha', value: profile.business },
              { label: 'Penanggung jawab', value: `${profile.pjName} · ${profile.pjPhone}` },
            ].map((row, i) => (
              <InfoRow key={row.label} label={row.label} value={row.value} first={i === 0} />
            ))}
          </div>
        </Card>
      </section>
    </Screen>
  )
}

/**
 * A label over its value, divided from the row above by a full-bleed hairline
 * (`-mx-12` against the card's 12px padding) so the rule reads as a division of
 * the card rather than an underline on the row.
 *
 * Stacked rather than label-left/value-right: an address and a PJ's name and
 * number are too long to sit in half a row, and a layout that works for "Modal"
 * but wraps badly for the rest is a layout tuned to its shortest case.
 */
function InfoRow({ label, value, first }: { label: string; value: string; first?: boolean }) {
  return (
    <div
      className={`-mx-12 flex flex-col gap-2 px-12 ${first ? '' : 'border-t border-default pt-12'}`}
    >
      <span className="text-10 text-disabled">{label}</span>
      <span className="break-words text-12 text-default">{value}</span>
    </div>
  )
}
