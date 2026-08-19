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

import { useEffect, useState, type ReactNode } from 'react'
import { ChevronDown, Cross } from '@/design-system/icons'

// --- Frame geometry ---------------------------------------------------------

/** Every control on a filter row is this tall, which is what stops the row
 *  looking ragged: FunDS sizes its controls by padding, so `size="sm"` on two
 *  different components lands ~4px apart. */
const CONTROL_H = 32

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

// --- Side drawer ------------------------------------------------------------

/** Full-height panel width — wide enough for the three-column settled table. */
const DRAWER_W = 520

/**
 * A full-height panel that slides in from the right, over a scrim. FunDS ships
 * `BottomSheet`, which is the phone answer to the same problem — on a 1440-wide
 * console a sheet from the bottom would cover the table it is about. Positioned
 * the same way the FunDS `Modal` overlay is, and below it in the stack, so a
 * confirmation dialog opened from inside the drawer sits on top.
 */
export function SideDrawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title?: ReactNode
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex h-full flex-col bg-neutral-white"
        style={{ width: DRAWER_W }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-16 border-b border-default p-16">
          <span className="text-16 font-bold text-default">{title}</span>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="text-caption active:opacity-70"
          >
            <Cross size={20} />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-16">{children}</div>
      </div>
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
