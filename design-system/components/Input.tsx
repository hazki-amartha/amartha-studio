import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export type InputSize = 'sm' | 'md' | 'lg'
export type InputState = 'default' | 'focus' | 'valid' | 'error'

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  size?: InputSize
  state?: InputState
  label?: ReactNode
  optionalText?: ReactNode
  required?: boolean
  description?: ReactNode
  helperText?: ReactNode
  prefix?: ReactNode
  suffix?: ReactNode
  prefixInteractive?: boolean
  suffixInteractive?: boolean
  prefixButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>
  suffixButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>
}

const sizeClass: Record<InputSize, string> = {
  sm: 'ds-inp-sm',
  md: '',
  lg: 'ds-inp-lg',
}

const stateClass: Record<InputState, string> = {
  default: '',
  focus: 'ds-inp-focus',
  valid: 'ds-inp-valid',
  error: 'ds-inp-error',
}

function renderAffix(
  content: ReactNode,
  position: 'prefix' | 'suffix',
  interactive?: boolean,
  buttonProps?: ButtonHTMLAttributes<HTMLButtonElement>,
) {
  const className = `ds-inp-${position}${interactive ? ' ds-inp-affix-btn' : ''}`

  if (interactive) {
    return (
      <button className={className} type="button" {...buttonProps}>
        {content}
      </button>
    )
  }

  return <span className={className}>{content}</span>
}

export function Input({
  size = 'md',
  state = 'default',
  label,
  optionalText,
  required,
  description,
  helperText,
  prefix,
  suffix,
  prefixInteractive,
  suffixInteractive,
  prefixButtonProps,
  suffixButtonProps,
  className,
  disabled,
  ...props
}: InputProps) {
  const inputClasses = [
    'ds-inp',
    sizeClass[size],
    stateClass[state],
    disabled ? 'ds-inp-disabled' : '',
    suffix ? 'ds-inp-pre-suffix' : '',
    className,
  ].filter(Boolean).join(' ')

  const input = (
    <input
      {...props}
      aria-invalid={state === 'error' ? true : props['aria-invalid']}
      className={inputClasses}
      disabled={disabled}
    />
  )

  const control = prefix || suffix
    ? (
      <div className="ds-inp-wrap">
        {prefix ? renderAffix(prefix, 'prefix', prefixInteractive, prefixButtonProps) : null}
        {input}
        {suffix ? renderAffix(suffix, 'suffix', suffixInteractive, suffixButtonProps) : null}
      </div>
    )
    : input

  const hasFieldChrome = label || optionalText || description || helperText
  if (!hasFieldChrome) return control

  return (
    <label className="ds-field">
      {label || optionalText ? (
        <div className="ds-field-head">
          {label ? (
            <span className="ds-field-label">
              {label}{required ? <span className="ds-field-required"> *</span> : null}
            </span>
          ) : null}
          {optionalText ? <span className="ds-field-meta">{optionalText}</span> : null}
        </div>
      ) : null}
      {description ? <span className="ds-field-desc">{description}</span> : null}
      {control}
      {helperText ? (
        <span className={`ds-field-helper${state === 'error' ? ' ds-field-helper-error' : ''}`}>
          {helperText}
        </span>
      ) : null}
    </label>
  )
}
