'use client'

import { useEffect, type HTMLAttributes, type ReactNode } from 'react'
import { ArrowLeft } from '../icons'

export type BottomSheetSize = 'sm' | 'md' | 'fullscreen'

export type BottomSheetProps = Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'slot'> & {
  open: boolean
  onClose?: () => void
  size?: BottomSheetSize
  title?: ReactNode
  description?: ReactNode
  slot?: ReactNode
  slotPosition?: 'above' | 'below'
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  hideClose?: boolean
  /**
   * A sheet that is step 2+ of a flow inside one sheet. When set, the head's
   * close glyph becomes a back arrow and taps call this instead of `onClose` —
   * the sheet's own history, so a multi-step sheet doesn't have to be closed
   * and reopened to correct the answer given a step earlier.
   */
  onBack?: () => void
}

const sizeClass: Record<BottomSheetSize, string> = {
  sm: '',
  md: 'ds-sheet-md',
  fullscreen: 'ds-sheet-fullscreen',
}

export function BottomSheet({
  open,
  onClose,
  size = 'sm',
  title,
  description,
  slot,
  slotPosition = 'above',
  primaryAction,
  secondaryAction,
  hideClose,
  onBack,
  className,
  children,
  ...props
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const sheetClasses = [
    'ds-sheet',
    sizeClass[size],
    className,
  ].filter(Boolean).join(' ')

  const renderSlot = slot ? <div className="ds-sheet-slot">{slot}</div> : null
  const renderTextBlock = (
    <div className="ds-sheet-text">
      {title ? <h3 className="ds-sheet-title">{title}</h3> : null}
      {description ? <p className="ds-sheet-desc">{description}</p> : null}
    </div>
  )

  return (
    <div className="ds-sheet-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className={sheetClasses}
        onClick={(e) => e.stopPropagation()}
        {...props}
        data-fds="BottomSheet"
        data-fds-size={size}
      >
        <div className="ds-sheet-head">
          {!hideClose ? (
            <button
              type="button"
              className="ds-sheet-close"
              aria-label={onBack ? 'Back' : 'Close'}
              onClick={onBack ?? onClose}
            >
              {onBack ? (
                <ArrowLeft size={20} />
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              )}
            </button>
          ) : null}
          {size === 'fullscreen' && title ? <h3 className="ds-sheet-title ds-sheet-title-inline">{title}</h3> : null}
        </div>
        <div className="ds-sheet-body">
          {size !== 'fullscreen' ? (
            <>
              {slotPosition === 'above' ? renderSlot : null}
              {(title || description) ? renderTextBlock : null}
              {slotPosition === 'below' ? renderSlot : null}
            </>
          ) : null}
          {children}
        </div>
        {(primaryAction || secondaryAction) ? (
          <div className="ds-sheet-actions">
            {secondaryAction}
            {primaryAction}
          </div>
        ) : null}
      </div>
    </div>
  )
}
