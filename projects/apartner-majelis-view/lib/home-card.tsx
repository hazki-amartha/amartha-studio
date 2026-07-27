'use client'

// The doorstep card, and the amount card under it — the two blocks a home visit
// opens with.
//
// The mitra leads with her name and WhatsApp, then her two places — her house
// and her warung — each a small photo, its address, and a route, because a home
// visit may be chasing either and the two are rarely the same door.
//
//   [avatar] Nama  ›                                  [WA]
//   [🏠]     Rumah          · alamat rumah          [Peta]
//   [🏪]     Tempat usaha   · alamat usaha          [Peta]
//
// Her penanggung jawab reuses the flat ContactRow below — a person, a subtitle,
// and the round buttons that reach them — with his relation and address as the
// subtitle and no photo, because we have no picture of his place.
//
// The amount gets a card of its own rather than a footnote on this one, because
// it has to be readable at every moment of the visit — including before the BP
// has answered anything. Buried under an identity block it reads as context
// rather than as the number she is standing there to collect.

import { type ReactNode } from 'react'

import { type Mitra } from './data'
import { IconChevronRight } from './icons'
import { BusinessPhoto, HousePhoto, MitraPhoto, mapsUrl } from './mitra-card'
import { ContactButton, PinMark, WaMark } from './ui'

/**
 * One contact, one row: an avatar, a name (optionally a button that opens a
 * page), a subtitle, and the round buttons that reach the person — a map route
 * and/or WhatsApp. Both the mitra and her PJ render through this so they share a
 * left edge, a name size, and a button rhythm instead of drifting apart.
 */
export function ContactRow({
  avatar,
  name,
  subtitle,
  onOpen,
  mapHref,
  mapLabel,
  waLabel,
}: {
  avatar: ReactNode
  name: string
  subtitle: ReactNode
  /** When set, the name becomes a button (with a chevron) that opens a page. */
  onOpen?: () => void
  /** A red map button routes here. Omit for a contact with no separate location
      of their own — e.g. a PJ answering at the mitra's door. */
  mapHref?: string
  mapLabel?: string
  waLabel: string
}) {
  return (
    <div className="flex items-center gap-12">
      {avatar}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Buka halaman ${name}`}
            className="flex min-w-0 items-center gap-4 text-left"
          >
            <span className="truncate text-14 font-bold text-default">{name}</span>
            <span className="shrink-0 text-disabled">
              <IconChevronRight size={16} />
            </span>
          </button>
        ) : (
          <span className="truncate text-14 font-bold text-default">{name}</span>
        )}
        <div className="min-w-0 text-12">{subtitle}</div>
      </div>

      {/* The route to the door, then WhatsApp. Map first, because at the door
          the first move is getting there. */}
      <div className="flex shrink-0 gap-8">
        {mapHref ? (
          <ContactButton label={mapLabel ?? `Buka lokasi ${name} di peta`} tone="red" href={mapHref}>
            <PinMark size={20} />
          </ContactButton>
        ) : null}
        <ContactButton label={waLabel} tone="green">
          <WaMark size={20} />
        </ContactButton>
      </div>
    </div>
  )
}

export function HomeMitraCard({
  mitra,
  address,
  business,
  photo,
  housePhoto,
  onOpen,
  onEnlarge,
}: {
  mitra: Mitra
  /** Her home address. */
  address: string
  /** Where she trades — a second place the BP may need to route to. */
  business: string
  /** Her portrait, and the photo of her house. */
  photo?: string
  housePhoto?: string
  /** Opens her mitra page, from the name. */
  onOpen: () => void
  /** Enlarges a photo in a lightbox. */
  onEnlarge?: (src: string) => void
}) {
  return (
    <div className="flex gap-12">
      <MitraPhoto src={photo} onClick={photo && onEnlarge ? () => onEnlarge(photo) : undefined} />
      <div className="flex min-w-0 flex-1 flex-col gap-12">
        {/* Name opens her page; WhatsApp reaches her. */}
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Buka halaman ${mitra.name}`}
            className="flex min-w-0 flex-1 items-center gap-4 text-left"
          >
            <span className="truncate text-14 font-bold text-default">{mitra.name}</span>
            <span className="shrink-0 text-disabled">
              <IconChevronRight size={16} />
            </span>
          </button>
          <ContactButton label={`WhatsApp ${mitra.name}`} tone="green">
            <WaMark size={20} />
          </ContactButton>
        </div>

        {/* Her two places, each a photo, its address, and a route of its own. */}
        <LocationRow
          photo={
            <HousePhoto
              size={32}
              src={housePhoto}
              onClick={housePhoto && onEnlarge ? () => onEnlarge(housePhoto) : undefined}
            />
          }
          label="Rumah"
          address={address}
          mapHref={mapsUrl(address)}
          mapLabel={`Buka lokasi rumah ${mitra.name} di peta`}
        />
        <LocationRow
          photo={<BusinessPhoto size={32} />}
          label="Tempat usaha"
          address={business}
          mapHref={mapsUrl(business)}
          mapLabel={`Buka lokasi usaha ${mitra.name} di peta`}
        />
      </div>
    </div>
  )
}

/** A place she can be found: a photo, a label, its address, and a map route. */
function LocationRow({
  photo,
  label,
  address,
  mapHref,
  mapLabel,
}: {
  photo: ReactNode
  label: string
  address: string
  mapHref: string
  mapLabel: string
}) {
  return (
    <div className="flex items-center gap-12">
      {photo}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-12 font-bold text-default">{label}</span>
        <span className="break-words text-12 text-caption">{address}</span>
      </div>
      <ContactButton label={mapLabel} tone="red" href={mapHref}>
        <PinMark size={20} />
      </ContactButton>
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
