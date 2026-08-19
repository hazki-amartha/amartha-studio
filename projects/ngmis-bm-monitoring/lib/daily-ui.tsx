'use client'

// The handful of components Progres harian needs that our own ui.tsx doesn't
// carry, ported from ngmis-bm-monitoring-v2's lib/ui.tsx (§1: copied, not
// imported). Everything else the ported screens use — Panel, PanelHeading,
// PageHeading, BmShell — is our own; porting a second copy of those would just
// be the same component twice.

import type { ReactNode } from 'react'
import { CalendarDots, ChevronDown, ChevronUp, ChevronUpDown } from '@/design-system/icons'

/** Every control on a filter row is this tall — matches CONTROL_H in ui.tsx. */
const CONTROL_H = 32

export function LockedFilter({ label, value }: { label: string; value: string }) {
  return (
    <span
      aria-label={label}
      aria-disabled="true"
      className="flex items-center justify-between gap-8 rounded-8 border border-default bg-neutral-200 pl-12 pr-8 text-14 font-regular text-caption"
      style={{ height: CONTROL_H }}
    >
      <span className="truncate">{value}</span>
      <span className="shrink-0 text-placeholder">
        <ChevronDown size={16} />
      </span>
    </span>
  )
}

/** Indonesian short month names, for the day filter's display format. */
const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/** "2026-08-07" → "7 Agu 2026" — day without a leading zero, short month. */
function formatDateID(value: string): string {
  const [y, m, d] = value.split('-')
  if (!y || !m || !d) return value
  return `${parseInt(d, 10)} ${MONTHS_ID[parseInt(m, 10) - 1]} ${y}`
}

/** A day picker for the filter row. FunDS has no date control; the browser's
 *  native `<input type="date">` can't show a custom label, so it sits invisible
 *  over a formatted "7 Agu 2026" chip — clicking anywhere opens the calendar. */
export function DateFilter({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (value: string) => void
  label: string
}) {
  return (
    <label
      className="relative flex cursor-pointer items-center gap-8 rounded-8 border border-default bg-neutral-white pl-12 pr-8 text-14 font-regular text-default focus-within:border-primary-500"
      style={{ height: CONTROL_H }}
    >
      <span>{formatDateID(value)}</span>
      <span className="text-caption">
        <CalendarDots size={16} />
      </span>
      <input
        type="date"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  )
}

export function SunGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 2v2m0 12v2M2 10h2m12 0h2M4.7 4.7l1.4 1.4m7.8 7.8 1.4 1.4m0-10.6-1.4 1.4m-7.8 7.8-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function MoonGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M16 12.3A6.8 6.8 0 0 1 7.7 4a6.8 6.8 0 1 0 8.3 8.3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** A diagonal "open in new tab" arrow — the up-right glyph isn't in the 166-icon
 *  set (§4), so a project-local one-off for the per-metric report links. */
export function ArrowUpRightGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M5 11 11 5m0 0H6m5 0v5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** A microphone — genuinely absent from the 166-icon set (§4), so a project-local
 *  one-off for the voice-commentary recorder on the briefing forms. */
export function MicGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="7.25" y="2" width="5.5" height="10" rx="2.75" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4.5 9a5.5 5.5 0 0 0 11 0M10 14.5V18m-2.5 0h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// --- Data table ---------------------------------------------------------

export type SortDir = 'asc' | 'desc'

export interface Column {
  id: string
  header: string
  sortable?: boolean
  align?: 'left' | 'right'
  width?: number
}

export interface Row {
  id: string
  cells: Record<string, ReactNode>
}

/** A sortable, generically-columned table — Riwayat Briefing's history list. */
export function DataTable({
  columns,
  rows,
  sort,
  onSortChange,
}: {
  columns: Column[]
  rows: Row[]
  sort: { columnId: string; dir: SortDir } | null
  onSortChange: (columnId: string) => void
}) {
  const fixed = columns.every((c) => typeof c.width === 'number')
  const totalWidth = fixed ? columns.reduce((sum, c) => sum + (c.width ?? 0), 0) : undefined

  return (
    <div className="min-w-0 overflow-x-auto">
      <table
        className={`border-collapse text-left ${fixed ? 'table-fixed' : 'w-full'}`}
        style={fixed ? { width: totalWidth } : undefined}
      >
        {fixed ? (
          <colgroup>
            {columns.map((col) => (
              <col key={col.id} style={{ width: col.width }} />
            ))}
          </colgroup>
        ) : null}
        <thead>
          <tr className="bg-neutral-50">
            {columns.map((col, i) => (
              <th
                key={col.id}
                className={`px-12 py-12 text-12 font-bold text-default ${
                  col.align === 'right' ? 'text-right' : ''
                } ${i === 0 ? 'rounded-l-8' : ''} ${
                  i === columns.length - 1 ? 'rounded-r-8' : ''
                }`}
              >
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => onSortChange(col.id)}
                    className="flex items-center gap-4"
                  >
                    {col.header}
                    <span className={sort?.columnId === col.id ? 'text-link' : 'text-caption'}>
                      {sort?.columnId === col.id ? (
                        sort.dir === 'asc' ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )
                      ) : (
                        <ChevronUpDown size={16} />
                      )}
                    </span>
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-default align-middle bg-neutral-white">
              {columns.map((col) => (
                <td
                  key={col.id}
                  className={`px-12 py-12 text-14 text-default ${
                    col.align === 'right' ? 'text-right' : ''
                  }`}
                >
                  {row.cells[col.id]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
