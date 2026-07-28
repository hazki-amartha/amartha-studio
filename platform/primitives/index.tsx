// =============================================================================
// WS-A · Layout primitives.
// Thin, token-locked wrappers screens compose with. They encode the mobile
// screen layout pattern from design-system/tokens.ts (LAYOUT_PATTERNS):
//   page-padding-x 16px · page-padding-top 16px · section-gap 12px ·
//   topbar-height 48px · topbar-padding-x 16px.
// =============================================================================

import type { HTMLAttributes, ReactNode } from 'react'

/** How the 32px device status-bar strip above the top bar is painted. */
export type ScreenStatusBar = 'light' | 'none'

/** How the page canvas behind the content is painted. */
export type ScreenCanvas = 'neutral' | 'white'

export interface ScreenProps extends HTMLAttributes<HTMLDivElement> {
  /** Fixed chrome pinned to the top of the screen (e.g. a NavigationHeader or TopBar). */
  topBar?: ReactNode
  /**
   * `'light'` (default) — an opaque white strip, which is how the device frame
   * has always drawn it. `'none'` — the strip paints nothing, so a screen whose
   * own chrome is coloured can extend into it (pull the first element up by
   * `-mt-48`: 32px of strip plus the 16px page padding-top).
   */
  statusBar?: ScreenStatusBar
  /**
   * `'neutral'` (default) — the neutral-50 canvas, which separates white cards
   * from the page behind them. `'white'` — a flat white page, for screens whose
   * real counterpart has no canvas tint at all; the shipped AmarthaFin homepage
   * is the reference case. A screen can't get this by passing `bg-neutral-white`
   * via `className`, because which of the two rules wins would then depend on
   * their order in Tailwind's output rather than on anything stated here.
   */
  canvas?: ScreenCanvas
  children: ReactNode
}

/** Device status-bar height. Content clears the notch area by this much. */
const STATUS_BAR_H = 'h-32'

/**
 * The frame a project screen renders inside. Provides the page canvas
 * (neutral-50 by default, see `canvas`), an optional pinned top bar, and the
 * standard content padding + section gap. The content area scrolls; the top bar
 * stays put.
 */
export function Screen({
  topBar,
  statusBar = 'light',
  canvas = 'neutral',
  children,
  className,
  ...props
}: ScreenProps) {
  const classes = [
    'flex',
    'min-h-full',
    'flex-col',
    canvas === 'white' ? 'bg-neutral-white' : 'bg-neutral-50',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...props} data-fds="Screen">
      {/* Stickiness lives on the SLOT, not on the bar. Two different components
          can be passed as `topBar` — the design system's NavigationHeader and
          the TopBar below — and a header is also legitimately used outside a
          Screen, where it should not pin itself. Pinning the slot gets both for
          free and keeps the two bars ignorant of how they are laid out.

          `z-10` is required rather than decorative: the bar is FIRST in DOM
          order, so without it the content scrolling past would paint on top of
          it. Both bars carry an opaque background, so nothing shows through.

          This resolves against the same containing block that already makes
          screens' `sticky bottom-0` chrome work (see ScreenThumb's load-bearing
          overflow-hidden), so it holds in the flow view as well as the device. */}
      {/* The status-bar strip belongs to the screen, not to the device frame:
          it is the only way a screen with coloured chrome (a brand band, a dark
          header) can reach the top of the display instead of stopping under a
          white bar it cannot paint. Default 'light' keeps it exactly as the
          frame used to draw it, so screens that don't ask are unchanged. */}
      <div className="sticky top-0 z-10 shrink-0">
        <div
          className={`${STATUS_BAR_H} ${statusBar === 'none' ? '' : 'bg-neutral-white'}`}
          aria-hidden
        />
        {topBar}
      </div>
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
    <header className={classes} {...props} data-fds="TopBar">
      {children}
    </header>
  )
}
