'use client'

// Project-local components, built only from tokens + design-system components
// per the §4 missing-component protocol. See NOTES.md.
//
// Most of this is carried over from apartner-task-first unchanged — the two
// directions disagree about the FLOW, not the vocabulary. What is new here is
// StageBar and WeekStrip, which are the two things the Majelis View reference
// actually introduces.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Screen, type ScreenProps } from '@/platform/primitives'
import { Badge, BottomSheet, Button, Input, SelectableCard } from '@/design-system/components'
import { ProductLogo } from '@/design-system/assets'
import {
  CheckCircleFill,
  CrossCircleFill,
  Image,
  MagnifyingGlass,
  MapPin,
  NotePencil,
  WhatsappLogo,
} from '@/design-system/icons'
import { ringkas, rupiah, type Week } from './data'
import { agentCodeFor, SETTLE_METHOD_LABEL, taskCode } from './schedule'
import { IconCheck, IconChevronDown, IconChevronUp, IconX } from './icons'
import {
  depositEntries,
  depositExpected,
  REJECT_AFTER,
  settledTotal,
  unsettledTotal,
  useApp,
} from './store'

// --- The two marks ---------------------------------------------------------
// Two glyphs get one treatment each, wherever they appear, because a glyph that
// changes with context is a glyph the BP re-reads.
//
// WhatsApp is always green. The PIN takes its colour from what it IS: red when
// it is a control (inside a round `ContactButton`, which sets the tint on the
// container), inherited when it is punctuation in front of an address. A page
// with six red pins down it has spent the loudest colour it owns on labelling
// text that was already labelled by being an address.
//
// Both draw from `@/design-system/icons` — the pin used to come from the
// project-local `icons.tsx`, which strokes at 1.6 where FunDS strokes at 2, so
// the pin and the WhatsApp glyph beside it in the same button were drawn at two
// different weights.

