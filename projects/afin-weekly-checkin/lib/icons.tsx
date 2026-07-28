// The one glyph the 166-icon FunDS set genuinely doesn't carry: the gift on the
// bonus tile. Drawn in the shared set's own idiom — 24px box, currentColor
// stroke at weight 2 — so it sits beside a real icon without looking foreign.
//
// The header mark is NOT here: LogoModal is already in the shared set and takes
// currentColor, so it goes white on the purple tile. The brand asset
// public/funds/logos/modal.svg is blue and served as an <img>, so it cannot be
// recoloured for that use.

import type { SVGProps } from 'react'

type Props = Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> & { size?: 16 | 20 | 24 | 32 }

function box({ size = 24, children, ...props }: Props & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
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
