import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

export type ToggleSize = 'sm' | 'md'

export type ToggleProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> & {
  size?: ToggleSize
  label?: ReactNode
  helperText?: ReactNode
}

const sizeClass: Record<ToggleSize, string> = {
  sm: '',
  md: 'ds-toggle-md',
}

export function Toggle({
  size = 'sm',
  label,
  helperText,
  id,
  className,
  disabled,
  checked,
  defaultChecked,
  ...props
}: ToggleProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const switchClasses = ['ds-toggle', sizeClass[size], className].filter(Boolean).join(' ')

  const control = (
    <span className={switchClasses}>
      <input
        {...props}
        id={inputId}
        type="checkbox"
        className="ds-toggle-input"
        disabled={disabled}
        checked={checked}
        defaultChecked={defaultChecked}
      />
      <span className="ds-toggle-track" aria-hidden>
        <span className="ds-toggle-thumb">
          <svg className="ds-toggle-check" viewBox="0 0 12 12" aria-hidden>
            <path d="M2.5 6.2l2.4 2.3 4.6-4.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
    </span>
  )

  if (!label && !helperText) return control

  return (
    <label htmlFor={inputId} className={`ds-toggle-field${disabled ? ' ds-toggle-field-disabled' : ''}`}>
      {control}
      {(label || helperText) ? (
        <span className="ds-toggle-text">
          {label ? <span className="ds-toggle-label">{label}</span> : null}
          {helperText ? <span className="ds-toggle-helper">{helperText}</span> : null}
        </span>
      ) : null}
    </label>
  )
}
