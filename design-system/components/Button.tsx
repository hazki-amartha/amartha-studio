import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

const sizeClass: Record<ButtonSize, string> = {
  xs: 'ds-btn-xs',
  sm: 'ds-btn-sm',
  md: '',
  lg: 'ds-btn-lg',
  xl: 'ds-btn-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  const classes = [
    'ds-btn',
    `ds-btn-${variant}`,
    sizeClass[size],
    className,
  ].filter(Boolean).join(' ')

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  )
}
