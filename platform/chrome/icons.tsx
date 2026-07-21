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

// Theme toggle — moon (in dark, offering light) and sun (in light, offering dark).
export const MoonIcon = icon(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />)
export const SunIcon = icon(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </>,
)

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
