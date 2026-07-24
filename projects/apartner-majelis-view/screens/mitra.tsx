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

import type { ReactNode } from 'react'
import { Badge, Card } from '@/design-system/components'
import { ArrowLeft, Image as ImageIcon } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMitra, rupiah } from '../lib/data'
import { IconCheck, IconChevronRight, IconTrendUp } from '../lib/icons'
import { ladderOf } from '../lib/ladder'
import { profileOf } from '../lib/profile'
import { AngsuranCard, MitraBadges, MitraPhoto } from '../lib/mitra-card'
import { openMajelisEntry, useApp } from '../lib/store'
import { PinMark, WaMark } from '../lib/ui'

export function MitraScreen() {
  const flow = useFlow()
  const s = useApp()

  const mitra = findMitra(s.openMitra)
  const profile = profileOf(mitra)
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

  // The nav carries the PAGE, not the mitra: a generic "Detail Mitra" title and
  // the two things a BP does WITH her — chat and route — as pinned buttons. Her
  // name and her badges moved off the bar and onto the page below, because the
  // row of standing labels (product, DPD, and now relief / pre-disbursement) has
  // outgrown a 48px bar the moment there is more than one of them.
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
      <span className="min-w-0 flex-1 truncate text-16 font-bold text-default">Detail Mitra</span>
      <CircleButton label={`Chat WhatsApp ${mitra.name}`} tone="green">
        <WaMark size={20} />
      </CircleButton>
      <PinButton label={`Rute ke rumah ${mitra.name}`} />
    </header>
  )

  return (
    <Screen topBar={header} className="bg-neutral-white">
      {/* --- Who she is. On the page, not the bar, and not in a card: an avatar,
          her name, and the row of standing labels beneath it, sitting flat on
          the white canvas. The badges wrap, so a mitra with product + bucket +
          relief reads as one row of facts rather than a truncated title. */}
      <div className="flex items-center gap-12">
        <MitraPhoto />
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <span className="truncate text-20 font-bold text-default">{mitra.name}</span>
          <span className="flex flex-wrap items-center gap-4">
            <MitraBadges mitra={mitra} />
          </span>
        </div>
      </div>

      {/* --- The recent cycle and what she owes, as one card. ---------------
          The eight-week strip and the tagihan breakdown used to be two stacked
          cards; they are read together, in one glance, so they are one card —
          the same one the collect page opens on. "Lihat Semua" opens the full
          ledger, which is where the week-by-week amounts live now that the strip
          carries only outcomes. */}
      <AngsuranCard mitra={mitra} onSeeAll={() => flow.go('loans')} />

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

      {/* --- Her products. ------------------------------------------------- */}
      {/* What she carries with Amartha, not just the loan behind this ledger.
          The one she is enrolled in is filled; the rest are what a BP can open a
          conversation about — the reason this card sits above the read-only
          details rather than among them. */}
      <ProdukCard active={mitra.product} />

      {/* --- Where to find her, and the majelis she belongs to. ------------- */}
      <Card>
        <div className="flex flex-col gap-12">
          <span className="text-16 font-bold text-default">Detail</span>
          <LabeledRow
            first
            label="Majelis"
            value={group.name}
            sub={`${group.day}, ${group.time}`}
            trailing={
              <span className="text-disabled">
                <IconChevronRight size={20} />
              </span>
            }
            onClick={() => flow.go('majelis')}
          />
          <LabeledRow
            label="Alamat rumah mitra"
            value={profile.address}
            footer={<PhotoLink label="Foto Rumah" />}
            trailing={<PinButton label={`Rute ke rumah ${mitra.name}`} />}
          />
          <LabeledRow
            label="Alamat tempat usaha mitra"
            value={profile.business}
            footer={<PhotoLink label="Foto Usaha" />}
            trailing={<PinButton label={`Rute ke usaha ${mitra.name}`} />}
          />
        </div>
      </Card>

      {/* --- Who the BP calls when the mitra doesn't answer. ---------------- */}
      <section className="pb-16">
        <Card>
          <div className="flex flex-col gap-12">
            <span className="text-16 font-bold text-default">Penanggung Jawab</span>
            <LabeledRow
              first
              label="Nama"
              value={profile.pjName}
              trailing={<MitraPhoto size={32} />}
            />
            <LabeledRow
              label="Nomor HP penanggung jawab"
              value={profile.pjPhone}
              trailing={
                <CircleButton label={`Chat WhatsApp ${profile.pjName}`} tone="green">
                  <WaMark size={20} />
                </CircleButton>
              }
            />
            <LabeledRow
              label="Alamat rumah penanggung jawab"
              value={profile.address}
              trailing={<PinButton label={`Rute ke rumah ${profile.pjName}`} />}
            />
            <LabeledRow label="Hubungan dengan mitra" value={profile.pjRelation} />
          </div>
        </Card>
      </section>
    </Screen>
  )
}

