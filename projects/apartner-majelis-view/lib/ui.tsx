'use client'

// Project-local components, built only from tokens + design-system components
// per the §4 missing-component protocol. See NOTES.md.
//
// Most of this is carried over from apartner-task-first unchanged — the two
// directions disagree about the FLOW, not the vocabulary. What is new here is
// StageBar and WeekStrip, which are the two things the Majelis View reference
// actually introduces.

import { useState, type ReactNode } from 'react'
import { ringkas, type Week } from './data'
import { IconCheck, IconChevronDown, IconChevronUp, IconX } from './icons'

// --- Avatar ----------------------------------------------------------------

export function Avatar({ name, size = 40 }: { name: string; size?: 32 | 40 }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  const box = size === 32 ? 'h-32 w-32 text-12' : 'h-40 w-40 text-14'

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary-50 font-bold text-primary-500 ${box}`}
    >
      {initials}
    </span>
  )
}

// --- StageBar --------------------------------------------------------------
// The three stages of a visit, as numbered circles joined by rails. This
// replaces the flat progress bars of apartner-task-first for one reason: in that
// direction the steps were a sequence you moved through, while here stage 1 is a
// GATE — collection genuinely cannot open until attendance is complete — and a
// gate needs to show which stages are closed behind you and which are still shut.
//
// A cleared stage turns green and swaps its number for a tick. That is the same
// pairing the rest of the system uses for a settled state, and it means the
// final recap can show all three ticked without needing a fourth visual idea.
//
// Deliberately not tappable. Stages advance by being finished, and a BP who
// could jump to Collection by tapping "2" would walk straight past the gate the
// direction exists to test.

export const STAGE_LABELS = ['Kehadiran', 'Penagihan', 'Penawaran']

// A home visit is one mitra, so there is no queue to clear and no cross-sell
// tail: meet her and settle the money, then prove it. Two stages, same bar —
// the sequence is the same shape, it is just shorter.
export const HOME_STAGE_LABELS = ['Temui & Tagih', 'Bukti & Kirim']

export function StageBar({
  current,
  labels = STAGE_LABELS,
}: {
  /** 1-based. One past the last label means every stage is cleared. */
  current: number
  labels?: string[]
}) {
  return (
    <div className="flex items-start">
      {labels.map((label, i) => {
        const no = i + 1
        const done = no < current
        const active = no === current
        const circle = done
          ? 'bg-green-500 text-neutral-white'
          : active
            ? 'bg-primary-500 text-neutral-white'
            : 'bg-neutral-200 text-neutral-600'
        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-4">
            <div className="flex w-full items-center gap-4">
              {/* The rails are half-width spacers on the outer edges so the
                  circles stay centred over their labels — a full rail on the
                  first and last stage would push both inward. */}
              <span
                className={`h-2 flex-1 rounded-full ${i === 0 ? 'bg-transparent' : done || active ? 'bg-green-500' : 'bg-neutral-200'}`}
              />
              <span
                className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-12 font-bold ${circle}`}
              >
                {done ? <IconCheck size={16} /> : no}
              </span>
              <span
                className={`h-2 flex-1 rounded-full ${i === labels.length - 1 ? 'bg-transparent' : done ? 'bg-green-500' : 'bg-neutral-200'}`}
              />
            </div>
            <span
              className={`text-10 font-bold uppercase ${active ? 'text-primary-500' : done ? 'text-green-500' : 'text-caption'}`}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// --- WeekStrip -------------------------------------------------------------
// The repayment ledger as a horizontal rail — the one piece of the reference
// direction the designer singled out to keep.
//
// The point of it, and the reason it beats a list of week rows, is that it
// carries the AMOUNT inside each week rather than only a paid/unpaid dot. A dot
// tells the BP that week 7 went wrong; "Rp150rb" tells her what actually
// happened — a shortfall, not a miss — which is the difference between "Ibu
// belum bayar" and "Ibu kurang Rp50.000", and only one of those is a sentence
// she can say without being contradicted.
//
// It scrolls rather than compressing: 50 weeks cannot be shown at once, and a
// strip that shrank to fit would turn the amounts back into dots, losing the
// only thing it was for.

