'use client'

// Tanggal filter — sheet + interaction ported from the "Global Transaction
// History" Figma reference (Filter transaksi, node 4515:101827 → the "Tanggal"
// section, and its nested date picker, node 4515:103391 "Pilih tanggal").
// Only the date-filter slice of that design is in scope here; the
// activity/type/status chip sections in the reference belong to a different
// screen and aren't part of this dashboard's filter.
//
// The reference's day/month/year columns scroll independently — the day wheel
// cycles 1–31 on its own, decoupled from the month wheel — so there's no
// per-month day-count validation to replicate; a day like 30 Feb is clamped to
// the month's last real day only when a selection is saved.

import { useEffect, useRef, useState } from 'react'
import { BottomSheet, Button } from '@/design-system/components'
import { CalendarDots } from '@/design-system/icons'
import { MONTHS_FULL, PERIOD_LABEL, fmtDMY, periodDate } from './data'
import type { Period } from './store'

export interface CustomRange {
  from: Date
  to: Date
}

const PERIODS: Period[] = ['hari', 'minggu', 'bulan']

// today − 12 months, per the reference's "only 12 months back" constraint.
function twelveMonthsAgo(): Date {
  const d = new Date()
  d.setMonth(d.getMonth() - 12)
  return d
}

function clampDate(d: Date, min: Date, max: Date): Date {
  if (d < min) return min
  if (d > max) return max
  return d
}

// ---------------------------------------------------------------------------
// Radio row — plain label + right-aligned dot, matching the reference's bare
// row (no card border, unlike design-system/SelectableCard).
// ---------------------------------------------------------------------------

function RadioRow({ label, checked, onSelect }: { label: string; checked: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className="flex w-full items-center justify-between gap-8 py-4 text-left">
      <span className="text-14 font-regular text-default">{label}</span>
      <span
        className={`flex size-20 shrink-0 items-center justify-center rounded-full border-2 ${
          checked ? 'border-primary-500' : 'border-neutral-400'
        }`}
      >
        {checked ? <span className="size-8 rounded-full bg-primary-500" /> : null}
      </span>
    </button>
  )
}

