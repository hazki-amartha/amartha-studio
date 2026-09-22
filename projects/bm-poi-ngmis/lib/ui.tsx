'use client'

// Project-local desktop surfaces (CLAUDE.md §4) — FunDS has no `<select>` or
// back-office card; both are copied (not imported — §1) and trimmed from
// `projects/ngmis-bm-monitoring/lib/ui.tsx`'s `Panel`/`Select` pair.

import type { ReactNode } from 'react'
import { ChevronDown } from '@/design-system/icons'

const CONTROL_H = 40

export function SidebarPromo({
  icon,
  title,
  body,
  action,
  onAction,
}: {
  icon: ReactNode
  title: string
  body: string
  action: string
  onAction: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-8 rounded-12 bg-primary-50 p-12 text-center">
      <span className="flex size-32 items-center justify-center rounded-full bg-primary-500 text-neutral-white">
        {icon}
      </span>
      <span className="text-12 font-bold text-default">{title}</span>
      <span className="text-10 text-caption">{body}</span>
      <button
        type="button"
        onClick={onAction}
        className="w-full rounded-full border border-primary-500 px-8 py-4 text-10 font-bold text-link"
      >
        {action}
      </button>
    </div>
  )
}

export function PageHeading({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-16">
      <h1 className="text-24 font-bold text-default">{title}</h1>
      {actions}
    </div>
  )
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

export interface TableColumn {
  id: string
  header: string
}

export interface TableRow {
  id: string
  cells: Record<string, ReactNode>
}

export function SimpleTable({ columns, rows }: { columns: TableColumn[]; rows: TableRow[] }) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.id}
                className="border-b border-default bg-neutral-50 px-12 py-8 text-12 font-bold text-default"
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-default align-middle">
              {columns.map((c) => (
                <td key={c.id} className="px-12 py-12 text-14 text-default">
                  {row.cells[c.id]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-40 text-center">
      <span className="text-14 font-bold text-default">{title}</span>
      <span className="text-12 text-caption">{body}</span>
    </div>
  )
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
