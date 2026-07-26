// Project-local icons for the two glyphs FunDS Lite's shared set (§4) doesn't
// carry: an empty/crossed-out wallet, and a piggy bank. Everything else this
// project used has moved to `@/design-system/icons` — see NOTES.md.

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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function IconWalletOff(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <path d="M2 2l20 20" />
      <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
    </Svg>
  )
}

export function IconPiggy(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 11c0-3.87-3.13-7-7-7s-7 3.13-7 7c0 1.74.64 3.33 1.69 4.56L6 19h12l-.69-3.44A7 7 0 0 0 19 11z" />
      <path d="M9 19v2M15 19v2M9 11h.01M15 11h.01" />
      <path d="M19 9h2v4h-2" />
    </Svg>
  )
}
