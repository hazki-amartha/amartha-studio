'use client'

// Project-local components the source draft hand-rolled and FunDS Lite doesn't
// cover yet. Built only from tokens + design-system components, per the missing
// component protocol. See NOTES.md for the promotion proposals.

import type { ReactNode } from 'react'
import { BottomSheet, SelectableCard } from '@/design-system/components'
import { IconChevD, IconChevR, IconSearch } from './icons'

// --- SearchField -----------------------------------------------------------
// A search input with a leading icon. FunDS's Input can't carry an icon in its
// `prefix` slot — the prop is typed ReactNode but the DOM's global `prefix:
// string` collides with it, so only string affixes typecheck. This composes the
// same 8px-radius input look from tokens instead. See NOTES.md for promotion.

export interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  'aria-label'?: string
}

export function SearchField({ value, onChange, placeholder, ...aria }: SearchFieldProps) {
  return (
    <div className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 focus-within:border-primary-500">
      <span className="shrink-0 text-disabled">
        <IconSearch size={20} />
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={aria['aria-label']}
        className="min-w-0 flex-1 bg-transparent text-14 text-default outline-none placeholder:text-placeholder"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="shrink-0 text-12 font-bold text-link"
        >
          Hapus
        </button>
      ) : null}
    </div>
  )
}

// --- FilterChip ------------------------------------------------------------
// The dropdown-trigger pill used across Home, Majelis, KPI, Comms, and Notif.

export interface FilterChipProps {
  label: string
  active?: boolean
  open?: boolean
  onClick: () => void
}

export function FilterChip({ label, active, open, onClick }: FilterChipProps) {
  const tone = active
    ? 'border-primary-500 bg-primary-50 text-primary-600'
    : 'border-default bg-neutral-white text-neutral-700'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={`flex shrink-0 items-center gap-4 rounded-full border px-12 py-8 text-12 font-bold ${tone}`}
    >
      <span className="truncate">{label}</span>
      <span className={`flex shrink-0 ${open ? 'rotate-180' : ''}`}>
        <IconChevD size={16} />
      </span>
    </button>
  )
}

// --- FilterBar -------------------------------------------------------------

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-8 overflow-x-auto">{children}</div>
}

export function ResetLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 text-12 font-bold text-link"
    >
      Reset
    </button>
  )
}

// --- OptionSheet -----------------------------------------------------------
// The source's BottomSheet + SheetOptions pair. Here it's the design-system
// BottomSheet wrapping a SelectableCard radio group, which is the system's
// sanctioned single-choice control.

export interface SheetOption<T> {
  l: string
  v: T
  /** Optional leading swatch — used by the KPI-type and notif-type pickers. */
  dot?: string
}

export interface OptionSheetProps<T> {
  open: boolean
  title: string
  name: string
  options: SheetOption<T>[]
  value: T
  onPick: (v: T) => void
  onClose: () => void
}

export function OptionSheet<T>({
  open,
  title,
  name,
  options,
  value,
  onPick,
  onClose,
}: OptionSheetProps<T>) {
  return (
    <BottomSheet open={open} onClose={onClose} size="md" title={title}>
      <div className="flex flex-col gap-8">
        {options.map((o) => (
          <SelectableCard
            key={o.l}
            name={name}
            title={o.l}
            checked={o.v === value}
            onChange={() => onPick(o.v)}
            prefixIcon={
              o.dot ? <span className={`block h-8 w-8 rounded-full ${o.dot}`} /> : undefined
            }
          />
        ))}
      </div>
    </BottomSheet>
  )
}

// --- ProgressBar -----------------------------------------------------------

export interface ProgressBarProps {
  /** 0–100. */
  value: number
  /** Token background class for the fill, e.g. `bg-primary-500`. */
  fill?: string
}

export function ProgressBar({ value, fill = 'bg-primary-500' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className="h-8 overflow-hidden rounded-full bg-neutral-200"
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Width is data-driven, so it has to be an inline style — it's a
          percentage of the track, not a spacing token. */}
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}

// --- Avatar ----------------------------------------------------------------

export type AvatarTone = 'primary' | 'neutral' | 'red' | 'blue'
export type AvatarSize = 32 | 40 | 48

const avatarTone: Record<AvatarTone, string> = {
  primary: 'border-primary-200 bg-primary-50 text-primary-600',
  neutral: 'border-default bg-neutral-50 text-neutral-700',
  red: 'border-red-200 bg-red-50 text-red-500',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
}

const avatarSize: Record<AvatarSize, string> = {
  32: 'h-32 w-32 text-12',
  40: 'h-40 w-40 text-14',
  48: 'h-48 w-48 text-16',
}

