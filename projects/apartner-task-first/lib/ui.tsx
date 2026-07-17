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

// --- Segmented -------------------------------------------------------------
// A two-or-three option pill group for a single choice that must stay visible
// and answerable in one tap — attendance on every mitra card. A BottomSheet
// (the design system's usual "pick one" pairing) would cost a tap and hide the
// answer; a Toggle can't express "not answered yet" as distinct from "no".
//
// Unselected is a real state here: it means the BP hasn't marked them.

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[]
  value?: T
  onChange: (value: T) => void
  label: string
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex gap-4 rounded-full bg-neutral-50 p-2">
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-12 py-4 text-12 font-bold ${
              active ? 'bg-primary-500 text-neutral-white' : 'text-caption'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

// --- Overline --------------------------------------------------------------
// The 10px uppercase micro label that separates the schedule's three zones.

export function Overline({ children }: { children: ReactNode }) {
  return <div className="text-10 font-bold uppercase text-caption">{children}</div>
}
