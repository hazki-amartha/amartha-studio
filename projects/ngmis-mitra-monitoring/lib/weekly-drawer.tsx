'use client'

// A BP's weekly diagnosis — opened from "See detail" beside her name on the
// Weekly task tab. Slides in from the right: the week's totals, how each task
// performed, the focused task's weekly breakdown (repayment, cash, day by day),
// and what needs the BM's review. Mock figures follow the same per-BP profile
// as the table behind it (lib/weekly-data.ts), so the two always agree.

import { useState } from 'react'
import { Badge, Button } from '@/design-system/components'
import {
  ArrowRight,
  CalendarDots,
  CheckCircleFill,
  ChevronLeft,
  ChevronRight,
  Cross,
  Hourglass,
  WarningFill,
} from '@/design-system/icons'
import { BPS, rupiah } from './daily-data'
import { COUNT_TASKS, OLDEST_WEEK, SLIP, snapshot, weekDays, weekRange } from './weekly-data'

const DRAWER_W = 640

/** The drawer's name for each Tugas row, matching the daily diagnosis. */
const TASK_NAME: Record<string, string> = {
  pelayanan: 'Majelis visits',
  'home-visit': 'Home visits',
  reaktivasi: 'Reaktivasi & lanjutan',
  sosialisasi: 'Sosialisasi',
  'follow-up': 'Follow up',
}

interface TaskTotals {
  id: string
  name: string
  done: number
  target: number
  notDone: number
  /** Skipped and rescheduled only exist for visits; other tasks leave them null. */
  skipped: number | null
  rescheduled: number | null
  verify: number
}

