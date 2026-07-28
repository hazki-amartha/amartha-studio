'use client'

// Project-local pieces for the AmarthaFin home reference. The brand band and
// Poket widget follow the same shape as projects/afin-weekly-checkin's
// hand-tuned version — kept project-local rather than shared, per CLAUDE.md §4
// (a component earns promotion by being wanted twice).

import { type ReactNode } from 'react'
import { Card } from '@/design-system/components'
import { ProductLogo } from '@/design-system/assets'
import { ArrowRight, Bell, User, Voucher } from '@/design-system/icons'

export function BrandBand({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-16 -mt-48">
      {/* 20px bottom corners — the header is a curved band, not a square block. */}
      <div className="rounded-b-20 bg-gradient-to-br from-primary-400 to-primary-700 px-16 pb-40 pt-48">
        <div className="flex items-center gap-12 pb-16">
          <ChromeIcon>
            <User size={20} />
          </ChromeIcon>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-12 text-neutral-white">Hello</span>
            <span className="truncate text-14 font-bold text-neutral-white underline">Widyasari</span>
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

export function SectionTitle({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between text-left text-14 font-bold text-default"
    >
      {children}
      <ArrowRight size={16} className="text-caption" />
    </button>
  )
}

export function Shortcut({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex flex-1 flex-col items-center gap-4 rounded-16 border border-default bg-neutral-white px-4 py-12">
      {icon}
      <span className="w-full truncate text-center text-10 text-default">{label}</span>
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

export function OfferCard({
  tone,
  title,
  description,
  logo,
  onClick,
}: {
  tone: 'green' | 'orange'
  title: string
  description: string
  logo: ReactNode
  onClick?: () => void
}) {
  return (
    <Card onClick={onClick}>
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0">
          <p className={`text-12 font-bold ${tone === 'green' ? 'text-green-500' : 'text-orange-500'}`}>
            {title}
          </p>
          <p className="mt-4 text-12 text-caption">{description}</p>
        </div>
        <ArrowRight size={16} className="mt-2 shrink-0 text-caption" />
      </div>
      <div className="mt-12">{logo}</div>
    </Card>
  )
}

export function ProductMark({ name }: { name: 'ggs' | 'celengan' | 'amartha-link' }) {
  return <ProductLogo name={name} size={24} />
}
