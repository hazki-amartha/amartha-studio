'use client'

// Project-local components, built only from tokens + design-system components
// per the §4 missing-component protocol. See NOTES.md.

import { useState, type ReactNode } from 'react'
import { Button } from '@/design-system/components'
import { Check, Copy, Cross, Hourglass, WarningCircle } from '@/design-system/icons'

// --- StickyBar -------------------------------------------------------------
// The pinned footer eight screens end with. FunDS Lite has no footer primitive
// and `Screen` only pins the top bar, so the CTA would otherwise scroll away
// from a long instruction list.

export function StickyBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-16 mt-auto flex flex-col gap-8 border-t border-light bg-neutral-white p-16">
      {children}
    </div>
  )
}

// --- Meter -----------------------------------------------------------------

export function Meter({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div className="h-8 w-full rounded-full bg-neutral-200">
      <div
        className="h-8 rounded-full bg-primary-500"
        // A data-driven width is the one dimension a meter cannot take from a
        // token — the value IS the geometry. Everything else here is a token.
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

// --- IconTile --------------------------------------------------------------
// The tinted square behind an icon: a task avatar, a method logo, a hero mark.

export type Tint = 'primary' | 'green' | 'blue' | 'orange' | 'red' | 'neutral'

const TINTS: Record<Tint, string> = {
  primary: 'bg-primary-50 text-primary-500',
  green: 'bg-green-50 text-green-500',
  blue: 'bg-blue-50 text-blue-500',
  orange: 'bg-orange-50 text-orange-700',
  red: 'bg-red-50 text-red-500',
  neutral: 'bg-neutral-50 text-neutral-600',
}

export function IconTile({
  tint,
  round,
  size = 40,
  children,
}: {
  tint: Tint
  /** Circular rather than the default 12px square. */
  round?: boolean
  size?: 32 | 40 | 48
  children: ReactNode
}) {
  const box = size === 32 ? 'h-32 w-32' : size === 48 ? 'h-48 w-48' : 'h-40 w-40'
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${box} ${
        round ? 'rounded-full' : 'rounded-12'
      } ${TINTS[tint]}`}
    >
      {children}
    </span>
  )
}

// --- SectionTitle ----------------------------------------------------------

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-16 font-bold text-default">{children}</h2>
}

export function Caption({ children }: { children: ReactNode }) {
  return <p className="text-12 text-caption">{children}</p>
}

// --- StatRow ---------------------------------------------------------------
// Label left, value right. The receipt, the simulation breakdown, and the
// majelis info block are all this same row.

export function StatRow({
  label,
  value,
  tone = 'default',
  strong,
  border,
}: {
  label: ReactNode
  value: ReactNode
  tone?: 'default' | 'red' | 'green' | 'primary' | 'orange'
  /** Prints the value one step larger — used for a total line. */
  strong?: boolean
  border?: boolean
}) {
  const toneClass =
    tone === 'red'
      ? 'text-red-500'
      : tone === 'green'
        ? 'text-green-500'
        : tone === 'primary'
          ? 'text-primary-500'
          : tone === 'orange'
            ? 'text-orange-700'
            : 'text-default'
  return (
    <div className={`flex items-center gap-12 py-8 ${border ? 'border-b border-light' : ''}`}>
      <span className="flex-1 text-12 text-caption">{label}</span>
      <span className={`font-bold ${strong ? 'text-18' : 'text-14'} ${toneClass}`}>{value}</span>
    </div>
  )
}

// --- InfoBlock -------------------------------------------------------------
// A bordered box with a quiet label above its content. Used across the payment
// instruction screens for the VA number, the bank, the account name.

export function InfoBlock({
  label,
  highlight,
  children,
}: {
  label: string
  /** Purple frame for the line the screen wants read last, e.g. the new balance. */
  highlight?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={`rounded-12 border p-12 ${
        highlight ? 'border-primary-500 bg-primary-50' : 'border-default bg-neutral-white'
      }`}
    >
      <p className="mb-4 text-12 text-caption">{label}</p>
      {children}
    </div>
  )
}

// --- CopyBlock -------------------------------------------------------------
// A number the mitra has to carry into another app. The copy button confirms in
// place rather than through a toast — the platform has no toast surface, and a
// button that says "Tersalin" is the confirmation anyway.

export function CopyBlock({
  label,
  display,
  raw,
}: {
  label: string
  /** Grouped for reading, e.g. "8808 1234 5678 9012". */
  display: string
  /** What actually reaches the clipboard — no spaces. */
  raw: string
}) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard?.writeText(raw).catch(() => {})
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <InfoBlock label={label}>
      <div className="flex items-center gap-12">
        <span className="flex-1 text-18 font-bold text-default">{display}</span>
        <button
          type="button"
          onClick={copy}
          className={`flex shrink-0 items-center gap-4 rounded-8 px-8 py-4 text-12 font-bold ${
            copied ? 'text-green-500' : 'text-primary-500'
          }`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Tersalin' : 'Salin'}
        </button>
      </div>
    </InfoBlock>
  )
}

// --- Notice ----------------------------------------------------------------
// A one-line caveat with an icon: a deadline, a processing delay, a reassurance.

export function Notice({
  tone,
  children,
}: {
  tone: 'red' | 'orange' | 'green'
  children: ReactNode
}) {
  const toneClass =
    tone === 'red'
      ? 'bg-red-50 text-red-500'
      : tone === 'green'
        ? 'bg-green-50 text-green-600'
        : 'bg-orange-50 text-orange-700'
  return (
    <div className={`flex items-center gap-8 rounded-12 p-12 text-12 ${toneClass}`}>
      <span className="shrink-0">
        {tone === 'red' ? <Hourglass size={16} /> : <WarningCircle size={16} />}
      </span>
      <span>{children}</span>
    </div>
  )
}

// --- Steps -----------------------------------------------------------------
// Numbered instructions. Four of the six payment methods end in a list of
// things to do somewhere else, and they all want the same shape.

export function Steps({ title, steps }: { title: string; steps: ReactNode[] }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-14 font-bold text-default">{title}</p>
      {steps.map((step, i) => (
        <div
          key={i}
          className={`flex gap-12 py-8 text-12 text-caption ${i === 0 ? '' : 'border-t border-light'}`}
        >
          <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary-50 text-12 font-bold text-primary-500">
            {i + 1}
          </span>
          <span className="flex-1">{step}</span>
        </div>
      ))}
    </div>
  )
}

// --- Hero ------------------------------------------------------------------
// The amount being paid, restated at the top of every instruction screen so the
// mitra never has to go back to check what she is transferring.

export function Hero({
  icon,
  name,
  amount,
  tint = 'primary',
}: {
  icon: ReactNode
  name: string
  amount: string
  tint?: 'primary' | 'green'
}) {
  return (
    <div
      className={`flex flex-col items-center gap-8 rounded-12 border p-20 text-center ${
        tint === 'green' ? 'border-green-200 bg-green-50' : 'border-primary-200 bg-primary-50'
      }`}
    >
      <span className="flex h-48 w-48 items-center justify-center rounded-12 bg-neutral-white text-primary-500">
        {icon}
      </span>
      <span className="text-14 font-bold text-default">{name}</span>
      <span className="text-24 font-bold text-primary-500">{amount}</span>
    </div>
  )
}

// --- ResultHeader ----------------------------------------------------------
// The circle-plus-headline every outcome screen opens with: pencairan berhasil,
// pembayaran berhasil, menunggu konfirmasi, saldo kurang.

export function ResultHeader({
  tint,
  icon,
  title,
  description,
}: {
  tint: 'green' | 'orange' | 'red'
  icon: ReactNode
  title: ReactNode
  description?: ReactNode
}) {
  const toneClass =
    tint === 'green'
      ? 'bg-green-50 text-green-500'
      : tint === 'red'
        ? 'bg-red-50 text-red-500'
        : 'bg-orange-50 text-orange-700'
  return (
    <div className="flex flex-col items-center gap-8 pt-16 text-center">
      <span className={`flex h-48 w-48 items-center justify-center rounded-full ${toneClass}`}>
        {icon}
      </span>
      <p className="text-20 font-bold text-default">{title}</p>
      {description ? <p className="text-14 text-caption">{description}</p> : null}
    </div>
  )
}

// --- Chip ------------------------------------------------------------------

export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  const classes = selected
    ? 'border-primary-500 bg-primary-500 text-neutral-white'
    : 'border-default bg-neutral-white text-neutral-600'
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full border px-12 py-8 text-12 font-bold ${classes}`}
    >
      {children}
    </button>
  )
}

