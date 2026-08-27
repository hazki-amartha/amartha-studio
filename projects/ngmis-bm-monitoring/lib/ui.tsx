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

import { useState, type ReactNode } from 'react'
import { Badge } from '@/design-system/components'
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

/** Every control on a filter row is this tall, which is what stops the row
 *  looking ragged: FunDS sizes its controls by padding, so `size="sm"` on two
 *  different components lands ~4px apart. */
const CONTROL_H = 32

/** The purple "we've updated our portal" card, pinned under the nav via
 *  `SideNav`'s footer slot. */
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

export function PageHeading({
  title,
  meta,
  actions,
  leading,
}: {
  title: string
  meta?: string
  actions?: ReactNode
  /** Rendered to the LEFT of the title — e.g. a back button. */
  leading?: ReactNode
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-start justify-between gap-16 py-16">
      <div className="flex items-center gap-12">
        {leading}
        <div className="flex flex-col gap-4">
          <h1 className="text-24 font-bold text-default">{title}</h1>
          {meta ? <span className="text-12 text-caption">{meta}</span> : null}
        </div>
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
  titleAction,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  /** Rendered inline right beside the title (not pushed to the right edge). */
  titleAction?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-16 pb-12">
      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-12">
          <span className="text-16 font-bold text-default">{title}</span>
          {titleAction}
        </span>
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
  /** Omit for a sheet with nothing to confirm — a body-only read/edit surface
   *  (e.g. Setor tunai's breakdown drawer) skips the footer strip entirely. */
  footer?: ReactNode
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

        {footer ? (
          <div className="flex shrink-0 items-center gap-12 border-t border-default p-24">{footer}</div>
        ) : null}
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
 * One bucket as its own card: the bucket named at the top, the figure plain
 * beneath.
 *
 * `intent` puts the name in a coloured chip, which is what Pembayaran's ageing
 * buckets want — colour sits on the chip rather than the number because the
 * chip is what the colour is about, how old the debt is. Omit it and the name
 * is plain black text: Pencairan's cards are cuts of the same month with no
 * severity between them, so a chip there would promise a scale that isn't.
 *
 * `trailing` sits on the figure's own line, for the one case where a count and
 * the rate computed from it are the same fact and belong together.
 */
export function BucketCard({
  label,
  intent,
  value,
  prefix,
  trailing,
  caption,
  targetLabel,
  borderClassName,
}: {
  label: string
  intent?: string
  value: string
  prefix?: string
  trailing?: ReactNode
  caption: string
  /** "Target: 100%", pinned top-right of the label row — for cards read
   *  against a monthly count target rather than a rate. */
  targetLabel?: string
  /** Overrides the default border, e.g. to bond this card visually to a
   *  panel underneath it — see Pencairan's "With Leads monitoring". */
  borderClassName?: string
}) {
  return (
    <div
      className={`flex flex-col gap-12 rounded-12 border bg-neutral-white p-16 ${
        borderClassName ?? 'border-default'
      }`}
    >
      <span className="flex items-start justify-between gap-8">
        {intent ? (
          <span
            className={`self-start rounded-8 border px-8 py-2 text-12 font-bold ${BUCKET_CHIP[intent]}`}
          >
            {label}
          </span>
        ) : (
          <span className="text-12 font-bold text-default">{label}</span>
        )}
        {targetLabel ? <span className="text-12 text-caption">{targetLabel}</span> : null}
      </span>
      <span className="flex flex-col gap-2">
        <span className="flex items-center gap-8">
          <span className="text-24 font-bold text-default">
            {prefix ? <span className="text-16">{prefix}</span> : null}
            {value}
          </span>
          {trailing}
        </span>
        <span className="text-12 text-caption">{caption}</span>
      </span>
    </div>
  )
}

// --- Collapsible --------------------------------------------------------

/**
 * A panel that opens to reveal a breakdown underneath its own header —
 * "Potential mitra" opening onto the lead funnel behind Mitra baru's count,
 * closed by default so the plain figure is what a BM sees first.
 */
export function Collapsible({
  title,
  hint,
  children,
  borderClassName,
  open: openProp,
  onToggle,
}: {
  title: string
  /** Right-aligned hint in the header, e.g. the total the breakdown adds up to. */
  hint?: string
  children: ReactNode
  /** Overrides the default border, e.g. to bond this panel visually to the
   *  card it opens up — see Pencairan's "With Leads monitoring". */
  borderClassName?: string
  /** Controlled open state — pass this (with `onToggle`) when something else
   *  on the page needs to open or read the same state, e.g. a matching
   *  gsheet-style column-group toggle in a table below. Omit both for the
   *  plain uncontrolled panel, which tracks its own open state. */
  open?: boolean
  onToggle?: (open: boolean) => void
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = openProp ?? uncontrolledOpen
  const toggle = () => (onToggle ?? setUncontrolledOpen)(!open)

  return (
    <div className={`rounded-12 border bg-neutral-white ${borderClassName ?? 'border-default'}`}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center gap-8 p-16 text-left"
      >
        <span className="flex-1 text-14 font-bold text-default">{title}</span>
        {hint ? <span className="text-12 text-caption">{hint}</span> : null}
        <span className="text-caption">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {open ? (
        <div className="flex flex-col gap-8 border-t border-default p-16">{children}</div>
      ) : null}
    </div>
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
