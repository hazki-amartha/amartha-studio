// =============================================================================
// WS-A · Layout primitives.
// Thin, token-locked wrappers screens compose with. They encode the mobile
// screen layout pattern from design-system/tokens.ts (LAYOUT_PATTERNS):
//   page-padding-x 16px · page-padding-top 16px · section-gap 12px ·
//   topbar-height 48px · topbar-padding-x 16px.
// =============================================================================

import type { HTMLAttributes, ReactNode } from 'react'

export interface ScreenProps extends HTMLAttributes<HTMLDivElement> {
  /** Fixed chrome pinned to the top of the screen (e.g. a NavigationHeader or TopBar). */
  topBar?: ReactNode
  children: ReactNode
}

/**
 * The frame a project screen renders inside. Provides the neutral-50 canvas,
 * an optional pinned top bar, and the standard content padding + section gap.
 * The content area scrolls; the top bar stays put.
 */
export function Screen({ topBar, children, className, ...props }: ScreenProps) {
  const classes = ['flex', 'min-h-full', 'flex-col', 'bg-neutral-50', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...props}>
      {topBar}
      <div className="flex flex-1 flex-col gap-12 px-16 pt-16">{children}</div>
    </div>
  )
}

export interface TopBarProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode
}

/**
 * A minimal 48px top bar primitive for screens that don't use a full
 * NavigationHeader. Applies topbar-height (48px) and topbar-padding-x (16px).
 */
export function TopBar({ children, className, ...props }: TopBarProps) {
  const classes = [
    'flex',
    'h-48',
    'shrink-0',
    'items-center',
    'gap-8',
    'bg-neutral-white',
    'px-16',
    'text-16',
    'font-bold',
    'text-default',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <header className={classes} {...props}>
      {children}
    </header>
  )
}
