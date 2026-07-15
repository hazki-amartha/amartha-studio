import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

export type SelectableCardSize = 'sm' | 'md'

export type SelectableCardProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'prefix' | 'title' | 'slot'> & {
  size?: SelectableCardSize
  title?: ReactNode
  description?: ReactNode
  prefixIcon?: ReactNode
  secondary?: ReactNode
  slot?: ReactNode
  ribbon?: ReactNode
  inputType?: 'radio' | 'checkbox'
}

const sizeClass: Record<SelectableCardSize, string> = {
  sm: '',
  md: 'ds-selcard-md',
}

export function SelectableCard({
  size = 'sm',
  title,
  description,
  prefixIcon,
  secondary,
  slot,
  ribbon,
  inputType = 'radio',
  id,
  name,
  className,
  disabled,
  checked,
  defaultChecked,
  children,
  ...props
}: SelectableCardProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const classes = [
    'ds-selcard',
    sizeClass[size],
    disabled ? 'ds-selcard-disabled' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <label htmlFor={inputId} className={classes}>
      {ribbon ? <span className="ds-selcard-ribbon">{ribbon}</span> : null}
      <input
        {...props}
        id={inputId}
        name={name}
        type={inputType}
        className="ds-selcard-input"
        disabled={disabled}
        checked={checked}
        defaultChecked={defaultChecked}
      />
      {prefixIcon ? <span className="ds-selcard-prefix" aria-hidden>{prefixIcon}</span> : null}
      <span className="ds-selcard-body">
        {secondary ? (
          <span className="ds-selcard-row">
            <span className="ds-selcard-title">{title}</span>
            <span className="ds-selcard-secondary">{secondary}</span>
          </span>
        ) : (
          <>
            {title ? <span className="ds-selcard-title">{title}</span> : null}
            {description ? <span className="ds-selcard-desc">{description}</span> : null}
          </>
        )}
        {slot ? <span className="ds-selcard-slot">{slot}</span> : null}
        {children}
      </span>
      <span className="ds-selcard-indicator" aria-hidden>
        <span className="ds-selcard-indicator-dot" />
      </span>
    </label>
  )
}
