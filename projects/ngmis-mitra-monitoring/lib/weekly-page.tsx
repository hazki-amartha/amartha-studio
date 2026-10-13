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
import { DailyDrawer, type WeekList } from './daily-drawer'
import type { GapFocus } from './daily-scorecard'
import { WeeklyDrawer } from './weekly-drawer'
import { BPS, type Bp } from './daily-data'
import {
  COUNT_TASKS,
  OLDEST_WEEK,
  snapshot,
  weekDays,
  weekRange,
  type Day,
  type Snapshot,
} from './weekly-data'

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

export function WeeklyProgress({ onOpenCash }: { onOpenCash: (bpName: string) => void }) {
  const [week, setWeek] = useState(0)
  const [weeklyBp, setWeeklyBp] = useState<string | null>(null)
  const [dailyBp, setDailyBp] = useState<string | null>(null)
  const [dailyGap, setDailyGap] = useState<GapFocus | undefined>()
  const [dailyWeek, setDailyWeek] = useState<WeekList | undefined>()
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
          <BpWeek
            key={bp.id}
            bp={bp}
            days={days}
            week={week}
            onWeekly={(b) => setWeeklyBp(b.name)}
            onDaily={(b, gap) => {
              setDailyWeek(undefined)
              setDailyGap(gap)
              setDailyBp(b.name)
            }}
          />
        ))}
      </div>
      {weeklyBp ? (
        <WeeklyDrawer
          bpName={weeklyBp}
          initialWeek={week}
          onClose={() => setWeeklyBp(null)}
          onOpenDaily={() => {
            setDailyGap(undefined)
            setDailyWeek(undefined)
            setDailyBp(weeklyBp)
            setWeeklyBp(null)
          }}
          onOpenList={(task, wk) => {
            const bp = BPS.find((b) => b.name === weeklyBp) ?? BPS[0]
            const ds = weekDays(wk)
            const taskId = task === 'home' ? 'home-visit' : 'pelayanan'
            setDailyGap(undefined)
            setDailyWeek({
              task,
              range: weekRange(wk),
              days: ds,
              doneByDay: ds.map((_, i) => snapshot(bp, i - wk * 5).done[taskId]),
              target: COUNT_TASKS.find((t) => t.id === taskId)!.target,
            })
            setDailyBp(weeklyBp)
            setWeeklyBp(null)
          }}
          onOpenCash={(name) => {
            setWeeklyBp(null)
            onOpenCash(name)
          }}
        />
      ) : null}
      {dailyBp ? (
        <DailyDrawer
          bpName={dailyBp}
          gap={dailyGap}
          week={dailyWeek}
          onClose={() => setDailyBp(null)}
          onOpenCash={(name) => {
            setDailyBp(null)
            onOpenCash(name)
          }}
        />
      ) : null}
    </>
  )
}

/** A day's two figures for one row; a `merged` row has one cell spanning both. */
interface Row {
  label: string
  cells?: (s: Snapshot, open: (gap?: GapFocus) => void) => [ReactNode, ReactNode]
  merged?: (s: Snapshot) => ReactNode
}

const ROWS: Row[] = [
  ...COUNT_TASKS.map((t): Row => ({
    label: t.label,
    cells: (s, open) => [
      <span key="t" className="text-default">
        {t.target}
      </span>,
      <button
        key="d"
        type="button"
        onClick={() => open({ rowId: t.id, target: t.target, done: s.done[t.id] })}
        className={`block w-full underline-offset-4 hover:underline active:opacity-70 ${tone(
          s.done[t.id] >= t.target,
        )}`}
      >
        {s.done[t.id]}
      </button>,
    ],
  })),
  { label: 'Ingatkan kumpulan', merged: (s) => <StatusBadge done={s.reminded} /> },
  { label: 'Tutup hari', merged: (s) => <StatusBadge done={s.closed} /> },
]

function BpWeek({
  bp,
  days,
  week,
  onWeekly,
  onDaily,
}: {
  bp: Bp
  days: Day[]
  week: number
  onWeekly: (bp: Bp) => void
  onDaily: (bp: Bp, gap?: GapFocus) => void
}) {
  const snaps = days.map((_, i) => snapshot(bp, i - week * 5))

  return (
    <section>
      <PanelHeading
        title={bp.name}
        titleAction={
          <button
            type="button"
            onClick={() => onWeekly(bp)}
            className="text-14 font-bold text-link active:opacity-70"
          >
            See detail
          </button>
        }
      />
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
                    <button
                      type="button"
                      onClick={() => onDaily(bp)}
                      className="text-14 font-bold text-link active:opacity-70"
                    >
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
                <th
                  key={`${d.date}-d`}
                  className="px-16 pb-16 text-center text-14 font-regular text-default"
                >
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
                      <td
                        key={d.date}
                        colSpan={2}
                        className="border-l border-default px-16 py-12 text-center"
                      >
                        {row.merged(s)}
                      </td>,
                    ]
                  }
                  const [target, done] = row.cells!(s, (gap) => onDaily(bp, gap))
                  return [
                    <td
                      key={`${d.date}-t`}
                      className="border-l border-default px-16 py-12 text-center text-14"
                    >
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
