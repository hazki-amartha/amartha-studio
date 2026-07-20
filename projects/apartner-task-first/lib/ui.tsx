'use client'

// Project-local components, built only from tokens + design-system components
// per the §4 missing-component protocol. See NOTES.md for promotion proposals.

import { useState, type ReactNode } from 'react'
import { IconCheck, IconChevronDown, IconChevronUp } from './icons'

// --- Avatar ----------------------------------------------------------------
// The circular initials chip that leads every mitra row. FunDS Lite has no
// avatar; ListRow just types its `leading` slot as ReactNode.

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

// --- AttendancePill --------------------------------------------------------
// The attendance control on every mitra card: two named pills, "Hadir" and
// "Tidak", sitting in the card's trailing slot.
//
// This replaced a pair of circular ✗ / ✓ icon buttons. The argument for icons
// was density — at 22 cards the two words repeat 44 times for a question whose
// answer is a shape. The argument against, which won, is that a bare ✗ has no
// fixed meaning on a collection card: it reads as "absent" only once you have
// been told, and the nearest neighbour on screen (a red DPD line) already means
// something bad. A word costs horizontal space and removes the guess.
//
// Selected still uses the sanctioned status pairing (a 500 foreground on its
// own 50 tint) rather than primary-500: attendance is a STATUS, not a primary
// action, and green/red resolves while scanning a roster where two purple pills
// would differ only by their label.
//
// Unselected is a real third state — the BP has not marked her yet, which is
// not the same as marking her absent — so there is no default. The unselected
// style is load-bearing: neutral-400 on neutral-50 is the DISABLED pairing and
// made unanswered cards look switched off, so it is an outlined pill on white.

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
      // px-12, not px-16: the two pills share the identity row with an avatar
      // and an 18px name, and at 390px the wider padding truncated "Rina
      // Marlina". Height stays 40 for the tap target and the card's rhythm.
      className={`flex h-40 shrink-0 items-center justify-center rounded-full border px-12 text-14 font-bold ${classes}`}
    >
      {children}
    </button>
  )
}

// --- Chip ------------------------------------------------------------------
// A compact selectable pill that wraps in a group. This is what shortened the
// Tagih sheet: the reason list and the janji-bayar list were nine stacked
// SelectableCards, which pushed "Simpan" below the fold on the outcome the BP
// reaches most often after a full payment.
//
// Chips are right for these two lists specifically because the options are all
// short, mutually exclusive, and need no description — the label IS the whole
// option. The sheet's MODE switch stays SelectableCard: "Bayar Penuh" carries
// the amount as a second line, and it is the choice the rest of the sheet
// depends on, so it should not look like the same weight as a reason tag.

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

// --- ProofTile -------------------------------------------------------------
// One of the two proof captures that gate submitting a visit: location, then
// photo. Both visits close the same way, so the pair lives here rather than
// being re-authored per flow.
//
// Location is proof the BP was THERE, which a photo alone cannot establish —
// a photo can be taken anywhere, and the whole point of the capture is that the
// visit is verifiable after the fact. Recording it is one tap and needs no
// preview, so the two sit side by side as equal tiles rather than the photo
// keeping its big drop-zone and location becoming a footnote under it.

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

// --- StepBar ---------------------------------------------------------------
// Three bars + a label, pinned under the header on every majelis-visit step.
// A visit is a sequence, so the BP should never have to wonder how much of it
// is left. Deliberately not tappable: steps advance by finishing them, in the
// same spirit as the schedule promoting the next task by itself.

// The two flows no longer run the same number of steps, and that is the point.
// A majelis visit is three: collect, offer, prove. A home visit is TWO — a home
// visit happens because a mitra is behind, so there is nothing to cross-sell and
// the offer step was cut. See NOTES.
// "Bukti & Kirim" rather than "Foto & Kirim": the last step gates on a location
// AND a photo, and naming it after only one of them made the other look
// optional.
export const STEP_LABELS = ['Kehadiran & Pembayaran', 'Tugas Tambahan', 'Bukti & Kirim']
export const HOME_STEP_LABELS = ['Temui & Tagih', 'Bukti & Kirim']

// The step's NAME is the heading, and "Langkah 1 dari 3" is the caption beneath
// it. The two were previously fused into one small line, which buried the only
// part the BP actually needs: what this screen is asking her to do. Position is
// reassurance — useful, but secondary to the job.
export function StepBar({
  current,
  labels = STEP_LABELS,
}: {
  current: number
  labels?: string[]
}) {
  const total = labels.length
  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-4">
        {labels.map((label, i) => (
          <span
            key={label}
            className={`h-4 flex-1 rounded-full ${i < current ? 'bg-primary-500' : 'bg-neutral-200'}`}
          />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-20 font-bold text-default">{labels[current - 1]}</span>
        <span className="text-10 font-bold uppercase text-caption">
          Langkah {current} dari {total}
        </span>
      </div>
    </div>
  )
}

// --- VisitTitle ------------------------------------------------------------
// The header of any visit carries two facts, not one: which visit this is, and
// WHEN it was scheduled. The clock line matters in the field — a BP running two
// hours late needs to see which slot she is actually standing in, and the app
// otherwise drops the schedule the moment the visit opens.

export function VisitTitle({ title, when }: { title: string; when: string }) {
  return (
    <span className="flex flex-col">
      <span className="text-16 font-bold text-default">{title}</span>
      <span className="text-12 font-regular text-caption">{when}</span>
    </span>
  )
}

// --- InfoPill --------------------------------------------------------------
// The header affordance that opens a status page. A pill (not a bare link)
// because it sits opposite a back arrow and has to read as a control at a
// glance; label plus icon because an "i" alone is a guess.

export function InfoPill({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-4 rounded-full border border-primary-200 bg-primary-50 px-12 py-4 text-12 font-bold text-primary-500">
      {children}
    </span>
  )
}

// --- SectionTitle ----------------------------------------------------------
// A plain 14px heading over a list. Louder than an Overline, for the one list
// that IS the screen's subject rather than a zone within it.

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-14 font-bold text-default">{children}</h2>
}

// --- StatRows --------------------------------------------------------------
// The visit's status, as label/value rows rather than a hero number. Step 1's
// subject is the mitra list; the totals are reassurance the BP glances at, so
// they are quiet by design — a 24px count at the top of the screen competed
// with the queue it was supposed to be summarising.

export interface StatRow {
  label: string
  value: string
  /** Optional second line under the value, e.g. the money behind a count. */
  detail?: string
}

export function StatRows({ rows }: { rows: StatRow[] }) {
  return (
    <div className="rounded-12 bg-neutral-white">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex items-start gap-12 px-12 py-12 ${i === 0 ? '' : 'border-t border-light'}`}
        >
          <span className="flex-1 text-14 text-caption">{row.label}</span>
          <span className="flex flex-col items-end">
            <span className="text-14 font-bold text-default">{row.value}</span>
            {row.detail ? <span className="text-12 text-caption">{row.detail}</span> : null}
          </span>
        </div>
      ))}
    </div>
  )
}

// --- Overline --------------------------------------------------------------
// The 10px uppercase micro label that separates the schedule's three zones.

export function Overline({ children }: { children: ReactNode }) {
  return <div className="text-10 font-bold uppercase text-caption">{children}</div>
}
