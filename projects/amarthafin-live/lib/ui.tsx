'use client'

// Project-local pieces for the AmarthaFin home reference. The brand band and
// Poket widget follow the same shape as projects/afin-weekly-checkin's
// hand-tuned version — kept project-local rather than shared, per CLAUDE.md §4
// (a component earns promotion by being wanted twice).

import { type ReactNode } from 'react'
import { Card } from '@/design-system/components'
import { ProductLogo, ServiceIcon, type ServiceIconName, Wordmark } from '@/design-system/assets'
import { ArrowRight, Bell, Eye, Plus, Transfer, User, Voucher } from '@/design-system/icons'

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
      {/* The header is masked to a curved band, not a rounded rectangle: the
          bottom edge is flat at the sides and sags at the centre (see the
          production mask, object.svg — 360x123, flat to y=99.8, dipping to 123
          at x=180). That is an ELLIPTICAL bottom radius, which Tailwind has no
          class for, so it goes in a style prop: a 50% horizontal radius on both
          bottom corners against a 24px vertical one, giving one continuous arc
          across the full width. 24px is the 4px-grid neighbour of the mask's
          23.2px sag. */}
      <div
        className="bg-gradient-to-r from-primary-400 to-primary-500 px-16 pb-40 pt-48"
        style={{ borderRadius: '0 0 50% 50% / 0 0 24px 24px' }}
      >
        <div className="flex items-center gap-12 pb-16">
          <ChromeIcon>
            <User size={20} />
          </ChromeIcon>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-12 text-neutral-white">{greeting}</span>
            <span className="truncate text-14 font-bold text-neutral-white underline">{name}</span>
          </span>
          <ChromeIcon badge="8">
            <Voucher size={20} />
          </ChromeIcon>
          <ChromeIcon badge="8">
            <Bell size={20} />
          </ChromeIcon>
        </div>
      </div>
      <div className="-mt-40 px-16">{children}</div>
    </div>
  )
}

// Frosted-glass chrome button: a 2px white ring over a lighter purple fill.
// The Figma uses a translucent white wash with a backdrop blur; primary-400 is
// the nearest token that keeps the ring reading against the darker gradient.
function ChromeIcon({ badge, children }: { badge?: string; children: ReactNode }) {
  return (
    <span className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-2 border-neutral-white bg-primary-400 text-neutral-white">
      {children}
      {badge ? (
        <span className="absolute -right-4 -top-4 flex h-16 min-w-16 items-center justify-center rounded-full bg-red-500 px-4 text-10 font-bold text-neutral-white">
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
// name — not the bare mark, because the copy above never says which product it
// is selling. `modal` and `celengan` ship as real wordmark artwork; GGS and
// AmarthaLink have no wordmark in @/design-system/assets yet, so their lockup
// is drawn as mark + text until that artwork exists (see NOTES.md).
export function ProductLockup({ name }: { name: OfferProduct }) {
  if (name === 'modal' || name === 'celengan') {
    return <Wordmark name={name} height={20} />
  }
  return (
    <span className="flex items-center gap-4">
      <ProductLogo name={name} size={20} />
      <span className="text-14 font-bold text-default">
        {name === 'ggs' ? 'Grassroots' : 'amarthalink'}
      </span>
    </span>
  )
}

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
        <ProductLockup name={product} />
      </div>
    </Card>
  )
}
