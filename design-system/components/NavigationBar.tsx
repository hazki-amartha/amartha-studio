import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

export type NavBarItem = {
  id: string
  label: ReactNode
  icon: ReactNode
  badge?: ReactNode
  active?: boolean
  onClick?: () => void
  feature?: boolean
}

export type NavigationBarProps = HTMLAttributes<HTMLElement> & {
  items: NavBarItem[]
}

export function NavigationBar({ items, className, ...props }: NavigationBarProps) {
  const classes = ['ds-navbar', className].filter(Boolean).join(' ')
  return (
    <nav className={classes} {...props}>
      {items.map((it) => (
        <NavigationBarTab key={it.id} item={it} />
      ))}
    </nav>
  )
}

function NavigationBarTab({ item }: { item: NavBarItem }) {
  const cls = [
    'ds-navbar-tab',
    item.active ? 'ds-navbar-tab-active' : '',
    item.feature ? 'ds-navbar-tab-feature' : '',
  ].filter(Boolean).join(' ')

  const buttonProps: ButtonHTMLAttributes<HTMLButtonElement> = {
    type: 'button',
    onClick: item.onClick,
    'aria-current': item.active ? 'page' : undefined,
  }

  return (
    <button className={cls} {...buttonProps}>
      <span className="ds-navbar-icon-wrap">
        <span className="ds-navbar-icon" aria-hidden>{item.icon}</span>
        {item.badge != null ? <span className="ds-navbar-badge">{item.badge}</span> : null}
      </span>
      <span className="ds-navbar-label">{item.label}</span>
    </button>
  )
}
