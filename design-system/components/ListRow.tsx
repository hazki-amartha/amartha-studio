import type { HTMLAttributes, ReactNode } from 'react'

export type ListRowProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  title: ReactNode
  /** Secondary line under the title. */
  description?: ReactNode
  /** Leading slot — typically a 24px icon or a 32px avatar circle. */
  leading?: ReactNode
  /** Trailing slot — value text, Badge, Toggle, etc. */
  trailing?: ReactNode
  /** Shows a chevron after the trailing slot and renders as a button. */
  chevron?: boolean
  onClick?: () => void
}

export function ListRow({
  title,
  description,
  leading,
  trailing,
  chevron = false,
  onClick,
  className,
  ...props
}: ListRowProps) {
  const interactive = Boolean(onClick)
  const classes = [
    'ds-listrow',
    interactive && 'ds-listrow-interactive',
    className,
  ].filter(Boolean).join(' ')

  const content = (
    <>
      {leading && <span className="ds-listrow-leading">{leading}</span>}
      <span className="ds-listrow-body">
        <span className="ds-listrow-title">{title}</span>
        {description && <span className="ds-listrow-desc">{description}</span>}
      </span>
      {trailing && <span className="ds-listrow-trailing">{trailing}</span>}
      {chevron && (
        <svg className="ds-listrow-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </>
  )

  if (interactive) {
    return (
      <button type="button" className={classes} onClick={onClick} {...props}>
        {content}
      </button>
    )
  }
  return (
    <div className={classes} {...props}>
      {content}
    </div>
  )
}
