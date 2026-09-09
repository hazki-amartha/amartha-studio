'use client'

// The Sales page's group card — one per task type.
//
// It answers three questions in one glance, in the order a BP asks them: what
// kind of work is this, how much of it is left, and what does doing one involve.
// The count sits top-right at 24px because "5 / 15" is the fact she came to the
// page for; the flow line ("Telepon → majelis → submit") sits under the title in
// caption grey because it is the answer to a question she only asks once.
//
// The bar is not decoration. A count alone ("5 of 15") is read as arithmetic; a
// bar is read as position, and position is what tells her at 14.00 whether the
// afternoon is recoverable.

import type { ReactNode } from 'react'
import { ChevronRight } from '@/design-system/icons'

export type Tint = 'primary' | 'blue' | 'green' | 'orange' | 'red'

// Each tint as a 50-tint ground under a 500 foreground — the same pairing the
// Badge uses, so an icon tile and a status badge on the same page agree.
const TILE: Record<Tint, string> = {
  primary: 'bg-primary-50 text-primary-500',
  blue: 'bg-blue-50 text-blue-500',
  green: 'bg-green-50 text-green-500',
  orange: 'bg-orange-50 text-orange-500',
  red: 'bg-red-50 text-red-500',
}

const FILL: Record<Tint, string> = {
  primary: 'bg-primary-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
}

const PILL: Record<Tint, string> = {
  primary: 'bg-primary-50 text-primary-500',
  blue: 'bg-blue-50 text-blue-500',
  green: 'bg-green-50 text-green-500',
  orange: 'bg-orange-50 text-orange-500',
  red: 'bg-red-50 text-red-500',
}

/** The progress rail. Width is the one dimension that cannot come from a token. */
export function Meter({ percent, tint }: { percent: number; tint: Tint }) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div className="h-8 w-full rounded-full bg-neutral-200">
      <div className={`h-8 rounded-full ${FILL[tint]}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}

/** A quiet chip — the facts that qualify a task rather than count it. */
export function TaskChip({ tint, children }: { tint?: Tint; children: ReactNode }) {
  return (
    <span
      className={`flex items-center gap-4 rounded-full px-12 py-4 text-12 font-bold ${
        tint ? PILL[tint] : 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {children}
    </span>
  )
}

export function TaskCard({
  icon,
  tint,
  title,
  flow,
  done,
  total,
  footer,
  chips,
  action,
  onOpen,
}: {
  icon: ReactNode
  tint: Tint
  title: string
  flow: string
  /** How many of this task are cleared, and how many there are in total. */
  done: number
  total: number
  /** The line under the bar — what the numbers mean in words. */
  footer?: string
  chips?: ReactNode
  /** Replaces the chevron, for a card whose main affordance is an action. */
  action?: ReactNode
  onOpen: () => void
}) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const left = Math.max(0, total - done)

  return (
    <div className="flex flex-col gap-12 rounded-16 bg-neutral-white p-12">
      {/* The head is the tappable part; an action button sits outside it so a
          tap on "+" never also opens the group behind it. */}
      <div className="flex items-start gap-12">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-start gap-12 text-left"
        >
          <span className={`flex h-48 w-48 shrink-0 items-center justify-center rounded-12 ${TILE[tint]}`}>
            {icon}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-2 py-2">
            <span className="truncate text-16 font-bold text-default">{title}</span>
            <span className="truncate text-12 text-caption">{flow}</span>
          </span>
          {action ? null : (
            <span className="flex shrink-0 items-baseline gap-2 pt-2">
              <span className="text-24 font-bold text-default">{done}</span>
              <span className="text-14 text-caption">/ {total}</span>
              <span className="pl-4 text-caption">
                <ChevronRight size={20} />
              </span>
            </span>
          )}
        </button>
        {action ? <span className="shrink-0">{action}</span> : null}
      </div>

      <Meter percent={percent} tint={tint} />

      {footer || left > 0 ? (
        <div className="flex items-center gap-8">
          <span className="min-w-0 flex-1 truncate text-12 text-caption">{footer}</span>
          {left > 0 ? <TaskChip tint={tint}>sisa {left}</TaskChip> : null}
        </div>
      ) : null}

      {chips ? <div className="flex flex-wrap items-center gap-8">{chips}</div> : null}
    </div>
  )
}
