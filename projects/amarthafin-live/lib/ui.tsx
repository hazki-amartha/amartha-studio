'use client'

// Project-local pieces for the AmarthaFin home reference. The brand band and
// Poket widget follow the same shape as projects/afin-weekly-checkin's
// hand-tuned version — kept project-local rather than shared, per CLAUDE.md §4
// (a component earns promotion by being wanted twice).

import { type ReactNode } from 'react'
import { Card } from '@/design-system/components'
import { ServiceIcon, type ServiceIconName, Wordmark } from '@/design-system/assets'
import { ArrowRight, Bell, Eye, Plus, Promo, Transfer, User } from '@/design-system/icons'

export function BrandBand({
  greeting = 'Hello',
  name = 'Widyasari',
  children,
}: {
  greeting?: string
  name?: string
  children: ReactNode
}) {
  return (
    <div className="-mx-16 -mt-48">
      {/* The band's bottom edge is a bezier, not a radius. The production mask
          (object.svg, 360x123) runs flat to y=99.8 and then sags to y=123 at the
          centre — and crucially its first control point sits ON the start point,
          so the curve leaves each side corner already angled downward. A CSS
          border-radius can't do that: an elliptical radius is tangent-VERTICAL
          at the sides, which rounds the two corners the real shape keeps sharp.
          So the sag is its own 24px strip below the flat rectangle, clipped to
          the mask's own path. The clipPath is in objectBoundingBox units (the
          mask's x-coords over 360: 290.403 -> 0.8067, 180 -> 0.5, 69.5972 ->
          0.1933) so it stretches to any device width. 24px is the 4px-grid
          neighbour of the mask's 23.2px sag; pb-16 + that strip keeps the same
          40px below the content the layout below is pulling back against. */}
      <svg aria-hidden className="absolute h-0 w-0">
        <clipPath id="afin-band-sag" clipPathUnits="objectBoundingBox">
          <path d="M1 0 C1 0 0.8067 1 0.5 1 C0.1933 1 0 0 0 0 Z" />
        </clipPath>
      </svg>
      <div className="bg-gradient-to-r from-primary-400 to-primary-500 px-16 pb-16 pt-48">
        <div className="flex items-center gap-12 pb-16">
          <ChromeIcon>
            <User size={20} />
          </ChromeIcon>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-12 text-neutral-white">{greeting}</span>
            <span className="truncate text-14 font-bold text-neutral-white underline">{name}</span>
          </span>
          <ChromeIcon badge="8">
            <Promo size={20} />
          </ChromeIcon>
          <ChromeIcon badge="8">
            <Bell size={20} />
          </ChromeIcon>
        </div>
      </div>
      <div
        className="h-24 w-full bg-gradient-to-r from-primary-400 to-primary-500"
        style={{ clipPath: 'url(#afin-band-sag)' }}
      />
      {/* `relative` is load-bearing: the clip-path above puts the sag strip in
          its own stacking context, which would otherwise paint over this
          in-flow sibling and cut the Poket widget in half. */}
      <div className="relative -mt-40 px-16">{children}</div>
    </div>
  )
}

// Frosted-glass chrome button. Production does NOT fill these with a flat
// purple — the fill is a translucent primary-50 wash over a 16px backdrop blur,
// so the gradient behind shows through, and the roundness comes from two
// shadows: a soft drop shadow below and an inset purple highlight up and to the
// left. Neither shadow is a token, so they go in a style prop (same escape
// hatch as the band's elliptical radius above); the colours are still the
// tokens — rgba of primary-600 for the inset, plain black for the drop.
function ChromeIcon({ badge, children }: { badge?: string; children: ReactNode }) {
  return (
    <span
      className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-2 border-neutral-white/60 bg-primary-50/25 text-neutral-white backdrop-blur-lg"
      style={{
        boxShadow:
          '0 4px 4px rgba(0, 0, 0, 0.1), inset -4px 6px 4px rgba(115, 44, 124, 0.32)',
      }}
    >
      {children}
      {badge ? (
        <span className="absolute -right-8 -top-8 flex h-20 min-w-20 items-center justify-center rounded-full bg-red-500 px-4 text-10 font-bold text-neutral-white">
          {badge}
        </span>
      ) : null}
    </span>
  )
}

// The Poket wallet widget that sits over the brand band.
export function PoketWidget({ balance }: { balance: string }) {
  return (
    <div className="flex items-center gap-16 rounded-16 border border-default bg-gradient-to-r from-neutral-white to-primary-50 p-12">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-4 text-primary-500">
          <Wordmark name="poket" height={20} />
          <ArrowRight size={16} />
        </div>
        <div className="mt-4 flex items-center gap-8">
          <span className="text-16 font-bold text-default">{balance}</span>
          <Eye size={16} className="text-default" />
        </div>
      </div>
      <WalletAction icon={<Plus size={16} />} label="Isi Saldo" />
      <WalletAction icon={<Transfer size={16} />} label="Transfer" />
    </div>
  )
}

