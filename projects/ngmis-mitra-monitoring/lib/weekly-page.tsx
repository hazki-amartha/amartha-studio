'use client'

// Weekly task — the working week so far (Senin–Jumat), one snapshot per BP. Days
// run across the top; the same tasks Progres harian's Tugas scorecard lists run
// down the side. Mock figures are
// derived from a small per-BP profile so the six BPs read differently without
// a hand-typed grid.

import { useState, type ReactNode } from 'react'
import { Badge } from '@/design-system/components'
import { CheckCircleFill, ChevronLeft, ChevronRight, Hourglass } from '@/design-system/icons'
import { PanelHeading } from './ui'
import { BPS, type Bp } from './daily-data'

interface Day {
  label: string
  date: string
}

const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
/** The Monday of the current week (the reporting date, 7 Agu 2026, is a Friday). */
const THIS_MONDAY = new Date(2026, 7, 3)
const OLDEST_WEEK = -4

const fmt = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

/** `week` is 0 for this week, -1 for last week, and so on. */
function weekDays(week: number): Day[] {
  const monday = addDays(THIS_MONDAY, week * 7)
  return DAY_LABELS.map((label, i) => ({ label, date: fmt(addDays(monday, i)) }))
}

/** "3 Agu – 10 Agu 2026": Monday to the following Monday. */
function weekRange(week: number): string {
  const monday = addDays(THIS_MONDAY, week * 7)
  const next = addDays(monday, 7)
  return `${fmt(monday)} – ${fmt(next)} ${next.getFullYear()}`
}

/** Per-BP profile: how often she misses a day's target (0–3). */
const SLIP: Record<string, number> = {
  'bp-a': 1,
  'bp-b': 0,
  'bp-c': 3,
  'bp-d': 1,
  'bp-e': 2,
  'bp-f': 3,
}

/** The count tasks Progres harian's Tugas scorecard lists, with a day's target. */
const COUNT_TASKS = [
  { id: 'pelayanan', label: 'Pelayanan', target: 6 },
  { id: 'home-visit', label: 'Home visit', target: 3 },
  { id: 'reaktivasi', label: 'Reaktivasi & lanjutan', target: 1 },
  { id: 'sosialisasi', label: 'Sosialisasi', target: 2 },
  { id: 'follow-up', label: 'Follow up', target: 2 },
]

interface Snapshot {
  done: Record<string, number>
  reminded: boolean
  closed: boolean
}

function snapshot(bp: Bp, dayIndex: number): Snapshot {
  const slip = SLIP[bp.id]
  const done: Record<string, number> = {}
  COUNT_TASKS.forEach((t, k) => {
    const miss = (dayIndex + k + slip) % 4 < slip
    done[t.id] = miss ? Math.max(0, t.target - 1 - ((dayIndex + k) % 2)) : t.target
  })
  return {
    done,
    reminded: (dayIndex + slip) % 4 !== 3 || slip === 0,
    closed: !((dayIndex + slip) % 3 === 0 && slip > 1),
  }
}

/** The entry point under a figure that missed its target. */
function SeeDetail() {
  return (
    <button type="button" className="block w-full text-center text-12 font-bold text-link active:opacity-70">
      See detail
    </button>
  )
}

const tone = (ok: boolean) => (ok ? 'text-green-500' : 'text-red-500')

// Same geometry as Progres harian's scorecard (daily-scorecard.tsx): a 220 label
// column, 132-wide day columns.
const W_LABEL = 220
const MEASURE_W = 132

function StatusBadge({ done }: { done: boolean }) {
  return done ? (
    <Badge intent="green" variant="subtle" size="sm" leadingIcon={<CheckCircleFill size={16} />}>
      Sudah
    </Badge>
  ) : (
    <Badge intent="neutral" variant="subtle" size="sm" leadingIcon={<Hourglass size={16} />}>
      Belum
    </Badge>
  )
}

