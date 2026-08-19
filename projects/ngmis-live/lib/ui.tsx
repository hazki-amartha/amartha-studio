'use client'

// =============================================================================
// NG-MIS shell — project-local components (CLAUDE.md §4).
//
// FunDS Lite is a mobile system: it has no app shell, no sidebar, no table, no
// pagination, because none of those make sense on a phone. Everything here is
// built from FunDS tokens and FunDS components only; nothing hardcodes a colour,
// a size or a radius that isn't in tailwind.config.ts.
//
// Geometry comes from the shipped NG-MIS frame in the FunDS component library
// (Figma node 28640-12376, "Expanded (default state)", 1440×900). Fixed widths
// and row heights are laid out with inline styles rather than Tailwind classes:
// they are frame geometry, the same category as the device bezel, and the
// spacing scale deliberately stops at 48px.
//
// If a second desktop project wants these, they are the promotion candidates
// for design-system/components — see DESKTOP-PLAN.md §3 Layer B.
// =============================================================================

import { useState, type ReactNode } from 'react'
import { Wordmark } from '@/design-system/assets'
import { Badge, Button, Input } from '@/design-system/components'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronUpDown,
  DotsThreeOutline,
  MagnifyingGlass,
  Sliders,
  User,
} from '@/design-system/icons'

// --- Tabs -------------------------------------------------------------------

