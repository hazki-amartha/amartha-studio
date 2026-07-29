'use client'

// The one detail page, shared by both options: the unit is the WEEK.
//
// One denominator on the page and nowhere else. Everything here counts in weeks
// — the headline, the bar, and every row of the ladder, which is labelled
// "Minggu 13–16" rather than numbered. The increment sits at the end of a row
// as what those four weeks added to the next disbursement; it is never itself
// counted, because a mitra tracking "how many rewards have I collected" is
// tracking the wrong thing.
//
// This page is deliberately where the RUPIAH live. Option B keeps figures off
// home on purpose, so the split it doesn't print — her Rp2jt, the majelis's
// Rp1jt — has to be legible somewhere, and this is that somewhere.

import { Badge, NavigationHeader } from '@/design-system/components'
import { Medal, Withdraw } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  GROUP_BONUS,
  LIMIT_INCREASE,
  MILESTONE_REWARD,
  TOTAL_WEEKS,
  goodWeeks,
  groupStatus,
  journeyPercent,
  ladder,
  limitOnOffer,
  pot,
  short,
  type Chapter,
} from '../lib/data'
import { useApp } from '../lib/store'
import { Meter, WeekTile, windowLine } from '../lib/ui'

export function ProgressWeeksScreen() {
  const flow = useFlow()
  const s = useApp()
  const chapters = ladder(s)

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

      {/* The forty-eight weeks, four to a row, each row ending in what those
          four weeks unlock. Every row is labelled by its WEEKS — no row is
          numbered "hadiah 3 of 12", because that is the count this page hands
          to the rewards page. */}
      <div className="flex flex-col gap-12">
        {chapters.map((chapter) => (
          <ChapterBlock key={chapter.index} chapter={chapter} />
        ))}
      </div>

      {/* The pot. A rupiah figure, not a second thing to track — one row. */}
      <div className="flex items-center gap-12 rounded-12 border border-default bg-neutral-white p-12 pb-16">
        <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
          <Withdraw size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-12 text-caption">Terkumpul untuk pencairan berikutnya</span>
          <span className="mt-2 block text-12 text-caption">{windowLine(s)}</span>
        </span>
        <span className="shrink-0 text-16 font-bold text-default">{short(pot(s))}</span>
      </div>

      <div className="pb-16" />
    </Screen>
  )
}

/** Four weeks and what they unlock. Labelled by week range, never numbered. */
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