const WEEK_TONE: Record<Week['status'], { ring: string; text: string; label: string }> = {
  lunas: { ring: 'border-green-500 bg-green-50 text-green-500', text: 'text-green-500', label: 'Lunas' },
  sebagian: {
    ring: 'border-orange-500 bg-orange-50 text-orange-500',
    text: 'text-orange-500',
    label: 'Sebagian',
  },
  lewat: { ring: 'border-red-500 bg-red-50 text-red-500', text: 'text-red-500', label: 'Terlewat' },
  'jatuh-tempo': {
    ring: 'border-primary-500 bg-primary-50 text-primary-500',
    text: 'text-primary-500',
    label: 'Jatuh tempo',
  },
}

export function WeekStrip({ weeks, totalWeeks }: { weeks: Week[]; totalWeeks: number }) {
  const current = weeks[weeks.length - 1]

  return (
    <div className="flex flex-col gap-8 rounded-12 bg-neutral-white p-12">
      <div className="flex items-center gap-8">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-14 font-bold text-default">Riwayat Angsuran</span>
          <span className="text-12 text-caption">{totalWeeks} minggu total</span>
        </div>
        <span className="shrink-0 rounded-full bg-primary-50 px-12 py-4 text-12 font-bold text-primary-500">
          Minggu {current.no} dari {totalWeeks}
        </span>
      </div>

      {/* -mx-12 lets the rail bleed to the card's edges, so the last visible
          week is clipped by the card rather than by an inner gutter — which is
          what makes it read as scrollable without a scrollbar. */}
      <div className="-mx-12 overflow-x-auto px-12">
        <div className="flex gap-8">
          {weeks.map((w) => {
            const tone = WEEK_TONE[w.status]
            return (
              <div key={w.no} className="flex w-48 shrink-0 flex-col items-center gap-4">
                <span className="text-10 font-bold text-caption">M{w.no}</span>
                <span className="text-10 text-disabled">{w.date}</span>
                <span
                  className={`flex h-32 w-32 items-center justify-center rounded-full border ${tone.ring}`}
                >
                  {w.status === 'lunas' ? (
                    <IconCheck size={16} />
                  ) : w.status === 'lewat' ? (
                    <IconX size={16} />
                  ) : (
                    <span className="text-12 font-bold">{w.no}</span>
                  )}
                </span>
                <span className={`text-10 font-bold ${tone.text}`}>{ringkas(w.paid)}</span>
              </div>
            )
          })}
        </div>
      </div>

      <span className="text-center text-10 text-disabled">Geser untuk melihat minggu lainnya</span>
    </div>
  )
}

// --- Collapsible -----------------------------------------------------------

export interface CollapsibleProps {
  title: string
  /** Right-aligned hint in the header, e.g. a count. */
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

// --- AttendancePill --------------------------------------------------------
// Two named pills, "Hadir" and "Tidak". Carried over from apartner-task-first,
// including its argument: a bare ✗ has no fixed meaning next to a red DPD line,
// and unselected is a real third state — not marked ≠ marked absent.

export interface AttendancePillProps {
  selected: boolean
  tone: 'green' | 'red'
  onClick: () => void
  /** Spoken label — "Hadir" alone doesn't say whose attendance this is. */
  label: string
  children: ReactNode
}

export function AttendancePill({
  selected,
  tone,
  onClick,
  label,
  children,
}: AttendancePillProps) {
  const selectedTone =
    tone === 'green'
      ? 'bg-green-50 text-green-500 border-green-500'
      : 'bg-red-50 text-red-500 border-red-500'
  const classes = selected ? selectedTone : 'bg-neutral-white text-neutral-600 border-default'

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={`flex h-40 flex-1 items-center justify-center rounded-full border px-12 text-14 font-bold ${classes}`}
    >
      {children}
    </button>
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
    ? 'border-primary-500 bg-primary-50 text-primary-500'
    : 'border-default bg-neutral-white text-neutral-700'
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

export function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-8">
      <span className="text-12 font-bold text-default">{label}</span>
      <div className="flex flex-wrap gap-8">{children}</div>
    </div>
  )
}

