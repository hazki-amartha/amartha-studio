'use client'

// The doorstep card — who she is, how to reach her, where she lives, and why
// you are standing there. One card instead of the three stacked blocks the home
// visit used to open with (a place card, then a reason card, then the shared
// MitraCard), because on a single-mitra visit those were never three things.
// They were one: this person, at this address, for this reason.
//
// The contact buttons are the addition that matters. A home visit fails most
// often by simply not reaching her — and the BP's actual next move at a locked
// gate is to phone, which until now meant leaving the app to look up a number
// the app already had.
//
//   [avatar] Nama  ›            [WA] [Telepon]
//   📍 alamat
//
// The "why now" line used to sit under a rule at the bottom of this card. It
// moved out to a Tagihan card of its own, because the amount owed has to be
// readable at every moment of the visit — including before the BP has answered
// anything — and burying it as a footnote on the identity card made it read as
// context rather than as the number she is standing there to collect.

import { Card } from '@/design-system/components'
import { rupiah, type Mitra } from './data'
import { IconChatFill, IconChevronRight, IconPhone, IconPin } from './icons'
import { profileOf } from './profile'
import { Avatar } from './ui'

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
  const phone = profileOf(mitra).phone

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
            <Avatar name={mitra.name} />
            <span className="flex min-w-0 items-center gap-4">
              <span className="truncate text-18 font-bold text-default">{mitra.name}</span>
              <span className="shrink-0 text-disabled">
                <IconChevronRight size={16} />
              </span>
            </span>
          </button>

          {/* Two circular controls on the same 40px rhythm as everything else
              on a mitra card. Icon-only: at one card there is room for labels,
              but WhatsApp and a handset are the two most legible glyphs a field
              app has, and keeping them silent keeps the name the loudest thing
              in the row. */}
          <div className="flex shrink-0 gap-8">
            <ContactButton label={`WhatsApp ${mitra.name}`} tone="green">
              <IconChatFill size={20} />
            </ContactButton>
            <ContactButton label={`Telepon ${mitra.name} — ${phone}`} tone="primary">
              <IconPhone size={20} />
            </ContactButton>
          </div>
        </div>

        <span className="flex items-start gap-4 text-12 text-caption">
          <span className="shrink-0">
            <IconPin size={16} />
          </span>
          {address}
        </span>
      </div>
    </Card>
  )
}

/**
 * What she owes, and why the BP is here — always on screen, from the moment the
 * step opens and regardless of what has been answered.
 *
 * This is the number the whole visit is about, so it does not wait for a
 * selection to appear. It previously only showed up inside the payment block,
 * which meant the BP could be mid-conversation at the door, having answered
 * "who did you meet", with the amount she is asking for nowhere on screen.
 */
export function TagihanCard({ mitra, reason }: { mitra: Mitra; reason: string }) {
  return (
    <Card>
      <div className="flex flex-col gap-2">
        <span className="text-12 text-caption">Tagihan</span>
        <span className="text-24 font-bold text-default">{rupiah(mitra.due)}</span>
        <span
          className={`text-12 font-bold ${
            mitra.dpd >= 30 ? 'text-red-500' : mitra.dpd > 0 ? 'text-orange-500' : 'text-green-500'
          }`}
        >
          {reason}
        </span>
      </div>
    </Card>
  )
}

function ContactButton({
  label,
  tone,
  children,
}: {
  label: string
  tone: 'green' | 'primary'
  children: React.ReactNode
}) {
  const classes =
    tone === 'green'
      ? 'bg-green-50 text-green-500 border-green-500'
      : 'bg-primary-50 text-primary-500 border-primary-200'
  return (
    <button
      type="button"
      aria-label={label}
      className={`flex h-40 w-40 items-center justify-center rounded-full border ${classes}`}
    >
      {children}
    </button>
  )
}
