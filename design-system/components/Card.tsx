import type { HTMLAttributes, ReactNode } from 'react'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Removes the internal padding for edge-to-edge content (e.g. ListRow groups). */
  flush?: boolean
  children: ReactNode
}

export function Card({ flush = false, className, children, ...props }: CardProps) {
  const classes = [
    'ds-card',
    flush && 'ds-card-flush',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}
