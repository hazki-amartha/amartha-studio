'use client'

// Project-local desktop surfaces — Panel, Select and a plain table — copied
// (not imported, §1) from `projects/ngmis-bm-monitoring/lib/ui.tsx` and
// trimmed to what a POI list + form actually needs.

import type { ReactNode } from 'react'
import { ChevronDown } from '@/design-system/icons'

const CONTROL_H = 32

export function Panel({
  children,
  className = 'p-16',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-12 border border-default bg-neutral-white ${className}`}>
      {children}
    </div>
  )
}

export function PanelHeading({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-16 pb-12">
      <div className="flex flex-col gap-2">
        <span className="text-16 font-bold text-default">{title}</span>
        {subtitle ? <span className="text-12 text-caption">{subtitle}</span> : null}
      </div>
      {action}
    </div>
  )
}

export function Select({
  value,
  options,
  onChange,
  label,
  disabled,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  label: string
  /** A cascading field — e.g. Desa — that has nothing to choose from until its
   *  parent is picked. Greyed rather than hidden, so the field grid keeps its
   *  shape as the form fills in. */
  disabled?: boolean
}) {
  return (
    <label className="flex flex-col gap-4">
      <span className="text-12 font-bold text-default">{label}</span>
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
            Pilih {label.toLowerCase()}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          className={`pointer-events-none absolute right-8 top-8 ${
            disabled ? 'text-placeholder' : 'text-caption'
          }`}
        >
          <ChevronDown size={16} />
        </span>
      </div>
    </label>
  )
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
