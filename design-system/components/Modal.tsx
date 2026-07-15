'use client'

import { useEffect, type HTMLAttributes, type ReactNode } from 'react'

export type ModalSize = 'sm' | 'md' | 'lg'
export type ModalVariant = 'default' | 'dialog'
export type ModalIntent = 'success' | 'warning' | 'error' | 'info'

export type ModalProps = Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'slot'> & {
  open: boolean
  onClose?: () => void
  size?: ModalSize
  variant?: ModalVariant
  intent?: ModalIntent
  title?: ReactNode
  description?: ReactNode
  slot?: ReactNode
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  hideClose?: boolean
}

const sizeClass: Record<ModalSize, string> = {
  sm: 'ds-modal-sm',
  md: '',
  lg: 'ds-modal-lg',
}

const intentIcon: Record<ModalIntent, ReactNode> = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" /><path d="M8 12.5l3 3 5-6" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l10 18H2L12 3z" /><path d="M12 10v5" /><circle cx="12" cy="18" r="0.5" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" /><path d="M8 8l8 8M16 8l-8 8" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" /><path d="M12 8v.5M11 12h1v5h1" />
    </svg>
  ),
}

export function Modal({
  open,
  onClose,
  size = 'md',
  variant = 'default',
  intent,
  title,
  description,
  slot,
  primaryAction,
  secondaryAction,
  hideClose,
  className,
  children,
  ...props
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const dialogClasses = [
    'ds-modal',
    sizeClass[size],
    variant === 'dialog' ? 'ds-modal-dialog' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className="ds-modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className={dialogClasses} onClick={(e) => e.stopPropagation()} {...props}>
        <div className="ds-modal-head">
          {intent ? <span className={`ds-modal-icon ds-modal-icon-${intent}`}>{intentIcon[intent]}</span> : null}
          {title ? <h3 className="ds-modal-title">{title}</h3> : null}
          {!hideClose ? (
            <button type="button" className="ds-modal-close" aria-label="Close" onClick={onClose}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          ) : null}
        </div>
        {slot ? <div className="ds-modal-slot">{slot}</div> : null}
        {description ? <p className="ds-modal-desc">{description}</p> : null}
        {children}
        {(primaryAction || secondaryAction) ? (
          <div className="ds-modal-actions">
            {secondaryAction}
            {primaryAction}
          </div>
        ) : null}
      </div>
    </div>
  )
}