// Mulai / Akhir date field — label above value, calendar icon trailing.
function DateField({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 flex-col items-start gap-2 rounded-8 border border-default bg-neutral-white px-8 py-4 text-left"
    >
      <span className="text-12 font-regular text-disabled">{label}</span>
      <span className="flex w-full items-center justify-between gap-4">
        <span className="text-12 font-regular text-default">{value}</span>
        <CalendarDots size={16} className="shrink-0 text-neutral-500" />
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Wheel picker — one scroll-snapped column. Scroll settles ~100ms after the
// user lets go, snaps to the nearest row, and reports that index up.
// ---------------------------------------------------------------------------

const ROW_H = 40
const VISIBLE_PAD = ROW_H * 2 // centers row 0 within a 5-row-tall column

function WheelColumn({
  items,
  index,
  onChange,
  align,
}: {
  items: string[]
  index: number
  onChange: (i: number) => void
  align: 'start' | 'center' | 'end'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const settleTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const target = index * ROW_H
    if (Math.abs(el.scrollTop - target) > 1) el.scrollTop = target
    // Only re-sync when the caller changes the value out from under us
    // (e.g. opening the sheet); scrolling itself already drives `index`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items.length])

  function handleScroll() {
    const el = ref.current
    if (!el) return
    window.clearTimeout(settleTimer.current)
    settleTimer.current = window.setTimeout(() => {
      const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ROW_H)))
      el.scrollTo({ top: i * ROW_H, behavior: 'smooth' })
      if (i !== index) onChange(i)
    }, 100)
  }

  const justify = align === 'start' ? 'justify-start' : align === 'end' ? 'justify-end' : 'justify-center'

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="flex-1 snap-y snap-mandatory overflow-y-scroll [&::-webkit-scrollbar]:hidden"
      style={{
        height: ROW_H * 5,
        scrollbarWidth: 'none',
        scrollPaddingTop: VISIBLE_PAD,
        scrollPaddingBottom: VISIBLE_PAD,
        paddingTop: VISIBLE_PAD,
        paddingBottom: VISIBLE_PAD,
      }}
    >
      {items.map((label, i) => {
        const dist = Math.abs(i - index)
        return (
          <div key={label} className={`flex snap-center items-center ${justify} px-16`} style={{ height: ROW_H }}>
            <span
              className={
                dist === 0
                  ? 'text-20 font-bold text-primary-600'
                  : `text-16 font-regular text-disabled ${dist > 1 ? 'opacity-50' : ''}`
              }
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// The nested "Pilih tanggal" sheet (Figma 4515:103391): three independent
// wheels (date / month / year), back arrow discards, Simpan commits.
function DatePickerSheet({
  open,
  date,
  min,
  max,
  onBack,
  onSave,
}: {
  open: boolean
  date: Date
  min: Date
  max: Date
  onBack: () => void
  onSave: (d: Date) => void
}) {
  const [day, setDay] = useState(date.getDate())
  const [month, setMonth] = useState(date.getMonth())
  const [year, setYear] = useState(date.getFullYear())

  useEffect(() => {
    if (!open) return
    setDay(date.getDate())
    setMonth(date.getMonth())
    setYear(date.getFullYear())
    // Reset the wheels to the field's current value each time this sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1))
  const years = Array.from({ length: max.getFullYear() - min.getFullYear() + 1 }, (_, i) => String(min.getFullYear() + i))
  const yearIndex = year - min.getFullYear()

  function save() {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
    const picked = new Date(year, month, Math.min(day, lastDayOfMonth))
    onSave(clampDate(picked, min, max))
  }

  return (
    <BottomSheet open={open} onBack={onBack} title="Pilih tanggal" primaryAction={<Button size="lg" className="w-full" onClick={save}>Simpan</Button>}>
      <div className="flex w-full items-center">
        <WheelColumn items={days} index={day - 1} onChange={(i) => setDay(i + 1)} align="start" />
        <WheelColumn items={MONTHS_FULL} index={month} onChange={setMonth} align="center" />
        <WheelColumn items={years} index={yearIndex} onChange={(i) => setYear(min.getFullYear() + i)} align="end" />
      </div>
    </BottomSheet>
  )
}

// ---------------------------------------------------------------------------
// The main "Tanggal" filter sheet — preset periods + "Tanggal lain" (custom).
// ---------------------------------------------------------------------------

export function DateFilterSheet({
  open,
  onClose,
  period,
  customRange,
  onApply,
}: {
  open: boolean
  onClose: () => void
  period: Period | 'custom'
  customRange: CustomRange
  onApply: (period: Period | 'custom', range: CustomRange) => void
}) {
  const [pending, setPending] = useState<Period | 'custom'>(period)
  const [range, setRange] = useState<CustomRange>(customRange)
  const [picking, setPicking] = useState<'from' | 'to' | null>(null)

  useEffect(() => {
    if (!open) return
    setPending(period)
    setRange(customRange)
    // Sheet reopens with whatever was last applied.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const min = twelveMonthsAgo()
  const max = new Date()

  return (
    <>
      <BottomSheet
        open={open && !picking}
        onClose={onClose}
        title="Filter Tanggal"
        primaryAction={
          <Button size="lg" className="w-full" onClick={() => onApply(pending, range)}>
            Terapkan
          </Button>
        }
      >
        <div className="flex flex-col gap-8">
          <span className="text-14 font-bold text-default">Tanggal</span>
          {PERIODS.map((p) => (
            <RadioRow key={p} label={PERIOD_LABEL[p]} checked={pending === p} onSelect={() => setPending(p)} />
          ))}
          <RadioRow label="Tanggal lain" checked={pending === 'custom'} onSelect={() => setPending('custom')} />
          {pending === 'custom' ? (
            <div className="flex w-full items-start gap-8">
              <DateField label="Mulai" value={fmtDMY(range.from)} onClick={() => setPicking('from')} />
              <DateField label="Akhir" value={fmtDMY(range.to)} onClick={() => setPicking('to')} />
            </div>
          ) : null}
        </div>
      </BottomSheet>

      <DatePickerSheet
        open={Boolean(picking)}
        date={picking === 'to' ? range.to : range.from}
        min={min}
        max={max}
        onBack={() => setPicking(null)}
        onSave={(d) => {
          setRange((r) =>
            picking === 'to'
              ? { from: d < r.from ? d : r.from, to: d }
              : { from: d, to: d > r.to ? d : r.to },
          )
          setPicking(null)
        }}
      />
    </>
  )
}

// The calendar-input label: the applied period's date range, or the custom
// range once "Tanggal lain" has been applied.
export function filterLabel(period: Period | 'custom', range: CustomRange): string {
  if (period === 'custom') return `${fmtDMY(range.from)} - ${fmtDMY(range.to)}`
  return periodDate(period)
}
