'use client'

// The pieces the two Perjalanan pendanaan layouts share: the status pill tones,
// the health→label map, the progress row, and the milestone rung itself. They
// live here so the alternative layout can differ at the TOP of the page without
// forking the ladder underneath it. Project-local (CLAUDE.md §4).

import { Check, ChevronRight, History, LockKey } from '@/design-system/icons'
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

/** The way back to the cycle that just closed. It sits at the FOOT of the
 *  ladder and scrolls with it — the current cycle is what she came for, and a
 *  pinned bar would put last cycle's rungs in front of this one's. Drawn, not
 *  wired: the achievements page does not exist yet. */
export function PreviousCycleLink() {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-8 rounded-12 border border-default bg-neutral-white p-16 text-left"
    >
      <span className="shrink-0 text-primary-500">
        <History size={20} />
      </span>
      <span className="min-w-0 flex-1 text-14 font-bold text-primary-500">
        Lihat capaian siklus sebelumnya
      </span>
      <span className="shrink-0 text-disabled">
        <ChevronRight size={16} />
      </span>
    </button>
  )
}

/**
 * Which rung is the ONE live card on the ladder.
 *
 * A ladder where four cards all carry a coloured amount and a button asks the
 * mitra to work out which one is hers to act on today. Exactly one is: the rung
 * that has money on the table now — reached, with its `cta` still unspent — and
 * failing that, the nearest goal she is working toward. Everything else is
 * either behind her or too far off to do anything about, so it greys out.
 */
export function activeIndexOf(milestones: Milestone[]) {
  const claimable = milestones.findIndex((m) => m.state === 'unlocked' && m.cta)
  return claimable !== -1 ? claimable : milestones.findIndex((m) => m.state === 'next')
}

export function MilestoneRung({
  milestone,
  showConnector,
  active,
  onOpen,
}: {
  milestone: Milestone
  showConnector: boolean
  /** The single live rung — see `activeIndexOf`. Everything else greys out. */
  active: boolean
  onOpen?: () => void
}) {
  const { label, status, countdown, actionLabel, amount, state, cta } = milestone
  // Locked rungs carry no figures at all. A rupiah amount and a week count on a
  // goal she cannot reach for months is arithmetic she has no use for yet, and
  // it was the loudest thing on a card that should have been the quietest.
  const locked = state === 'locked'

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
            !active
              ? 'bg-neutral-50 text-neutral-400'
              : state === 'unlocked'
                ? 'bg-green-500 text-neutral-white'
                : state === 'next'
                  ? 'bg-primary-500 text-neutral-white'
                  : state === 'missed'
                    ? 'bg-red-500 text-neutral-white'
                    : 'bg-neutral-50 text-neutral-400'
          }`}
        >
          {locked ? (
            <LockKey size={20} />
          ) : state === 'unlocked' ? (
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

      <div
        className={`min-w-0 flex-1 rounded-12 border p-16 ${
          active ? 'border-primary-500 bg-neutral-white' : 'border-default bg-neutral-50'
        }`}
      >
        {/* Date + countdown on the left, the status pill on the right. */}
        <div className="flex items-start gap-8">
          <div className="min-w-0 flex-1">
            <span className={`text-16 font-bold ${active ? 'text-default' : 'text-caption'}`}>
              {label}
            </span>
            {countdown && !locked ? (
              <p className="mt-2 text-12 text-caption">{countdown}</p>
            ) : null}
          </div>
          {status ? (
            <span
              className={`shrink-0 rounded-full px-8 py-2 text-12 font-bold ${
                // A missed goal keeps its red wherever it sits: greying "Gagal"
                // into the furniture would hide the one thing she must not miss.
                active || state === 'missed'
                  ? STATUS_TONE[status.tone]
                  : 'bg-neutral-200 text-caption'
              }`}
            >
              {status.label}
            </span>
          ) : null}
        </div>

        <div className="my-16 border-t border-light" />

        {/* The reward on the left, the way in on the right — on one row. The
            amount belongs to the live card only; repeated down the ladder it
            read as four payouts pending rather than one. */}
        <div className="flex items-center gap-8">
          <div className="min-w-0 flex-1">
            <p className={`text-14 ${active ? 'text-caption' : 'text-disabled'}`}>{actionLabel}</p>
            {amount && active ? (
              <p className="mt-2 text-18 font-bold text-green-600">{amount}</p>
            ) : null}
          </div>
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              className={`shrink-0 rounded-full px-16 py-8 text-14 font-bold ${
                active && cta
                  ? 'bg-primary-500 text-neutral-white'
                  : active
                    ? 'border border-primary-500 text-primary-500'
                    : 'border border-default text-caption'
              }`}
            >
              {active && cta ? cta : 'Lihat'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