/**
 * The product suite, as pills. The enrolled product is filled in primary with a
 * check; the rest are outlined — available, not owned. A representative set
 * rather than live data: the prototype's point is the shape of the card, and a
 * BP reads "she has Modal, could have Proteksi" off exactly this.
 */
function ProdukCard({ active }: { active: string }) {
  const products = [active, 'Proteksi', 'Celengan', 'Poket']
  return (
    <Card>
      <div className="flex flex-col gap-12">
        <span className="text-16 font-bold text-default">Produk</span>
        <div className="flex flex-wrap gap-8">
          {products.map((p) => {
            const on = p === active
            return (
              <span
                key={p}
                className={`flex items-center gap-4 rounded-full border px-12 py-4 text-12 font-bold ${
                  on
                    ? 'border-primary-500 bg-primary-50 text-primary-500'
                    : 'border-default bg-neutral-white text-caption'
                }`}
              >
                {on ? <IconCheck size={16} /> : null}
                {p}
              </span>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

/**
 * A label over its value inside a card, divided from the row above by a
 * full-bleed hairline (`-mx-12` against the card's 12px padding). `trailing` is
 * a control pinned right — a route pin, a WhatsApp button, a photo — and
 * `footer` a link that hangs under the value. Rendered as a button when it opens
 * something, a div when it only tells.
 *
 * Stacked label/value rather than label-left/value-right: an address is too long
 * to sit in half a row, and a layout that works for "Suami" but wraps badly for
 * the rest is a layout tuned to its shortest case.
 */
function LabeledRow({
  label,
  value,
  sub,
  trailing,
  footer,
  first,
  onClick,
}: {
  label: string
  value: string
  sub?: string
  trailing?: ReactNode
  footer?: ReactNode
  first?: boolean
  onClick?: () => void
}) {
  const cls = `-mx-12 flex items-center gap-12 px-12 text-left ${
    first ? '' : 'border-t border-default pt-12'
  }`
  const body = (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-10 text-disabled">{label}</span>
        <span className="break-words text-14 text-default">{value}</span>
        {sub ? <span className="text-12 text-caption">{sub}</span> : null}
        {footer}
      </div>
      {trailing ? <div className="flex shrink-0 items-center">{trailing}</div> : null}
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  )
}

/** A "Foto …" link under an address — opens the photo the surveyor took. */
function PhotoLink({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => undefined}
      className="mt-2 flex items-center gap-4 text-12 font-bold text-primary-500"
    >
      <ImageIcon size={16} />
      {label}
    </button>
  )
}

/**
 * A round, bordered icon button — the shape the reference puts every address's
 * route pin and every contact's WhatsApp in. Bigger tap target than the header's
 * bare glyph, because in a card it stands alone rather than in a row of chrome.
 */
function CircleButton({
  label,
  tone = 'default',
  onClick,
  children,
}: {
  label: string
  tone?: 'default' | 'green' | 'red'
  onClick?: () => void
  children: ReactNode
}) {
  const toneClass =
    tone === 'green' ? 'text-green-500' : tone === 'red' ? 'text-red-500' : 'text-default'
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-full border border-default bg-neutral-white ${toneClass}`}
    >
      {children}
    </button>
  )
}

/** A route pin in a circle — red, because a pin that opens a route is red everywhere. */
function PinButton({ label }: { label: string }) {
  return (
    <CircleButton label={label} tone="red">
      <PinMark size={20} />
    </CircleButton>
  )
}
