'use client'

// =============================================================================
// NG-MIS BM shell — project-local components (CLAUDE.md §4).
//
// FunDS Lite is a mobile system: no app shell, no sidebar, no table, no
// pagination, because none of those make sense on a phone. Everything here is
// built from FunDS tokens and FunDS components only — no hardcoded colour, size
// or radius that isn't in tailwind.config.ts.
//
// The shell follows `projects/ngmis-live/lib/ui.tsx` (the shipped NG-MIS
// reference) but takes the sidebar-first frame the BM portal uses: the amartha
// lockup sits at the TOP OF THE SIDEBAR rather than in a 40px header strip, so
// there is no header row and the nav runs the full height of the window.
// Copied rather than imported — a project never reaches into another project's
// folder (§1).
//
// Fixed pixel widths are laid out with inline styles rather than Tailwind
// classes: they are frame geometry, the same category as a device bezel, and
// the spacing scale deliberately stops at 48px.
// =============================================================================

import type { ReactNode } from 'react'
import { Badge } from '@/design-system/components'
import {
  CheckCircleFill,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronUpDown,
  SignOut,
} from '@/design-system/icons'

// --- Frame geometry ---------------------------------------------------------

const SIDEBAR_W = 216
const NAV_ITEM_H = 40

/** Every control on a filter row is this tall, which is what stops the row
 *  looking ragged: FunDS sizes its controls by padding, so `size="sm"` on two
 *  different components lands ~4px apart. */
const CONTROL_H = 32

// --- Brand lockup -----------------------------------------------------------

/**
 * The corporate amartha lockup. `design-system/assets` ships product wordmarks
 * (poket, modal, celengan…) but not the company one, so this renders the word
 * alone rather than inventing the flower mark — same gap `ngmis-live` records.
 */
function AmarthaLockup() {
  return <span className="text-20 font-bold lowercase text-primary-500">amartha</span>
}

// --- Sidebar ----------------------------------------------------------------

export interface NavItem {
  id: string
  label: string
  icon: ReactNode
}

export function SideNav({
  items,
  footerItems,
  activeId,
  onSelect,
  promo,
  user,
}: {
  items: NavItem[]
  /** The lower group — Report, Settings — pinned above the user row. */
  footerItems: NavItem[]
  activeId: string
  onSelect: (id: string) => void
  promo?: ReactNode
  user: { name: string; role: string; initial: string }
}) {
  return (
    <nav
      className="flex shrink-0 flex-col border-r border-default bg-neutral-white"
      style={{ width: SIDEBAR_W }}
    >
      <div className="flex items-center px-16 py-20">
        <AmarthaLockup />
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-8">
        <div className="flex flex-col">
          {items.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={item.id === activeId}
              onSelect={onSelect}
            />
          ))}
        </div>

        <div className="flex flex-col gap-8 pb-8">
          {promo}
          {footerItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={item.id === activeId}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-8 border-t border-default bg-neutral-50 px-16 py-12">
        <span className="flex size-24 shrink-0 items-center justify-center rounded-full bg-green-500 text-12 font-bold text-neutral-white">
          {user.initial}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-12 font-bold text-default">{user.name}</span>
          <span className="truncate text-10 text-caption">{user.role}</span>
        </span>
        <button type="button" aria-label="Keluar" className="text-caption hover:text-link">
          <SignOut size={16} />
        </button>
      </div>
    </nav>
  )
}

function NavButton({
  item,
  active,
  onSelect,
}: {
  item: NavItem
  active: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={`flex items-center gap-12 rounded-8 px-8 text-14 ${
        active ? 'font-bold text-link' : 'font-regular text-default hover:bg-neutral-50'
      }`}
      style={{ height: NAV_ITEM_H }}
    >
      <span className={active ? 'text-link' : 'text-caption'}>{item.icon}</span>
      <span className="flex-1 truncate text-left">{item.label}</span>
    </button>
  )
}

/** The purple "we've updated our portal" card that sits above Report/Settings. */
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

// --- Shell ------------------------------------------------------------------

/**
 * The whole 1440×900 chrome: sidebar down the left, a scrolling content column
 * on the tinted canvas. This is the desktop counterpart to `Screen` — a desktop
 * project uses it INSTEAD of Screen, which is mobile-shaped (32px status strip,
 * 48px top bar, 16px page padding, 12px section gap).
 */
