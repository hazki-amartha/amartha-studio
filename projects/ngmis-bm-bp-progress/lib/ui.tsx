'use client'

// =============================================================================
// Project-local desktop chrome and table (CLAUDE.md §4).
//
// FunDS Lite is a mobile system — no shell, no sidebar, no table — so a
// back-office screen has to build those from tokens. The shell half is adapted
// from `projects/ngmis-bm-monitoring/lib/ui.tsx`, copied rather than imported
// (§1: a project never reaches into another project's folder).
//
// The one genuinely new piece is `GroupedTable`: this board's whole argument is
// that tasks, repayment and disbursement belong on ONE row, and three subjects
// on one row need a two-deep header — a group band naming the subject and its
// clock, and the columns under it. The existing DataTable is flat.
//
// Fixed pixel widths use inline styles: frame geometry, the same category as a
// device bezel, and the spacing scale deliberately stops at 48px.
// =============================================================================

import type { ReactNode } from 'react'
import {
  Bank,
  Calculator,
  ChartLineUp,
  Coins,
  Contact,
  GearSix,
  Layout,
  Sliders,
  Transfer,
  TransferArrow,
  Umbrella,
} from '@/design-system/icons'

const SIDEBAR_W = 216
const NAV_ITEM_H = 40

// --- Sidebar ----------------------------------------------------------------

interface NavItem {
  id: string
  label: string
  icon: ReactNode
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Layout size={20} /> },
  { id: 'customer', label: 'Customer', icon: <Contact size={20} /> },
  { id: 'loans', label: 'Loans', icon: <Coins size={20} /> },
  { id: 'matchmaking', label: 'Matchmaking', icon: <Transfer size={20} /> },
  { id: 'accounting', label: 'Accounting', icon: <Calculator size={20} /> },
  { id: 'branches', label: 'Branches', icon: <Bank size={20} /> },
  { id: 'transactions', label: 'Transactions', icon: <TransferArrow size={20} /> },
  { id: 'insurance', label: 'Insurance', icon: <Umbrella size={20} /> },
  { id: 'product-config', label: 'Product Config', icon: <Sliders size={20} /> },
]

const FOOTER_NAV: NavItem[] = [
  { id: 'report', label: 'Report', icon: <ChartLineUp size={20} /> },
  { id: 'settings', label: 'Settings', icon: <GearSix size={20} /> },
]

const USER = { name: 'Budi Santoso', role: 'Branch Manager', initial: 'B' }

/** `design-system/assets` ships product wordmarks but not the corporate amartha
 *  lockup, so the sidebar renders the word alone rather than inventing the mark. */
function AmarthaLockup() {
  return <span className="text-20 font-bold lowercase text-primary-500">amartha</span>
}

