'use client'

// The full 48 weeks — the one place the whole ladder is shown, because home
// deliberately never does. Twelve chapters, each four good weeks ending in a
// reward, the last one ending in the limit increase instead.
//
// Past chapters list the weeks she actually banked. Future ones are nominal:
// they assume no further missed weeks, which is the only honest thing to draw.

import { Badge, NavigationHeader } from '@/design-system/components'
import { Check, Medal, Withdraw } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  GROUP_BONUS,
  LIMIT_INCREASE,
  MILESTONE_REWARD,
  TOTAL_CHAPTERS,
  TOTAL_WEEKS,
  goodWeeks,
  groupStatus,
  journeyPercent,
  ladder,
  limitOnOffer,
  milestonesEarned,
  pot,
  short,
  type Chapter,
} from '../lib/data'
import { useApp } from '../lib/store'
import { Meter, WeekTile, windowLine } from '../lib/ui'

export function ProgressScreen() {
  const flow = useFlow()
  const s = useApp()
  const chapters = ladder(s)

  return (
    <Screen topBar={<NavigationHeader title="Perjalanan Ibu" onBack={flow.back} />}>
      {/* The pot. What the milestones have actually banked, and when it opens —
          the first thing to answer, because it is the near-term one. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <div className="flex items-center gap-12">
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
            <Withdraw size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-12 text-caption">Siap dicairkan</p>
            <p className="mt-2 text-20 font-bold text-default">{short(pot(s))}</p>
          </div>
        </div>
        <p className="mt-12 text-12 text-caption">{windowLine(s)}</p>
      </div>

      {/* The limit, and the two things that raise it. The split home never
          shows: hers is week 48, the other is the majelis. */}
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

      {/* The twelve stamps, moved off the home card. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <p className="text-14 font-bold text-default">
          {milestonesEarned(s)} dari {TOTAL_CHAPTERS} hadiah terkumpul
        </p>
        <div className="mt-12 grid grid-cols-6 gap-4">
          {Array.from({ length: TOTAL_CHAPTERS }, (_, i) => i + 1).map((n) => (
            <Stamp
              key={n}
              n={n}
              status={
                n <= milestonesEarned(s)
                  ? 'earned'
                  : n === milestonesEarned(s) + 1
                    ? 'current'
                    : 'locked'
              }
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-12 pb-16">
        {chapters.map((chapter) => (
          <ChapterBlock key={chapter.index} chapter={chapter} />
        ))}
      </div>
    </Screen>
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

/** One of the twelve milestone stamps. Earned, being filled, or still locked. */
function Stamp({ n, status }: { n: number; status: 'earned' | 'current' | 'locked' }) {
  if (status === 'earned') {
    return (
      <span className="flex h-32 items-center justify-center rounded-8 bg-primary-500 text-neutral-white">
        <Check size={16} />
      </span>
    )
  }
  if (status === 'current') {
    return (
      <span className="flex h-32 items-center justify-center rounded-8 border-2 border-primary-500 bg-neutral-white text-12 font-bold text-primary-500">
        {n}
      </span>
    )
  }
  return (
    <span className="flex h-32 items-center justify-center rounded-8 border border-default bg-neutral-white text-12 text-disabled">
      {n}
    </span>
  )
}

function ChapterBlock({ chapter }: { chapter: Chapter }) {
  const first = chapter.cells[0].week
  const last = chapter.cells[chapter.cells.length - 1].week

  return (
    <div
      className={`rounded-12 border bg-neutral-white p-12 ${
        chapter.status === 'current' ? 'border-primary-500' : 'border-default'
      }`}
    >
      <div className="flex items-center gap-8">
        <span className="min-w-0 flex-1 text-14 font-bold text-default">
          Minggu {first}–{last}
        </span>
        {chapter.status === 'done' ? (
          <Badge intent="green" variant="subtle" size="sm">
            Selesai
          </Badge>
        ) : null}
        {chapter.status === 'current' ? (
          <Badge intent="primary" variant="solid" size="sm">
            Sekarang
          </Badge>
        ) : null}
      </div>

      <div className="mt-12 flex items-start gap-8">
        <span className="flex min-w-0 flex-1 gap-4">
          {chapter.cells.map((cell) => (
            <WeekTile key={cell.week} cell={cell} size="sm" />
          ))}
        </span>

        <span
          className={`flex h-32 shrink-0 items-center gap-4 rounded-8 px-8 ${
            chapter.status === 'done'
              ? 'bg-primary-500 text-neutral-white'
              : chapter.final
                ? 'bg-yellow-50 text-yellow-600'
                : 'border border-primary-200 bg-primary-50 text-primary-500'
          }`}
        >
          {chapter.final ? <Medal size={16} /> : <Withdraw size={16} />}
          <span className="whitespace-nowrap text-12 font-bold">
            {chapter.final ? short(LIMIT_INCREASE) : short(MILESTONE_REWARD)}
          </span>
        </span>
      </div>
    </div>
  )
}
