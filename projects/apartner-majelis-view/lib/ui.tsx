'use client'

// Project-local components, built only from tokens + design-system components
// per the §4 missing-component protocol. See NOTES.md.
//
// Most of this is carried over from apartner-task-first unchanged — the two
// directions disagree about the FLOW, not the vocabulary. What is new here is
// StageBar and WeekStrip, which are the two things the Majelis View reference
// actually introduces.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Badge, BottomSheet, SelectableCard } from '@/design-system/components'
import { MagnifyingGlass, WhatsappLogo } from '@/design-system/icons'
import { ringkas, type Week } from './data'
import { IconCheck, IconChevronDown, IconChevronUp, IconPin, IconX } from './icons'

// --- The two marks ---------------------------------------------------------
// Two glyphs get one treatment each, wherever they appear, because a glyph that
// changes with context is a glyph the BP re-reads.
//
// WhatsApp is always green — every place it appears is a control, so there is
// no second case to distinguish.
//
// The PIN takes its colour from what it IS. Red when it is the button — a tap
// that opens a route — and inherited when it is punctuation in front of an
// address. Colour is the affordance here: a page with six red pins down it has
// spent the loudest colour it owns on labelling text that was already labelled
// by being an address, and the one pin that actually does something stops
// standing out.

export function PinMark({ size = 16 }: { size?: 16 | 20 | 24 }) {
  return (
    <span className="flex shrink-0">
      <IconPin size={size} />
    </span>
  )
}

export function WaMark({ size = 20 }: { size?: 16 | 20 | 24 }) {
  return (
    <span className="flex shrink-0 text-green-500">
      <WhatsappLogo size={size} />
    </span>
  )
}

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

// Three states, and the cell says which by its MARK, not by a number:
//
//   paid            tick, green
//   missed          cross, red
//   due, not late   nothing, grey, dotted
//
// The dotted ring is the whole point of the third one. This week's instalment
// is not a failure — it is a week that has not finished — and drawing it in a
// solid ring like the other two made "nothing has happened yet" look like an
// outcome. A dotted edge is the only thing on the rail that says "still open".
const WEEK_TONE: Record<Week['status'], { ring: string; text: string; label: string }> = {
  lunas: { ring: 'border-green-500 bg-green-50 text-green-500', text: 'text-green-500', label: 'Lunas' },
  // The one state the three-way split doesn't name. A part-payment is neither
  // paid nor missed, so it keeps its own colour and shows no mark — the amount
  // under the cell ("Rp150rb" against a Rp200rb week) is what tells the story,
  // and it is the reason this rail exists rather than a row of dots.
  sebagian: {
    ring: 'border-orange-500 bg-orange-50 text-orange-500',
    text: 'text-orange-500',
    label: 'Sebagian',
  },
  lewat: { ring: 'border-red-500 bg-red-50 text-red-500', text: 'text-red-500', label: 'Terlewat' },
  'jatuh-tempo': {
    ring: 'border-dotted border-neutral-400 bg-neutral-white text-neutral-500',
    text: 'text-caption',
    label: 'Jatuh tempo',
  },
}

/** How many weeks the rail holds. Ten is a season of payments, not a ledger. */
const STRIP_WEEKS = 10