// --- ProgressCard ----------------------------------------------------------
// The stage's own progress, as a headline pair over a meter. Stage 1 counts
// people, stage 2 counts money, and both want the same shape: what has been
// done, out of what, and how far along that is.

export function ProgressCard({
  title,
  value,
  of,
  percent,
  tone = 'primary',
}: {
  title: string
  value: string
  /** The denominator, printed quietly beside the value. */
  of?: string
  percent: number
  tone?: 'primary' | 'green'
}) {
  return (
    <div className="flex flex-col gap-8 rounded-12 bg-neutral-white p-12">
      <div className="flex items-end gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-12 text-caption">{title}</span>
          <span className="flex items-baseline gap-4">
            <span className="text-24 font-bold text-default">{value}</span>
            {of ? <span className="text-14 text-caption">dari {of}</span> : null}
          </span>
        </div>
        <span className={`text-18 font-bold ${tone === 'green' ? 'text-green-500' : 'text-primary-500'}`}>
          {percent}%
        </span>
      </div>
      <Meter progress={percent} tone={tone} />
    </div>
  )
}

// --- ProofTile -------------------------------------------------------------
// One of the two captures that gate submitting a visit. Location proves the BP
// was THERE, which a photo alone cannot establish — a photo can be taken
// anywhere — so the two sit side by side as equal tiles.

