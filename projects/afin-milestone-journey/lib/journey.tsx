'use client'

// The pieces the two Perjalanan pendanaan layouts share: the status pill tones,
// the health→label map, the progress row, and the milestone rung itself. They
// live here so the alternative layout can differ at the TOP of the page without
// forking the ladder underneath it. Project-local (CLAUDE.md §4).

import { Check, ChevronRight, LockKey } from '@/design-system/icons'
import type { Milestone } from './data'
import type { Health } from './milestone-tracker'

export const STATUS_TONE = {
  green: 'bg-green-50 text-green-600',
  blue: 'bg-blue-50 text-blue-600',
  orange: 'bg-orange-50 text-orange-700',
  red: 'bg-red-50 text-red-600',
} as const

export const HEALTH_LABEL: Record<Health, { label: string; tone: keyof typeof STATUS_TONE }> = {
  sehat: { label: 'Sehat', tone: 'green' },
  berisiko: { label: 'Berisiko', tone: 'orange' },
  buruk: { label: 'Tidak sehat', tone: 'red' },
}

export function ProgressMenuItem({
  label,
  subtitle,
  health,
  onOpen,
  inset,
}: {
  label: string
  subtitle: string
  health: Health
  onOpen: () => void
  /** Set when the row sits in a full-bleed band rather than inside a sheet,
   *  which already carries its own side padding. */
  inset?: boolean
}) {
  const h = HEALTH_LABEL[health]
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-center gap-8 text-left ${inset ? 'p-16' : 'py-12'}`}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-14 font-bold text-default">{label}</span>
        <span className="text-12 text-caption">{subtitle}</span>
      </span>
      <span className={`shrink-0 rounded-full px-8 py-2 text-12 font-bold ${STATUS_TONE[h.tone]}`}>
        {h.label}
      </span>
      <span className="shrink-0 text-disabled">
        <ChevronRight size={16} />
      </span>
    </button>
  )
}

export function MilestoneRung({
  milestone,
  showConnector,
  onOpen,
}: {
  milestone: Milestone
  showConnector: boolean
  onOpen?: () => void
}) {
  const { label, status, countdown, actionLabel, amount, state, cta } = milestone

  return (
    <div className="flex gap-12">
      {/* The node column, stretched to the card's height so the connector can
          run from this node down to the next — a timeline the eye reads as
          progress. It carries the rung's status on its own, so the card beside
          it never has to repeat "terkunci" in words. */}
      <div className="relative flex w-40 shrink-0 justify-center self-stretch">
        {showConnector ? (
          <span
            className={`absolute left-1/2 top-40 -bottom-16 w-2 -translate-x-1/2 ${
              state === 'unlocked' ? 'bg-green-500' : 'bg-neutral-200'
            }`}
          />
        ) : null}
        <span
          className={`relative z-10 flex h-40 w-40 items-center justify-center rounded-full ${
            state === 'unlocked'
              ? 'bg-green-500 text-neutral-white'
              : state === 'next'
                ? 'bg-primary-500 text-neutral-white'
                : state === 'missed'
                  ? 'bg-red-500 text-neutral-white'
                  : 'bg-neutral-50 text-neutral-400'
          }`}
        >
          {state === 'unlocked' ? (
            <Check size={20} />
          ) : state === 'next' ? (
            <span className="text-16">🎯</span>
          ) : state === 'missed' ? (
            <span className="text-18 font-bold">✕</span>
          ) : (
            <LockKey size={20} />
          )}
        </span>
      </div>

      <div className="min-w-0 flex-1 rounded-12 border border-default bg-neutral-white p-16">
        {/* Date + countdown on the left, the status pill on the right. */}
        <div className="flex items-start gap-8">
          <div className="min-w-0 flex-1">
            <span className="text-16 font-bold text-default">{label}</span>
            {countdown ? <p className="mt-2 text-12 text-caption">{countdown}</p> : null}
          </div>
          {status ? (
            <span
              className={`shrink-0 rounded-full px-8 py-2 text-12 font-bold ${STATUS_TONE[status.tone]}`}
            >
              {status.label}
            </span>
          ) : null}
        </div>

        <div className="my-16 border-t border-light" />

        {/* The reward on the left, the way in on the right — on one row. */}
        <div className="flex items-center gap-8">
          <div className="min-w-0 flex-1">
            <p className="text-14 text-caption">{actionLabel}</p>
            {amount ? <p className="mt-2 text-18 font-bold text-green-600">{amount}</p> : null}
          </div>
          {cta && onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              className="shrink-0 rounded-full bg-primary-500 px-16 py-8 text-14 font-bold text-neutral-white"
            >
              {cta}
            </button>
          ) : onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              className="shrink-0 rounded-full border border-primary-500 px-16 py-8 text-14 font-bold text-primary-500"
            >
              Lihat
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