export function PinMark({ size = 16 }: { size?: 16 | 20 | 24 }) {
  return (
    <span className="flex shrink-0">
      <MapPin size={size} />
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
// The stages of a visit, as numbered circles joined by rails. This
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

// Four, not three. Bukti used to sit OUTSIDE the bar on the argument that
// attendance, collection and offers are the work while proof is the paperwork
// that closes it — true of the job, and wrong for the screen: a BP three taps
// from finishing was shown a bar that said she was already done, and the same
// visit ran on a 3-step bar in the majelis flow and a 4th-step-shaped one at the
// door. The home visit counts its own Bukti & Kirim as a step; this now matches.
export const STAGE_LABELS = ['Kehadiran', 'Penagihan', 'Penawaran', 'Bukti']

// A home visit is one mitra, so there is no queue to clear and no cross-sell
// tail. Persiapan reviews who she is, records who was met, and — when nobody was
// home — takes the visit note right there and skips straight to Bukti & Kirim,
// since there is nothing to tagih from a locked door. Otherwise the Tagih step
// settles the money against the ledger, then Bukti & Kirim proves the visit.
export const HOME_STAGE_LABELS = ['Kunjungi', 'Tagih', 'Kirim bukti']

/**
 * The BP app's page frame: a platform `Screen` on this direction's own cool
 * canvas (`canvas-blue`, #F3F6FD) instead of the studio-wide warm neutral-50.
 *
 * A project-local wrapper rather than a new `canvas` option on `Screen`,
 * because only this direction wants the cool ground — every other prototype,
 * and the shipped AmarthaFin screens, still sit on the warm one.
 *
 * Screens that are deliberately WHITE pages (Penagihan, Home visit, Brief,
 * Mitra) do not use this: they keep a plain `Screen` and paint their own white
 * ground. Only the grey they already had becomes blue.
 *
 * The `!` is load-bearing. `Screen` puts its own `bg-canvas-blue` on the same
 * element, so without the important flag which of the two wins would depend on
 * their order in Tailwind's generated CSS rather than on anything stated here.
 */
export function AppScreen({ className, ...props }: ScreenProps) {
  return <Screen {...props} className={`!bg-canvas-blue ${className ?? ''}`.trim()} />
}

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
        // A cleared stage goes GREY, not green, and an upcoming one is a ring
        // around its number rather than a filled disc. Only one thing on this
        // bar is coloured — where she is standing — because that is the single
        // fact the bar exists to state; green ticks behind her competed with it
        // and made a four-step bar look like three results and a question.
        const circle = done
          ? 'border-neutral-400 bg-neutral-400 text-neutral-white'
          : active
            ? 'border-primary-500 bg-primary-500 text-neutral-white'
            : 'border-default bg-neutral-white text-default'
        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-4">
            <div className="flex w-full items-center gap-4">
              {/* The rails are half-width spacers on the outer edges so the
                  circles stay centred over their labels — a full rail on the
                  first and last stage would push both inward.

                  The one coloured rail runs OUT of the active stage, toward the
                  one she is heading for: it is the stage in progress, not a
                  trail of everything already done. */}
              <span
                className={`h-2 flex-1 rounded-full ${i === 0 ? 'bg-transparent' : no === current + 1 ? 'bg-primary-200' : 'bg-neutral-200'}`}
              />
              <span
                className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border text-12 font-bold ${circle}`}
              >
                {done ? <IconCheck size={16} /> : no}
              </span>
              <span
                className={`h-2 flex-1 rounded-full ${i === labels.length - 1 ? 'bg-transparent' : active ? 'bg-primary-200' : 'bg-neutral-200'}`}
              />
            </div>
            {/* Sentence case at reading size, not 10px caps. The stage names are
                words the BP says ("kehadiran dulu, baru penagihan"), and setting
                them as a legend under a diagram made the bar look like a chart
                of the visit rather than the place she is standing in it.
                A cleared stage's name greys out — it is behind her — while the
                ones ahead stay dark: they are still work. */}
            <span
              className={`text-12 ${active ? 'font-bold text-default' : done ? 'font-regular text-disabled' : 'font-regular text-default'}`}
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

// --- WeekGrid ---------------------------------------------------------------
// The recent cycle as a bordered grid of cells — the AngsuranCard's history
// panel. Each cell stacks three things: the week's date on top, its outcome as a
// filled or hollow status circle, and the rupiah actually received that week.
//
// The amount under each cell is what makes the grid worth more than a row of
// dots. A red Rp0 and an orange Rp100rb are two different failures — a miss and a
// shortfall — and only one of them is a sentence the BP can say without being
// contradicted. The circle carries the same split by colour so the pattern reads
// at a glance before the amounts are even scanned.
//
// Six cells at a time, and the whole cycle behind them as a carousel: six recent
// weeks sit legibly across a phone with the amount under each still readable,
// which is why six is the page rather than a number of weeks the grid holds. It
// pages rather than scrolls freely — each swipe lands on a clean set of six, so
// a cell is never cut in half and the dates always read as one band. No stepper
// and no dots: the row opens on the current week and swiping back is the only
// gesture, so there is nothing for a control to say that the grid doesn't.
const GRID_TONE: Record<Week['status'], string> = {
  lunas: 'border-green-500 bg-green-500 text-neutral-white',
  sebagian: 'border-orange-500 bg-orange-500 text-neutral-white',
  lewat: 'border-red-500 bg-red-500 text-neutral-white',
  'jatuh-tempo': 'border-2 border-primary-500 text-primary-500',
}

/** Six recent weeks fit across a phone with the date and amount still legible. */
const GRID_WEEKS = 6

export function WeekGrid({ weeks }: { weeks: Week[] }) {
  // Paged from the RIGHT, so the newest page is always a full six and any short
  // page is the oldest one. Chunking from week 1 instead would leave the current
  // week stranded alone on a near-empty final page — the one page the BP opens
  // on, and the one that has to look like the others.
  const pages: Week[][] = []
  for (let end = weeks.length; end > 0; end -= GRID_WEEKS) {
    pages.unshift(weeks.slice(Math.max(0, end - GRID_WEEKS), end))
  }

  const rail = useRef<HTMLDivElement>(null)
  // Opens on the current week at the right edge; the BP swipes back into the
  // past. A carousel that opened on week 1 would put the cell she came for off
  // screen and make "swipe" the first thing she has to do.
  useEffect(() => {
    const el = rail.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [weeks])

  return (
    // Each week is its own tile — its own grey ground, its own radius, a gap
    // between it and the next — rather than six columns sharing one panel. A
    // week is the unit the BP argues about ("minggu ini belum, Bu"), so it gets
    // an edge of its own, and the current week can then be tinted as a whole
    // cell rather than by colouring its text alone.
    <div ref={rail} className="flex snap-x snap-mandatory overflow-x-auto">
      {pages.map((page) => (
        <div key={page[0]?.no} className="flex w-full shrink-0 snap-start gap-8">
          {/* A short page is always the OLDEST one, and its empty slots sit at
              the left — before its earliest week — so the six columns line up
              page to page and the dates still run left-to-right unbroken. */}
          {Array.from({ length: GRID_WEEKS - page.length }).map((_, i) => (
            <div key={`pad-${i}`} className="flex-1" />
          ))}
          {page.map((w) => {
            const current = w.status === 'jatuh-tempo'
            return (
              <div
                key={w.no}
                className={`flex flex-1 flex-col items-center gap-8 rounded-8 px-4 py-8 ${
                  current ? 'bg-primary-50' : 'bg-canvas-blue'
                }`}
              >
                <span
                  className={`text-10 ${current ? 'font-bold text-primary-500' : 'text-caption'}`}
                >
                  {w.date}
                </span>
                <span
                  className={`flex h-20 w-20 items-center justify-center rounded-full border ${GRID_TONE[w.status]}`}
                >
                  {w.status === 'lunas' ? (
                    <IconCheck size={16} />
                  ) : w.status === 'lewat' || w.status === 'sebagian' ? (
                    <IconX size={16} />
                  ) : null}
                </span>
                <span
                  className={`text-10 font-bold ${current ? 'text-primary-500' : 'text-disabled'}`}
                >
                  {ringkas(w.paid)}
                </span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

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

/**
 * Which product she is on, drawn as the reference draws it: the product's own
 * mark and its name in the product's colour, on no ground at all.
 *
 * It was a solid `Badge`, and on a card that now carries three chips — chair,
 * product, bucket — the solid one won every time, when the product is the least
 * changeable fact of the three. Quiet is the point: it labels, it does not
 * report. Only Modal has a mark in the FunDS asset set, so GL and the mix are
 * their name alone; the colour is what they have in common.
 *
 * "Hybrid" is the internal word; "GL Modal Mix" is what it actually means and
 * names both products in it, which is the whole reason a BP looks at this
 * before she opens the group.
 */
export function ProductBadge({ product }: { product: 'Modal' | 'GL' | 'Hybrid' }) {
  // GL is unlabelled: it is the product a mitra is on unless something is said,
  // so printing it spends a chip on every card to report the default. The label
  // now marks the EXCEPTION — Modal, or a group carrying both.
  if (product === 'GL') return null
  const ink = product === 'Modal' ? 'text-blue-500' : 'text-caption'
  return (
    <span className={`flex shrink-0 items-center gap-4 ${ink}`}>
      {product === 'Modal' ? <ProductLogo name="modal" size={16} /> : null}
      <span className="text-12 font-bold">{product === 'Hybrid' ? 'GL Modal Mix' : product}</span>
    </span>
  )
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

/**
 * A tag that sits ON a coloured hero rather than on white — Badge's tints all
 * assume a light ground, so on the inbox detail's block of colour it reads as a
 * patch rather than a label.
 */
export function BannerTag({ children }: { children: ReactNode }) {
  return (
    <span className="self-start rounded-full bg-neutral-white/20 px-12 py-2 text-12 font-regular text-neutral-white">
      {children}
    </span>
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

// --- AttendanceChoice ------------------------------------------------------
// The register's one gesture, as the final UI draws it: two cells side by side
// under the rule, "Tidak hadir" and "Hadir", filling the card's width.
//
// Not `ChoicePill`, and the difference is the point. A pill is a button — a
// thing you press to make something happen. These two are a RECORD: one of them
// is what she said, and the pair is a single field with two possible values. So
// they take the 8px radius the system gives inputs, and the unchosen one goes
// quiet rather than staying equally loud, because once an answer exists the card
// should read as an answer and not as a question still being asked.
//
// Colour is the outcome, not the selection: green for present, red for absent.
// That is the one place this direction spends the semantic pair on attendance —
// justified because a BP scanning 22 cards for who is still missing is reading
// exactly that, and a uniform primary tint on both answers made "marked" and
// "here" the same colour.

export function AttendanceChoice({
  tone,
  selected,
  /** True once EITHER answer is given — what dims the road not taken. */
  answered,
  label,
  onClick,
  children,
}: {
  tone: 'green' | 'red'
  selected: boolean
  answered: boolean
  /** Spoken label — "Hadir" alone doesn't say whose attendance this is. */
  label: string
  onClick: () => void
  children: ReactNode
}) {
  const classes = selected
    ? tone === 'green'
      ? 'border-green-500 bg-green-50 font-bold text-green-500'
      : 'border-red-500 bg-red-50 font-bold text-red-500'
    : answered
      ? 'border-default bg-neutral-white font-regular text-disabled'
      : 'border-default bg-neutral-white font-regular text-default'

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={`flex flex-1 items-center justify-center rounded-8 border px-8 py-8 text-12 ${classes}`}
    >
      {children}
    </button>
  )
}

// --- ReasonNote ------------------------------------------------------------
// The answer behind the answer: why she isn't here, once it has been picked.
//
// It is a NOTE, not a form row — a tinted block with a rule down its left edge,
// the way a quotation is set — because that is what it is: the sentence the BP
// was told, attached to the mark it explains. The pencil is the only way back
// into the list, out at the edge where it can't be hit while reading.

export function ReasonNote({
  label,
  value,
  onEdit,
}: {
  label: string
  value: string
  /** Reopens the list. Omitted renders no pencil. */
  onEdit?: () => void
}) {
  // Square on the left, rounded on the right. The rule IS the left edge — a
  // radius there pulls the block away from its own margin and turns the mark
  // into a stripe floating beside the text instead of the edge it is set
  // against. Neutral, not primary: the rule is punctuation, and this block is
  // already the quiet half of a card whose answer is coloured above it.
  return (
    <div className="flex items-start gap-8 rounded-r-8 border-l-2 border-default bg-canvas-blue p-8">
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="truncate text-12 text-caption">{label}</span>
        <span className="break-words text-12 text-default">{value}</span>
      </span>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Ubah ${label.toLowerCase()}`}
          className="shrink-0 text-primary-500"
        >
          <NotePencil size={16} />
        </button>
      ) : null}
    </div>
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
// card still asks for something ("Tagihan Rp650.000 · [Tagih]"). Once an outcome
// exists the card is no longer asking, and the reference draws that as a change
// of GROUND rather than a change of contents: one tinted band carrying the whole
// result — a mark, what happened, and the figure — in the status colour, with
// "Ubah" at its edge.
//
// It replaces a caption-over-figure with a badge and a round pencil beside it:
// three objects saying one thing, where the news itself ("Lunas", "Tidak bayar")
// was the smallest of them. The tint now IS the status, so the badge is gone,
// and "Ubah" comes back as a word — a bare pencil on a coloured ground reads as
// decoration rather than a control.
//
// Anything the outcome LEAVES BEHIND — the reason, the promise, what is still
// short, the screenshot backing a Poket claim — drops into a note block under
// the band: grey, ruled down its left edge, so it reads as an annotation on the
// result rather than a second result.

