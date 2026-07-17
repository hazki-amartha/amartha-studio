'use client'

// Project-local components, built only from tokens + design-system components
// per the §4 missing-component protocol. See NOTES.md for promotion proposals.

import { useState, type ReactNode } from 'react'
import { IconChevronDown, IconChevronUp } from './icons'

// --- Avatar ----------------------------------------------------------------
// The circular initials chip that leads every mitra row. FunDS Lite has no
// avatar; ListRow just types its `leading` slot as ReactNode.

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-primary-50 text-12 font-bold text-primary-500">
      {initials}
    </span>
  )
}

// --- IconTile --------------------------------------------------------------
// A rounded square holding a 20px icon, tinted per task kind. Follows the
// status-colour rule by hand: a 500 foreground on its own 50 tint.

export function IconTile({ tint, children }: { tint: 'primary' | 'red'; children: ReactNode }) {
  const tone = tint === 'red' ? 'bg-red-50 text-red-500' : 'bg-primary-50 text-primary-500'
  return (
    <span
      className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-8 ${tone}`}
    >
      {children}
    </span>
  )
}

// --- Collapsible -----------------------------------------------------------
// A disclosure section: a quiet header row that expands its children. Used for
// the two things the BP does NOT need in front of them — who already paid, and
// the optional offers. Collapsed is the whole point, so it defaults closed.

export interface CollapsibleProps {
  title: string
  /** Right-aligned hint in the header, e.g. a count or "opsional". */
  hint?: string
  children: ReactNode
}

export function Collapsible({ title, hint, children }: CollapsibleProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-12 border border-default bg-neutral-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-8 p-12 text-left"
      >
        <span className="flex-1 text-14 font-bold text-default">{title}</span>
        {hint ? <span className="text-12 text-caption">{hint}</span> : null}
        <span className="text-disabled">
          {open ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
        </span>
      </button>
      {open ? <div className="flex flex-col gap-8 px-12 pb-12">{children}</div> : null}
    </div>
  )
}

// --- IconToggle ------------------------------------------------------------
// A circular icon button that holds a selected state — the attendance ✗ / ✓ on
// every mitra card. Two of them replace a labelled pill group: at 22 cards the
// words "Hadir"/"Tidak" repeat 44 times for a question whose answer is a shape.
//
// Selected uses the status pairing the foundations sanction (500 foreground on
// its own 50 tint) rather than primary-500. Attendance is a STATUS, not a
// primary action, and green/red resolves at a glance while scanning a roster —
// two purple circles would differ only by glyph.

export interface IconToggleProps {
  selected: boolean
  tone: 'green' | 'red'
  onClick: () => void
  /** Spoken label — the icon alone is not accessible. */
  label: string
  children: ReactNode
}

export function IconToggle({ selected, tone, onClick, label, children }: IconToggleProps) {
  const selectedTone =
    tone === 'green'
      ? 'bg-green-50 text-green-500 border-green-500'
      : 'bg-red-50 text-red-500 border-red-500'
  // Unselected must still read as a live control: a neutral-400 glyph on a
  // neutral-50 fill is the disabled pairing, so an unanswered card looked
  // switched off. An outlined circle on white reads as "tap me".
  const classes = selected ? selectedTone : 'bg-neutral-white text-neutral-600 border-default'

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={`flex h-32 w-32 shrink-0 items-center justify-center rounded-full border ${classes}`}
    >
      {children}
    </button>
  )
}

// --- StepBar ---------------------------------------------------------------
// Three bars + a label, pinned under the header on every majelis-visit step.
// A visit is a sequence, so the BP should never have to wonder how much of it
// is left. Deliberately not tappable: steps advance by finishing them, in the
// same spirit as the schedule promoting the next task by itself.

// Both flows run three steps and share step 2 (Tugas Tambahan) and step 3
// (Foto & Kirim). Only step 1's name differs: a majelis collects attendance,
// a home visit records whether the one borrower was even reached.
export const STEP_LABELS = ['Kehadiran & Pembayaran', 'Tugas Tambahan', 'Foto & Kirim']
export const HOME_STEP_LABELS = ['Temui & Tagih', 'Tugas Tambahan', 'Foto & Kirim']

export function StepBar({
  current,
  labels = STEP_LABELS,
}: {
  current: 1 | 2 | 3
  labels?: string[]
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-4 flex-1 rounded-full ${n <= current ? 'bg-primary-500' : 'bg-neutral-200'}`}
          />
        ))}
      </div>
      <span className="text-10 font-bold uppercase text-caption">
        Langkah {current} dari 3 · {labels[current - 1]}
      </span>
    </div>
  )
}

// --- Overline --------------------------------------------------------------
// The 10px uppercase micro label that separates the schedule's three zones.

export function Overline({ children }: { children: ReactNode }) {
  return <div className="text-10 font-bold uppercase text-caption">{children}</div>
}