export function WeekStrip({
  weeks,
  onSeeAll,
}: {
  weeks: Week[]
  /** Opens the full record. Omitted renders no link. */
  onSeeAll?: () => void
}) {
  // The last ten, because the rail is for the RECENT past: what happened over
  // the weeks the BP is about to ask about. Fifty cells was a ledger rendered
  // as a rail, and the forty at the far left were never scrolled to.
  const shown = weeks.slice(-STRIP_WEEKS)

  const rail = useRef<HTMLDivElement>(null)
  // Opens on THIS week, at the right edge, and the BP scrolls left into the
  // past. A rail that opens on week 1 puts the cell she actually came for off
  // screen and makes "swipe" the first thing she has to do.
  useEffect(() => {
    const el = rail.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [weeks])

  return (
    <div className="flex flex-col gap-8 rounded-12 bg-neutral-white p-12">
      {/* A title and nothing else. The cycle length and "minggu 9 dari 50" were
          two ways of saying how far through she is — which the rail itself
          shows, in the only form she can act on: which weeks went wrong. */}
      <span className="text-14 font-bold text-default">Riwayat Angsuran</span>

      {/* -mx-12 lets the rail bleed to the card's edges, so the last visible
          week is clipped by the card rather than by an inner gutter — which is
          what makes it read as scrollable without a scrollbar. */}
      <div ref={rail} className="-mx-12 overflow-x-auto px-12">
        <div className="flex gap-8">
          {shown.map((w) => {
            const tone = WEEK_TONE[w.status]
            return (
              // No week number anywhere on the rail — not above the cell, not
              // inside it. The date under the cell already says which week this
              // is in the only terms said out loud ("yang 7 Juli, Bu"); the
              // number was a second identifier for the same cell that only the
              // app was ever counting in, and inside the circle it sat where a
              // mark should be, so an unanswered week looked answered.
              <div key={w.no} className="flex w-48 shrink-0 flex-col items-center gap-4">
                <span className="text-10 text-disabled">{w.date}</span>
                <span
                  className={`flex h-32 w-32 items-center justify-center rounded-full border ${tone.ring}`}
                >
                  {w.status === 'lunas' ? (
                    <IconCheck size={16} />
                  ) : w.status === 'lewat' ? (
                    <IconX size={16} />
                  ) : null}
                </span>
                <span className={`text-10 font-bold ${tone.text}`}>{ringkas(w.paid)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {onSeeAll ? (
        <button
          type="button"
          onClick={onSeeAll}
          className="-mx-12 -mb-12 border-t border-default px-12 py-12 text-center text-12 font-bold text-link"
        >
          Lihat semua riwayat
        </button>
      ) : (
        <span className="text-center text-10 text-disabled">Geser untuk melihat minggu lainnya</span>
      )}
    </div>
  )
}

// --- RepaymentStrip --------------------------------------------------------
// The recent cycle as a FIXED row — the last eight weeks, sized to the card
// width and not scrollable. It replaces the horizontal rail on every
// payment-related page: a swipe hides the weeks it doesn't open on, and the
// question a BP brings to this strip ("how has the last month or two gone?") is
// answered by what fits on screen, not by what she can reach.
//
// Eight, because that is what sits comfortably across a phone at a legible mark
// size — a season of payments, the same span the reference draws on its
// overview card. The amounts are gone from under each cell (they live behind
// "Lihat Semua"); here a week is only its outcome, so the mark carries the whole
// meaning: green paid, orange part-paid, red missed, and a hollow primary ring
// for the week that has not closed yet.
const MARK_TONE: Record<Week['status'], string> = {
  lunas: 'border-green-500 bg-green-500 text-neutral-white',
  sebagian: 'border-orange-500 bg-orange-500 text-neutral-white',
  lewat: 'border-red-500 bg-red-500 text-neutral-white',
  'jatuh-tempo': 'border-2 border-primary-500 text-primary-500',
}

export function RepaymentStrip({ weeks }: { weeks: Week[] }) {
  const shown = weeks.slice(-STRIP_WEEKS_STATIC)
  return (
    <div className="flex items-start justify-between">
      {shown.map((w) => {
        const current = w.status === 'jatuh-tempo'
        return (
          <div key={w.no} className="flex flex-col items-center gap-4">
            <span
              className={`flex h-20 w-20 items-center justify-center rounded-full border ${MARK_TONE[w.status]}`}
            >
              {w.status === 'lunas' || w.status === 'sebagian' ? (
                <IconCheck size={16} />
              ) : w.status === 'lewat' ? (
                <IconX size={16} />
              ) : null}
            </span>
            <span className={`text-10 ${current ? 'font-bold text-primary-500' : 'text-disabled'}`}>
              {w.date}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Eight weeks fit across a phone at a legible mark size without scrolling. */
const STRIP_WEEKS_STATIC = 8

// --- ProductBadge ----------------------------------------------------------
// The lending product, wherever it appears — on a group in the directory or on
// a mitra in the roster. One component so the colours cannot drift between the
// two screens, which is the only way a colour code is worth having.
//
// The palette is deliberately disjoint from the STATUS badges beside it. Those
// own green / orange / yellow (lancar, DPD, draft), so a product cannot borrow
// one without the same hue meaning two things on a single card. That leaves
// blue and primary — Modal blue, GL purple — and Hybrid takes neutral, because
// it is not a third product: it is a group carrying both at once, and giving it
// its own hue would say otherwise.

export function ProductBadge({ product }: { product: 'Modal' | 'GL' | 'Hybrid' }) {
  const intent = product === 'Modal' ? 'blue' : product === 'GL' ? 'primary' : 'neutral'
  // "Hybrid" is the internal word; "GL Modal Mix" is what it actually means and
  // names both products in it, which is the whole reason a BP looks at this
  // badge before she opens the group.
  return <Badge intent={intent}>{product === 'Hybrid' ? 'GL Modal Mix' : product}</Badge>
}

// --- Finding things in a list ----------------------------------------------
// SearchField, FilterBar, FilterChip, OptionSheet and ResetLink are lifted from
// apartner-homepage-ia, which has the same problem on the same tab: a directory
// long enough that scrolling stops being an answer. Keeping the shapes
// identical is the point — the two directions should differ on the FLOW, and a
// second invention of "how do you filter a list" is noise in that comparison.
//
// The split between them: search is for a group the BP can NAME, filters are
// for a set she can only describe ("the Kamis ones", "the drafts").

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  /** Spoken label — a magnifier alone doesn't say what is being searched. */
  label: string
}) {
  return (
    <div className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 focus-within:border-primary-500">
      <span className="shrink-0 text-disabled">
        <MagnifyingGlass size={20} />
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
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

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-8 overflow-x-auto">{children}</div>
}

/**
 * A dropdown-trigger pill. It names the CHOSEN value rather than the dimension
 * once something is picked — "Kamis", not "Hari kumpulan" — so a filtered list
 * says why it is short without the BP opening anything.
 */
export function FilterChip({
  label,
  active,
  open,
  onClick,
}: {
  label: string
  active: boolean
  open: boolean
  onClick: () => void
}) {
  const tone = active
    ? 'border-primary-500 bg-primary-50 text-primary-500'
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
        <IconChevronDown size={16} />
      </span>
    </button>
  )
}

export function ResetLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="shrink-0 text-12 font-bold text-link">
      Reset
    </button>
  )
}

/** Single-choice picker: the design system's BottomSheet over SelectableCard. */
export function OptionSheet<T>({
  open,
  title,
  name,
  options,
  value,
  onPick,
  onClose,
}: {
  open: boolean
  title: string
  name: string
  options: { label: string; value: T }[]
  value: T
  onPick: (v: T) => void
  onClose: () => void
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-8">
        {options.map((o) => (
          <SelectableCard
            key={o.label}
            name={name}
            title={o.label}
            checked={o.value === value}
            onChange={() => onPick(o.value)}
          />
        ))}
      </div>
    </BottomSheet>
  )
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-12 bg-neutral-white p-24 text-center">
      <span className="text-14 font-bold text-default">{title}</span>
      <span className="text-12 text-caption">{body}</span>
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

// --- ChoicePill ------------------------------------------------------------
// The two-outcome control at the bottom of a stage card: "Tidak / Hadir",
// "Tidak tertarik / Tertarik". Named pills rather than a bare ✗/✓, because a
// tick alone has no fixed meaning next to a red DPD line — and unselected is a
// real third state, since not answered ≠ answered no.
//
// Selection is PRIMARY, not green-for-yes and red-for-no. The pills record what
// was said; they are not a verdict on it, and a red "Tidak hadir" on a card that
// also carries a red DPD badge puts two different alarms in the same colour.
// One selected colour also means the same control reads identically on all
// three stages, which is the point of the card keeping one shape.

export interface ChoicePillProps {
  selected: boolean
  onClick: () => void
  /** Spoken label — "Hadir" alone doesn't say whose attendance this is. */
  label: string
  /** The mark after the word — a tick for yes, a cross for no. */
  icon: ReactNode
  children: ReactNode
}

export function ChoicePill({ selected, onClick, label, icon, children }: ChoicePillProps) {
  const classes = selected
    ? 'bg-primary-50 text-primary-500 border-primary-500'
    : 'bg-neutral-white text-neutral-600 border-default'

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={`flex h-40 flex-1 items-center justify-center gap-4 rounded-full border px-12 text-14 font-bold ${classes}`}
    >
      {children}
      <span className="shrink-0">{icon}</span>
    </button>
  )
}

// --- ActionRow -------------------------------------------------------------
// The bottom half of a stage card: what is at stake on the left, the one
// control on the right. Every stage uses it, which is what keeps the card the
// same object as the BP moves from attendance to collection to offers — only
// the caption, the figure and the verb change.

export function ActionRow({
  label,
  value,
  children,
}: {
  label: string
  /** The figure, bold. Omitted when the label is the whole fact. */
  value?: ReactNode
  /** The control. A button, a badge, or a badge and a way to change it. */
  children?: ReactNode
}) {
  return (
    <div className="flex items-center gap-12">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="truncate text-12 text-caption">{label}</span>
        {value ? <span className="truncate text-16 font-bold text-default">{value}</span> : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  )
}

// --- ResultRow -------------------------------------------------------------
// What a card says once its outcome is RECORDED — the collection stage's other
// half, and deliberately not `ActionRow`.
//
// ActionRow is one line with one control on the right, which is right while the
// card still asks for something ("Tagihan Rp650.000 · [Tagih]"). The moment an
// outcome exists there are three or four facts to carry — the amount, what kind
// of outcome it was, what is still short, why — and squeezing them into one row
// meant the amount, a badge and "Ubah" fought over the same 340px, with the
// shortfall reduced to text inside a badge.
//
// So: the figure gets its own line at reading size with its status beside it,
// "Ubah" sits out at the edge as a link rather than a button, and anything
// further — what is still owed, the reason, the promise — drops to a SECOND row
// under a rule. The row only appears when there is something to put in it, so a
// clean "Lunas" stays exactly one row tall.

export function ResultRow({
  label,
  amount,
  badge,
  onEdit,
  detail,
}: {
  label: string
  /** The figure, at reading size. */
  amount: string
  /** What kind of outcome it was, set beside the figure rather than opposite it. */
  badge?: ReactNode
  /** Reopens whatever produced the outcome. Omitted renders no "Ubah". */
  onEdit?: () => void
  /** The second row. Omitted renders no rule and no row. */
  detail?: { label: string; value: string; tone?: 'red' | 'default'; note?: string }
}) {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-center gap-12">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="truncate text-12 text-caption">{label}</span>
          {/* Wraps rather than truncates: on a narrow card the badge drops under
              the figure instead of shortening it, and a half-printed amount is
              the one thing this row must never do. */}
          <span className="flex flex-wrap items-center gap-8">
            <span className="text-20 font-bold text-default">{amount}</span>
            {badge}
          </span>
        </div>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 text-14 font-bold text-primary-500"
          >
            Ubah
          </button>
        ) : null}
      </div>

      {detail ? (
        <div className="flex flex-col gap-2 border-t border-default pt-12">
          <span className="text-12 text-caption">{detail.label}</span>
          <span
            className={`text-16 font-bold ${detail.tone === 'red' ? 'text-red-500' : 'text-default'}`}
          >
            {detail.value}
          </span>
          {detail.note ? <span className="text-12 text-caption">{detail.note}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

// --- OptionCard ------------------------------------------------------------
// A radio card that can HOLD the thing its option needs — an amount field, a
// reason list — inside itself.
//
// FunDS `SelectableCard` is the right look and the wrong shape for that: it is a
// `<label>`, so every click inside it re-triggers the radio and pulls focus back
// off whatever the BP was typing in. This is the same card drawn from tokens,
// with the label reduced to the header row, so the body below it is ordinary
// interactive content.
//
// Why the follow-up belongs INSIDE the option rather than under the list: at the
// bottom of the page a reason field is a second question the BP has to connect
// back to the answer that caused it, and on a screen where three of four options
// have follow-ups, that connection is exactly what gets mis-made under time
// pressure. In the card, the question is where the answer was.

export function OptionCard({
  selected,
  title,
  description,
  onSelect,
  children,
}: {
  selected: boolean
  title: string
  description?: string
  onSelect: () => void
  /** The option's follow-up. Rendered only while the option is selected. */
  children?: ReactNode
}) {
  return (
    <div
      className={`flex flex-col gap-12 rounded-8 border p-12 ${
        selected ? 'border-primary-500 bg-primary-50' : 'border-default bg-neutral-white'
      }`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        className="flex items-center gap-12 text-left"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-14 font-bold text-default">{title}</span>
          {description ? <span className="text-12 text-caption">{description}</span> : null}
        </span>
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border bg-neutral-white ${
            selected ? 'border-primary-500' : 'border-neutral-400'
          }`}
        >
          {selected ? <span className="h-8 w-8 rounded-full bg-primary-500" /> : null}
        </span>
      </button>
      {selected && children ? <div className="flex flex-col gap-12">{children}</div> : null}
    </div>
  )
}

// --- ChoiceList / ChosenRow ------------------------------------------------
// A single-choice reason picker, as a list of full-width rows rather than a
// wrap of chips.
//
// Chips were the wrong shape for this: reasons are sentences of uneven length,
// so a chip wrap reflows into a ragged block that has to be READ before it can
// be tapped, and the tap targets end up different sizes on every card. Rows are
// one column, one line each, one target size — the BP scans down and hits one.
//
// Once picked, the whole list collapses to the answer plus "Ubah". A resolved
// card is a record, and a record does not need to keep showing the four things
// it could have said instead.

export function ChoiceList({
  label,
  options,
  value,
  onPick,
}: {
  label: string
  options: string[]
  value?: string
  onPick: (option: string) => void
}) {
  return (
    <div className="flex flex-col gap-8">
      <span className="text-12 text-caption">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-col gap-8">
        {options.map((option) => {
          const selected = option === value
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onPick(option)}
              className={`flex items-center gap-12 rounded-8 border p-12 text-left ${
                selected ? 'border-primary-500 bg-primary-50' : 'border-default bg-neutral-white'
              }`}
            >
              <span
                className={`min-w-0 flex-1 truncate text-14 ${selected ? 'font-bold text-primary-500' : 'text-default'}`}
              >
                {option}
              </span>
              <span
                className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border ${
                  selected
                    ? 'border-primary-500 bg-primary-500 text-neutral-white'
                    : 'border-default bg-neutral-white'
                }`}
              >
                {selected ? <IconCheck size={16} /> : null}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ChosenRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  /** Reopens the list. Omitted renders no "Ubah". */
  onChange?: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-8">
        <span className="min-w-0 flex-1 truncate text-12 text-caption">{label}</span>
        {onChange ? (
          <button
            type="button"
            onClick={onChange}
            className="shrink-0 text-12 font-bold text-primary-500"
          >
            Ubah
          </button>
        ) : null}
      </div>
      <span className="truncate text-14 text-default">{value}</span>
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
  tone = 'default',
  onClick,
  children,
}: {
  label: string
  /** Unread count; 0 hides the counter entirely. */
  count?: number
  /**
   * Tints the glyph. The two that are tinted are tinted everywhere in this
   * project: WhatsApp is green and a location pin is red, on a header, in a
   * card, or in a line of caption text. A glyph that changes colour by context
   * is a glyph the BP re-reads.
   */
  tone?: 'default' | 'green' | 'red'
  onClick?: () => void
  children: ReactNode
}) {
  const toneClass =
    tone === 'green' ? 'text-green-500' : tone === 'red' ? 'text-red-500' : 'text-default'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={count > 0 ? `${label}, ${count} belum dibaca` : label}
      className={`relative flex h-32 w-32 shrink-0 items-center justify-center ${toneClass}`}
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

export type Tint = 'primary' | 'red' | 'green' | 'blue' | 'orange'

export function IconTile({ tint, children }: { tint: Tint; children: ReactNode }) {
  const tone =
    tint === 'red'
      ? 'bg-red-50 text-red-500'
      : tint === 'green'
        ? 'bg-green-50 text-green-500'
        : tint === 'blue'
          ? 'bg-blue-50 text-blue-500'
          : tint === 'orange'
            ? 'bg-orange-50 text-orange-500'
            : 'bg-primary-50 text-primary-500'
  return (
    <span className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-8 ${tone}`}>
      {children}
    </span>
  )
}

// --- ContactButton ---------------------------------------------------------
// The round WhatsApp / handset pair. It lives here rather than beside the
// doorstep card because reaching someone is the whole job on two different
// screens now — a home visit that fails at a locked gate, and a follow-up call
// where the contact IS the task.

export function ContactButton({
  label,
  tone,
  onClick,
  children,
}: {
  label: string
  tone: 'green' | 'primary'
  onClick?: () => void
  children: ReactNode
}) {
  const classes =
    tone === 'green'
      ? 'bg-green-50 text-green-500 border-green-500'
      : 'bg-primary-50 text-primary-500 border-primary-200'
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-40 w-40 items-center justify-center rounded-full border ${classes}`}
    >
      {children}
    </button>
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