export function ProofTile({
  done,
  label,
  doneLabel,
  icon,
  onClick,
}: {
  done: boolean
  label: string
  doneLabel: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-8 rounded-12 border p-16 text-center ${
        done ? 'border-green-500 bg-green-50' : 'border-default bg-neutral-white'
      }`}
    >
      <span
        className={`flex h-48 w-48 items-center justify-center rounded-full ${
          done ? 'bg-green-50 text-green-500' : 'bg-primary-50 text-primary-500'
        }`}
      >
        {done ? <IconCheck size={24} /> : icon}
      </span>
      <span className={`text-14 font-bold ${done ? 'text-green-500' : 'text-default'}`}>
        {done ? doneLabel : label}
      </span>
    </button>
  )
}

// --- SectionTitle ----------------------------------------------------------

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-14 font-bold text-default">{children}</h2>
}

// --- StatRows --------------------------------------------------------------
// Label/value rows. Used for the outstanding breakdown, which is the one place
// in this direction where the BP genuinely does have to read four numbers —
// they are the four she has to explain out loud.

export interface StatRow {
  label: string
  value: string
  /** Colours the value. `strong` is the total line. */
  tone?: 'default' | 'strong' | 'red' | 'orange' | 'green'
}

export function StatRows({ rows }: { rows: StatRow[] }) {
  const toneClass = (tone: StatRow['tone']) =>
    tone === 'red'
      ? 'text-red-500'
      : tone === 'orange'
        ? 'text-orange-500'
        : tone === 'green'
          ? 'text-green-500'
          : 'text-default'

  return (
    <div className="rounded-12 bg-neutral-white">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex items-center gap-12 px-12 py-12 ${i === 0 ? '' : 'border-t border-default'}`}
        >
          <span className="flex-1 text-14 text-caption">{row.label}</span>
          <span
            className={`font-bold ${row.tone === 'strong' ? 'text-18' : 'text-14'} ${toneClass(row.tone)}`}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// --- Meter -----------------------------------------------------------------

// `muted` exists for the held ladder rung: a frozen bar that still reads purple
// looks like it is still moving, which is the one thing it must not imply.
export function Meter({
  progress,
  tone = 'primary',
}: {
  progress: number
  tone?: 'primary' | 'green' | 'orange' | 'red' | 'muted'
}) {
  const clamped = Math.max(0, Math.min(100, progress))
  const fill =
    tone === 'green'
      ? 'bg-green-500'
      : tone === 'orange'
        ? 'bg-orange-500'
        : tone === 'red'
          ? 'bg-red-500'
          : tone === 'muted'
            ? 'bg-neutral-400'
            : 'bg-primary-500'
  return (
    <div className="h-8 w-full rounded-full bg-neutral-200">
      <div
        className={`h-8 rounded-full ${fill}`}
        // A data-driven width is the one dimension a progress meter cannot take
        // from a token — the value IS the geometry. Every colour and height
        // around it is still a token.
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

// --- Overline --------------------------------------------------------------

export function Overline({ children }: { children: ReactNode }) {
  return <div className="text-10 font-bold uppercase text-caption">{children}</div>
}

// --- HeaderAction ----------------------------------------------------------
// An icon button for the schedule's top bar, with an optional unread count.
// FunDS Lite has no icon-button component, and Badge is a pill for inline
// status rather than a corner-mounted counter.

export function HeaderAction({
  label,
  count = 0,
  onClick,
  children,
}: {
  label: string
  /** Unread count; 0 hides the counter entirely. */
  count?: number
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={count > 0 ? `${label}, ${count} belum dibaca` : label}
      className="relative flex h-32 w-32 shrink-0 items-center justify-center text-default"
    >
      {children}
      {count > 0 ? (
        <span className="absolute right-0 top-0 flex h-16 min-w-16 items-center justify-center rounded-full border-2 border-neutral-white bg-red-500 px-4 text-10 font-bold text-neutral-white">
          {count}
        </span>
      ) : null}
    </button>
  )
}

// --- AgendaRow -------------------------------------------------------------
// The calendar gutter. Time lives OUTSIDE the card, in a fixed left column, so
// every task on the day lines up on one clock rail and the card itself carries
// only what the task IS. That is what makes the page read as an agenda rather
// than a list: the eye scans the times down the left edge.
//
// `until` is set only on the focus card — an upcoming slot needs its start
// time; the one you are standing in needs to know when it ends.

export function AgendaRow({
  time,
  until,
  muted,
  children,
}: {
  time: string
  until?: string
  /** Dims the gutter for slots that are done. */
  muted?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-8">
      <div className="flex w-40 shrink-0 flex-col items-end pt-12">
        <span className={`text-12 font-bold ${muted ? 'text-disabled' : 'text-default'}`}>
          {time}
        </span>
        {until ? <span className="text-10 text-disabled">{until}</span> : null}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

// --- IconTile --------------------------------------------------------------

export function IconTile({ tint, children }: { tint: 'primary' | 'red' | 'green'; children: ReactNode }) {
  const tone =
    tint === 'red'
      ? 'bg-red-50 text-red-500'
      : tint === 'green'
        ? 'bg-green-50 text-green-500'
        : 'bg-primary-50 text-primary-500'
  return (
    <span className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-8 ${tone}`}>
      {children}
    </span>
  )
}

// --- VisitTitle ------------------------------------------------------------

export function VisitTitle({ title, when }: { title: string; when: string }) {
  return (
    <span className="flex flex-col">
      <span className="text-16 font-bold text-default">{title}</span>
      <span className="text-12 font-regular text-caption">{when}</span>
    </span>
  )
}

// --- StickyBar -------------------------------------------------------------
// The footer every stage ends with. It exists as a component because four
// screens use it and one of them — the collect page — puts a live summary above
// its button, which has to sit INSIDE the sticky region or it scrolls away from
// the action it is qualifying.

export function StickyBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-16 mt-auto flex flex-col gap-12 border-t border-default bg-neutral-white p-16">
      {children}
    </div>
  )
}