export function Tabs({
  items,
  activeId,
  onChange,
}: {
  items: { id: string; label: string }[]
  activeId: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex shrink-0 border-b border-default">
      {items.map((item) => {
        const on = item.id === activeId
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`border-b-2 px-16 py-12 text-14 ${
              on
                ? 'border-primary-500 font-bold text-link'
                : 'border-transparent font-regular text-caption hover:text-default'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

// --- Toolbar ----------------------------------------------------------------

/** Every control on the toolbar row is this tall, which is what the reference
 *  frame does and what stops the row looking ragged: FunDS sizes its controls
 *  by padding, so `Input size="sm"` and `Button size="sm"` land ~4px apart. */
export const CONTROL_H = 32

export function Toolbar({
  search,
  onSearchChange,
  onFilter,
  action,
}: {
  search: string
  onSearchChange: (v: string) => void
  onFilter: () => void
  action?: ReactNode
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-8 p-16">
      <div className="flex items-center gap-8">
        {/* The magnifier sits INSIDE the field. Input's `prefix` renders a
            separate bordered segment (the "Rp" shape), which is a different
            component of the search field the reference draws. */}
        <div className="relative" style={{ width: 240 }}>
          <span className="pointer-events-none absolute left-8 top-8 text-caption">
            <MagnifyingGlass size={16} />
          </span>
          <Input
            size="sm"
            placeholder="Search by Keyword"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            // Inline rather than `h-32 pl-32`: the height and the icon inset
            // have to beat .ds-inp-sm's padding shorthand, and which of two
            // equal-specificity rules wins would otherwise depend on stylesheet
            // order.
            style={{ height: CONTROL_H, paddingLeft: 32 }}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onFilter}
          className="flex items-center"
          style={{ height: CONTROL_H }}
        >
          <span className="flex items-center gap-8">
            Filter
            <Sliders size={16} />
          </span>
        </Button>
      </div>
      {action}
    </div>
  )
}

// --- Table ------------------------------------------------------------------

export type SortDir = 'asc' | 'desc'

export interface Column {
  id: string
  header: string
  width: number
  sortable?: boolean
  align?: 'left' | 'right'
}

/** A cell is up to three stacked lines: a title and two supporting values.
 *  That stacking is what lets NG-MIS put ~12 fields in 4 columns. */
export interface Cell {
  title: ReactNode
  lines?: string[]
  /** Renders the title as a link, the way identifiers are in the real table. */
  link?: boolean
  /** The small person glyph that trails some identifiers. */
  person?: boolean
  /** Replaces the title with a status pill. */
  status?: { label: string; intent: 'primary' | 'green' | 'orange' | 'red' | 'neutral' }
}

export interface Row {
  id: string
  cells: Record<string, Cell>
}

export function DataTable({
  columns,
  rows,
  selected,
  onSelectedChange,
  sort,
  onSortChange,
}: {
  columns: Column[]
  rows: Row[]
  selected: string[]
  onSelectedChange: (ids: string[]) => void
  sort: { columnId: string; dir: SortDir } | null
  onSortChange: (columnId: string) => void
}) {
  const allOn = rows.length > 0 && selected.length === rows.length

  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-neutral-200">
            <th className="px-16 py-8" style={{ width: 48 }}>
              <Checkbox
                checked={allOn}
                onChange={() => onSelectedChange(allOn ? [] : rows.map((r) => r.id))}
                label="Select all rows"
              />
            </th>
            {columns.map((col) => (
              <th
                key={col.id}
                className={`px-8 py-8 text-12 font-bold text-default ${
                  col.align === 'right' ? 'text-right' : ''
                }`}
                style={{ width: col.width }}
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
            <th className="px-16 py-8 text-right text-12 font-bold text-default" style={{ width: 80 }}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id}
              // Zebra striping, so the eye can track a row across 1200px.
              className={`border-b border-default align-top ${
                i % 2 === 1 ? 'bg-neutral-50' : 'bg-neutral-white'
              }`}
            >
              <td className="px-16 py-12">
                <Checkbox
                  checked={selected.includes(row.id)}
                  onChange={() =>
                    onSelectedChange(
                      selected.includes(row.id)
                        ? selected.filter((id) => id !== row.id)
                        : [...selected, row.id],
                    )
                  }
                  label={`Select row ${row.id}`}
                />
              </td>
              {columns.map((col) => (
                <td key={col.id} className="px-8 py-12">
                  <TableCell cell={row.cells[col.id]} />
                </td>
              ))}
              <td className="px-16 py-12 text-right">
                <button
                  type="button"
                  aria-label={`Actions for ${row.id}`}
                  className="text-caption hover:text-link"
                >
                  <DotsThreeOutline size={20} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TableCell({ cell }: { cell?: Cell }) {
  if (!cell) return null
  return (
    <div className="flex flex-col gap-2">
      {cell.status ? (
        <span>
          <Badge intent={cell.status.intent} variant="outline" size="sm">
            {cell.status.label}
          </Badge>
        </span>
      ) : (
        <span className="flex items-center gap-4">
          <span className={`text-14 ${cell.link ? 'text-link underline' : 'text-default'}`}>
            {cell.title}
          </span>
          {cell.person ? <User size={16} className="text-green-500" /> : null}
        </span>
      )}
      {cell.lines?.map((line) => (
        <span key={line} className="text-12 text-caption">
          {line}
        </span>
      ))}
    </div>
  )
}

/** FunDS has Toggle but no checkbox — a phone doesn't multi-select rows. */
function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`flex size-20 items-center justify-center rounded-4 border ${
        checked ? 'border-primary-500 bg-primary-500' : 'border-neutral-400 bg-neutral-white'
      }`}
    >
      {checked ? (
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
          className="text-neutral-white"
        >
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </button>
  )
}

// --- Pagination -------------------------------------------------------------

export function Pagination({
  page,
  pageCount,
  total,
  onPageChange,
}: {
  page: number
  pageCount: number
  total: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="flex shrink-0 items-center justify-between p-16 text-12 text-caption">
      <span>{total} entries</span>
      <div className="flex items-center gap-8">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="flex size-32 items-center justify-center rounded-8 border border-default text-default disabled:text-placeholder"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-default">
          Page {page} of {pageCount}
        </span>
        <button
          type="button"
          aria-label="Next page"
          disabled={page === pageCount}
          onClick={() => onPageChange(page + 1)}
          className="flex size-32 items-center justify-center rounded-8 border border-default text-default disabled:text-placeholder"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

/** The white card the toolbar, table and pagination sit on. */
export function TableCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-col rounded-8 border border-default bg-neutral-white shadow-sm">
      {children}
    </div>
  )
}
