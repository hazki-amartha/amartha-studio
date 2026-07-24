'use client'

// The doorstep card, and the amount card under it — the two blocks a home visit
// opens with.
//
// One card for who she is, how to reach her, and where she lives, because on a
// single-mitra visit those were never three separate things. The contact
// buttons are the part that matters: a home visit fails most often by simply
// not reaching her, and the BP's actual next move at a locked gate is to phone
// — which until now meant leaving the app for a number the app already had.
//
//   [avatar] Nama  ›            [Peta] [WA]
//   📍 alamat
//
// The amount gets a card of its own rather than a footnote on this one, because
// it has to be readable at every moment of the visit — including before the BP
// has answered anything. Buried under an identity block it reads as context
// rather than as the number she is standing there to collect.

import { Card } from '@/design-system/components'
import { type Mitra } from './data'
import { IconChevronRight } from './icons'
import { HouseLocation, MitraPhoto, mapsUrl } from './mitra-card'
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
    <Card>
      <div className="flex flex-col gap-12">
        <div className="flex items-center gap-12">
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Buka halaman ${mitra.name}`}
            className="flex min-w-0 flex-1 items-center gap-12 text-left"
          >
            <MitraPhoto />
            <span className="flex min-w-0 items-center gap-4">
              <span className="truncate text-18 font-bold text-default">{mitra.name}</span>
              <span className="shrink-0 text-disabled">
                <IconChevronRight size={16} />
              </span>
            </span>
          </button>

          {/* Two circular controls on the same 40px rhythm as every other mitra
              card: the route to her house, then WhatsApp. Map first, because at
              the door the first move is getting there. */}
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

        <HouseLocation address={address} />
      </div>
    </Card>
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