export function Avatar({
  children,
  tone = 'primary',
  size = 40,
}: {
  children: ReactNode
  tone?: AvatarTone
  size?: AvatarSize
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full border font-bold ${avatarTone[tone]} ${avatarSize[size]}`}
    >
      {children}
    </span>
  )
}

// --- IconTile --------------------------------------------------------------
// The rounded square that leads a task card / majelis card / profile row.

export type IconTileTone = 'primary' | 'orange' | 'neutral'

const tileTone: Record<IconTileTone, string> = {
  primary: 'bg-primary-50 text-primary-500',
  orange: 'bg-orange-50 text-orange-700',
  neutral: 'bg-neutral-50 text-neutral-600',
}

export function IconTile({ children, tone = 'neutral' }: { children: ReactNode; tone?: IconTileTone }) {
  return (
    <span className={`flex h-32 w-32 shrink-0 items-center justify-center rounded-8 ${tileTone[tone]}`}>
      {children}
    </span>
  )
}

// --- SectionHeader ---------------------------------------------------------

export function SectionHeader({
  title,
  linkLabel,
  onLink,
  trailing,
}: {
  title: string
  linkLabel?: string
  onLink?: () => void
  trailing?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-8">
      <h2 className="text-14 font-bold text-default">{title}</h2>
      {linkLabel && onLink ? (
        <button
          type="button"
          onClick={onLink}
          className="flex shrink-0 items-center gap-2 text-12 font-bold text-link"
        >
          {linkLabel}
          <IconChevR size={16} />
        </button>
      ) : null}
      {trailing}
    </div>
  )
}

// --- ContextStrip ----------------------------------------------------------
// Shown when a screen was deep-linked from a KPI group, explaining why the list
// arrived pre-filtered.

export function ContextStrip({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-8 rounded-8 border border-primary-200 bg-primary-50 px-12 py-8 text-12 text-primary-600">
      {children}
    </div>
  )
}

// --- BannerTag ---------------------------------------------------------------
// Category pill sitting on a colored banner surface — translucent white fill,
// white text (Badge has no on-color variant; see NOTES.md).

export function BannerTag({ children }: { children: ReactNode }) {
  return (
    <span className="self-start rounded-full bg-neutral-white/20 px-12 py-2 text-12 font-regular text-neutral-white">
      {children}
    </span>
  )
}

// --- EmptyState ------------------------------------------------------------

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-40 text-center">
      <p className="text-14 font-bold text-default">{title}</p>
      <p className="text-12 text-caption">{body}</p>
    </div>
  )
}

// --- SegmentedChoice ---------------------------------------------------------
// Two (or three) evenly-sized pill-adjacent buttons, filling the row. Used for
// every yes/no branch question in the Kunjungan Rumah flow and the majelis
// visit-mode payment dialog. See NOTES.md for promotion.

export interface ChoiceOption<T extends string> {
  l: string
  v: T
}

export function SegmentedChoice<T extends string>({
  options,
  value,
  onPick,
}: {
  options: ChoiceOption<T>[]
  value: T | null
  onPick: (v: T) => void
}) {
  return (
    <div className="flex gap-8">
      {options.map((o) => {
        const on = value === o.v
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onPick(o.v)}
            className={`flex-1 rounded-8 border px-8 py-12 text-12 font-bold ${
              on ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-default bg-neutral-white text-neutral-700'
            }`}
          >
            {o.l}
          </button>
        )
      })}
    </div>
  )
}

// --- ChipPicker --------------------------------------------------------------
// Small wrapping pill buttons — reason chips, PTP date chips, and the compact
// Hadir/Tidak toggle on a majelis visit-mode mitra card.

export function ChipPicker<T extends string>({
  options,
  value,
  onPick,
}: {
  options: ChoiceOption<T>[]
  value: T | null
  onPick: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-6">
      {options.map((o) => {
        const on = value === o.v
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onPick(o.v)}
            className={`rounded-full border px-12 py-8 text-10 font-bold ${
              on ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-default bg-neutral-white text-neutral-700'
            }`}
          >
            {o.l}
          </button>
        )
      })}
    </div>
  )
}

// --- FlowQuestion --------------------------------------------------------
// One Q-block in the Kunjungan Rumah wizard: title, optional subtext, control.

export function FlowQuestion({
  title,
  sub,
  children,
}: {
  title: string
  sub?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-14 font-bold text-default">{title}</p>
        {sub ? <p className="mt-2 text-12 text-caption">{sub}</p> : null}
      </div>
      {children}
    </div>
  )
}