// --- OptionCard ------------------------------------------------------------
// A radio-selectable card. FunDS Lite's SelectableCard puts the control on the
// left and takes only text slots; the amount and method pickers both need a
// trailing radio and arbitrary content inside the selected card (an inline
// amount field, a live balance), so this is that shape.

export function OptionCard({
  selected,
  onClick,
  leading,
  title,
  description,
  children,
}: {
  selected: boolean
  onClick: () => void
  leading?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** Rendered under the description, inside the card. */
  children?: ReactNode
}) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={`flex cursor-pointer items-start gap-12 rounded-12 border p-12 ${
        selected ? 'border-primary-500 bg-primary-50' : 'border-default bg-neutral-white'
      }`}
    >
      {leading}
      <div className="min-w-0 flex-1">
        <div className="text-14 font-bold text-default">{title}</div>
        {description ? <div className="mt-2 text-12 text-caption">{description}</div> : null}
        {children}
      </div>
      <span
        className={`mt-2 flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? 'border-primary-500 bg-primary-500' : 'border-neutral-400'
        }`}
      >
        {selected ? <span className="h-8 w-8 rounded-full bg-neutral-white" /> : null}
      </span>
    </div>
  )
}

// --- StatusMark ------------------------------------------------------------
// A tick or cross with its label — the history table's two right-hand columns.

