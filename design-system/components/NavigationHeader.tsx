import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

export type NavigationHeaderVariant = 'light' | 'dark'

export type NavigationHeaderProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  title?: ReactNode
  variant?: NavigationHeaderVariant
  onBack?: () => void
  hideBack?: boolean
  trailingIcons?: ReactNode[]
  link?: ReactNode
  onLinkClick?: () => void
  showStatusBar?: boolean
}

export function NavigationHeader({
  title,
  variant = 'light',
  onBack,
  hideBack,
  trailingIcons,
  link,
  onLinkClick,
  showStatusBar,
  className,
  ...props
}: NavigationHeaderProps) {
  const classes = [
    'ds-navhdr',
    variant === 'dark' ? 'ds-navhdr-dark' : '',
    className,
  ].filter(Boolean).join(' ')

  const limitedIcons = (trailingIcons ?? []).slice(0, 2)

  const backProps: ButtonHTMLAttributes<HTMLButtonElement> = {
    type: 'button',
    onClick: onBack,
    'aria-label': 'Back',
  }
  const linkProps: ButtonHTMLAttributes<HTMLButtonElement> = {
    type: 'button',
    onClick: onLinkClick,
  }

  return (
    <header className={classes} {...props}>
      {showStatusBar ? (
        <div className="ds-navhdr-statusbar" aria-hidden>
          <span className="ds-navhdr-clock">9:41</span>
          <span className="ds-navhdr-status-icons">
            <svg viewBox="0 0 16 12" width="16" height="12" fill="currentColor" aria-hidden><rect x="1" y="9" width="2" height="2" /><rect x="5" y="6" width="2" height="5" /><rect x="9" y="3" width="2" height="8" /><rect x="13" y="0" width="2" height="11" /></svg>
            <svg viewBox="0 0 16 12" width="16" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M1 5a10 10 0 0114 0M3.5 7.5a6 6 0 019 0M6 10a2 2 0 014 0" /></svg>
            <svg viewBox="0 0 24 12" width="24" height="12" aria-hidden><rect x="0.5" y="0.5" width="20" height="11" rx="2" fill="none" stroke="currentColor" /><rect x="2" y="2" width="17" height="8" rx="1" fill="currentColor" /><rect x="21" y="4" width="2" height="4" rx="0.5" fill="currentColor" /></svg>
          </span>
        </div>
      ) : null}
      <div className="ds-navhdr-row">
        {!hideBack ? (
          <button className="ds-navhdr-back" {...backProps}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        ) : null}
        <span className="ds-navhdr-title">{title}</span>
        <span className="ds-navhdr-trailing">
          {limitedIcons.map((ic, i) => (
            <span key={i} className="ds-navhdr-trailing-icon" aria-hidden>{ic}</span>
          ))}
          {link ? <button className="ds-navhdr-link" {...linkProps}>{link}</button> : null}
        </span>
      </div>
    </header>
  )
}
