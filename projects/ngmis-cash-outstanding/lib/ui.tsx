'use client'

// =============================================================================
// NG-MIS FO Report shell — project-local components (CLAUDE.md §4).
//
// The sidebar-first back-office frame, copied and trimmed from
// projects/ngmis-bm-monitoring-v2/lib/ui.tsx (§1: a project never imports across
// another project's folder). Everything here is FunDS tokens and FunDS
// components only — no hardcoded colour, size or radius outside tailwind.config.
//
// Fixed pixel widths are laid out with inline styles rather than Tailwind
// classes: they are frame geometry, the same category as a device bezel, and
// the spacing scale deliberately stops at 48px.
// =============================================================================

import { useState, type ReactNode } from 'react'
import { ChevronDown } from '@/design-system/icons'

// --- Frame geometry ---------------------------------------------------------

const SIDEBAR_W = 216
/** Width of the sidebar when minimised to an icon-only rail. */
const COLLAPSED_W = 64
const NAV_ITEM_H = 40
/** The top header bar that carries the hamburger, lockup and profile. */
const HEADER_H = 52

/** Every control on a filter row is this tall, which is what stops the row
 *  looking ragged: FunDS sizes its controls by padding, so `size="sm"` on two
 *  different components lands ~4px apart. */
const CONTROL_H = 32

// --- Brand lockup -----------------------------------------------------------

/**
 * The corporate amartha lockup. `design-system/assets` ships product wordmarks
 * (poket, modal, celengan…) but not the company one, so this renders the word
 * alone rather than inventing the flower mark.
 */
function AmarthaLockup() {
  return <span className="text-20 font-bold lowercase text-primary-500">amartha</span>
}

/** A hamburger — three lines aren't in the 166-icon set (§4), so a project-local
 *  one-off for the header's sidebar toggle. */
function MenuGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// --- Sidebar ----------------------------------------------------------------

export interface NavItem {
  id: string
  label: string
  icon: ReactNode
}

export function SideNav({
  items,
  activeId,
  onSelect,
  collapsed = false,
}: {
  items: NavItem[]
  activeId: string
  onSelect: (id: string) => void
  /** Minimised to an icon-only rail — toggled from the header hamburger. */
  collapsed?: boolean
}) {
  return (
    <nav
      className="flex shrink-0 flex-col border-r border-default bg-neutral-white"
      style={{ width: collapsed ? COLLAPSED_W : SIDEBAR_W }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-8 py-12">
        {items.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={item.id === activeId}
            collapsed={collapsed}
            onSelect={onSelect}
          />
        ))}
      </div>
    </nav>
  )
}

function NavButton({
  item,
  active,
  collapsed,
  onSelect,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={`flex items-center rounded-8 text-14 ${collapsed ? 'justify-center' : 'gap-12 px-8'} ${
        active ? 'bg-primary-50 font-bold text-link' : 'font-regular text-default hover:bg-neutral-50'
      }`}
      style={{ height: NAV_ITEM_H }}
    >
      <span className={active ? 'text-link' : 'text-caption'}>{item.icon}</span>
      {collapsed ? null : <span className="flex-1 truncate text-left">{item.label}</span>}
    </button>
  )
}

// --- Shell ------------------------------------------------------------------

/** The full-width top bar: hamburger + amartha lockup on the left, the profile
 *  chip on the right. The hamburger toggles the sidebar between full and rail. */
function TopHeader({
  collapsed,
  onToggle,
  user,
}: {
  collapsed: boolean
  onToggle: () => void
  user: { name: string; role: string; initial: string }
}) {
  return (
    <header
      className="flex shrink-0 items-center justify-between border-b border-default bg-neutral-white px-16"
      style={{ height: HEADER_H }}
    >
      <div className="flex items-center gap-12">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Perbesar menu' : 'Perkecil menu'}
          className="flex size-32 items-center justify-center rounded-8 text-default hover:bg-neutral-50 active:opacity-70"
        >
          <MenuGlyph size={20} />
        </button>
        <AmarthaLockup />
      </div>
      <button
        type="button"
        aria-label={user.name}
        className="flex items-center gap-4 rounded-full py-2 pl-2 pr-8 hover:bg-neutral-50 active:opacity-70"
      >
        <span className="flex size-32 shrink-0 items-center justify-center rounded-full bg-green-500 text-12 font-bold text-neutral-white">
          {user.initial}
        </span>
        <ChevronDown size={16} className="text-caption" />
      </button>
    </header>
  )
}

/**
 * The whole 1440×900 chrome: a full-width top header, then a sidebar down the
 * left beside a scrolling content column on the tinted canvas. The sidebar
 * minimises to an icon rail via the header hamburger. `sidebar` is a render
 * function so it can read the live `collapsed` state the header controls.
 */
export function MisShell({
  sidebar,
  user,
  breadcrumbs,
  header,
  children,
}: {
  sidebar: (collapsed: boolean) => ReactNode
  user: { name: string; role: string; initial: string }
  breadcrumbs?: { label: string; current?: boolean }[]
  /** Full-bleed white block above the tinted body: title, filters, tabs. */
  header?: ReactNode
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-full flex-col bg-neutral-white">
      <TopHeader collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} user={user} />
      <div className="flex min-h-0 flex-1">
        {sidebar(collapsed)}
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

// --- Filter controls --------------------------------------------------------

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

/** A read-only, select-looking chip for a filter that has nothing left to pick
 *  (e.g. "Semua BP"). It carries the chevron so it reads as a filter, but it is
 *  a static span, not a control — greyed rather than hidden, so the row keeps
 *  its shape. */
export function LockedFilter({ label, value }: { label: string; value: string }) {
  return (
    <span
      aria-label={label}
      aria-disabled="true"
      className="flex items-center justify-between gap-8 rounded-8 border border-default bg-neutral-200 pl-12 pr-8 text-14 font-regular text-placeholder"
      style={{ height: CONTROL_H }}
    >
      <span className="truncate">{value}</span>
      <span className="shrink-0 text-placeholder">
        <ChevronDown size={16} />
      </span>
    </span>
  )
}

/** Page title + timestamp on the left, actions on the right. */
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

// --- Surfaces ---------------------------------------------------------------

/** The white card every section sits on. FunDS `Card` is the mobile 16px-radius
 *  tile; back-office panels are wider, flatter and bordered. Pass `className` to
 *  override the default 16px padding (e.g. `p-0` for a panel that wraps a table). */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-12 border border-default bg-neutral-white ${className ?? 'p-16'}`}>
      {children}
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
            // The first tab loses its left padding so it lines up with the
            // page title above it, the way the reference header does.
            className={`-mb-px border-b-2 px-16 pb-12 text-14 first:pl-0 ${
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