export function StatusMark({
  ok,
  okLabel,
  failLabel,
}: {
  ok: boolean
  okLabel: string
  failLabel: string
}) {
  return (
    <span
      className={`flex items-center justify-end gap-4 text-12 font-bold ${
        ok ? 'text-green-500' : 'text-red-500'
      }`}
    >
      <span
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-neutral-white ${
          ok ? 'bg-green-500' : 'bg-red-500'
        }`}
      >
        {ok ? <Check size={16} /> : <Cross size={16} />}
      </span>
      {ok ? okLabel : failLabel}
    </span>
  )
}

// --- TaskButton ------------------------------------------------------------
// The small pill on the right of a home-screen task. It has five states — do
// it, check it, done, retry, in progress — and Button's variants cover only the
// first, so the tinted outline states live here.

export function TaskButton({
  tone,
  onClick,
  disabled,
  children,
}: {
  tone: 'primary' | 'green' | 'orange' | 'red' | 'neutral'
  onClick?: () => void
  disabled?: boolean
  children: ReactNode
}) {
  const toneClass =
    tone === 'green'
      ? 'border-green-500 bg-green-50 text-green-600'
      : tone === 'orange'
        ? 'border-orange-500 bg-orange-50 text-orange-700'
        : tone === 'red'
          ? 'border-red-500 bg-neutral-white text-red-500'
          : tone === 'neutral'
            ? 'border-default bg-neutral-white text-neutral-700'
            : 'border-primary-500 bg-neutral-white text-primary-500'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex shrink-0 items-center justify-center gap-4 rounded-full border px-12 py-8 text-12 font-bold ${toneClass}`}
    >
      {children}
    </button>
  )
}

// --- FullWidthButton -------------------------------------------------------
// Button is inline-sized; every footer CTA in this project is full-bleed.

export function FullWidthButton({
  onClick,
  disabled,
  variant = 'primary',
  children,
}: {
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
}) {
  return (
    <Button variant={variant} size="lg" onClick={onClick} disabled={disabled} className="w-full">
      {children}
    </Button>
  )
}
