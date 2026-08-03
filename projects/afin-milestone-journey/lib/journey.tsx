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

export function MilestoneRung({
  milestone,
  showConnector,
  onOpen,
}: {
  milestone: Milestone
  showConnector: boolean
  onOpen?: () => void
}) {
  const { label, status, countdown, actionLabel, amount, amountTo, footnote, state, cta } =
    milestone

  // A rung that asks nothing more of her collapses to a single line: the date,
  // what it was, and how it ended. That covers both a rung she has already
  // collected and one she missed — in neither case is there a figure worth the
  // room, and a card with a divider and an empty reward slot reads as unfinished
  // business. Only rungs with something still to do keep the full card.
  const collapsed = state === 'missed' || (state === 'unlocked' && !cta)

  // A rung further up the ladder is drained of colour entirely — grey date,
  // grey figure — and drops its status label outright. "Sesuai rencana" on a
  // goal thirty weeks out is a reading of habits she has not had the chance to
  // keep yet; it filled the loudest slot on the card with the least useful
  // thing on it. The next rung is what she should be working on, and it can
  // only look urgent if the ones behind it are quiet.
  const muted = state === 'locked'
  const ink = muted ? 'text-disabled' : undefined

  const pill =
    status && !muted ? (
      <span
        className={`shrink-0 rounded-full px-8 py-2 text-12 font-bold ${STATUS_TONE[status.tone]}`}
      >
        {status.label}
      </span>
    ) : null

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

      {collapsed ? (
        // The whole card is the target — there is no control drawn on it, but
        // its tracker page is still worth reaching, especially for a missed
        // rung where the page explains what went wrong.
        <button
          type="button"
          onClick={onOpen}
          disabled={!onOpen}
          className={`flex min-w-0 flex-1 items-start gap-8 rounded-12 border border-default p-16 text-left ${
            state === 'missed' ? 'bg-neutral-50' : 'bg-neutral-white'
          }`}
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span
              className={`text-16 font-bold ${state === 'missed' ? 'text-disabled' : 'text-default'}`}
            >
              {label}
            </span>
            <span className={`mt-2 text-12 ${state === 'missed' ? 'text-disabled' : 'text-caption'}`}>
              {actionLabel}
            </span>
          </span>
          {pill}
        </button>
      ) : (
        <div className="min-w-0 flex-1 overflow-hidden rounded-12 border border-default bg-neutral-white">
          <div className="p-16">
            {/* Date + countdown on the left, the status pill on the right. */}
            <div className="flex items-start gap-8">
              <div className="min-w-0 flex-1">
                <span className={`text-16 font-bold ${ink ?? 'text-default'}`}>{label}</span>
                {countdown ? (
                  <p className={`mt-2 text-12 ${ink ?? 'text-caption'}`}>{countdown}</p>
                ) : null}
              </div>
              {pill}
            </div>

            <div className="my-16 border-t border-light" />

            {/* The reward on the left, the way in on the right — on one row. */}
            <div className="flex items-center gap-8">
              <div className="min-w-0 flex-1">
                <p className={`text-14 ${ink ?? 'text-caption'}`}>{actionLabel}</p>
                {/* One size for every figure, estimate or not: the ladder is
                    read by comparing rungs, and a range that shrank to fit
                    would read as the smaller reward. */}
                {amount ? (
                  <p className={`mt-2 text-18 font-bold ${ink ?? 'text-green-600'}`}>
                    {amountTo ? `${amount} - ${amountTo}` : amount}
                  </p>
                ) : null}
              </div>
              {cta && onOpen ? (
                <button
                  type="button"
                  onClick={onOpen}
                  className="shrink-0 rounded-full bg-primary-500 px-16 py-8 text-14 font-bold text-neutral-white"
                >
                  {cta}
                </button>
              ) : state === 'next' && onOpen ? (
                // Only the rung she is working toward is worth opening. A
                // locked rung further up has no progress of its own to show
                // yet, so it gets no control and the card stays inert.
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

          {/* The condition on the figure above, in a band of its own so it
              qualifies the number without competing with it. */}
          {footnote ? (
            <div className="border-t border-light bg-neutral-50 px-16 py-8">
              <p className={`text-10 ${ink ?? 'text-caption'}`}>
                {footnote.before}{' '}
                <span className={`font-bold ${ink ?? 'text-default'}`}>{footnote.strong}</span>{' '}
                {footnote.after}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
