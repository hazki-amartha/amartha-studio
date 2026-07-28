'use client'

// Detail page for the A/B concept: the unit is the WEEK.
//
// One denominator on the page and nowhere else. Everything here counts in weeks
// — the headline, the bar, the grid, the recap — and the word "12" never
// appears. The four-week reward still exists, but it is stated once as a
// sentence underneath, subordinate to the run of weeks it hangs off.
//
// The rewards page is the mirror image: it counts in twelves and never says 48.
// A mitra should only ever be handed one of these.

import { NavigationHeader } from '@/design-system/components'
import { Check, Medal, Minus, Withdraw } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  CHAPTER_LENGTH,
  GROUP_BONUS,
  LIMIT_INCREASE,
  MILESTONE_REWARD,
  TOTAL_WEEKS,
  allWeeks,
  goodWeeks,
  groupStatus,
  journeyPercent,
  limitOnOffer,
  pot,
  short,
  type WeekCell,
} from '../lib/data'
import { useApp } from '../lib/store'
import { Meter, windowLine } from '../lib/ui'

export function ProgressWeeksScreen() {
  const flow = useFlow()
  const s = useApp()
  const weeks = allWeeks(s)

  return (
    <Screen topBar={<NavigationHeader title="Perjalanan Ibu" onBack={flow.back} />}>
      {/* The one thing this page argues, in the one unit it uses. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <div className="flex items-center gap-12">
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-yellow-50 text-yellow-600">
            <Medal size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-16 font-bold text-default">
              Limit naik {groupStatus(s) === 'lewat' ? '' : 's/d '}
              {short(limitOnOffer(s))}
            </p>
            <p className="mt-2 text-12 text-caption">
              {goodWeeks(s)} dari {TOTAL_WEEKS} minggu lancar
            </p>
          </div>
        </div>
        <div className="mt-12">
          <Meter percent={journeyPercent(s)} tone="yellow" />
        </div>

        <div className="mt-16 flex flex-col gap-8">
          <SplitLine label={`Dari ${TOTAL_WEEKS} minggu Ibu`} amount={short(LIMIT_INCREASE)} />
          <SplitLine
            label="Dari kelompok lancar"
            amount={short(GROUP_BONUS)}
            struck={groupStatus(s) === 'lewat'}
          />
        </div>
      </div>

      {/* Forty-eight weeks, unbroken. No chapter dividers, no reward markers —
          the moment the run is cut into blocks it starts counting in twelves. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <p className="text-14 font-bold text-default">Catatan mingguan Ibu</p>

        <div className="mt-12 grid grid-cols-8 gap-4">
          {weeks.map((cell) => (
            <GridWeek key={cell.week} cell={cell} />
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-12">
          <Legend tone="bg-primary-500" label="Lancar" />
          <Legend tone="border border-orange-200 bg-orange-50" label="Terlewat" />
          <Legend tone="border border-default bg-neutral-white" label="Belum" />
        </div>

        {/* The reward, said once and kept subordinate. */}
        <p className="mt-16 text-12 text-caption">
          Setiap {CHAPTER_LENGTH} minggu lancar, Ibu dapat tambahan{' '}
          {short(MILESTONE_REWARD)} untuk pencairan berikutnya.
        </p>
      </div>

      {/* The pot. A rupiah figure, not a second thing to track — one row. */}
      <div className="flex items-center gap-12 rounded-12 border border-default bg-neutral-white p-12 pb-16">
        <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
          <Withdraw size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-12 text-caption">Siap dicairkan</span>
          <span className="mt-2 block text-12 text-caption">{windowLine(s)}</span>
        </span>
        <span className="shrink-0 text-16 font-bold text-default">{short(pot(s))}</span>
      </div>

      <div className="pb-16" />
    </Screen>
  )
}

function GridWeek({ cell }: { cell: WeekCell }) {
  const style =
    cell.status === 'done'
      ? 'bg-primary-500 text-neutral-white'
      : cell.status === 'missed'
        ? 'border border-orange-200 bg-orange-50 text-orange-500'
        : cell.status === 'active'
          ? 'border-2 border-primary-500 bg-neutral-white text-primary-500'
          : 'border border-default bg-neutral-white text-disabled'

  return (
    <span className={`flex h-32 items-center justify-center rounded-4 text-10 ${style}`}>
      {cell.status === 'done' ? <Check size={16} /> : null}
      {cell.status === 'missed' ? <Minus size={16} /> : null}
      {cell.status === 'done' || cell.status === 'missed' ? null : cell.week}
    </span>
  )
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="flex items-center gap-4">
      <span className={`h-12 w-12 rounded-2 ${tone}`} />
      <span className="text-10 text-caption">{label}</span>
    </span>
  )
}

function SplitLine({
  label,
  amount,
  struck,
}: {
  label: string
  amount: string
  struck?: boolean
}) {
  return (
    <div className="flex items-baseline gap-8">
      <span className="min-w-0 flex-1 text-12 text-caption">{label}</span>
      <span
        className={`shrink-0 text-12 font-bold ${struck ? 'text-caption line-through' : 'text-default'}`}
      >
        {amount}
      </span>
    </div>
  )
}