export function WeeklyProgress() {
  const [week, setWeek] = useState(0)
  const days = weekDays(week)
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-16 pb-32">
        <span className="flex flex-col items-start gap-8">
          <span className="text-16 font-bold text-default">Weekly task</span>
          <span className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Minggu sebelumnya"
              disabled={week <= OLDEST_WEEK}
              onClick={() => setWeek(week - 1)}
              className="flex size-24 items-center justify-center text-default disabled:text-placeholder"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-8 text-14 text-default">{weekRange(week)}</span>
            <button
              type="button"
              aria-label="Minggu berikutnya"
              disabled={week >= 0}
              onClick={() => setWeek(week + 1)}
              className="flex size-24 items-center justify-center text-default disabled:text-placeholder"
            >
              <ChevronRight size={16} />
            </button>
          </span>
        </span>
      </div>
      <div className="flex flex-col gap-24">
        {BPS.map((bp) => (
          <BpWeek key={bp.id} bp={bp} days={days} week={week} />
        ))}
      </div>
    </>
  )
}

/** A day's two figures for one row; a `merged` row has one cell spanning both. */
interface Row {
  label: string
  cells?: (s: Snapshot) => [ReactNode, ReactNode]
  merged?: (s: Snapshot) => ReactNode
}

const ROWS: Row[] = [
  ...COUNT_TASKS.map((t): Row => ({
    label: t.label,
    cells: (s) => [
      <span key="t" className="text-default">{t.target}</span>,
      <span key="d" className="block text-center">
        <span className={`block ${tone(s.done[t.id] >= t.target)}`}>{s.done[t.id]}</span>
        {s.done[t.id] < t.target ? <SeeDetail /> : null}
      </span>,
    ],
  })),
  { label: 'Ingatkan kumpulan', merged: (s) => <StatusBadge done={s.reminded} /> },
  { label: 'Tutup hari', merged: (s) => <StatusBadge done={s.closed} /> },
]

function BpWeek({ bp, days, week }: { bp: Bp; days: Day[]; week: number }) {
  const snaps = days.map((_, i) => snapshot(bp, i - week * 5))

  return (
    <section>
      <PanelHeading title={bp.name} />
      <div className="overflow-x-auto rounded-12 border border-default">
        <table
          className="w-full table-fixed border-collapse text-left"
          style={{ minWidth: W_LABEL + days.length * 2 * MEASURE_W }}
        >
          <colgroup>
            <col style={{ width: W_LABEL }} />
            {days.flatMap((d) => [<col key={`${d.date}-t`} />, <col key={`${d.date}-d`} />])}
          </colgroup>
          <thead>
            <tr className="bg-neutral-200">
              <th
                rowSpan={2}
                className="sticky left-0 z-10 border-r border-default bg-neutral-200 px-16 py-20 text-left align-middle text-14 font-regular text-default"
              >
                Tugas
              </th>
              {days.map((d) => (
                <th
                  key={d.date}
                  colSpan={2}
                  className="border-l border-default px-16 py-20 text-14 font-regular text-default"
                >
                  <span className="flex items-baseline justify-center gap-8">
                    {d.label}, {d.date}
                    <button type="button" className="text-14 font-bold text-link active:opacity-70">
                      See detail
                    </button>
                  </span>
                </th>
              ))}
            </tr>
            <tr className="bg-neutral-200">
              {days.flatMap((d) => [
                <th
                  key={`${d.date}-t`}
                  className="border-l border-default px-16 pb-16 text-center text-14 font-regular text-default"
                >
                  Target
                </th>,
                <th key={`${d.date}-d`} className="px-16 pb-16 text-center text-14 font-regular text-default">
                  Selesai
                </th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, ri) => (
              <tr
                key={row.label}
                className={`align-middle ${ri % 2 === 1 ? 'bg-neutral-50' : 'bg-neutral-white'}`}
              >
                <td
                  className={`sticky left-0 z-10 border-r border-default px-16 py-12 text-14 font-regular text-default ${
                    ri % 2 === 1 ? 'bg-neutral-50' : 'bg-neutral-white'
                  }`}
                >
                  {row.label}
                </td>
                {days.flatMap((d, i) => {
                  const s = snaps[i]
                  if (row.merged) {
                    return [
                      <td key={d.date} colSpan={2} className="border-l border-default px-16 py-12 text-center">
                        {row.merged(s)}
                      </td>,
                    ]
                  }
                  const [target, done] = row.cells!(s)
                  return [
                    <td key={`${d.date}-t`} className="border-l border-default px-16 py-12 text-center text-14">
                      {target}
                    </td>,
                    <td key={`${d.date}-d`} className="px-16 py-12 text-center text-14">
                      {done}
                    </td>,
                  ]
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
