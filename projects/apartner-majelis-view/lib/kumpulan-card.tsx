'use client'

// Where the kumpulan is — as one row at the top of Kehadiran.
//
// It used to be a bottom sheet ("Menuju Lokasi Kumpulan") that opened BEFORE the
// roster, on the argument that a BP tapping a majelis task is still on her
// motorbike. That put a full-screen interruption in front of the one gesture
// that starts the visit, and then had to be re-openable from an info button on
// every stage so she could get the address back.
//
// Per the BP APP 2026 Figma it is the address alone, captioned "Alamat", with a
// single route button — the Ketua Majelis WhatsApp button is gone.

import type { MajelisEntry } from './schedule'
import { ContactButton, PinMark } from './ui'

/** A Google Maps search for a place name — the same route the mitra page uses. */
function mapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function KumpulanCard({ entry }: { entry: MajelisEntry }) {
  return (
    <div className="flex flex-col gap-4">
      <span className="text-12 font-bold text-default">Alamat</span>

      <div className="flex items-center gap-12">
        <span className="min-w-0 flex-1 break-words text-14 text-caption">{entry.place}</span>
        <ContactButton
          label={`Buka lokasi ${entry.place} di peta`}
          tone="red"
          href={mapsUrl(entry.place)}
        >
          <PinMark size={20} />
        </ContactButton>
      </div>
    </div>
  )
}
