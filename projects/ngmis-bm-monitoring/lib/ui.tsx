'use client'

// =============================================================================
// NG-MIS BM shell — project-local components (CLAUDE.md §4).
//
// FunDS Lite is a mobile system: no app shell, no sidebar and no table,
// because none of those make sense on a phone. Everything here is
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
import { Badge, Toggle } from '@/design-system/components'
import {
  Cross,
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
    <div className="relative flex h-full bg-neutral-white">
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-neutral-50">
        {breadcrumbs?.length || header ? (
          <div className="shrink-0 border-b border-default bg-neutral-white px-24">
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

// --- Side sheet --------------------------------------------------------------

const SHEET_W = 420

/**
 * A panel that slides over the page from the right. FunDS ships BottomSheet,
 * which is the phone answer to the same problem — on a 1440-wide console a
 * sheet from the bottom would cover the table it is about.
 *
 * Positioned `absolute`, not `fixed`, so it stays inside the device frame in
 * prototype view rather than escaping to the browser viewport.
 */
export function SideSheet({
  title,
  description,
  onClose,
  children,
  footer,
}: {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="absolute inset-0 z-20 flex justify-end bg-overlay">
      <div className="flex h-full flex-col bg-neutral-white" style={{ width: SHEET_W }}>
        <div className="flex shrink-0 items-start justify-between gap-16 border-b border-default p-24">
          <div className="flex flex-col gap-4">
            <span className="text-20 font-bold text-default">{title}</span>
            {description ? <span className="text-14 text-caption">{description}</span> : null}
          </div>
          <button type="button" aria-label="Tutup" onClick={onClose} className="text-caption">
            <Cross size={20} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-24 overflow-y-auto p-24">{children}</div>

        <div className="flex shrink-0 items-center gap-12 border-t border-default p-24">
          {footer}
        </div>
      </div>
    </div>
  )
}

/** One labelled block inside a sheet. The label is the question, the body is
 *  the answer — so a BM can skim to the part she doubts. */
export function SheetSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-8">
      <span className="text-12 font-bold text-caption">{label}</span>
      {children}
    </div>
  )
}

// --- Rate pill ---------------------------------------------------------------

/**
 * A rate wearing its verdict: a soft pill, green when the figure clears its
 * standard and red when it does not.
 *
 * `ok === null` renders plain text instead. A neutral pill would still read as
 * a judgement, and Total Mitra and DPD 90+ have no standard to be judged
 * against.
 */
export function RatePill({ ok, children }: { ok: boolean | null; children: ReactNode }) {
  if (ok === null) return <span className="text-14 text-default">{children}</span>
  return (
    <Badge intent={ok ? 'green' : 'red'} variant="subtle" size="sm">
      {children}
    </Badge>
  )
}

// --- Bucket card -------------------------------------------------------------

const BUCKET_CHIP: Record<string, string> = {
  green: 'border-green-200 bg-green-50 text-green-600',
  yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  orange: 'border-orange-200 bg-orange-50 text-orange-600',
  red: 'border-red-200 bg-red-50 text-red-600',
}

/**
 * One ageing bucket as its own card: the bucket named in a coloured chip, the
 * figure plain beneath.
 *
 * Colour sits on the chip rather than the number because the chip is what the
 * colour is about — how old the debt is. Tinting the figure as well would put
 * two meanings on one card.
 */
export function BucketCard({
  label,
  intent,
  value,
  prefix,
  caption,
}: {
  label: string
  intent: string
  value: string
  prefix?: string
  caption: string
}) {
  return (
    <div className="flex flex-col gap-12 rounded-12 border border-default bg-neutral-white p-16">
      <span
        className={`self-start rounded-8 border px-8 py-2 text-12 font-bold ${BUCKET_CHIP[intent]}`}
      >
        {label}
      </span>
      <span className="flex flex-col gap-2">
        <span className="text-24 font-bold text-default">
          {prefix ? <span className="text-16">{prefix}</span> : null}
          {value}
        </span>
        <span className="text-12 text-caption">{caption}</span>
      </span>
    </div>
  )
}

// --- Unit toggle -------------------------------------------------------------

/**
 * A switch between two readings of the same page, on the FunDS `Toggle`.
 *
 * Both readings are named, one either side of the switch, and the live one is
 * bold: neither unit is the obvious default, so a single trailing label would
 * leave the reader working out what "off" means. The labels are clickable too —
 * a 32px switch is a small target for a control this central.
 */
export function UnitToggle({
  off,
  on,
  value,
  onChange,
}: {
  /** The reading the switch shows when it is off, drawn on the left. */
  off: { id: string; label: string }
  on: { id: string; label: string }
  value: string
  onChange: (id: string) => void
}) {
  const isOn = value === on.id
  const label = (side: { id: string; label: string }, live: boolean) => (
    <button
      type="button"
      onClick={() => onChange(side.id)}
      className={`text-12 ${live ? 'font-bold text-default' : 'font-regular text-caption'}`}
    >
      {side.label}
    </button>
  )

  return (
    <span className="flex items-center gap-8">
      {label(off, !isOn)}
      <Toggle
        checked={isOn}
        aria-label={`${off.label} / ${on.label}`}
        onChange={(e) => onChange(e.target.checked ? on.id : off.id)}
      />
      {label(on, isOn)}
    </span>
  )
}

// --- Metric card ------------------------------------------------------------

/** A headline rate with the target it is judged against sitting underneath, so
 *  the number is never read without the bar it has to clear. */
export function MetricCard({
  label,
  value,
  target,
  onTarget,
}: {
  label: string
  value: string
  target: string
  onTarget: boolean
}) {
  return (
    <div className="rounded-12 border border-default bg-neutral-white p-16">
      <div className="flex flex-col gap-4">
        <span className="text-14 text-default">{label}</span>
        <span className={`text-24 font-bold ${onTarget ? 'text-green-500' : 'text-red-500'}`}>
          {value}
        </span>
        <span className="text-12 text-caption">Target: {target}</span>
      </div>
    </div>
  )
}

// --- Form controls ----------------------------------------------------------

/** A dropdown. FunDS has no select — a phone uses a bottom sheet for this. */
export function Select({
  value,
  options,
  groups,
  onChange,
  label,
  disabled,
}: {
  value: string
  options?: { value: string; label: string }[]
  /** Labelled sections, for a list that mixes two kinds of choice — a status
   *  and a name read as one flat list otherwise. */
  groups?: { label: string; options: { value: string; label: string }[] }[]
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
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {groups?.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
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

// --- Table ------------------------------------------------------------------

export type SortDir = 'asc' | 'desc'

export interface Column {
  id: string
  header: string
  sortable?: boolean
  align?: 'left' | 'right'
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
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full border-collapse text-left">
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
          {rows.map((row, i) => (
            <tr
              key={row.id}
              // Zebra striping, so the eye can track a row across 1200px.
              className={`border-b border-default align-middle ${
                i % 2 === 1 ? 'bg-neutral-50' : 'bg-neutral-white'
              }`}
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

