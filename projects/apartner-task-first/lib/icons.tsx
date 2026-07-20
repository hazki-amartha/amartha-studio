// Project-local icons. FunDS Lite ships no icon library — design-system
// components take icons as ReactNode slots — so this is the minimum set the two
// screens need. Sizes are clamped to the 16/20/24 grid and colour comes from
// currentColor, so an icon inherits the token text colour of its container.

import type { ReactNode } from 'react'

export type IconSize = 16 | 20 | 24

interface IconProps {
  size?: IconSize
  className?: string
}

function Svg({ size = 24, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/** Majelis visit — a group. */
export function IconUsers(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 19v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  )
}

/** Home visit — a door. */
export function IconHome(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M9 21v-7h6v7" />
    </Svg>
  )
}

export function IconPin(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 10c0 5-8 12-8 12s-8-7-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </Svg>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Svg>
  )
}

/** Attendance — tidak hadir. */
export function IconX(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Svg>
  )
}

export function IconChevronDown(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  )
}

export function IconChevronUp(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m18 15-6-6-6 6" />
    </Svg>
  )
}

/** Trailing affordance on a tappable schedule row. */
export function IconChevronRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9 18 6-6-6-6" />
    </Svg>
  )
}

/** Step 3 — photo proof of the majelis. */
export function IconCamera(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.5" />
    </Svg>
  )
}

/** Header affordance — opens the majelis status page. */
export function IconInfo(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </Svg>
  )
}

/** The KPI tab. */
export function IconChart(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 21h18" />
      <path d="M7 21v-8M12 21V6M17 21v-5" />
    </Svg>
  )
}

/** Reaching a mitra between visits. */
export function IconChat(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.7-.8L3 21l1.9-5.3A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" />
    </Svg>
  )
}

/** Scheduling a follow-up. */
export function IconCalendar(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Svg>
  )
}

/** The money sections — tagihan & pinjaman. */
export function IconWallet(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1" />
      <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2z" />
      <circle cx="16.5" cy="14" r="1.2" />
    </Svg>
  )
}

/** Trailing affordance on the offer rows. */
export function IconGift(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </Svg>
  )
}
