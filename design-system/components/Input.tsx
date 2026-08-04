import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export type InputSize = 'sm' | 'md' | 'lg'
export type InputState = 'default' | 'focus' | 'valid' | 'error'

// `prefix` is omitted alongside `size` because HTMLAttributes already declares
// one (the deprecated string attribute). Left in, the intersection narrows our
// ReactNode prefix to `string & ReactNode`, so passing the icon the component
// was built to accept is a type error — it happened to go unnoticed because the
// only caller so far passes "Rp".
export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> & {
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

  // Input renders one of three shapes. The inspect stamp goes on whichever ends
  // up outermost, so a field is exactly one boundary rather than nested ones.
  const hasAffix = Boolean(prefix || suffix)
  const hasFieldChrome = Boolean(label || optionalText || description || helperText)
  const fds: Record<string, string | undefined> = {
    'data-fds': 'Input',
    'data-fds-size': size,
    'data-fds-state': state,
  }
  const unstamped: Record<string, string | undefined> = {}

  const input = (
    <input
      {...props}
      aria-invalid={state === 'error' ? true : props['aria-invalid']}
      className={inputClasses}
      disabled={disabled}
      {...(!hasAffix && !hasFieldChrome ? fds : unstamped)}
    />
  )

  const control = hasAffix
    ? (
      <div className="ds-inp-wrap" {...(!hasFieldChrome ? fds : unstamped)}>
        {prefix ? renderAffix(prefix, 'prefix', prefixInteractive, prefixButtonProps) : null}
        {input}
        {suffix ? renderAffix(suffix, 'suffix', suffixInteractive, suffixButtonProps) : null}
      </div>
    )
    : input

  if (!hasFieldChrome) return control

  return (
    <label className="ds-field" {...fds}>
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
