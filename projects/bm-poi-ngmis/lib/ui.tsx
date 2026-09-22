'use client'

// Project-local desktop surfaces (CLAUDE.md §4) — FunDS has no `<select>` or
// back-office card; both are copied (not imported — §1) and trimmed from
// `projects/ngmis-bm-monitoring/lib/ui.tsx`'s `Panel`/`Select` pair.

import type { ReactNode } from 'react'
import { ChevronDown } from '@/design-system/icons'

const CONTROL_H = 40

export function PageHeading({ title }: { title: string }) {
  return <h1 className="text-24 font-bold text-default">{title}</h1>
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <span className="text-16 font-bold text-default">{children}</span>
}

export function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-16 border border-default bg-neutral-white p-24">{children}</div>
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

export function Select({
  label,
  required,
  optional,
  placeholder,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string
  required?: boolean
  optional?: boolean
  placeholder: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <label className="flex flex-col gap-8">
      <FieldLabel required={required} optional={optional}>
        {label}
      </FieldLabel>
      <div className="relative">
        <select
          aria-label={label}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none rounded-8 border border-default bg-neutral-white pl-12 pr-32 text-14 font-regular ${
            disabled ? 'text-placeholder' : 'text-default'
          }`}
          style={{ height: CONTROL_H }}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          className={`pointer-events-none absolute right-12 top-12 ${
            disabled ? 'text-placeholder' : 'text-caption'
          }`}
        >
          <ChevronDown size={16} />
        </span>
      </div>
    </label>
  )
}
