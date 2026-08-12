import type { HTMLAttributes, ReactNode } from 'react'

/**
 * Corner radius, in the radius tokens a card is ever drawn with. 16 is the
 * system's card radius and stays the default — this exists because the shipped
 * product does use other corners for card-shaped surfaces (tighter rows, softer
 * sheets), and a prototype that needs one should say so on the component rather
 * than hand-roll a div that only looks like a Card.
 */
export type CardRadius = '8' | '12' | '16' | '20' | '24'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Removes the internal padding for edge-to-edge content (e.g. ListRow groups). */
  flush?: boolean
  /** Corner radius token. Defaults to the system's 16. */
  radius?: CardRadius
  children: ReactNode
}

/** 16 is `.ds-card`'s own radius, so it needs no modifier. */
const radiusClass: Record<CardRadius, string> = {
  '8': 'ds-card-r8',
  '12': 'ds-card-r12',
  '16': '',
  '20': 'ds-card-r20',
  '24': 'ds-card-r24',
}

export function Card({ flush = false, radius = '16', className, children, ...props }: CardProps) {
  const classes = [
    'ds-card',
    flush && 'ds-card-flush',
    radiusClass[radius],
    className,
  ].filter(Boolean).join(' ')

  return (
    <div
      className={classes}
      {...props}
      data-fds="Card"
      data-fds-flush={flush || undefined}
      data-fds-radius={radius}
    >
      {children}
    </div>
  )
}
