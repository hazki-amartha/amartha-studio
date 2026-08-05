'use client'

import type { ReactNode } from 'react'
import { ChevronRight } from '@/design-system/icons'

// ---------------------------------------------------------------------------
// Shared, token-locked bits for the agent dashboard. Nothing here hardcodes a
// colour or an arbitrary size — every value is a FunDS token.
// ---------------------------------------------------------------------------

type TileIntent = 'purple' | 'blue' | 'green' | 'orange' | 'red' | 'neutral'

const TILE: Record<TileIntent, string> = {
  purple: 'bg-primary-50 text-primary-500',
  blue: 'bg-blue-50 text-blue-500',
  green: 'bg-green-50 text-green-500',
  orange: 'bg-orange-50 text-orange-500',
  red: 'bg-red-50 text-red-500',
  neutral: 'bg-neutral-50 text-neutral-600',
}

// A rounded, tinted glyph tile. `size` picks the two sizes the dashboard uses.
export function IconTile({
  intent,
  size = 'md',
  children,
}: {
  intent: TileIntent
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}) {
  const box = size === 'lg' ? 'size-48 rounded-12' : 'size-40 rounded-8'
  return (
    <span className={`flex shrink-0 items-center justify-center ${box} ${TILE[intent]}`}>
      {children}
    </span>
  )
}

// Section header: bold title on the left, optional link on the right.
export function SectionTitle({
  children,
  link,
  onLink,
  sub,
}: {
  children: ReactNode
  link?: string
  onLink?: () => void
  sub?: ReactNode
}) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-8 px-2">
        <span className="min-w-0 text-16 font-bold text-default">{children}</span>
        {link ? (
          <button
            type="button"
            onClick={onLink}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap text-12 text-primary-500"
          >
            {link}
            <ChevronRight size={16} />
          </button>
        ) : null}
      </div>
      {sub ? <p className="mt-4 px-2 text-12 text-caption">{sub}</p> : null}
    </div>
  )
}

// The "… Selengkapnya" style link row inside the summary card: label left,
// chevron right, full width.
export function LinkRow({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between text-left text-12 text-primary-500"
    >
      <span>{children}</span>
      <ChevronRight size={20} />
    </button>
  )
}

// A small circled-i info affordance. Inherits colour from the parent.
export function InfoDot({ onClick, label }: { onClick?: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex text-neutral-500"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 11v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="7.5" r="1.15" fill="currentColor" />
      </svg>
    </button>
  )
}

// A plain filled progress track — there is no shared ProgressBar component.
export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className={`h-4 w-full overflow-hidden rounded-full bg-neutral-50 ${className ?? ''}`}>
      <div className="h-full rounded-full bg-primary-500" style={{ width: `${percent}%` }} />
    </div>
  )
}
