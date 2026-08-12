'use client'

// =============================================================================
// The prototype view's side panels — one shell, one interaction, everywhere.
//
// Notes, States, Layers and the inspector/edit panels used to differ in how you
// dismissed them: the phone layout gave States a pill of its own, the desktop
// layout put everything behind floating tabs that then sat ON TOP of the panel
// they had opened, and the right-hand side could not be dismissed at all. This
// is the single answer: a panel is either open — with a minimize control in a
// header that stays put while the body scrolls — or closed, leaving a pill.
// Never both, so a tab can never cover its own panel's title.
//
// Placement is still the layouts' business, because it genuinely differs: a
// 390px device leaves room for real columns beside it, while a 1440px one
// leaves none and its panels overlay the canvas. Everything ABOUT the panel is
// here, so the two layouts can't drift apart again.
//
// It lives in chrome/ rather than frame/ because inspect/ and edit/ both need
// it, and frame/ already imports them — putting it there would be a cycle.
// =============================================================================

import type { ReactNode } from 'react'
import { CloseIcon } from './icons'

/** The panel's own surface, which the sticky header has to repeat — otherwise
 *  scrolled content shows through it. Every panel sits on a card, in both
 *  layouts, so this is a constant rather than a choice. */
const SURFACE_BG = 'bg-neutral-white dark:bg-ink-900'

export interface PanelShellProps {
  title: string
  /** Omitted for a panel that cannot be dismissed; then no control is drawn. */
  onMinimize?: () => void
  /** Column geometry from the layout (width, alignment) or `w-full` in a drawer. */
  className?: string
  onMouseLeave?: () => void
  children: ReactNode
}

export function PanelShell({
  title,
  onMinimize,
  className,
  onMouseLeave,
  children,
}: PanelShellProps) {
  return (
    // Height comes from the card around it, which is what bounds the panel
    // against the view. `min-h-0` is what lets it shrink past its own content
    // and scroll there, instead of pushing the card off the bottom of the
    // screen — and deliberately no `flex-1`, so a two-line Notes panel stays
    // two lines tall rather than stretching its card to full height.
    <aside
      onMouseLeave={onMouseLeave}
      className={`flex min-h-0 flex-col overflow-y-auto ${className ?? ''}`}
    >
      {/* Sticky so the way out stays reachable however far the body scrolls —
          a long layers tree used to bury its own minimize button. */}
      <div
        className={`sticky top-0 z-10 flex items-center justify-between gap-8 pb-8 pt-8 ${SURFACE_BG}`}
      >
        <span className="truncate text-10 font-bold uppercase text-caption dark:text-neutral-400">
          {title}
        </span>
        {onMinimize ? (
          <button
            type="button"
            onClick={onMinimize}
            aria-label={`Hide ${title}`}
            title={`Hide ${title}`}
            className="flex size-20 flex-none items-center justify-center rounded-4 text-caption hover:bg-neutral-white hover:text-default dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50"
          >
            <CloseIcon className="size-16" />
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-12 pb-8">{children}</div>
    </aside>
  )
}

/** The way back to a minimized panel. Positioned by the caller — a column in
 *  one layout, floating over the canvas in the other. */
export function PanelPill({
  label,
  onClick,
  className,
}: {
  label: string
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={false}
      className={`rounded-full border border-default bg-neutral-white px-12 py-4 text-12 font-bold text-caption shadow-sm hover:bg-neutral-50 hover:text-default dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50 ${className ?? ''}`}
    >
      {label}
    </button>
  )
}