export function WeeklyDrawer({
  bpName,
  initialWeek,
  onClose,
  onOpenDaily,
  onOpenCash,
}: {
  bpName: string
  initialWeek: number
  onClose: () => void
  /** Jump to this BP's daily diagnosis. */
  onOpenDaily: () => void
  /** Jump to Sisa setor tunai, from the unsettled-cash review row. */
  onOpenCash: (bpName: string) => void
}) {
  const bp = BPS.find((b) => b.name === bpName) ?? BPS[0]
  const [week, setWeek] = useState(initialWeek)
  const [selected, setSelected] = useState('pelayanan')

  const days = weekDays(week)
  const snaps = days.map((_, i) => snapshot(bp, i - week * 5))
  const slip = SLIP[bp.id]

  const totals: TaskTotals[] = COUNT_TASKS.map((t) => {
    const done = snaps.reduce((n, s) => n + s.done[t.id], 0)
    const target = t.target * days.length
    const gap = target - done
    // Visits have four outcomes; every other task is just done or not done.
    const visit = t.id === 'pelayanan' || t.id === 'home-visit'
    const rescheduled = visit && gap >= 1 ? 1 : 0
    const skipped = visit && gap >= 3 ? 1 : 0
    // Only visits carry a photo and a location, so only they can look wrong.
    const verify = t.id === 'pelayanan' ? slip : t.id === 'home-visit' ? Math.min(slip, 1) : 0
    return {
      id: t.id,
      name: TASK_NAME[t.id],
      done,
      target,
      notDone: gap - rescheduled - skipped,
      skipped: visit ? skipped : null,
      rescheduled: visit ? rescheduled : null,
      verify,
    }
  })

  const verifyTotal = totals.reduce((n, t) => n + t.verify, 0)
  const rows = totals
  const focus = totals.find((t) => t.id === selected) ?? totals[0]

  // Home visits: of those done, who was met, who paid, and why not.
  const visited = totals[1].done
  const metNone = Math.round(visited * 0.2)
  const metFamily = Math.round(visited * 0.1)
  const metMitra = visited - metNone - metFamily
  const paidVisits = Math.round(visited * 0.45)
  const paidFull = Math.round(paidVisits * 0.6)

  // Cash comes from majelis visits: roughly a million and change per visit held.
  const majelis = totals[0]
  const collected = majelis.done * 1_170_000
  const pending = slip * 400_000
  const settled = collected - pending

  return (
    <div className="absolute inset-0 z-20 flex justify-end bg-overlay">
      <div className="flex h-full w-full flex-col bg-neutral-50" style={{ maxWidth: DRAWER_W }}>
        <div className="flex shrink-0 items-start justify-between gap-16 border-b border-default bg-neutral-white p-24">
          <div className="flex flex-col gap-4">
            <span className="text-12 font-bold text-caption">Weekly diagnosis</span>
            <span className="text-20 font-bold text-default">{bp.name}</span>
            <span className="flex items-center gap-4 text-14 text-default">
              <button
                type="button"
                aria-label="Previous week"
                disabled={week <= OLDEST_WEEK}
                onClick={() => setWeek(week - 1)}
                className="flex size-24 items-center justify-center disabled:text-placeholder"
              >
                <ChevronLeft size={16} />
              </button>
              <CalendarDots size={16} />
              <span className="px-4">{weekRange(week)}</span>
              <button
                type="button"
                aria-label="Next week"
                disabled={week >= 0}
                onClick={() => setWeek(week + 1)}
                className="flex size-24 items-center justify-center disabled:text-placeholder"
              >
                <ChevronRight size={16} />
              </button>
            </span>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="text-default">
            <Cross size={20} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-12 overflow-y-auto p-24">
          <div className="flex shrink-0 flex-col overflow-hidden rounded-16 border border-default bg-neutral-white">
            <div className="flex items-center justify-between p-12">
              <span className="text-16 font-bold text-default">Performance by task</span>
              <span className="text-12 text-caption">Select a task to focus.</span>
            </div>
            <div className="flex flex-col">
              {rows.map((t) => {
                const on = selected === t.id
                const clean = !t.notDone && !t.skipped && !t.rescheduled && !t.verify
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelected(t.id)}
                    className={`flex items-center gap-12 border-l-4 border-t border-t-default px-12 py-12 text-left ${
                      on
                        ? 'border-l-primary-500 bg-primary-50'
                        : 'border-l-transparent bg-neutral-white'
                    }`}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-8">
                      <span className="flex items-baseline justify-between gap-12">
                        <span
                          className={`text-14 text-default ${on ? 'font-bold' : 'font-regular'}`}
                        >
                          {t.name}
                        </span>
                        <span className="text-14 text-default">
                          <span className="text-16 font-bold">{t.done}</span> / {t.target} done
                        </span>
                      </span>
                      <span className="flex flex-wrap gap-8">
                        {clean ? (
                          <Badge intent="green" variant="subtle" size="sm">
                            All on target
                          </Badge>
                        ) : null}
                        {t.notDone ? (
                          <Badge intent="red" variant="subtle" size="sm">
                            {t.notDone} not done
                          </Badge>
                        ) : null}
                        {t.rescheduled ? (
                          <Badge intent="blue" variant="subtle" size="sm">
                            {t.rescheduled} rescheduled
                          </Badge>
                        ) : null}
                        {t.skipped ? (
                          <Badge intent="neutral" variant="subtle" size="sm">
                            {t.skipped} skipped
                          </Badge>
                        ) : null}
                        {t.verify ? (
                          <Badge intent="orange" variant="subtle" size="sm">
                            {t.verify} to verify
                          </Badge>
                        ) : null}
                      </span>
                    </span>
                    <span className="text-caption">
                      <ChevronRight size={16} />
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-12 rounded-16 border border-default bg-neutral-white p-12">
            <div className="flex items-center justify-between gap-12">
              <span className="flex items-center gap-8">
                <span className="text-16 font-bold text-default">{focus.name}</span>
                <Badge intent="primary" variant="subtle" size="sm">
                  Weekly summary
                </Badge>
              </span>
              <button
                type="button"
                onClick={onOpenDaily}
                className="flex items-center gap-4 text-14 font-bold text-link active:opacity-70"
              >
                View {focus.target} {focus.name.toLowerCase()} <ArrowRight size={16} />
              </button>
            </div>

            {focus.id === 'pelayanan' ? (
              <>
                <div className="flex gap-12">
                  <Fraction
                    label="Repayment"
                    value={focus.done * 7}
                    total={focus.target * 10}
                    unit="angsuran paid by mitra"
                    note={`${Math.round(focus.done * 6.3)} full · ${Math.round(focus.done * 0.7)} partial`}
                  />
                  <Fraction
                    label="Attendance"
                    value={focus.done * 8}
                    total={focus.target * 10}
                    unit="mitra attended the meeting"
                  />
                </div>
                <div className="flex items-center gap-12 rounded-12 bg-neutral-50 p-12">
                  <Money label="Cash collected" value={collected} />
                  <Money label="Cash settled" value={settled} tone="green" />
                  <Money
                    label="Not yet settled"
                    value={pending}
                    tone={pending ? 'orange' : undefined}
                  />
                </div>
              </>
            ) : null}
            {focus.id === 'home-visit' ? (
              <>
                <div className="flex gap-12">
                  <Fraction
                    label="Payment"
                    value={paidVisits}
                    total={visited}
                    unit="visits where the mitra paid"
                    note={`${paidFull} full · ${paidVisits - paidFull} partial`}
                  />
                  <Fraction
                    label="Visited"
                    value={visited}
                    total={totals[1].target}
                    unit="home visits done"
                  />
                </div>
                <div className="flex items-center gap-12 rounded-12 bg-neutral-50 p-12">
                  <Tally label="Met mitra" value={metMitra} />
                  <Tally label="Did not meet mitra" value={metNone} />
                  <Tally label="Met family" value={metFamily} />
                </div>
                <div className="flex gap-24">
                  <ReasonList
                    title="Why the mitra was not met"
                    unit="visits"
                    reasons={distribute(NOT_MET_REASONS, metNone + metFamily)}
                  />
                  <ReasonList
                    title="Why the mitra did not pay"
                    unit="visits"
                    reasons={distribute(NOT_PAID_REASONS, visited - paidVisits)}
                  />
                </div>
              </>
            ) : null}

            <span className="flex flex-col gap-2">
              <span className="text-14 font-bold text-default">Day by day</span>
              <span className="text-12 text-caption">
                {focus.name} done against the daily target
              </span>
            </span>
            <div className="flex flex-col overflow-hidden rounded-12 border border-default">
              {days.map((d, i) => {
                const done = snaps[i].done[focus.id]
                const target = COUNT_TASKS.find((t) => t.id === focus.id)!.target
                const gap = target - done
                const met = gap <= 0
                const visit = focus.id === 'pelayanan' || focus.id === 'home-visit'
                const rescheduled = visit && gap >= 1 ? 1 : 0
                const skipped = visit && gap >= 3 ? 1 : 0
                const parts = [
                  [gap - rescheduled - skipped, 'not done'],
                  [skipped, 'skipped'],
                  [rescheduled, 'rescheduled'],
                ]
                  .filter(([n]) => n)
                  .map(([n, label]) => `${n} ${label}`)
                  .join(' · ')
                return (
                  <div
                    key={d.date}
                    className={`flex items-center gap-12 px-12 py-12 ${
                      i > 0 ? 'border-t border-default' : ''
                    } ${met ? 'bg-neutral-white' : 'bg-orange-50'}`}
                  >
                    <span className={met ? 'text-green-500' : 'text-orange-500'}>
                      {met ? <CheckCircleFill size={20} /> : <Hourglass size={20} />}
                    </span>
                    <span className="shrink-0 text-14 text-default" style={{ width: 96 }}>
                      {d.label}, {d.date}
                    </span>
                    <span className="shrink-0 text-14 font-bold text-default" style={{ width: 56 }}>
                      {done} / {target}
                    </span>
                    <span
                      className={`min-w-0 flex-1 text-14 ${met ? 'text-caption' : 'text-default'}`}
                    >
                      {met ? 'Target met' : parts}
                    </span>
                    {met ? null : (
                      <button
                        type="button"
                        onClick={onOpenDaily}
                        className="shrink-0 text-14 font-bold text-link active:opacity-70"
                      >
                        See detail
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {verifyTotal > 0 || pending > 0 ? (
              <div className="flex flex-col gap-8 border-t border-default pt-12">
                <span className="flex items-baseline gap-8">
                  <span className="text-16 font-bold text-default">Needs your review</span>
                  <span className="text-12 text-caption">Across all task types</span>
                </span>
                {verifyTotal > 0 ? (
                  <div className="flex items-center justify-between gap-12 rounded-12 bg-orange-50 p-12">
                    <div className="flex items-center gap-12">
                      <span className="text-orange-500">
                        <WarningFill size={24} />
                      </span>
                      <span className="flex flex-col gap-2">
                        <span className="text-14 font-bold text-default">
                          {verifyTotal} submissions need verification
                        </span>
                        <span className="text-12 text-caption">
                          {totals[0].verify} Majelis · {totals[1].verify} home visit
                        </span>
                      </span>
                    </div>
                    <Button variant="primary" size="sm" onClick={onOpenDaily}>
                      Verify
                    </Button>
                  </div>
                ) : null}
                {pending > 0 ? (
                  <div className="flex items-center justify-between gap-12 rounded-12 bg-orange-50 p-12">
                    <div className="flex items-center gap-12">
                      <span className="text-orange-500">
                        <WarningFill size={24} />
                      </span>
                      <span className="flex flex-col gap-2">
                        <span className="text-14 font-bold text-default">
                          {rupiah(pending)} cash not yet settled
                        </span>
                        <span className="text-12 text-caption">
                          From {slip} Majelis {slip === 1 ? 'visit' : 'visits'}
                        </span>
                      </span>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => onOpenCash(bp.name)}>
                      Review
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

// Mock reason tallies for a BP's home visits over the week; scaled by how often
// she slips so a steadier BP shows fewer of each.
const NOT_MET_REASONS: [string, number][] = [
  ['Mitra is working', 4],
  ['Mitra went to the market', 3],
  ['Mitra not at home, no reason given', 2],
  ['Mitra moved house', 1],
]
const NOT_PAID_REASONS: [string, number][] = [
  ['No cash on hand', 5],
  ['Business is slow', 3],
  ['Will pay later (janji bayar)', 2],
  ['Family emergency', 1],
]

/** Split `total` across the reasons in proportion to their weights (largest
 *  remainder), so the tallies always add up to the figure they explain. */
function distribute(base: [string, number][], total: number): [string, number][] {
  const weight = base.reduce((n, [, w]) => n + w, 0)
  const raw = base.map(([, w]) => (w / weight) * total)
  const counts = raw.map(Math.floor)
  let left = total - counts.reduce((n, c) => n + c, 0)
  raw
    .map((r, i) => [r - Math.floor(r), i] as const)
    .sort((x, y) => y[0] - x[0])
    .forEach(([, i]) => {
      if (left > 0) {
        counts[i] += 1
        left -= 1
      }
    })
  return base.map(([r], i): [string, number] => [r, counts[i]]).filter(([, c]) => c > 0)
}

/** A ranked list of reasons; the most common one is called out first. */
function ReasonList({
  title,
  unit,
  reasons,
}: {
  title: string
  unit: string
  reasons: [string, number][]
}) {
  const total = reasons.reduce((n, [, c]) => n + c, 0)
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="pb-8 text-14 font-bold text-default">
        {title} <span className="font-regular text-caption">· {total}</span>
      </span>
      {reasons.map(([reason, count]) => (
        <span
          key={reason}
          className="flex items-center justify-between gap-8 border-t border-default py-8"
        >
          <span className="min-w-0 text-14 text-default">{reason}</span>
          <span className="shrink-0 text-14 font-bold text-default">{count}</span>
        </span>
      ))}
    </div>
  )
}

/** One figure in a strip: a small label over a bold count. */
function Tally({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <span className="text-12 text-caption">{label}</span>
      <span className="text-20 font-bold text-default">{value}</span>
    </div>
  )
}

function Fraction({
  label,
  value,
  total,
  unit,
  note,
}: {
  label: string
  value: number
  total: number
  unit: string
  note?: string
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <span className="text-14 text-default">{label}</span>
      <span className="text-24 font-bold text-default">
        {value} <span className="text-14 font-regular text-caption">/ {total}</span>
      </span>
      <span className="text-12 text-caption">{unit}</span>
      {note ? <span className="text-12 text-caption">{note}</span> : null}
    </div>
  )
}

function Money({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'green' | 'orange'
}) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <span className="text-12 text-caption">{label}</span>
      <span
        className={`text-16 font-bold ${
          tone === 'green'
            ? 'text-green-500'
            : tone === 'orange'
              ? 'text-orange-500'
              : 'text-default'
        }`}
      >
        {rupiah(value)}
      </span>
    </div>
  )
}
