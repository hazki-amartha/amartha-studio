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

// --- Frame geometry ---------------------------------------------------------

const HEADER_H = 40
const SIDEBAR_W = 232
const SIDEBAR_COLLAPSED_W = 56
const NAV_ITEM_H = 40

// --- Brand lockup -----------------------------------------------------------

/**
 * The corporate amartha lockup in the header. `design-system/assets` ships
 * product wordmarks (poket, modal, celengan…) but not the company one, so this
 * renders the word alone rather than inventing the flower mark — see NOTES.md.
 */
function AmarthaLockup() {
  return <span className="text-16 font-bold lowercase text-primary-500">amartha</span>
}

/** The hamburger. Genuinely absent from the 166-icon set (§4), so it is a
 *  project-local one-off rather than an addition to the shared module. */
function MenuGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M3 5h14M3 10h14M3 15h14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

// --- Header -----------------------------------------------------------------

export function MisHeader({ onToggleSidebar, initial }: { onToggleSidebar: () => void; initial: string }) {
  return (
    <header
      className="flex shrink-0 items-center justify-between border-b border-default bg-neutral-white px-16"
      style={{ height: HEADER_H }}
    >
      <div className="flex items-center gap-16">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
          className="flex items-center text-default"
        >
          <MenuGlyph />
        </button>
        <AmarthaLockup />
      </div>
      <button type="button" className="flex items-center gap-4 text-caption">
        <span className="flex size-24 items-center justify-center rounded-full bg-green-50 text-12 font-bold text-green-600">
          {initial}
        </span>
        <ChevronDown size={16} />
      </button>
    </header>
  )
}

// --- Sidebar ----------------------------------------------------------------

export interface NavItem {
  id: string
  label: string
  icon: ReactNode
  /** Sub-items expand in place, pushing the rest of the list down. */
  children?: { id: string; label: string }[]
}

export function SideNav({
  items,
  activeId,
  collapsed,
  onSelect,
  footer,
}: {
  items: NavItem[]
  activeId: string
  collapsed: boolean
  onSelect: (id: string) => void
  footer?: ReactNode
}) {
  // Which group is expanded. The shipped shell opens the group containing the
  // active item and keeps one open at a time.
  const [openGroup, setOpenGroup] = useState<string | null>(
    () => items.find((i) => i.children?.some((c) => c.id === activeId))?.id ?? null,
  )

  return (
    <nav
      className="flex shrink-0 flex-col justify-between overflow-y-auto border-r border-default bg-neutral-white p-8"
      style={{ width: collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W }}
    >
      <div className="flex flex-col pt-16">
        {items.map((item) => {
          const group = (item.children?.length ?? 0) > 0
          const open = openGroup === item.id
          const on = activeId === item.id || (group && item.children!.some((c) => c.id === activeId))
          return (
            <div key={item.id} className="flex flex-col">
              <button
                type="button"
                onClick={() => (group ? setOpenGroup(open ? null : item.id) : onSelect(item.id))}
                className={`flex items-center gap-12 rounded-8 px-8 text-14 ${
                  on ? 'font-bold text-link' : 'font-regular text-default hover:bg-neutral-50'
                }`}
                style={{ height: NAV_ITEM_H }}
              >
                <span className={on ? 'text-link' : 'text-caption'}>{item.icon}</span>
                {collapsed ? null : (
                  <>
                    <span className="flex-1 truncate text-left">{item.label}</span>
                    {group ? (
                      <span className={on ? 'text-link' : 'text-caption'}>
                        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    ) : null}
                  </>
                )}
              </button>
              {group && open && !collapsed
                ? item.children!.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => onSelect(child.id)}
                      className={`flex items-center rounded-8 pl-48 pr-8 text-left text-14 ${
                        activeId === child.id
                          ? 'font-bold text-link'
                          : 'font-regular text-caption hover:bg-neutral-50'
                      }`}
                      style={{ height: NAV_ITEM_H }}
                    >
                      {child.label}
                    </button>
                  ))
                : null}
            </div>
          )
        })}
      </div>
      {collapsed ? null : <div className="px-8 pb-8">{footer}</div>}
    </nav>
  )
}

// --- Shell ------------------------------------------------------------------

/**
 * The whole 1440×900 chrome: header across the top, sidebar down the left, and
 * a scrolling content column. This is the desktop counterpart to `Screen` —
 * a desktop project uses it INSTEAD of Screen, which is mobile-shaped (32px
 * status strip, 48px top bar, 16px page padding, 12px section gap).
 */
export function MisShell({
  sidebar,
  breadcrumbs,
  children,
  onToggleSidebar,
  user,
}: {
  sidebar: ReactNode
  breadcrumbs?: { label: string; current?: boolean }[]
  children: ReactNode
  onToggleSidebar: () => void
  user: string
}) {
  return (
    <div className="flex h-full flex-col bg-neutral-white">
      <MisHeader onToggleSidebar={onToggleSidebar} initial={user} />
      <div className="flex min-h-0 flex-1">
        {sidebar}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto px-16">
          {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
          {children}
        </div>
      </div>
    </div>
  )
}

export function Breadcrumbs({ items }: { items: { label: string; current?: boolean }[] }) {
  return (
    <div className="flex shrink-0 items-center gap-4 py-8 text-12">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-4">
          {i > 0 ? <span className="text-placeholder">/</span> : null}
          <span className={item.current ? 'text-caption' : 'text-default underline'}>
            {item.label}
          </span>
        </span>
      ))}
    </div>
  )
}

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
