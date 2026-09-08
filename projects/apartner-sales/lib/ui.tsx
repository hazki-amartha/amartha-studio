'use client'

// Project-local components, built only from tokens + design-system components
// per the §4 missing-component protocol. See NOTES.md.
//
// The subset of `apartner-majelis-view`'s `lib/ui.tsx` that the Sales module
// actually uses — eighteen of its fifty-odd exports. Everything the field day
// owns (the week strip, the attendance choices, the proof tiles, the settlement
// history) stayed behind with the field day.
//
// `StageBar` takes its labels rather than defaulting to the pelayanan's four:
// the only sequences here are the follow-up and the POI visit, and a default
// naming stages this prototype does not have would be a default nobody can use.

import { useEffect, useState, type ReactNode } from 'react'
import { Screen, type ScreenProps } from '@/platform/primitives'
import { BottomSheet, Button, Input, SelectableCard } from '@/design-system/components'
import { Check, ChevronDown, MagnifyingGlass } from '@/design-system/icons'
import { REJECT_AFTER } from './store'

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
  labels,
}: {
  /** 1-based. One past the last label means every stage is cleared. */
  current: number
  labels: string[]
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
                {done ? <Check size={16} /> : no}
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
        <ChevronDown size={16} />
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

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-14 font-bold text-default">{children}</h2>
}

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

export function VisitTitle({ title, when }: { title: string; when: string }) {
  return (
    <span className="flex flex-col">
      <span className="text-16 font-bold text-default">{title}</span>
      <span className="text-12 font-regular text-caption">{when}</span>
    </span>
  )
}

export function StickyBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-16 mt-auto flex flex-col gap-12 border-t border-default bg-neutral-white p-16">
      {children}
    </div>
  )
}

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
                {selected ? <Check size={16} /> : null}
              </span>
            </button>
          )
        })}
      </div>
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
  hideReason = false,
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
  /**
   * Drops the "Alasan" picker, leaving just the date. For a follow-up call that
   * didn't connect — the visit-shaped reasons (distance, weather) don't fit, and
   * the only question left is when to try again.
   */
  hideReason?: boolean
}) {
  const [reason, setReason] = useState('')
  const [date, setDate] = useState('')
  const [mode, setMode] = useState<'reschedule' | 'reject'>('reschedule')
  const [rejectReason, setRejectReason] = useState('')

  // Only offered once she has moved this task three times, and only if the
  // caller wired up a way to record it.
  const canReject = Boolean(onReject) && count >= REJECT_AFTER
  const rejecting = mode === 'reject'

  const ready = rejecting
    ? rejectReason.trim().length > 0
    : hideReason
      ? Boolean(date)
      : Boolean(reason && date)

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
            {hideReason ? null : (
              <ChoiceList
                plain
                label="Alasan"
                options={RESCHEDULE_REASONS}
                value={reason || undefined}
                onPick={setReason}
              />
            )}
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
