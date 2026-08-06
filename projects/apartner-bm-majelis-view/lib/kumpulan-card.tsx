'use client'

// Where the kumpulan is, and who to call when the group isn't there — as one
// row at the top of Kehadiran.
//
// It used to be a bottom sheet ("Menuju Lokasi Kumpulan") that opened BEFORE the
// roster, on the argument that a BP tapping a majelis task is still on her
// motorbike. That put a full-screen interruption in front of the one gesture
// that starts the visit, and then had to be re-openable from an info button on
// every stage so she could get the number back. Two pieces of chrome for two
// facts.
//
// So the facts move onto the stage itself, in the shape the home visit already
// draws a contact in: identity on the left, the ways to reach it on the right.
// The address and the Ketua Majelis are ONE card rather than two, because they
// are one thought — "the place, and the person who is at it".

import { WhatsappLogo } from '@/design-system/icons'
import { MAJELIS, findMitra } from './data'
import { profileOf } from './profile'
import type { MajelisEntry } from './schedule'
import { ContactButton, PinMark } from './ui'

/** A Google Maps search for a place name — the same route the mitra page uses. */
function mapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function KumpulanCard({ entry }: { entry: MajelisEntry }) {
  // The KM is the group's own contact, and she is a mitra like any other — so
  // her number comes from the same profile record every screen reads her from
  // rather than being authored a second time here.
  const ketua = findMitra(MAJELIS.ketuaId)
  const km = profileOf(ketua)

  return (
    <div className="flex flex-col gap-4">
      {/* The block says what it IS before it says the thing. Without the caption
          an address alone at the top of a register reads as the majelis's own
          name repeated — and the two round buttons beside it are the whole
          "kontak" half, which nothing else on the screen names. */}
      <span className="text-12 text-caption">Kontak &amp; Lokasi majelis</span>

      <div className="flex items-center gap-12">
        {/* The address leads at reading size: it is the thing being acted on,
            and the KM is who answers for it — she is named by the button that
            reaches her rather than by a second line of grey under the street. */}
        <span className="min-w-0 flex-1 break-words text-16 text-default">{entry.place}</span>

        {/* Route first, then WhatsApp — same order and same pair as the doorstep
            card, so reaching a place and reaching a person are drawn once. */}
        <div className="flex shrink-0 gap-8">
          <ContactButton
            label={`Buka lokasi ${entry.place} di peta`}
            tone="red"
            href={mapsUrl(entry.place)}
          >
            <PinMark size={20} />
          </ContactButton>
          <ContactButton
            label={`WhatsApp ${ketua.name} — Ketua Majelis`}
            tone="green"
            href={`https://wa.me/${km.phone.replace(/\D/g, '')}`}
          >
            <WhatsappLogo size={20} />
          </ContactButton>
        </div>
      </div>
    </div>
  )
}
