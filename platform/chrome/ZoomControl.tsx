'use client'

// =============================================================================
// Zoom control — `− Fit +`, in the bottom-left corner of both canvases: the
// prototype's device frame (phone or desktop) and the flow diagram. One
// component so the two read and behave the same; each canvas owns its own zoom
// state and hands the control what it needs.
// =============================================================================

import { MinusIcon, PlusIcon } from './icons'
import { withKey } from './shortcuts'

const STEP =
  'flex h-full w-32 items-center justify-center text-caption hover:bg-neutral-50 hover:text-default disabled:text-placeholder dark:text-neutral-500 dark:hover:bg-ink-800 dark:hover:text-neutral-50 dark:disabled:text-neutral-700'

/** The stops − and + step between; past either end they go to the limit. */
export const ZOOM_STEPS = [0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.25, 1.5, 2, 3]

/** The next stop from `scale` in `dir`, clamped to [min, max]. */
export function nextZoom(scale: number, dir: 1 | -1, min: number, max: number): number {
  const next =
    dir === 1
      ? (ZOOM_STEPS.find((z) => z > scale + 0.01) ?? max)
      : ([...ZOOM_STEPS].reverse().find((z) => z < scale - 0.01) ?? min)
  return Math.min(max, Math.max(min, next))
}

export function ZoomControl({
  scale,
  fitted,
  min,
  max,
  onStep,
  onFit,
  className,
}: {
  scale: number
  /** Showing the whole canvas — the middle button then reads "Fit". */
  fitted: boolean
  min: number
  max: number
  onStep: (dir: 1 | -1) => void
  onFit: () => void
  className?: string
}) {
  return (
    <div
      className={`flex h-32 items-stretch overflow-hidden rounded-8 border border-default bg-neutral-white text-12 dark:border-ink-800 dark:bg-ink-900 ${className ?? ''}`}
    >
      <button
        type="button"
        onClick={() => onStep(-1)}
        disabled={scale <= min}
        aria-label="Zoom out"
        title={withKey('Zoom out', 'zoomOut')}
        className={STEP}
      >
        <MinusIcon className="size-16" />
      </button>
      <button
        type="button"
        onClick={onFit}
        title={fitted ? 'Fitted to the canvas' : withKey('Fit to the canvas', 'fit')}
        className="min-w-52 px-8 font-bold text-default hover:bg-neutral-50 dark:text-neutral-50 dark:hover:bg-ink-800"
      >
        {fitted ? 'Fit' : `${Math.round(scale * 100)}%`}
      </button>
      <button
        type="button"
        onClick={() => onStep(1)}
        disabled={scale >= max}
        aria-label="Zoom in"
        title={withKey('Zoom in', 'zoomIn')}
        className={STEP}
      >
        <PlusIcon className="size-16" />
      </button>
    </div>
  )
}
