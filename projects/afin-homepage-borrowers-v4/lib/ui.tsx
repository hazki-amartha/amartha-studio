'use client'

// Project-local pieces for the borrowers homepage. The brand header, band and
// Poket widget follow projects/amarthafin-live/lib/ui.tsx (the shipped
// reference) — copied rather than imported across projects per CLAUDE.md §1/§4.
// StatusCard, StatDivider and StatPair are new: the "Limit saat ini" and
// "Misi Majelis" cards aren't in @/design-system/components yet (see NOTES.md).

import { type ReactNode } from 'react'
import { Badge } from '@/design-system/components'
import { ArrowRight, Bell, Eye, Plus, Promo, Transfer, User } from '@/design-system/icons'
import { Wordmark } from '@/design-system/assets'

export const BAND_FILL = 'bg-gradient-to-r from-primary-400 to-primary-500'

export function BrandHeader({
  greeting = 'Hello! 👋🏼',
  name = 'John Doe',
}: {
  greeting?: string
  name?: string
}) {
  return (
    <div className="flex items-center gap-12 px-16 pb-16 pt-16">
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
  )
}

export function BrandBand({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-16 -mt-16">
      <svg aria-hidden className="absolute h-0 w-0">
        <clipPath id="afin-borrowers-band-sag" clipPathUnits="objectBoundingBox">
          <path d="M1 0 C1 0 0.8067 1 0.5 1 C0.1933 1 0 0 0 0 Z" />
        </clipPath>
      </svg>
      <div className={`h-16 w-full ${BAND_FILL}`} />
      <div className={`h-24 w-full ${BAND_FILL}`} style={{ clipPath: 'url(#afin-borrowers-band-sag)' }} />
      <div className="relative -mt-40 px-16">{children}</div>
    </div>
  )
}

function ChromeIcon({ badge, children }: { badge?: string; children: ReactNode }) {
  return (
    <span
      className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-2 border-neutral-white/60 bg-primary-50/25 text-neutral-white backdrop-blur-lg"
      style={{
        boxShadow: '0 4px 4px rgba(0, 0, 0, 0.1), inset -4px 6px 4px rgba(115, 44, 124, 0.32)',
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

export function PoketWidget({
  balance,
  onIsiSaldo,
  onTransfer,
}: {
  balance: string
  onIsiSaldo?: () => void
  onTransfer?: () => void
}) {
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
      <WalletAction icon={<Plus size={16} />} label="Isi Saldo" onClick={onIsiSaldo} />
      <WalletAction icon={<Transfer size={16} />} label="Transfer" onClick={onTransfer} />
    </div>
  )
}

function WalletAction({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
  const content = (
    <>
      <span className="flex h-24 w-24 items-center justify-center rounded-8 bg-primary-500 text-neutral-white">
        {icon}
      </span>
      <span className="text-12 text-primary-500">{label}</span>
    </>
  )
  const className = 'flex shrink-0 flex-col items-center gap-4'
  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <span className={className}>{content}</span>
  )
}

// Shared shell for the two loan-status cards: one border, 16px radius, 12px
// padding. StatusCardHeader bleeds a green-tinted block up to the card's top
// corners and edges (Figma's "Kondisi ... Sangat Lancar" band); everything
// else stacked below it stays plain white.
export function StatusCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-12 overflow-hidden rounded-16 border border-default p-12">
      {children}
    </div>
  )
}

export function StatusCardHeader({ children }: { children: ReactNode }) {
  return <div className="-mx-12 -mt-12 flex flex-col gap-4 rounded-t-16 bg-green-50 p-12">{children}</div>
}

export function StatusRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-8">
      <p className="flex-1 text-12 text-default">{label}</p>
      <Badge intent="green" variant="solid">
        Sangat Lancar
      </Badge>
    </div>
  )
}

// Hairlines use `border` (untouched by the token spacing scale) rather than
// `h-px`/`w-px` backgrounds — this project's Tailwind config replaces the
// spacing scale outright (see tailwind.config.ts) and doesn't define a `px`
// key, so `h-px`/`w-px` silently resolve to 0 instead of 1px.
export function StatDivider() {
  return <div className="border-t border-default" />
}

export function StatCellDivider() {
  return <div className="w-0 self-stretch border-l border-default" />
}

export function StatCell({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <p className="text-12 text-default">{label}</p>
      <p className="text-14 text-default">
        <span className="font-bold">{value}</span> <span>{unit}</span>
      </p>
    </div>
  )
}
