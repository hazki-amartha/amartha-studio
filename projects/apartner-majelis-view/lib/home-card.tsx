'use client'

// The doorstep card, and the amount card under it — the two blocks a home visit
// opens with.
//
// One card for who she is, how to reach her, and where she lives, because on a
// single-mitra visit those were never three separate things.
//
//   [avatar] Nama  ›                       [Peta] [WA]
//            alamat · Lihat foto rumah
//
// The address rides as a subtitle under the name, with a "Lihat foto rumah"
// link beside it — the photo is a tap away rather than a thumbnail spending
// space on every card. It is one compact row: the name opens her page, the two
// round buttons open the route and WhatsApp, and the address is read, not
// tapped — the map pin is the single way to open maps, so "where she lives" is
// stated once and opened once.
//
// The amount gets a card of its own rather than a footnote on this one, because
// it has to be readable at every moment of the visit — including before the BP
// has answered anything. Buried under an identity block it reads as context
// rather than as the number she is standing there to collect.

import { type Mitra } from './data'
import { IconChevronRight } from './icons'
import { MitraPhoto, mapsUrl } from './mitra-card'
import { ContactButton, PinMark, WaMark } from './ui'

export function HomeMitraCard({
  mitra,
  address,
  onOpen,
}: {
  mitra: Mitra
  address: string
  /** Opens her mitra page, from the name. */
  onOpen: () => void
}) {
  return (
    <div className="flex items-center gap-12">
      <MitraPhoto />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Buka halaman ${mitra.name}`}
          className="flex min-w-0 items-center gap-4 text-left"
        >
          <span className="truncate text-16 font-bold text-default">{mitra.name}</span>
          <span className="shrink-0 text-disabled">
            <IconChevronRight size={16} />
          </span>
        </button>
        {/* Address, with a link to the house photo beside it. The photo opens
            on tap; the address itself is read, not a second route to maps. */}
        <span className="flex flex-wrap items-baseline gap-x-8 gap-y-2 text-12">
          <span className="text-caption">{address}</span>
          <button
            type="button"
            onClick={() => undefined}
            className="shrink-0 font-bold text-primary-500"
          >
            Lihat foto rumah
          </button>
        </span>
      </div>

      {/* Two circular controls: the route to her house, then WhatsApp. Map
          first, because at the door the first move is getting there. */}
      <div className="flex shrink-0 gap-8">
        <ContactButton
          label={`Buka lokasi rumah ${mitra.name} di peta`}
          tone="red"
          href={mapsUrl(address)}
        >
          <PinMark size={20} />
        </ContactButton>
        <ContactButton label={`WhatsApp ${mitra.name}`} tone="green">
          <WaMark size={20} />
        </ContactButton>
      </div>
    </div>
  )
}

/**
 * What she owes at the door. It used to be drawn here — a big total over a
 * three-line split with its own wording ("Angsuran minggu ini", "Tunggakan 9
 * minggu", "Kekurangan bayar") — while her mitra page drew the same three facts
 * a different way. Same moment, same numbers, two cards: exactly the drift the
 * shared components in this project exist to stop.
 *
 * So it is now the mitra page's card, and this is the name the home visit
 * already imports it under.
 */
export { TagihanBreakdown as TagihanCard } from './mitra-card'
