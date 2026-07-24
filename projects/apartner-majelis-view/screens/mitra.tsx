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
import { IconChevronRight, IconTrendUp } from '../lib/icons'
import { ladderOf } from '../lib/ladder'
import { profileOf } from '../lib/profile'
import { DpdBadge, HouseLocation, TagihanBreakdown } from '../lib/mitra-card'
import { openMajelisEntry, store, useApp } from '../lib/store'
import { HeaderAction, Overline, PinMark, WaMark, WeekStrip } from '../lib/ui'

export function MitraScreen() {
  const flow = useFlow()
  const s = useApp()

  const mitra = findMitra(s.openMitra)
  const profile = profileOf(mitra)
  const owed = outstandingOf(mitra)
  const ladder = ladderOf(mitra)
  const group = openMajelisEntry(s)

  // The row states the PRIZE, not the problem. It used to read "Tunggakan
  // Rp450.000" whenever she was behind, which is the same figure the tagihan
  // card two blocks up already prints — so the one row on this page that exists
  // to open a conversation about growth was spending its line on the debt.
  //
  // Now it names what is on the other side of the arrears and when she reaches
  // it. The badge carries the caveat: a mitra who is at risk still hears the
  // offer, because the offer is the reason to clear the arrears.
  const ladderLine =
    ladder.reward === null || ladder.weeksLeft === null
      ? 'Siklus selesai — bisa ajukan pembiayaan baru'
      : ladder.reward.amount === null
        ? `${ladder.weeksLeft} minggu lagi bisa melunasi lebih awal`
        : `${ladder.weeksLeft} minggu lagi bisa cairkan ${rupiah(ladder.reward.amount)}`

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
      <HeaderAction label={`Chat WhatsApp ${mitra.name}`} tone="green" onClick={() => undefined}>
        <WaMark size={20} />
      </HeaderAction>
      <HeaderAction label={`Rute ke rumah ${mitra.name}`} tone="red" onClick={() => undefined}>
        <PinMark size={20} />
      </HeaderAction>
    </header>
  )

  return (
    <Screen topBar={header}>
      {/* --- The recent ledger. No overline: the card names itself. --------- */}
      <WeekStrip weeks={mitra.weeks} onSeeAll={() => flow.go('loans')} />

      {/* --- What she owes today, and what it is made of. -------------------
          Three lines in one card, no rules and no section title: the total is
          the first line of its own breakdown, not a headline sitting above one.
          A rule under it would turn "made of these" into "and also these".

          "Terlewat" is now everything overdue — the missed weeks AND whatever
          is left over from a week she part-paid. They were two lines because
          they are two different failures, but the BP does not collect them
          separately, and a card whose parts do not obviously sum to its total
          is the one thing this project has been careful never to print. The
          week strip above still tells the two apart, in the place where the
          difference is actually said out loud. */}
      <TagihanBreakdown mitra={mitra} />

      {/* --- The ladder, on its own. --------------------------------------- */}
      {/* It used to be the first row inside a "Data mitra" card, sharing a
          container with a phone number and two addresses. It is not a datum
          about her — it is a conversation the BP is meant to have, and the only
          thing on this page that leads anywhere she does something. */}
      {/* White, like every other card on the page. The purple wash marked it as
          the one thing here that leads somewhere — but the page has no other
          card competing for that, and a tinted panel among white ones reads as
          a notice rather than as a place to go. What earns the attention now is
          SIZE: bigger tile, bigger title, and the offer set at reading size
          instead of caption size, because that sentence is the whole card. */}
      <button
        type="button"
        onClick={() => flow.go('ladder')}
        className="flex items-center gap-12 rounded-12 border border-default bg-neutral-white p-12 text-left"
      >
        <span className="flex h-48 w-48 shrink-0 items-center justify-center rounded-8 bg-primary-50 text-primary-500">
          <IconTrendUp size={24} />
        </span>
        {/* The badge rides on the TITLE line and the promise gets the full
            width beneath it. Sharing one line, the badge and the chevron left
            the sentence about 130px, which truncated the amount — and an offer
            that ends in an ellipsis is not an offer. */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="flex min-w-0 items-center gap-8">
            <span className="truncate text-16 font-bold text-default">Jalur Naik Modal</span>
            {/* Named in both directions. A row that badges only the bad state
                leaves "no badge" meaning two things — she is fine, or nobody
                checked.

                "At risk" rather than "Tertahan" because the row now leads with
                the prize: the badge has to say whether that prize is in danger,
                which is a judgement about the FUTURE. "Tertahan" describes the
                ladder's state, and beside "3 minggu lagi bisa cairkan" that
                reads as a contradiction rather than a caveat. */}
            {ladder.status === 'tertahan' ? (
              <Badge intent="orange">At risk</Badge>
            ) : (
              <Badge intent="green">On Track</Badge>
            )}
          </span>
          {/* text-default, not caption: this line IS the offer. Grey it and the
              card is a heading with a footnote. */}
          <span className="text-14 text-default">{ladderLine}</span>
        </div>
        <span className="shrink-0 text-primary-500">
          <IconChevronRight size={24} />
        </span>
      </button>

      {/* --- Where she lives, as a place rather than a line of text. -------
          A photo of the house to recognise the door, and the whole tile taps
          out to maps — the address the BP rides to, not just reads. */}
      <section className="flex flex-col gap-8">
        <Overline>Lokasi rumah</Overline>
        <HouseLocation address={profile.address} />
      </section>

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
