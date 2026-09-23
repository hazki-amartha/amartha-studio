'use client'

// =============================================================================
// The prototype view's side panels — one shell, one interaction, everywhere.
//
// Notes, States, Layers and the inspector/edit panels used to differ in how you
// dismissed them: the phone layout gave States a pill of its own, the desktop
// layout put everything behind floating tabs that then sat ON TOP of the panel
// they had opened, and the right-hand side could not be dismissed at all. This
// is the single answer: one header that stays put while the body scrolls,
// holding the panel's title or its tabs.
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
import styles from './chrome.module.css'

/** The panel's own surface, which the sticky header has to repeat — otherwise
 *  scrolled content shows through it. Every panel sits on a card, in both
 *  layouts, so this is a constant rather than a choice. */
const SURFACE_BG = 'bg-neutral-white dark:bg-ink-900'

export interface PanelShellProps {
  title: string
  /** Drawn in the header instead of the title — for a panel with tabs. The
   *  title still names the panel for the minimize control. */
  tabs?: ReactNode
  /** Omitted for a panel that cannot be dismissed; then no control is drawn. */
  onMinimize?: () => void
  /** Column geometry from the layout (width, alignment) or `w-full` in a drawer. */
  className?: string
  onMouseLeave?: () => void
  children: ReactNode
}

export function PanelShell({
  title,
  tabs,
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
      <PanelHeader title={title} tabs={tabs} onMinimize={onMinimize} className="sticky top-0 z-10" />
      <div className="flex flex-col gap-12 pb-8">{children}</div>
    </aside>
  )
}

/** A panel's header: its title or tabs, and the way to minimize it. Exported
 *  for a panel that lays out its own body — Chat, whose transcript scrolls
 *  while its composer stays put. */
export function PanelHeader({
  title,
  tabs,
  onMinimize,
  className,
}: {
  title: string
  tabs?: ReactNode
  onMinimize?: () => void
  className?: string
}) {
  return (
    <div
      className={`flex items-center justify-between gap-8 pb-8 ${tabs ? '' : 'pt-8'} ${SURFACE_BG} ${className ?? ''}`}
    >
      {tabs ?? (
        <span className="truncate text-10 font-bold uppercase text-caption dark:text-neutral-400">
          {title}
        </span>
      )}
      {onMinimize ? (
        <button
          type="button"
          onClick={onMinimize}
          // With tabs the control hides the whole panel, not the tab showing.
          aria-label={tabs ? 'Hide panel' : `Hide ${title}`}
          title={tabs ? 'Hide panel' : `Hide ${title}`}
          className="flex size-20 flex-none items-center justify-center rounded-4 text-caption hover:bg-neutral-white hover:text-default dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50"
        >
          <CloseIcon className="size-16" />
        </button>
      ) : null}
    </div>
  )
}

/** A panel's tabs, for its header: equal-width, icon and label, the active
 *  one underlined — the same bar on both sidebars. */
export function PanelTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; icon?: (props: { className?: string }) => ReactNode }[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div role="tablist" className={`flex w-full items-stretch ${styles.tabs}`}>
      {tabs.map((t) => {
        const on = t.id === active
        const Icon = t.icon
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={`flex h-40 min-w-0 flex-1 items-center justify-center gap-8 border-b-2 px-4 text-12 ${
              on
                ? 'border-primary-500 font-bold text-default dark:text-neutral-50'
                : 'border-transparent text-caption hover:text-default dark:text-neutral-400 dark:hover:text-neutral-50'
            }`}
          >
            {Icon ? <Icon className="size-16 flex-none" /> : null}
            <span className="truncate">{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}