function SideNav() {
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
          {NAV.map((item) => (
            <NavButton key={item.id} item={item} active={item.id === 'branches'} />
          ))}
        </div>
        <div className="flex flex-col pb-8">
          {FOOTER_NAV.map((item) => (
            <NavButton key={item.id} item={item} active={false} />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-8 border-t border-default bg-neutral-50 px-16 py-12">
        <span className="flex size-24 shrink-0 items-center justify-center rounded-full bg-green-500 text-12 font-bold text-neutral-white">
          {USER.initial}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-12 font-bold text-default">{USER.name}</span>
          <span className="truncate text-10 text-caption">{USER.role}</span>
        </span>
      </div>
    </nav>
  )
}

function NavButton({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <span
      className={`flex items-center gap-12 rounded-8 px-8 text-14 ${
        active ? 'font-bold text-link' : 'font-regular text-default'
      }`}
      style={{ height: NAV_ITEM_H }}
    >
      <span className={active ? 'text-link' : 'text-caption'}>{item.icon}</span>
      <span className="flex-1 truncate text-left">{item.label}</span>
    </span>
  )
}

// --- Shell ------------------------------------------------------------------

/** The whole desktop frame: sidebar left, a scrolling content column on the
 *  tinted canvas. The desktop counterpart to `Screen`, which is mobile-shaped. */
export function MisShell({
  breadcrumbs,
  header,
  children,
}: {
  breadcrumbs?: { label: string; onClick?: () => void }[]
  header?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex h-full bg-neutral-white">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-neutral-50">
        <div className="shrink-0 border-b border-default bg-neutral-white px-24">
          {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
          {header}
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-12 px-24 pb-24 pt-16">{children}</div>
      </div>
    </div>
  )
}

function Breadcrumbs({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <div className="flex shrink-0 items-center gap-4 py-12 text-12">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-4">
          {i > 0 ? <span className="text-placeholder">/</span> : null}
          {item.onClick ? (
            <button type="button" onClick={item.onClick} className="text-default underline">
              {item.label}
            </button>
          ) : (
            <span className="text-caption">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  )
}

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

/** The white card a section sits on. FunDS `Card` is the mobile 16px tile;
 *  back-office panels are wider, flatter and bordered. */
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

/** The one-line summary above the board. Three figures, each naming its own
 *  period — the board's three subjects genuinely do not share a clock, and
 *  hiding that behind a single "hari ini" would be a lie about the data. */
export function SummaryLine({ items }: { items: { label: string; value: string; tone?: string }[] }) {
  return (
    <div className="flex flex-wrap items-stretch gap-12">
      {items.map((item) => (
        <Panel key={item.label} className="flex-1 px-16 py-12">
          <span className="flex flex-col gap-4">
            <span className="text-12 text-caption">{item.label}</span>
            <span className={`text-20 font-bold ${item.tone ?? 'text-default'}`}>{item.value}</span>
          </span>
        </Panel>
      ))}
    </div>
  )
}

// --- Grouped table ----------------------------------------------------------

export interface TableGroup {
  id: string
  /** The subject — "Repayment" — and the clock it runs on. */
  label: string
  period: string
  columns: { id: string; header: string; align?: 'left' | 'right' }[]
}

export interface TableRow {
  id: string
  cells: Record<string, ReactNode>
  onClick?: () => void
}

/**
 * A table whose header is two rows deep: a band naming each subject group, and
 * the columns under it. The first column stands outside every group — it is who
 * the row is about, not one of the things being measured.
 */
export function GroupedTable({
  leadHeader,
  groups,
  rows,
}: {
  leadHeader: string
  groups: TableGroup[]
  rows: TableRow[]
}) {
  const flat = groups.flatMap((g) => g.columns.map((c) => ({ ...c, groupId: g.id })))
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            <th
              rowSpan={2}
              className="border-b border-default bg-neutral-50 px-12 py-8 align-bottom text-12 font-bold text-default"
            >
              {leadHeader}
            </th>
            {groups.map((g) => (
              <th
                key={g.id}
                colSpan={g.columns.length}
                className="border-l border-default bg-neutral-50 px-12 pb-4 pt-8 text-center text-12 font-bold text-default"
              >
                {g.label}
                <span className="block text-10 font-regular lowercase text-caption">
                  {g.period}
                </span>
              </th>
            ))}
          </tr>
          <tr>
            {flat.map((c, i) => (
              <th
                key={c.id}
                className={`border-b border-default bg-neutral-50 px-12 pb-8 text-12 font-regular text-caption ${
                  c.align === 'right' ? 'text-right' : 'text-left'
                } ${
                  // The first column of a group carries the divider, so the
                  // three subjects stay visibly separate across 1100px.
                  i > 0 && flat[i - 1].groupId !== c.groupId ? 'border-l border-default' : ''
                }`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={row.onClick}
              className={`border-b border-default align-middle ${
                row.onClick ? 'cursor-pointer hover:bg-primary-50' : ''
              }`}
            >
              <td className="px-12 py-12 text-14 text-default">{row.cells.lead}</td>
              {flat.map((c, i) => (
                <td
                  key={c.id}
                  className={`px-12 py-12 text-14 text-default ${
                    c.align === 'right' ? 'text-right' : ''
                  } ${i > 0 && flat[i - 1].groupId !== c.groupId ? 'border-l border-default' : ''}`}
                >
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

/** A plain table for the detail pages, where one subject fills the panel. */
export function SimpleTable({
  columns,
  rows,
}: {
  columns: { id: string; header: string; align?: 'left' | 'right' }[]
  rows: TableRow[]
}) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.id}
                className={`border-b border-default bg-neutral-50 px-12 py-8 text-12 font-bold text-default ${
                  c.align === 'right' ? 'text-right' : ''
                }`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={row.onClick}
              className={`border-b border-default align-middle ${
                row.onClick ? 'cursor-pointer hover:bg-primary-50' : ''
              }`}
            >
              {columns.map((c) => (
                <td
                  key={c.id}
                  className={`px-12 py-12 text-14 text-default ${
                    c.align === 'right' ? 'text-right' : ''
                  }`}
                >
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

// --- Cells ------------------------------------------------------------------

/** The delta arrowheads. `TriangleUpFill` in the shared set is a 24px glyph that
 *  reads far heavier than an 8px caret sitting inline with 12px text (§4). */
function CaretUp() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden>
      <path d="M4 1.5 7.5 6.5h-7z" />
    </svg>
  )
}

function CaretDown() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden>
      <path d="M4 6.5 0.5 1.5h7z" />
    </svg>
  )
}

/**
 * One repayment bucket: the rate, coloured by whether it clears ITS OWN target,
 * with the move from last week under it. The colour is the whole point — 34% is
 * a failure in DPD 1–30 and a triumph in DPD 31–90, so a single palette applied
 * to the raw number would read backwards in half the columns.
 */
export function RateCell({
  rate,
  delta,
  onTarget,
  muted,
}: {
  rate: number
  delta: number
  onTarget: boolean
  /** DPD 90+ has no target in the sheet, so it is reported, not judged. */
  muted?: boolean
}) {
  const tone = muted ? 'text-caption' : onTarget ? 'text-green-500' : 'text-red-500'
  const move = delta > 0 ? 'text-green-500' : delta < 0 ? 'text-red-500' : 'text-caption'
  return (
    <span className="flex flex-col items-end gap-2">
      <span className={`text-14 font-bold ${tone}`}>{rate}%</span>
      <span className={`flex items-center gap-2 text-10 ${move}`}>
        {delta > 0 ? <CaretUp /> : delta < 0 ? <CaretDown /> : null}
        {delta === 0 ? 'tetap' : `${Math.abs(delta)}%`}
      </span>
    </span>
  )
}

/** Done-out-of-planned, with the bar carrying the read and the fraction the
 *  detail. Red below two thirds: a BP who has done a third of her day by the
 *  afternoon is not going to finish it. */
export function TaskCell({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 100
  const tone = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <span className="flex flex-col gap-4">
      <span className="text-14 font-bold text-default">
        {done}
        <span className="font-regular text-caption"> dari {total}</span>
      </span>
      <span className="relative h-4 w-full overflow-hidden rounded-full bg-neutral-200">
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${tone}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </span>
    </span>
  )
}

/** A signed rupiah gap: negative is behind target and reads red. */
export function GapCell({ value, format }: { value: number; format: (v: number) => string }) {
  return (
    <span className={`text-14 font-bold ${value < 0 ? 'text-red-500' : 'text-green-500'}`}>
      {value > 0 ? '+' : ''}
      {format(value)}
    </span>
  )
}
