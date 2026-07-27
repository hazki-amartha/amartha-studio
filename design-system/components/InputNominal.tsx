'use client'

// The large amount field — one number, made the biggest thing on the screen.
//
// It is not a size of `Input`. `Input` is a labelled row: label above, control
// below, one line of text inside. This is a TILE — the label lives inside the
// border, the figure is set at 24px/700, and the helper hangs under it — because
// the screens that use it (a payment sheet, a top-up) are asking for exactly one
// value and everything else on them is confirmation.
//
// The currency sits outside the input, not as a `prefix` affix: an affix is a
// grey box with its own border, which would put a seam between "Rp" and the
// number they are read as one word with.
//
// Trailing control tells the two modes apart. Idle, it is a pencil — the field
// is showing a value and the pencil says it can be changed. Focused with digits
// in it, it is a clear — the thing a thumb wants while typing.

import { useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { CrossCircleFill, NotePencil } from '../icons'

export type InputNominalState = 'default' | 'error'

export type InputNominalProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'size' | 'prefix' | 'type'
> & {
  /** Sits inside the border, above the figure. */
  label?: ReactNode
  /** Raw digits — no separators. */
  value: string
  /** Called with raw digits; non-digits are stripped for you. */
  onValueChange: (digits: string) => void
  /** Printed before the figure, unseparated from it. */
  currency?: string
  state?: InputNominalState
  /** Under the figure. Red when `state="error"`. */
  helperText?: ReactNode
  disabled?: boolean
}

/** 1250000 → "1.250.000". The separator the figure is always read with here. */
function group(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function InputNominal({
  label,
  value,
  onValueChange,
  currency = 'Rp',
  state = 'default',
  helperText,
  disabled,
  className,
  placeholder = '0',
  ...props
}: InputNominalProps) {
  const ref = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)

  const classes = [
    'ds-nominal',
    state === 'error' ? 'ds-nominal-error' : focused ? 'ds-nominal-focus' : '',
    disabled ? 'ds-nominal-disabled' : '',
    className,
  ].filter(Boolean).join(' ')

  const showClear = !disabled && focused && value !== ''
  const showPencil = !disabled && !focused

  return (
    <label className={classes} data-fds="InputNominal" data-fds-state={state}>
      {label ? <span className="ds-nominal-label">{label}</span> : null}
      <span className="ds-nominal-row">
        <span className="ds-nominal-currency">{currency}</span>
        <input
          {...props}
          ref={ref}
          className="ds-nominal-input"
          inputMode="numeric"
          disabled={disabled}
          aria-invalid={state === 'error' ? true : props['aria-invalid']}
          placeholder={placeholder}
          value={group(value)}
          onFocus={(e) => {
            setFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            props.onBlur?.(e)
          }}
          onChange={(e) => onValueChange(e.target.value.replace(/\D/g, ''))}
        />
        {showClear ? (
          <button
            type="button"
            className="ds-nominal-action ds-nominal-clear"
            aria-label="Hapus"
            // The blur that a mousedown fires would close the clear before the
            // click lands on it.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onValueChange('')
              ref.current?.focus()
            }}
          >
            <CrossCircleFill size={20} />
          </button>
        ) : showPencil ? (
          <button
            type="button"
            className="ds-nominal-action"
            aria-label="Ubah nominal"
            onClick={() => ref.current?.focus()}
          >
            <NotePencil size={20} />
          </button>
        ) : null}
      </span>
      {helperText ? (
        <span className={`ds-nominal-helper${state === 'error' ? ' ds-nominal-helper-error' : ''}`}>
          {helperText}
        </span>
      ) : null}
    </label>
  )
}
