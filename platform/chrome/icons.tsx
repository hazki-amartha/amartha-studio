// =============================================================================
// Chrome icons — inline SVG, currentColor, token-sized via className.
// Hand-drawn so the shell needs no icon-library dependency. Not part of FunDS;
// these dress the tool's own chrome, not prototype screens.
// =============================================================================

import type { ReactNode } from 'react'

type IconProps = { className?: string }

function icon(path: ReactNode) {
  return function Icon({ className }: IconProps) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {path}
      </svg>
    )
  }
}

// Studio — stacked layout tiles (the gallery of prototypes).
export const StudioIcon = icon(
  <>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </>,
)

// FunDS — layered swatches (the design system).
export const FundsIcon = icon(
  <>
    <path d="M12 3l9 5-9 5-9-5 9-5z" />
    <path d="M3 13l9 5 9-5" />
  </>,
)

// Panel toggle — collapse/expand the secondary sidebar.
export const PanelIcon = icon(
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </>,
)

// Breadcrumb separator.
export const ChevronRightIcon = icon(<path d="M9 6l6 6-6 6" />)
export const ChevronLeftIcon = icon(<path d="M15 6l-6 6 6 6" />)

// Mobile top nav — hamburger and its close state.
export const MenuIcon = icon(
  <>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </>,
)
export const CloseIcon = icon(
  <>
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  </>,
)

// Prototype view — a phone.
export const DeviceIcon = icon(
  <>
    <rect x="6" y="2" width="12" height="20" rx="2" />
    <path d="M11 18h2" />
  </>,
)

// Full screen — four arrows pushing out to the corners of the window.
export const ExpandIcon = icon(
  <>
    <path d="M9 3H3v6" />
    <path d="M15 3h6v6" />
    <path d="M9 21H3v-6" />
    <path d="M15 21h6v-6" />
  </>,
)

// Theme toggle — moon (in dark, offering light) and sun (in light, offering dark).
export const MoonIcon = icon(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />)
export const SunIcon = icon(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </>,
)

// Studio brand mark — the interlocking staircase glyph. Filled (not stroked),
// so it doesn't go through `icon()`; inherits colour from its container.
export function StudioMark({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 34 34"
      width="34"
      height="34"
      fill="currentColor"
      aria-hidden
    >
      <path d="M15 25C15 25.5667 15.1917 26.0417 15.575 26.425C15.9583 26.8083 16.4333 27 17 27H21C21.5833 27 22.0583 26.8083 22.425 26.425C22.8083 26.0417 23 25.5667 23 25V21C23 20.4167 22.8083 19.9417 22.425 19.575C22.0583 19.1917 21.5833 19 21 19H12.9C11.6333 19 11 18.3667 11 17.1V17C11 16.4167 10.8083 15.9417 10.425 15.575C10.0583 15.1917 9.58333 15 9 15H8.9C7.63333 15 7 14.3667 7 13.1V8.9C7 7.63333 7.63333 7 8.9 7H9C9.58333 7 10.0583 6.80833 10.425 6.425C10.8083 6.04167 11 5.56667 11 5V4.9C11 3.63333 11.6333 3 12.9 3H17.1C18.3667 3 19 3.63333 19 4.9V5C19 5.56667 19.1917 6.04167 19.575 6.425C19.9583 6.80833 20.4333 7 21 7C21.5833 7 22.0583 6.80833 22.425 6.425C22.8083 6.04167 23 5.56667 23 5V4.9C23 3.63333 23.6333 3 24.9 3H25.1C26.3667 3 27 3.63333 27 4.9V9C27 9.6 26.8167 10.0833 26.45 10.45C26.0833 10.8167 25.6 11 25 11H20.9C19.6333 11 19 10.3667 19 9.1V9C19 8.41667 18.8083 7.94167 18.425 7.575C18.0583 7.19167 17.5833 7 17 7H13C12.4333 7 11.9583 7.19167 11.575 7.575C11.1917 7.94167 11 8.41667 11 9V13C11 13.5667 11.1917 14.0417 11.575 14.425C11.9583 14.8083 12.4333 15 13 15H21.1C22.3667 15 23 15.6333 23 16.9V17C23 17.5667 23.1917 18.0417 23.575 18.425C23.9583 18.8083 24.4333 19 25 19H25.1C26.3667 19 27 19.6333 27 20.9V25.1C27 26.3667 26.3667 27 25.1 27H25C24.4333 27 23.9583 27.1917 23.575 27.575C23.1917 27.9417 23 28.4167 23 29V29.1C23 30.3667 22.3667 31 21.1 31H16.9C15.6333 31 15 30.3667 15 29.1V29C15 28.4167 14.8083 27.9417 14.425 27.575C14.0583 27.1917 13.5833 27 13 27C12.4333 27 11.9583 27.1917 11.575 27.575C11.1917 27.9417 11 28.4167 11 29V29.1C11 30.3667 10.3667 31 9.1 31H8.9C7.63333 31 7 30.3667 7 29.1V25C7 24.4 7.18333 23.9167 7.55 23.55C7.91667 23.1833 8.4 23 9 23H13.1C14.3667 23 15 23.6333 15 24.9V25Z" />
    </svg>
  )
}

// Flow view — connected nodes.
export const FlowIcon = icon(
  <>
    <rect x="3" y="3" width="7" height="6" rx="1.5" />
    <rect x="14" y="15" width="7" height="6" rx="1.5" />
    <rect x="3" y="15" width="7" height="6" rx="1.5" />
    <path d="M6.5 9v6" />
    <path d="M10 18h4" />
  </>,
)

// Inspect — a marquee with a cursor in it: pick an element, read its spec.
export const InspectIcon = icon(
  <>
    <path d="M3 8V5.5A2.5 2.5 0 0 1 5.5 3H8" />
    <path d="M16 3h2.5A2.5 2.5 0 0 1 21 5.5V8" />
    <path d="M3 16v2.5A2.5 2.5 0 0 0 5.5 21H8" />
    <path d="M11 11l7 2.6-3 1.2-1.2 3z" />
  </>,
)
