'use client'

// Components used only by the "alt" screens — kept apart from ui.tsx so the
// existing home/journey screens have nothing new to accidentally pick up.
// Project-local per CLAUDE.md §4; see NOTES.md.

import { useSyncExternalStore } from 'react'
import { ChevronRight } from '@/design-system/icons'
import { cardStateStore, type CardSelector } from './revolving'

export type Health = 'sehat' | 'berisiko'

const HEALTH_TONE: Record<Health, string> = {
  sehat: 'bg-green-50 text-green-600',
  berisiko: 'bg-orange-50 text-orange-700',
}
const HEALTH_LABEL: Record<Health, string> = { sehat: 'Sehat', berisiko: 'Berisiko' }

/** The way into the record behind a status. Optional: the compact card on
 *  Home - alt states the two reads and leaves it there, while the journey page
 *  — where the reads are the header — names the page each one opens. */
export interface StatusCta {
  label: string
  onClick: () => void
}

export function StatusPillRow({
  statusPribadi,
  statusMajelis,
  ctaPribadi,
  ctaMajelis,
  onOpenPribadi,
  onOpenMajelis,
}: {
  statusPribadi: Health
  statusMajelis: Health
  ctaPribadi?: StatusCta
  ctaMajelis?: StatusCta
  /** Makes the whole pill the target, for the card that has no room for a CTA
   *  line of its own. Ignored when the matching `cta*` prop is given. */
  onOpenPribadi?: () => void
  onOpenMajelis?: () => void
}) {
  return (
    <div className="flex items-stretch gap-8">
      <StatusPill
        label="Status pribadi"
        health={statusPribadi}
        cta={ctaPribadi}
        onClick={ctaPribadi ? undefined : onOpenPribadi}
      />
      <StatusPill
        label="Status majelis"
        health={statusMajelis}
        cta={ctaMajelis}
        onClick={ctaMajelis ? undefined : onOpenMajelis}
      />
    </div>
  )
}

function StatusPill({
  label,
  health,
  cta,
  onClick,
}: {
  label: string
  health: Health
  cta?: StatusCta
  onClick?: () => void
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`relative flex flex-1 flex-col rounded-12 p-12 text-left ${HEALTH_TONE[health]}`}
    >
      {/* Whole-pill tap target, no CTA row of its own: a corner chevron is
          the only affordance, so it needs to carry the "tappable" claim on
          its own — inherits the pill's own text colour via currentColor. */}
      {onClick && !cta ? (
        <span className="absolute right-8 top-8">
          <ChevronRight size={16} />
        </span>
      ) : null}
      <p className="text-12">{label}</p>
      <p className="mt-2 text-14 font-bold">{HEALTH_LABEL[health]}</p>
      {cta ? (
        // Pushed to the foot so two pills of unequal copy length still line
        // their CTAs up with each other.
        <button
          type="button"
          onClick={cta.onClick}
          className="mt-auto flex items-center gap-4 pt-8 text-left text-12 font-regular"
        >
          <span className="min-w-0 flex-1">{cta.label}</span>
          <ChevronRight size={16} />
        </button>
      ) : null}
    </Comp>
  )
}

export function useCardState(): CardSelector {
  return useSyncExternalStore(cardStateStore.subscribe, cardStateStore.get, cardStateStore.get)
}

// --- StatusBox ---------------------------------------------------------------
// The "Angsuran Ibu" / "Kelompok Ibu" pair on the new 3-state card. A separate
// component from StatusPill above: different labels (Lancar / Belum lancar,
// not Sehat / Berisiko), a third RED tone for a critical arrears read, and an
// optional reason line — none of which perjalanan-alt2's status pills should
// pick up just because this card changed.

export type BoxTone = 'lancar' | 'kuning' | 'merah'

const BOX_TONE: Record<BoxTone, string> = {
  lancar: 'bg-green-50 text-green-600',
  kuning: 'bg-yellow-50 text-yellow-700',
  merah: 'bg-red-50 text-red-600',
}
const BOX_LABEL: Record<BoxTone, string> = {
  lancar: 'Lancar',
  kuning: 'Belum lancar',
  merah: 'Belum lancar',
}

export function StatusBoxRow({
  left,
  right,
}: {
  left: { tone: BoxTone; value?: string; reason?: string; cta: StatusCta; onInfo?: () => void }
  right: { tone: BoxTone; value?: string; reason?: string; cta: StatusCta; onInfo?: () => void }
}) {
  return (
    <div className="flex items-stretch gap-8">
      <StatusBox label="Angsuran Ibu" {...left} />
      <StatusBox label="Kelompok Ibu" {...right} />
    </div>
  )
}

function StatusBox({
  label,
  tone,
  value,
  reason,
  cta,
  onInfo,
}: {
  label: string
  tone: BoxTone
  value?: string
  reason?: string
  cta: StatusCta
  onInfo?: () => void
}) {
  return (
    <div className={`relative flex flex-1 flex-col rounded-12 p-12 text-left ${BOX_TONE[tone]}`}>
      {onInfo ? (
        <button
          type="button"
          onClick={onInfo}
          aria-label="Info lebih lanjut"
          className="absolute right-8 top-8 flex h-16 w-16 items-center justify-center rounded-full border border-current text-12 font-bold"
        >
          i
        </button>
      ) : null}
      <p className="text-12">{label}</p>
      <p className="mt-2 text-14 font-bold">{value ?? BOX_LABEL[tone]}</p>
      {reason ? <p className="mt-2 text-12">{reason}</p> : null}
      {/* Pushed to the foot so a box with no reason line still lines its link
          up with the one beside it that has one. */}
      <button
        type="button"
        onClick={cta.onClick}
        className="mt-auto flex items-center gap-4 pt-8 text-left text-12 font-regular"
      >
        <span className="min-w-0 flex-1">{cta.label}</span>
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

// --- SegmentedBar ------------------------------------------------------------
// A bar the eye can count, not a smooth fill. `justFilled` highlights one
// segment — the instalment that just landed — brighter than the rest.

export function SegmentedBar({
  total,
  filled,
  justFilled,
}: {
  total: number
  filled: number
  justFilled?: number
}) {
  return (
    <div className="flex gap-4">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1
        const isFilled = n <= filled
        const isJust = justFilled === n
        return (
          <span
            key={n}
            className={`h-8 flex-1 rounded-full ${
              isJust ? 'bg-green-500' : isFilled ? 'bg-primary-500' : 'bg-neutral-200'
            }`}
          />
        )
      })}
    </div>
  )
}
