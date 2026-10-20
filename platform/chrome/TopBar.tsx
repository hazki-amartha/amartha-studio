'use client'

// =============================================================================
// TopBar — the 48px bar across the top of the page card. Left: the button
// that folds and opens the sidebar — here whether it's open or folded, so it
// never moves between the two — then where you are (a breadcrumb, or inside a
// project the screen that's showing). Right: what the route publishes — its
// status (the flow view's badge), then its actions, which the route portals
// in (shellSlots.ts): the prototype's Comment · Edit · Chat, the gallery's
// New project.
// =============================================================================

import Link from 'next/link'
import { useCallback, type ReactNode } from 'react'
import { FoldButton } from './FoldButton'
import { ChevronRightIcon } from './icons'
import { setShellSlot } from './shellSlots'

export interface Crumb {
  label: string
  href?: string
}

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-4">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-4">
            {i > 0 ? <ChevronRightIcon className="size-12 flex-none text-placeholder dark:text-neutral-600" /> : null}
            {crumb.href && !isLast ? (
              <Link
                href={crumb.href}
                className="truncate rounded-6 px-4 text-14 text-caption hover:text-default dark:text-neutral-500 dark:hover:text-neutral-50"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? 'page' : undefined}
                className={
                  isLast
                    ? 'truncate px-4 text-14 font-bold text-default dark:text-neutral-50'
                    : 'truncate px-4 text-14 text-caption dark:text-neutral-500'
                }
              >
                {crumb.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}

const TOOL = 'flex h-32 flex-none items-center gap-8 rounded-8 px-12 text-12 font-bold'

/** One of the top bar's actions — Comment, Edit, AI Chat, New project.
 *  `inverted`: against the bar — white with black text on the dark theme,
 *  near-black with white text on the light one — so AI Chat stands apart. */
export function ToolButton({
  icon,
  label,
  title,
  onClick,
  inverted,
}: {
  icon: ReactNode
  label: string
  title?: string
  onClick: () => void
  inverted?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={
        inverted
          ? `${TOOL} bg-ink-900 text-neutral-white hover:bg-ink-800 dark:bg-neutral-white dark:text-ink-900 dark:hover:bg-neutral-200`
          : `${TOOL} border border-default bg-neutral-white text-default hover:bg-neutral-50 dark:border-ink-800 dark:bg-ink-900 dark:text-neutral-50 dark:hover:bg-ink-800`
      }
    >
      {icon}
      {label}
    </button>
  )
}

export function TopBar({
  title,
  status,
  sidebar,
  className,
}: {
  title: ReactNode
  /** Route-published extras, before the actions (the flow view's badge). */
  status?: ReactNode
  /** Given wherever the sidebar shows: whether it's folded, and the switch. */
  sidebar?: { folded: boolean; onToggle: () => void }
  className?: string
}) {
  const metaRef = useCallback((el: HTMLElement | null) => setShellSlot('meta', el), [])
  const actionsRef = useCallback((el: HTMLElement | null) => setShellSlot('actions', el), [])

  return (
    <header
      className={`h-48 flex-none items-center gap-8 border-b border-default px-12 dark:border-ink-800 ${className ?? 'flex'}`}
    >
      {sidebar ? (
        <div className="hidden flex-none items-center gap-8 md:flex">
          <FoldButton folded={sidebar.folded} onClick={sidebar.onToggle} />
          <span aria-hidden className="h-16 border-l border-default dark:border-ink-800" />
        </div>
      ) : null}
      <div className="flex min-w-0 items-center gap-8">
        {title}
        <span ref={metaRef} className="flex-none text-12 text-caption empty:hidden dark:text-neutral-500" />
      </div>
      <div className="ml-auto flex flex-none items-center gap-8">
        {status}
        <div ref={actionsRef} className="flex items-center gap-8 empty:hidden" />
      </div>
    </header>
  )
}
