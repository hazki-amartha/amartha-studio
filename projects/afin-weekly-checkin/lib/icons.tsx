// Two glyphs the 166-icon FunDS set genuinely doesn't carry, both load-bearing
// in the Home A comp: the celengan mark in the header and the gift on the bonus
// tile. Drawn in the shared set's own idiom — 24px box, currentColor stroke at
// weight 2 — so they sit beside a real icon without looking foreign.
//
// The brand asset public/funds/logos/celengan.svg is a green piggy and cannot
// be recoloured (it is an <img>), so it can't serve as a white-on-purple mark.

import type { SVGProps } from 'react'

type Props = Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> & { size?: 16 | 20 | 24 | 32 }

function box({ size = 24, children, ...props }: Props & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

/** Celengan — the piggy bank. */
export function IconPiggy(props: Props) {
  return box({
    ...props,
    children: (
      <>
        <path
          d="M14 6.5c3.6 0 6.5 2.7 6.5 6 0 1.9-1 3.6-2.5 4.7V20h-3v-1.6c-.6.1-1.3.2-2 .2s-1.4-.1-2-.2V20h-3v-2.8c-1-.7-1.7-1.6-2.1-2.7H4c-.6 0-1-.4-1-1v-2c0-.6.4-1 1-1h1.9c.7-1.9 2.3-3.4 4.3-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.2 6.5 8.6 3.4c-.2-.4.1-.9.6-.8l3.6.9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="16.5" cy="11" r="1.1" fill="currentColor" />
      </>
    ),
  })
}

/** The bonus gift box. */
export function IconGift(props: Props) {
  return box({
    ...props,
    children: (
      <>
        <path
          d="M4 11.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="2.75"
          y="7.5"
          width="18.5"
          height="4"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M12 7.5V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M12 7.5H8.5a2.25 2.25 0 1 1 0-4.5C10.5 3 12 5.5 12 7.5Zm0 0H15.5a2.25 2.25 0 1 0 0-4.5C13.5 3 12 5.5 12 7.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </>
    ),
  })
}
