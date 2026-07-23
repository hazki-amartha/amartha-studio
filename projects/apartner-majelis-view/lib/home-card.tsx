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
//   [avatar] Nama  ›            [WA] [Telepon]
//   📍 alamat
//
// The amount gets a card of its own rather than a footnote on this one, because
// it has to be readable at every moment of the visit — including before the BP
// has answered anything. Buried under an identity block it reads as context
// rather than as the number she is standing there to collect.

import { Card } from '@/design-system/components'
import { outstandingOf, rupiah, type Mitra } from './data'
import { IconChatFill, IconChevronRight, IconPhone, IconPin } from './icons'
import { profileOf } from './profile'
import { MitraPhoto } from './mitra-card'
import { ContactButton } from './ui'

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
            <MitraPhoto />
            <span className="flex min-w-0 items-center gap-4">
              <span className="truncate text-18 font-bold text-default">{mitra.name}</span>
              <span className="shrink-0 text-disabled">
                <IconChevronRight size={16} />
              </span>
            </span>
          </button>

          {/* Two circular controls on the same 40px rhythm as every other mitra
              card. Icon-only: WhatsApp and a handset are the two most legible
              glyphs a field app has, and keeping them silent leaves the name
              the loudest thing in the row. */}
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
 * What she owes, broken into the three debts it is actually made of — this
 * week, the weeks she missed, and any shortfall left over from a part-payment.
 *
 * Naming all three is this direction's rule, and it matters more at a door than
 * in a queue: "Rp1.500.000" on its own is a number to be argued with, while
 * "this week, plus nine missed weeks" is a number to be explained, which is
 * exactly what the BP is standing there doing.
 */
export function TagihanCard({ mitra }: { mitra: Mitra }) {
  const owed = outstandingOf(mitra)

  return (
    <Card>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="text-12 text-caption">Total tagihan</span>
          <span className="text-24 font-bold text-default">{rupiah(owed.total)}</span>
        </div>
        <div className="flex flex-col gap-4 border-t border-default pt-8">
          <Line label="Angsuran minggu ini" value={rupiah(owed.thisWeek)} />
          {owed.missed > 0 ? (
            <Line
              label={`Tunggakan ${owed.missedWeeks} minggu`}
              value={rupiah(owed.missed)}
              tone="red"
            />
          ) : null}
          {owed.partial > 0 ? (
            <Line label="Kekurangan bayar" value={rupiah(owed.partial)} tone="orange" />
          ) : null}
        </div>
      </div>
    </Card>
  )
}

function Line({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'red' | 'orange'
}) {
  const valueTone =
    tone === 'red' ? 'text-red-500' : tone === 'orange' ? 'text-orange-500' : 'text-default'
  return (
    <div className="flex items-center gap-12">
      <span className="flex-1 text-12 text-caption">{label}</span>
      <span className={`text-12 font-bold ${valueTone}`}>{value}</span>
    </div>
  )
}