function WalletAction({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex shrink-0 flex-col items-center gap-4">
      <span className="flex h-24 w-24 items-center justify-center rounded-8 bg-primary-500 text-neutral-white">
        {icon}
      </span>
      <span className="text-12 text-primary-500">{label}</span>
    </span>
  )
}

export function SectionTitle({
  children,
  showArrow = true,
  onClick,
}: {
  children: ReactNode
  showArrow?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between text-left text-16 font-bold text-default"
    >
      {children}
      {showArrow ? <ArrowRight size={16} className="text-caption" /> : null}
    </button>
  )
}

// A PPOB tile as it appears INSIDE a product widget: glyph and label with no
// bordered box (the widget's own card already carries the container), unlike
// the bordered `Shortcut` used on the bare homepage.
export function MenuTile({
  icon,
  label,
  badge,
}: {
  icon: ServiceIconName
  label: string
  badge?: string
}) {
  return (
    <span className="flex flex-col items-center gap-4">
      <span className="relative">
        <ServiceIcon name={icon} size={40} />
        {badge ? (
          <span className="absolute -left-4 -top-4 rounded-full bg-red-500 px-4 text-10 font-bold text-neutral-white">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="text-center text-12 text-default">{label}</span>
    </span>
  )
}

// One offer in the AmarthaLink cashback strip: glyph, wrapping product name,
// price. Three sit side by side, so they share the row evenly.
export function PromoTile({
  icon,
  label,
  price,
}: {
  icon: ServiceIconName
  label: string
  price: string
}) {
  return (
    <span className="flex flex-1 flex-col gap-4 rounded-12 border border-default bg-neutral-white p-8">
      <ServiceIcon name={icon} size={24} />
      <span className="text-10 text-caption">{label}</span>
      <span className="mt-auto text-12 font-bold text-default">{price}</span>
    </span>
  )
}

// The cashback countdown: lightning glyph, then hh : mm : ss in red chips.
export function Countdown({ hours, minutes, seconds }: { hours: string; minutes: string; seconds: string }) {
  return (
    <span className="flex items-center gap-2">
      {[hours, minutes, seconds].map((unit, i) => (
        <span key={unit + i} className="flex items-center gap-2">
          {i > 0 ? <span className="text-12 font-bold text-red-500">:</span> : null}
          <span className="rounded-4 bg-red-500 px-4 text-12 font-bold text-neutral-white">{unit}</span>
        </span>
      ))}
    </span>
  )
}

// The promo carousel's page indicator: a wide pill for the active page, dots
// for the rest.
export function PageStrip({ count, active }: { count: number; active: number }) {
  return (
    <div className="flex items-center justify-center gap-4">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={
            i === active ? 'h-4 w-16 rounded-full bg-primary-500' : 'h-4 w-4 rounded-full bg-neutral-400'
          }
        />
      ))}
    </div>
  )
}

// A PPOB tile. The bordered rounded-16 box holds the GLYPH ONLY — the product
// name sits below it, outside the box (Figma: a 54px `icon` square, then a
// sibling 12px label, the two spaced apart in a 73px column). Boxing the label
// in with the icon is the thing this got wrong first time round.
//
// The label is allowed to wrap: Figma sizes it `w-[min-content] min-w-full`, so
// "Paket Data" and "Isi E-Wallet" break onto two lines by design rather than
// being truncated.
export function Shortcut({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex flex-1 flex-col items-center gap-4">
      <span className="flex h-48 w-48 items-center justify-center rounded-16 border border-default bg-neutral-white">
        {icon}
      </span>
      <span className="w-full text-center text-12 text-default">{label}</span>
    </span>
  )
}

export function QuickLink({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex flex-1 items-center justify-center gap-8 rounded-full border border-default bg-neutral-white px-12 py-12 text-14 text-default">
      <span className="text-primary-500">{icon}</span>
      {label}
    </span>
  )
}

// Missing component: no shared ProgressBar exists in @/design-system/components
// (see NOTES.md). A plain filled track, tokens only.
export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-8 w-full overflow-hidden rounded-full bg-neutral-100">
      <div className="h-full rounded-full bg-primary-500" style={{ width: `${percent}%` }} />
    </div>
  )
}

/** The products the recommendation cards can advertise. */
export type OfferProduct = 'modal' | 'ggs' | 'celengan' | 'amartha-link'

const OFFER_TONE = {
  modal: 'text-blue-500',
  ggs: 'text-green-500',
  celengan: 'text-green-500',
  'amartha-link': 'text-orange-500',
} as const

// A recommendation card. The foot is the product's full LOCKUP — mark plus
// name as artwork — not the bare mark, because the copy above never says which
// product it is selling.
export function OfferCard({
  product,
  title,
  description,
  onClick,
}: {
  product: OfferProduct
  title: string
  description: string
  onClick?: () => void
}) {
  return (
    <Card onClick={onClick}>
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0">
          <p className={`text-16 font-bold ${OFFER_TONE[product]}`}>{title}</p>
          <p className="mt-4 text-16 text-caption">{description}</p>
        </div>
        <ArrowRight size={16} className="mt-2 shrink-0 text-caption" />
      </div>
      <div className="mt-12">
        <Wordmark name={product} height={20} />
      </div>
    </Card>
  )
}
