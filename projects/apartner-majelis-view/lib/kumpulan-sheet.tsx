'use client'

// "Menuju Lokasi Kumpulan" — the two facts a BP needs BEFORE she is standing in
// the balai, and nowhere to put them once she is.
//
// It opens twice, from two directions, and it is the same sheet both times.
//
// On the way IN, from the schedule: tapping a majelis task used to drop her
// straight into the roster, which assumes she has already arrived. She has not
// — she is on a motorbike deciding which turning to take, and the address and
// the KM's number are what that ride needs. So the tap opens this first, and
// "Mulai Kumpulan" is the thing that actually starts the visit.
//
// Once INSIDE, from the info button in the nav header of all three stages: the
// group has not gathered, half of them are at the other balai, and she needs the
// KM again. Re-opening the same sheet is cheaper than remembering where the
// number lives — and it is the same sheet, so there is nothing new to read. The
// only difference is the button, which has nothing to start by then and closes.

import { Button, BottomSheet } from '@/design-system/components'
import { MapPin, Phone, WhatsappLogo } from '@/design-system/icons'
import { MAJELIS, findMitra } from './data'
import { profileOf } from './profile'
import { IconChevronRight } from './icons'
import type { MajelisEntry } from './schedule'
import { Avatar, ContactButton } from './ui'

/** A Google Maps search for a place name — the same route the mitra page uses. */
function mapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function KumpulanSheet({
  open,
  entry,
  onClose,
  onStart,
}: {
  open: boolean
  entry: MajelisEntry
  onClose: () => void
  /**
   * Set only on the way in, from the schedule. When it is absent the sheet is
   * being read mid-visit and has nothing left to start, so its one button
   * closes instead.
   */
  onStart?: () => void
}) {
  // The KM is the group's own contact, and she is a mitra like any other — so
  // her number comes from the same profile record every screen reads her from
  // rather than being authored a second time here.
  const ketua = findMitra(MAJELIS.ketuaId)
  const km = profileOf(ketua)

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      size="md"
      title="Menuju Lokasi Kumpulan"
      description={`${entry.name} · ${entry.day}, ${entry.time}`}
      primaryAction={
        onStart ? (
          <Button size="lg" className="w-full" onClick={onStart}>
            Mulai Kumpulan
          </Button>
        ) : (
          <Button variant="outline" size="lg" className="w-full" onClick={onClose}>
            Tutup
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-8">
        {/* Where. The whole card is the route out to maps — an address on a
            ride is something she taps, not something she reads and retypes. */}
        <a
          href={mapsUrl(entry.place)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-12 rounded-12 border border-default bg-neutral-white p-12"
        >
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-primary-50 text-primary-500">
            <MapPin size={20} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="text-12 text-caption">Lokasi kumpulan</span>
            <span className="break-words text-14 font-bold text-default">{entry.place}</span>
            <span className="text-12 font-bold text-link">Lihat di peta</span>
          </span>
          <span className="shrink-0 text-disabled">
            <IconChevronRight size={20} />
          </span>
        </a>

        {/* Who. The KM is the one person who can tell her the group moved, and
            the two channels sit ON the card: a number she has to copy out to
            dial is a number she calls from her own contacts instead. */}
        <div className="flex items-center gap-12 rounded-12 border border-default bg-neutral-white p-12">
          <Avatar name={ketua.name} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="text-12 text-caption">Ketua Majelis</span>
            <span className="truncate text-14 font-bold text-default">{ketua.name}</span>
            <span className="truncate text-12 text-caption">{km.phone}</span>
          </div>
          <span className="flex shrink-0 items-center gap-8">
            <ContactButton label={`Telepon ${ketua.name}`} tone="primary" href={`tel:${km.phone}`}>
              <Phone size={20} />
            </ContactButton>
            <ContactButton
              label={`WhatsApp ${ketua.name}`}
              tone="green"
              href={`https://wa.me/${km.phone.replace(/\D/g, '')}`}
            >
              <WhatsappLogo size={20} />
            </ContactButton>
          </span>
        </div>
      </div>
    </BottomSheet>
  )
}