export function MisShell({
  sidebar,
  breadcrumbs,
  header,
  children,
}: {
  sidebar: ReactNode
  breadcrumbs?: { label: string; current?: boolean }[]
  /** Full-bleed white block above the tinted body: title, filters, tabs. */
  header?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex h-full bg-neutral-white">
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-neutral-50">
        {breadcrumbs?.length || header ? (
          <div className="shrink-0 px-24">
            {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
            {header}
          </div>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col px-24 pb-24 pt-16">{children}</div>
      </div>
    </div>
  )
}

export function Breadcrumbs({ items }: { items: { label: string; current?: boolean }[] }) {
  return (
    <div className="flex shrink-0 items-center gap-4 py-12 text-12">
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

/** Page title + timestamp on the left, filters on the right. The filter row
 *  wraps rather than squeezing: six cascading selects do not fit beside a title
 *  at every window width. */
export function PageHeading({
  title,
  meta,
  actions,
}: {
  title: string
  meta?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-start justify-between gap-16 py-16">
      <div className="flex flex-col gap-4">
        <h1 className="text-24 font-bold text-default">{title}</h1>
        {meta ? <span className="text-12 text-caption">{meta}</span> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-8">{actions}</div> : null}
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
    <div className="flex shrink-0">
      {items.map((item) => {
        const on = item.id === activeId
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            // The first tab loses its left padding so it lines up with the
            // page title above it, the way the reference header does.
            className={`border-b-2 px-16 pb-12 text-14 first:pl-0 ${
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

// --- Surfaces ---------------------------------------------------------------

/** The white card every section sits on. FunDS `Card` is the mobile 16px-radius
 *  tile; back-office panels are wider, flatter and bordered. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-12 border border-default bg-neutral-white ${className ?? 'p-16'}`}
    >
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

// --- Form controls ----------------------------------------------------------

/** A dropdown. FunDS has no select — a phone uses a bottom sheet for this. */
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
  /** A filter that has nothing left to narrow — greyed rather than hidden, so
   *  the control row keeps its shape as you drill down. */
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none rounded-8 border border-default bg-neutral-white pl-12 pr-32 text-14 font-regular ${
          disabled ? 'text-placeholder' : 'text-default'
        }`}
        style={{ height: CONTROL_H }}
      >
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
  )
}

/** A read-only, select-looking chip for fixed context (the region → branch
 *  cascade). It carries the chevron so it reads as a filter, but it is a static
 *  span, not a control — the value can't be changed. */
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

/** A day picker for the header filter row. FunDS has no date control, so this
 *  is a native `<input type="date">` styled to match `Select` — clicking it
 *  opens the browser's own calendar. */
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
    <input
      type="date"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-8 border border-default bg-neutral-white px-12 text-14 font-regular text-default focus:border-primary-500 focus:outline-none"
      style={{ height: CONTROL_H }}
    />
  )
}

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-8 border border-default bg-neutral-white p-12 text-14 font-regular text-default placeholder:text-placeholder focus:border-primary-500 focus:outline-none"
    />
  )
}

// --- KPI card ---------------------------------------------------------------

export interface StatDelta {
  /** e.g. "Kemarin: 19.8%" */
  label: string
  /** e.g. "0,2%" */
  value: string
  direction: 'up' | 'down'
  /** A rise is not always good news: DPD flow going up is red. */
  good: boolean
}

export function StatCard({
  label,
  value,
  delta,
  average,
  aside,
}: {
  label: string
  value: string
  delta: StatDelta
  average: string
  /** The second figure some cards carry, e.g. "New mitra / 12". */
  aside?: { label: string; value: string }
}) {
  const tone = delta.good ? 'text-green-500' : 'text-red-500'
  return (
    <Panel>
      <div className="flex items-start justify-between gap-16">
        <div className="flex min-w-0 flex-col gap-4">
          <span className="text-14 text-default">{label}</span>
          <span className="text-24 font-bold text-default">{value}</span>
          <span className="flex items-center gap-4 text-12 text-caption">
            {delta.label}
            <span className={`flex items-center gap-2 ${tone}`}>
              {delta.direction === 'up' ? <TriangleUpGlyph /> : <TriangleDownGlyph />}
              {delta.value}
            </span>
          </span>
          <span className="text-12 text-caption">{average}</span>
        </div>
        {aside ? (
          <div className="flex shrink-0 flex-col gap-4 pt-24">
            <span className="text-12 text-caption">{aside.label}</span>
            <span className="text-16 font-bold text-default">{aside.value}</span>
          </div>
        ) : null}
      </div>
    </Panel>
  )
}

/** The delta arrowheads. `TriangleUpFill` in the shared set is a 24px glyph that
 *  reads far heavier than the 8px caret the reference draws inline with 12px
 *  text, so these are project-local one-offs (§4). */
function TriangleUpGlyph() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden>
      <path d="M4 1.5 7.5 6.5h-7z" />
    </svg>
  )
}

function TriangleDownGlyph() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden>
      <path d="M4 6.5 0.5 1.5h7z" />
    </svg>
  )
}

// --- Daily report tiles -----------------------------------------------------

/** Sun and moon are genuinely absent from the 166-icon set (§4), so they are
 *  project-local one-offs rather than additions to the shared module. */
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

export function ReportTile({
  icon,
  iconTone,
  title,
  body,
  action,
  done,
}: {
  icon: ReactNode
  iconTone: string
  title: string
  body: string
  action: ReactNode
  /** Replaces the action once the report has been sent. */
  done?: boolean
}) {
  return (
    <div className="flex flex-1 flex-col gap-8 rounded-12 border border-default p-16">
      <span className="flex items-center gap-8">
        <span className={iconTone}>{icon}</span>
        <span className="text-14 font-bold text-default">{title}</span>
      </span>
      <span className="text-12 text-caption">{body}</span>
      <span className="pt-4">
        {done ? (
          <Badge intent="green" variant="subtle" size="sm">
            Terkirim
          </Badge>
        ) : (
          action
        )}
      </span>
    </div>
  )
}

// --- Progress bar -----------------------------------------------------------

const BAR_W = 200

/** The task-completion meter in the BP table. Colour is the read: red is a BP
 *  who has fallen behind, green is one who is on top of it. */
export function ProgressBar({ percent }: { percent: number }) {
  const tone = percent >= 80 ? 'bg-green-500' : percent >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <span className="flex items-center gap-8">
      <span
        className="relative h-4 shrink-0 overflow-hidden rounded-full bg-neutral-200"
        style={{ width: BAR_W }}
      >
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${tone}`}
          style={{ width: `${Math.max(percent, 1)}%` }}
        />
      </span>
      <span className="text-12 text-caption">{percent}%</span>
      {percent === 100 ? <CheckCircleFill size={16} className="text-green-500" /> : null}
    </span>
  )
}

// --- Table ------------------------------------------------------------------

export type SortDir = 'asc' | 'desc'

export interface Column {
  id: string
  header: string
  sortable?: boolean
  align?: 'left' | 'right'
  /** Fixed pixel width. When EVERY column sets one, the table switches to a
   *  fixed layout at their summed width — so the same-width columns of two
   *  sibling tables line up, and a wide table scrolls rather than squeezing. */
  width?: number
}

export interface Row {
  id: string
  cells: Record<string, ReactNode>
}

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
  // Fixed layout only when every column declares a width — otherwise the table
  // stays auto-sized and full-width (the history table's behaviour).
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
                // The tinted header is a bar sitting inside a rounded card, so
                // its outer corners follow the card rather than staying square.
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
            <tr
              key={row.id}
              className="border-b border-default align-middle bg-neutral-white"
            >
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

// --- Pagination -------------------------------------------------------------

/**
 * The page numbers to draw: first, last, and the current page with a neighbour
 * either side, `null` where the run is broken. 95 entries at 10/page is ten
 * buttons and at 5/page it would be nineteen, so the row has to window or it
 * becomes the widest thing on the screen.
 */
function pageWindow(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const wanted = [1, page - 1, page, page + 1, pageCount]
    .filter((n) => n >= 1 && n <= pageCount)
    .sort((a, b) => a - b)

  const out: (number | null)[] = []
  let prev = 0
  for (const n of wanted) {
    if (n === prev) continue
    if (prev && n - prev > 1) out.push(null)
    out.push(n)
    prev = n
  }
  return out
}

export function Pagination({
  page,
  pageCount,
  rangeLabel,
  onPageChange,
  perPage,
  onPerPageChange,
}: {
  page: number
  pageCount: number
  /** e.g. "1 - 10 of 95 entries." — the count is of the whole set, not the page. */
  rangeLabel: string
  onPageChange: (page: number) => void
  perPage: string
  onPerPageChange: (perPage: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-16 pt-16 text-12 text-caption">
      <span>{rangeLabel}</span>
      <div className="flex items-center gap-8">
        <PageArrow
          label="Halaman sebelumnya"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </PageArrow>
        {pageWindow(page, pageCount).map((n, i) =>
          n === null ? (
            // eslint-disable-next-line react/no-array-index-key -- gaps have no id
            <span key={`gap-${i}`} className="px-4 text-caption">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onPageChange(n)}
              aria-current={n === page ? 'page' : undefined}
              className={`flex size-32 items-center justify-center rounded-full text-12 ${
                n === page
                  ? 'border border-primary-500 font-bold text-link'
                  : 'font-regular text-caption hover:text-default'
              }`}
            >
              {n}
            </button>
          ),
        )}
        <PageArrow
          label="Halaman berikutnya"
          disabled={page === pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={16} />
        </PageArrow>
      </div>
      <Select
        label="Baris per halaman"
        value={perPage}
        onChange={onPerPageChange}
        options={[
          { value: '10', label: '10 / page' },
          { value: '20', label: '20 / page' },
          { value: '50', label: '50 / page' },
        ]}
      />
    </div>
  )
}

function PageArrow({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-32 items-center justify-center rounded-full text-default disabled:text-placeholder"
    >
      {children}
    </button>
  )
}
