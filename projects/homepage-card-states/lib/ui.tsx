'use client'

// Project-local pieces with no design-system equivalent yet. All of them are
// built from tokens + design-system components only — see NOTES.md for the
// promotion proposal.

import type { ReactNode } from 'react'
import { ArrowRight } from './icons'
import { jt } from './data'

/**
 * The unified card header this exploration is testing: a motivational headline
 * in brand purple plus a circular arrow affordance, on every card.
 */
export function CardHeader({ title, tone = 'text-primary-600' }: { title: string; tone?: string }) {
  return (
    <div className="flex items-start justify-between gap-12">
      <div className={`flex-1 text-16 font-bold ${tone}`}>{title}</div>
      <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-neutral-50 text-default">
        <ArrowRight />
      </div>
    </div>
  )
}

/** 1px rule between card sections. */
export function Divider() {
  return <div className="my-12 border-t border-default" />
}

/** A labelled percentage ring. Stroke colour is passed as a token var(). */
export function Ring({ pct, stroke, label }: { pct: number; stroke: string; label: string }) {
  const size = 56
  const width = 5
  const r = (size - width) / 2
  const circumference = 2 * Math.PI * r

  return (
    <div className="flex flex-1 flex-col items-center gap-4 rounded-12 border border-default bg-neutral-50 p-12">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--neutral-200)"
            strokeWidth={width}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={width}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
            className="transition-all"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-14 font-bold text-default">
          {pct}%
        </div>
      </div>
      <div className="text-center text-10 font-bold uppercase text-neutral-700">{label}</div>
      <button type="button" className="text-12 text-link underline">
        Lihat
      </button>
    </div>
  )
}

/**
 * Current → potential limit gauge. Replaces reading the three rings separately:
 * the thumb sits where the projected limit lands between the two ends.
 */
export function LimitGauge({
  current,
  potential,
  projected,
}: {
  current: number
  potential: number
  projected: number
}) {
  const pct = Math.max(0, Math.min(100, ((projected - current) / (potential - current)) * 100))

  return (
    <div className="mt-12">
      <div className="relative h-8 rounded-full bg-neutral-200">
        {/* pct is data, not a design value — inline style is the only way to bind it */}
        <div className="h-8 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
        <div
          className="absolute top-0 h-16 w-16 -translate-x-1/2 -translate-y-4 rounded-full border-2 border-neutral-white bg-primary-500"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="relative mt-8 h-16">
        <span
          className="absolute -translate-x-1/2 whitespace-nowrap text-12 font-bold text-primary-600"
          style={{ left: `${pct}%` }}
        >
          {jt(projected)}
        </span>
      </div>
    </div>
  )
}

/** Tinted inline notice — 500 foreground on the matching 50 background. */
export function Notice({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-8 flex items-start gap-8 rounded-8 bg-red-50 p-8">
      <div className="shrink-0 text-red-500">{icon}</div>
      <div className="text-12 text-red-600">{children}</div>
    </div>
  )
}
