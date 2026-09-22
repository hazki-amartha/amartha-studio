'use client'

// Project-local form components (CLAUDE.md §4), copied (not imported — §1)
// from `projects/apartner-bm-majelis-view/lib/ui.tsx`'s SelectField/OptionSheet
// pattern — the mobile BM app's own way of doing a picker, since FunDS has no
// desktop-style `<select>` on a phone.

import type { ReactNode } from 'react'
import { BottomSheet, SelectableCard } from '@/design-system/components'
import { ChevronDown, ChevronRight } from '@/design-system/icons'

export function SectionTitle({ children }: { children: ReactNode }) {
  return <span className="text-16 font-bold text-default">{children}</span>
}

export function FieldLabel({
  children,
  required,
  optional,
}: {
  children: ReactNode
  required?: boolean
  optional?: boolean
}) {
  return (
    <span className="text-12 font-bold text-default">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
      {optional ? <span className="font-regular text-caption"> (optional)</span> : null}
    </span>
  )
}

export function HelperText({ children }: { children: ReactNode }) {
  return <span className="text-12 text-caption">{children}</span>
}

export function SelectField({
  label,
  required,
  optional,
  placeholder,
  value,
  onClick,
  disabled,
  /** The map-point picker reads as a drill-in (▸), not a picker (⌄). */
  chevron = 'down',
}: {
  label?: string
  required?: boolean
  optional?: boolean
  placeholder: string
  value?: string | null
  onClick: () => void
  disabled?: boolean
  chevron?: 'down' | 'right'
}) {
  return (
    <div className="flex flex-col gap-8">
      {label ? (
        <FieldLabel required={required} optional={optional}>
          {label}
        </FieldLabel>
      ) : null}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center justify-between gap-8 rounded-8 border px-12 py-8 text-left text-14 ${
          disabled
            ? 'border-default bg-neutral-50 text-disabled'
            : 'border-default bg-neutral-white text-default'
        }`}
      >
        <span className={`truncate ${value ? '' : 'text-placeholder'}`}>{value || placeholder}</span>
        <span className="shrink-0 text-disabled">
          {chevron === 'right' ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
    </div>
  )
}

export function OptionSheet<T>({
  open,
  title,
  name,
  options,
  value,
  onPick,
  onClose,
}: {
  open: boolean
  title: string
  name: string
  options: { label: string; value: T }[]
  value: T
  onPick: (v: T) => void
  onClose: () => void
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-8">
        {options.map((o) => (
          <SelectableCard
            key={o.label}
            name={name}
            title={o.label}
            checked={o.value === value}
            onChange={() => onPick(o.value)}
          />
        ))}
      </div>
    </BottomSheet>
  )
}
