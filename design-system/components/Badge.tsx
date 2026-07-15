import type { HTMLAttributes, ReactNode } from 'react'

export type BadgeIntent = 'primary' | 'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'neutral'
export type BadgeVariant = 'solid' | 'subtle' | 'outline' | 'inverted'
export type BadgeSize = 'sm' | 'md'

export type BadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, 'prefix'> & {
  intent?: BadgeIntent
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  children: ReactNode
}

const sizeClass: Record<BadgeSize, string> = {
  sm: '',
  md: 'ds-badge-md',
}

const variantClass: Record<BadgeVariant, string> = {
  solid: 'ds-badge-solid',
  subtle: '',
  outline: 'ds-badge-outline',
  inverted: 'ds-badge-inverted',
}

export function Badge({
  intent = 'primary',
  variant = 'subtle',
  size = 'sm',
  dot,
  leadingIcon,
  trailingIcon,
  className,
  children,
  ...props
}: BadgeProps) {
  const classes = [
    'ds-badge',
    `ds-badge-${intent}`,
    variantClass[variant],
    sizeClass[size],
    className,
  ].filter(Boolean).join(' ')

  return (
    <span className={classes} {...props}>
      {dot ? <span className="ds-badge-dot" aria-hidden /> : null}
      {leadingIcon ? <span className="ds-badge-icon" aria-hidden>{leadingIcon}</span> : null}
      {children}
      {trailingIcon ? <span className="ds-badge-icon" aria-hidden>{trailingIcon}</span> : null}
    </span>
  )
}