export type ResultTone = 'green' | 'orange' | 'red'

const RESULT_TONE: Record<ResultTone, { band: string; ink: string }> = {
  // 700 on the orange tint, 500/600 on the others: orange-500 is the brightest
  // colour in the palette and at 12px on its own 50-tint it stops being legible.
  green: { band: 'bg-green-50', ink: 'text-green-600' },
  orange: { band: 'bg-orange-50', ink: 'text-orange-700' },
  red: { band: 'bg-red-50', ink: 'text-red-500' },
}

/**
 * The annotation ground: grey, ruled down its left edge, square where it meets
 * that rule. Shared by every block that hangs under a result band so a reason
 * and a screenshot are visibly the same KIND of thing — a footnote on the
 * outcome — rather than two more results stacked below it.
 */
function NoteBlock({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-r-8 border-l-2 border-neutral-400 bg-canvas-blue px-12 py-4">
      {children}
    </div>
  )
}

export function ResultRow({
  tone,
  label,
  amount,
  onEdit,
  notes,
  proof,
}: {
  tone: ResultTone
  /** What happened, in words: "Lunas", "Bayar sebagian", "Berhenti pinjam". */
  label: string
  /**
   * The figure, bold, beside the label. Omitted where the outcome has no
   * amount — a mitra leaving the program did not pay a smaller number, she
   * stopped having a bill at all, and "Rp0" beside her name says the opposite.
   */
  amount?: string
  /** Reopens whatever produced the outcome. Omitted renders no "Ubah". */
  onEdit?: () => void
  /**
   * The note block: each entry a caption over its value. Every fact the outcome
   * leaves for whoever reads the visit later — the reason, the janji bayar,
   * what is still short — goes here, in one block, because they are one
   * annotation and three grey boxes would read as three.
   */
  notes?: { label: string; value: string }[]
  /** Renders the "Foto bukti" strip — the screenshot behind a Poket claim. */
  proof?: boolean
}) {
  const t = RESULT_TONE[tone]
  return (
    <div className="flex flex-col gap-8">
      {/* The band sets its news at 14 in every tone — this is the line that says
          what happened on the visit, and it was reading smaller than the rows
          that merely ask for something. Vertical padding 12 to match. */}
      <div className={`flex items-center gap-12 rounded-8 px-8 py-12 ${t.band}`}>
        <span className={`flex min-w-0 flex-1 items-center gap-4 ${t.ink}`}>
          <span className="shrink-0">
            {tone === 'red' ? <CrossCircleFill size={16} /> : <CheckCircleFill size={16} />}
          </span>
          <span className="truncate text-14">{label}</span>
          {amount ? <span className="shrink-0 text-14 font-bold">{amount}</span> : null}
        </span>
        {onEdit ? (
          <Button variant="outline" size="xs" onClick={onEdit}>
            Ubah
          </Button>
        ) : null}
      </div>

      {notes && notes.length > 0 ? (
        <NoteBlock>
          {notes.map((n) => (
            <p key={n.label} className="text-12 text-default">
              <span className="text-caption">{n.label}:</span>
              <br />
              {n.value}
            </p>
          ))}
        </NoteBlock>
      ) : null}

      {proof ? (
        <NoteBlock>
          <span className="flex items-center gap-8">
            <span className="shrink-0 text-12 text-caption">Foto bukti:</span>
            {/* The same honest placeholder the rest of the project uses for a
                photo it does not have — a tinted tile with a glyph, not a stock
                receipt pretending to be her screenshot. */}
            {/* No edit control of its own: the band's "Ubah" reopens the sheet
                that captured the photo, so a pencil here is a second way into
                the same place on a row that is only a footnote. */}
            <span className="flex h-32 w-24 shrink-0 items-center justify-center rounded-4 border border-default bg-neutral-white text-disabled">
              <Image size={16} />
            </span>
          </span>
        </NoteBlock>
      ) : null}
    </div>
  )
}

// --- PickRow ---------------------------------------------------------------
// The one radio row this direction uses for a question with a fixed set of
// answers: who was met at the door, how much was paid. A full-width card with
// the mark on the RIGHT, where the chevron used to be — these rows used to GO
// somewhere on touch, and putting the radio under the thumb that was already
// travelling there keeps the target still while the meaning changes.
//
// Why picking and committing are now two acts: the BP is standing in front of a
// woman still counting notes out of a plastic bag, and a row that fires its own
// sheet on touch means a mis-tap costs a sheet she has to back out of over the
// bill she was reading. Picking is free; the page's Lanjut is the commitment.

export function PickRow({
  title,
  description,
  detail,
  selected,
  onSelect,
}: {
  title: string
  /** What the option means, or the figure it commits to. */
  description?: string
  /** A read-back of what the option's follow-up captured, once it has. */
  detail?: string | null
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex items-center gap-12 rounded-12 border p-16 text-left ${
        selected ? 'border-primary-500 bg-primary-50' : 'border-default bg-neutral-white'
      }`}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-14 font-bold text-default">{title}</span>
        {/* 14, not 12: the description under a pick row is usually the figure
            the option commits to, and a rupiah amount the BP is about to record
            should not be the smallest text on the row. */}
        {description ? <span className="text-14 text-caption">{description}</span> : null}
        {detail ? (
          <span className="mt-4 border-t border-primary-200 pt-8 text-12 text-primary-500">
            {detail}
          </span>
        ) : null}
      </span>
      <span
        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? 'border-primary-500' : 'border-neutral-400'
        }`}
      >
        {selected ? <span className="h-12 w-12 rounded-full bg-primary-500" /> : null}
      </span>
    </button>
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

/**
 * One option. A bare string where the label is the whole answer — which is
 * every reason list — and the object form where the answer needs a second line
 * to say what taking it means. `value` is always the label, so a caller that
 * adds a description changes nothing about what it stores.
 */
export type Choice = string | { label: string; description?: string }

export function ChoiceList({
  label,
  options,
  value,
  onPick,
  hideLabel,
  plain,
}: {
  label: string
  options: Choice[]
  value?: string
  onPick: (option: string) => void
  /**
   * Drops the printed caption, keeping it as the group's spoken label. For a
   * sheet whose TITLE already says what is being picked — "Alasan Kurang
   * Bayar" over a list captioned "Alasan kurang bayar" is the same sentence
   * twice, one of them in grey.
   */
  hideLabel?: boolean
  /**
   * Bare rows — a radio at the left, no box around it — instead of the bordered
   * cards. For a sheet asking TWO questions in a row: nine boxed rows stacked
   * under two captions read as nine objects, where the reference draws one list
   * with two headings, and the radio column is what tells them apart.
   */
  plain?: boolean
}) {
  if (plain) {
    return (
      <div className="flex flex-col gap-8">
        {hideLabel ? null : <span className="text-12 text-caption">{label}</span>}
        <div role="radiogroup" aria-label={label} className="flex flex-col">
          {options.map((option) => {
            const text = typeof option === 'string' ? option : option.label
            const description = typeof option === 'string' ? undefined : option.description
            const selected = text === value
            return (
              <button
                key={text}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onPick(text)}
                className="flex items-center gap-12 py-8 text-left"
              >
                {/* The mark leads the row here, where a boxed row puts it at the
                    edge: with no border to hold the row together, the column of
                    radios IS the list's left edge. */}
                <span
                  className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 ${
                    selected ? 'border-primary-500' : 'border-default'
                  }`}
                >
                  {selected ? <span className="h-12 w-12 rounded-full bg-primary-500" /> : null}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="text-14 text-default">{text}</span>
                  {description ? (
                    <span className="text-12 text-caption">{description}</span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {hideLabel ? null : <span className="text-12 text-caption">{label}</span>}
      <div role="radiogroup" aria-label={label} className="flex flex-col gap-8">
        {options.map((option) => {
          const text = typeof option === 'string' ? option : option.label
          const description = typeof option === 'string' ? undefined : option.description
          const selected = text === value
          return (
            <button
              key={text}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onPick(text)}
              className={`flex items-center gap-12 rounded-8 border p-12 text-left ${
                selected ? 'border-primary-500 bg-primary-50' : 'border-default bg-neutral-white'
              }`}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span
                  className={`truncate text-14 ${selected ? 'font-bold text-primary-500' : 'text-default'}`}
                >
                  {text}
                </span>
                {description ? (
                  <span className="truncate text-12 text-caption">{description}</span>
                ) : null}
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

/**
 * The quick filter over a roster: one row of pills, each carrying its count.
 *
 * Its own component rather than a row of `Chip`s, for one reason that matters
 * on a 360px phone — it must stay on ONE LINE. `Chip` is built for the reason
 * lists, where a wrapping group of full sentences is right; here a chip that
 * breaks in two turns a control strip into a paragraph and pushes the roster
 * down the page. So the pills never shrink and never wrap: the row scrolls
 * sideways if it has to, and each label holds its line.
 *
 * A FILTER, not a sort. The roster underneath keeps its order whatever is
 * selected — the woman the BP is standing in front of has to stay where she
 * was — this only hides the cards she is not asking about.
 */
export function RosterFilter<T extends string>({
  options,
  value,
  onPick,
}: {
  options: { id: T; label: string; count: number }[]
  value: T
  onPick: (id: T) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Filter daftar mitra"
      className="-mx-16 flex gap-8 overflow-x-auto px-16 pb-2"
    >
      {options.map((option) => {
        const selected = option.id === value
        // The picked chip keeps the white ground of the others and takes the
        // brand colour on its border and its word only — a tinted fill made the
        // filter row read as a second, louder header above the roster.
        const tone = selected
          ? 'border-primary-500 bg-neutral-white text-primary-500'
          : 'border-default bg-neutral-white text-neutral-700'
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onPick(option.id)}
            className={`shrink-0 whitespace-nowrap rounded-8 border px-12 py-8 text-12 font-bold ${tone}`}
          >
            {option.label} ({option.count})
          </button>
        )
      })}
    </div>
  )
}

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

/**
 * A labelled vertical list of single-select rows — one tap-target per line
 * rather than chips that wrap. Selected rows carry the brand tint; the rest are
 * plain cards. Used by the home-visit steps for reasons and revisit dates.
 */
export function SelectList({
  label,
  items,
}: {
  label: string
  items: { key: string; label: string; selected: boolean; onClick: () => void }[]
}) {
  return (
    <div className="flex flex-col gap-8">
      <span className="text-12 font-bold text-default">{label}</span>
      <div className="flex flex-col gap-8">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={item.selected}
            onClick={item.onClick}
            className={`rounded-12 border px-16 py-12 text-left text-14 font-bold ${
              item.selected
                ? 'border-primary-500 bg-primary-50 text-primary-500'
                : 'border-default bg-neutral-white text-default'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
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
  /**
   * The percentage is a THIRD way of saying what the value, the denominator and
   * the bar already say. On the money stages it was the least useful of the
   * four — a BP chases rupiah, not a ratio — so those turn it off and let the
   * denominator take the right-hand slot instead.
   */
  showPercent = true,
  /** Drops the card chrome for a block already sitting on its own white panel. */
  flat = false,
}: {
  title: string
  value: string
  /** The denominator, printed quietly beside the value. */
  of?: string
  percent: number
  tone?: 'primary' | 'green'
  showPercent?: boolean
  flat?: boolean
}) {
  const body = (
    <div className="flex flex-col gap-8">
      <div className="flex items-end gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Bold and dark, not a grey caption: it names the figure under it,
              and on a white header band a grey label over a 24px number read as
              a footnote that had floated above its own total. */}
          <span className="text-12 font-bold text-default">{title}</span>
          <span className="flex items-baseline gap-4">
            <span className="text-24 font-bold text-default">{value}</span>
            {of && showPercent ? <span className="text-14 text-caption">dari {of}</span> : null}
          </span>
        </div>
        {showPercent ? (
          <span
            className={`text-18 font-bold ${tone === 'green' ? 'text-green-500' : 'text-primary-500'}`}
          >
            {percent}%
          </span>
        ) : of ? (
          <span className="shrink-0 text-14 text-caption">dari {of}</span>
        ) : null}
      </div>
      <Meter progress={percent} tone={tone} />
    </div>
  )

  return flat ? body : <div className="rounded-12 bg-neutral-white p-12">{body}</div>
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
  threshold,
}: {
  progress: number
  tone?: 'primary' | 'green' | 'orange' | 'red' | 'muted'
  /**
   * Where the minimum sits on the rail, 0–100. Draws a notch there and tints
   * the track past it, so the bar stops being "how far along" and becomes "how
   * far along, and where the bar you have to clear actually is".
   *
   * The scale has to run PAST this point for the notch to mean anything — a
   * meter whose 100% is the target has nowhere to put "beyond". Omit it and
   * the meter behaves exactly as it always did.
   */
  threshold?: number
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
  const mark = threshold == null ? null : Math.max(0, Math.min(100, threshold))
  return (
    <div className="relative h-8 w-full rounded-full bg-neutral-200">
      {/* The incentive zone: the stretch of track beyond the minimum, tinted so
          it reads as a different place to be rather than more of the same. */}
      {mark == null ? null : (
        <div
          className="absolute inset-y-0 right-0 rounded-r-full bg-canvas-blue"
          style={{ left: `${mark}%` }}
        />
      )}
      <div
        className={`relative h-8 rounded-full ${fill}`}
        // A data-driven width is the one dimension a progress meter cannot take
        // from a token — the value IS the geometry. Every colour and height
        // around it is still a token.
        style={{ width: `${clamped}%` }}
      />
      {/* The gate notch, drawn over the fill so it stays visible once she is
          past it — that is the moment it is most worth seeing. */}
      {mark == null ? null : (
        <span
          className="absolute inset-y-0 w-2 -translate-x-1/2 rounded-full bg-neutral-500"
          style={{ left: `${mark}%` }}
        />
      )}
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
// The round action buttons beside a mitra — WhatsApp and a route out to maps.
// It lives here rather than beside the doorstep card because reaching someone,
// or her house, is the whole job on two different screens: a home visit that
// fails at a locked gate, and a follow-up call where the contact IS the task.
//
// Renders as an anchor when given `href` (the maps link) and as a button when
// given `onClick`.
//
// The BUTTON is neutral, the GLYPH is not. These used to be tinted whole — a
// green disc on a green ring, a red one, a purple one — which put three or four
// saturated circles on every card that carried a contact, competing with content
// that has real colour to spend (a red DPD bucket, a green paid week). Now the
// container is a grey disc with a hairline everywhere, and only the icon keeps
// its channel colour: WhatsApp green, a route pin red, a handset primary. The
// colour still says which is which; it just stops shouting it.

export function ContactButton({
  label,
  tone = 'default',
  onClick,
  href,
  children,
}: {
  label: string
  /** Tints the GLYPH only — the disc and its hairline stay neutral. */
  tone?: 'green' | 'red' | 'primary' | 'default'
  onClick?: () => void
  /** When set, renders as a link (used for the maps route). */
  href?: string
  children: ReactNode
}) {
  const ink =
    tone === 'green'
      ? 'text-green-500'
      : tone === 'red'
        ? 'text-red-500'
        : tone === 'primary'
          ? 'text-primary-500'
          : 'text-default'
  const shared = `flex h-40 w-40 shrink-0 items-center justify-center rounded-full border border-default bg-canvas-blue ${ink}`
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" aria-label={label} className={shared}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" aria-label={label} onClick={onClick} className={shared}>
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

// --- RescheduleSheet -------------------------------------------------------
// Moving a task to another day, from the top bar of a home visit, a sosialisasi
// or a follow-up. A bottom sheet rather than an inline block or its own screen:
// it is a meta-action on the TASK, not a step in the work, and it has to be
// reachable mid-flow — the BP who opens the door, finds the mitra can't talk
// now, and decides to come back should not have to unwind the flow to do it.
//
// Two questions, both required: why it is moving (the record ops reads) and
// when to (the day it lands on, anywhere from tomorrow to next week). The draft
// is local and resets each time the sheet opens, so a cancelled reschedule
// leaves nothing behind on the next task.
//
// After the THIRD move the sheet grows a second path: reject the task outright.
// A task the BP has pushed three times is a task that isn't going to happen, and
// forcing a fourth reschedule only launders "this won't happen" into a date
// nobody believes. Rejection asks for one thing the reschedule reasons can't
// give — an open-text reason in her own words — because by now none of the tidy
// options fit, and ops needs to read what actually went wrong.

/** Why a visit gets moved — BP-side reasons, distinct from a mitra's absence. */
const RESCHEDULE_REASONS = ['Tidak cukup waktu', 'Lokasi terlalu jauh', 'Bencana alam']

// When to move it to — tomorrow through next week, so a BP who can't get back
// this week can still land the task somewhere real. A reschedule needs a date,
// so there is no "no date". "Besok" and "Minggu depan" anchor the two ends; the
// weekday is spelled on each so she isn't counting days off a bare number.
const RESCHEDULE_DATES = [
  'Rabu, 22 Juli (besok)',
  'Kamis, 23 Juli',
  'Jumat, 24 Juli',
  'Sabtu, 25 Juli',
  'Senin, 27 Juli',
  'Selasa, 28 Juli (minggu depan)',
]

export function RescheduleSheet({
  open,
  onClose,
  subject,
  subjectNoun = 'Kunjungan',
  count = 0,
  onConfirm,
  onReject,
}: {
  open: boolean
  onClose: () => void
  /** Whose task is being moved — named in the sheet so it can't be mis-tapped. */
  subject: string
  /** How the task reads in the sentence — "Kunjungan", "Sosialisasi", "Follow up". */
  subjectNoun?: string
  /** How many times this task has already been moved. Unlocks reject at 3. */
  count?: number
  onConfirm: (reason: string, date: string) => void
  /** Closes the task for good. Omitting it keeps the reject path off entirely. */
  onReject?: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const [date, setDate] = useState('')
  const [mode, setMode] = useState<'reschedule' | 'reject'>('reschedule')
  const [rejectReason, setRejectReason] = useState('')

  // Only offered once she has moved this task three times, and only if the
  // caller wired up a way to record it.
  const canReject = Boolean(onReject) && count >= REJECT_AFTER
  const rejecting = mode === 'reject'

  const ready = rejecting ? rejectReason.trim().length > 0 : Boolean(reason && date)

  // Fresh every time it opens: a reschedule cancelled on one task must not
  // pre-fill its answers on the next, and the mode always reopens on reschedule.
  useEffect(() => {
    if (open) {
      setReason('')
      setDate('')
      setRejectReason('')
      setMode('reschedule')
    }
  }, [open])

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={rejecting ? 'Tolak tugas' : 'Jadwalkan ulang tugas'}
      description={
        rejecting
          ? `${subjectNoun} ${subject} ditutup dan tidak dijadwalkan lagi.`
          : `${subjectNoun} ${subject} dijadwalkan di waktu lain.`
      }
      secondaryAction={
        <Button variant="outline" size="lg" className="w-full" onClick={onClose}>
          Batal
        </Button>
      }
      primaryAction={
        <Button
          size="lg"
          className="w-full"
          disabled={!ready}
          onClick={() => (rejecting ? onReject?.(rejectReason.trim()) : onConfirm(reason, date))}
        >
          {rejecting ? 'Tolak tugas' : 'Simpan'}
        </Button>
      }
    >
      <div className="flex flex-col gap-16">
        {/* The gate, and the choice it opens. Shown only after the third move:
            she can move it again, or close it. Two pills rather than a second
            button in the footer, so the primary action stays the one thing the
            sheet does. */}
        {canReject ? (
          <div className="flex flex-col gap-8 rounded-8 bg-orange-50 p-12">
            <span className="text-12 text-orange-500">
              Tugas ini sudah dijadwalkan ulang {count}×. Kamu bisa menolaknya jika memang tidak
              bisa dilanjutkan.
            </span>
            <div className="flex gap-8">
              <Chip selected={!rejecting} onClick={() => setMode('reschedule')}>
                Jadwalkan ulang
              </Chip>
              <Chip selected={rejecting} onClick={() => setMode('reject')}>
                Tolak tugas
              </Chip>
            </div>
          </div>
        ) : null}

        {rejecting ? (
          <Input
            label="Alasan penolakan"
            required
            placeholder="Tulis apa yang terjadi dengan tugas ini"
            helperText="Ditulis dengan kata-katamu sendiri — dibaca ops untuk menutup tugas."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        ) : (
          // Two questions, one under the other, as bare radio lists — the
          // reference's shape. Chips were the wrong form for the dates: six
          // weekdays of uneven length wrap into a ragged block that has to be
          // read before it can be tapped, and a date is picked by scanning down
          // a column, which is how a calendar is read everywhere else.
          <>
            <ChoiceList
              plain
              label="Alasan"
              options={RESCHEDULE_REASONS}
              value={reason || undefined}
              onPick={setReason}
            />
            <ChoiceList
              plain
              label="Jadwal baru"
              options={RESCHEDULE_DATES}
              value={date || undefined}
              onPick={setDate}
            />
          </>
        )}
      </div>
    </BottomSheet>
  )
}

// --- SettlementHistorySheet ------------------------------------------------
// The day's cash story in one sheet, reached from the schedule's settled line
// and from the Setoran header. Two questions, stacked: what went OUT (each
// handover, its road and its receipt) and then what came IN (the cash each
// pelayanan and door banked) — out first, because "how much did I already put
// down" is what the sheet is opened to answer. Read-only — it is a record, not
// a step — so it carries no footer button and closes on the X.
//
// It answers the question a BP asks herself all afternoon: is the bag empty,
// and if not, how much of it did I already put down. The summary trio at the
// top says it in three numbers; the breakdowns are there for the transfer she
// has to defend when the branch's figure and hers disagree.

export function SettlementHistorySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp()
  const collected = depositExpected(s)
  const settled = settledTotal(s)
  const left = unsettledTotal(s)
  const entries = depositEntries(s).filter((e) => e.cash > 0)

  return (
    <BottomSheet open={open} onClose={onClose} title="Riwayat Setoran" size="md">
      <div className="flex flex-col gap-16">
        {/* The three numbers the whole sheet is about, so the breakdowns below
            are evidence for a figure already stated rather than a sum the BP
            has to do herself. */}
        <div className="flex gap-8">
          <SummaryTile label="Terkumpul" value={rupiah(collected)} />
          <SummaryTile label="Sudah disetor" value={rupiah(settled)} tone="green" />
          <SummaryTile label="Belum disetor" value={rupiah(left)} tone={left > 0 ? 'orange' : 'default'} />
        </div>

        {/* What went out — each handover, its road and the identifier the
            branch reconciles it against. First, because "how much did I already
            put down" is the question this sheet is opened to answer. */}
        <div className="flex flex-col gap-8">
          <SectionTitle>Setoran hari ini</SectionTitle>
          {s.settlements.length === 0 ? (
            <div className="rounded-12 bg-canvas-blue px-12 py-16 text-center text-12 text-caption">
              Belum ada setoran hari ini.
            </div>
          ) : (
            <div className="rounded-12 bg-canvas-blue">
              {s.settlements.map((x, i) => (
                <div
                  key={x.no}
                  className={`flex items-center gap-12 px-12 py-12 ${i === 0 ? '' : 'border-t border-default'}`}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="truncate text-14 text-default">Setoran ke-{x.no}</span>
                    <span className="truncate text-12 text-caption">
                      {SETTLE_METHOD_LABEL[x.method]} · {x.method === 'agent' ? agentCodeFor(x.no) : x.va} ·{' '}
                      {x.at}
                    </span>
                  </div>
                  <span className="shrink-0 text-14 font-bold text-default">{rupiah(x.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* What came in — every task that banked cash, the same lines the
            settlement breakdown draws from. */}
        <div className="flex flex-col gap-8">
          <SectionTitle>Uang tunai terkumpul</SectionTitle>
          <div className="rounded-12 bg-canvas-blue">
            {entries.map((e, i) => (
              <div
                key={e.taskId}
                className={`flex items-center gap-12 px-12 py-12 ${i === 0 ? '' : 'border-t border-default'}`}
              >
                <span className="shrink-0 rounded-8 bg-neutral-white px-8 py-4 text-10 font-bold text-neutral-600">
                  {taskCode(e.taskId)}
                </span>
                <span className="min-w-0 flex-1 truncate text-14 text-default">{e.label}</span>
                <span className="shrink-0 text-14 font-bold text-default">{rupiah(e.cash)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}

/** One of the three headline figures at the top of the history sheet. */
function SummaryTile({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'green' | 'orange'
}) {
  const ink = tone === 'green' ? 'text-green-500' : tone === 'orange' ? 'text-orange-500' : 'text-default'
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-12 bg-canvas-blue p-12">
      <span className="truncate text-10 text-caption">{label}</span>
      <span className={`truncate text-14 font-bold ${ink}`}>{value}</span>
    </div>
  )
}
