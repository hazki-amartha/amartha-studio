'use client'

// Option B — the board.
//
// The e-commerce reference taken literally: a grid you are filling in, with the
// reward as the one oversized tile that closes it. The difference from A is
// where the limit increase goes — here it is NOT a header framing the row, it
// is the last locked item on the same board, the way a seven-day grid ends in a
// red packet. The endgame reads as a collectible rather than a destination.
//
// The question this option puts to the designer: does the far reward work
// better above the row as context, or below it as the final prize?

import {
  CHAPTER_LENGTH,
  LIMIT_INCREASE,
  MILESTONE_REWARD,
  TOTAL_WEEKS,
  chapterCells,
  goodWeeks,
  journeyPercent,
  rewardReady,
  short,
  weeksToReward,
} from '../lib/data'
import { useApp } from '../lib/store'
import { HomeShell, LadderLink, Meter, WeekTasks, WeekTile } from '../lib/ui'
import { Medal, Withdraw } from '@/design-system/icons'

export function HomeBScreen() {
  const s = useApp()
  const cells = chapterCells(s)
  const ready = rewardReady(s)
  const left = weeksToReward(s)

  return (
    <HomeShell>
      <div className="overflow-hidden rounded-12 border border-light bg-neutral-white">
        <div className="p-16">
          <div className="flex items-baseline gap-12">
            <span className="flex-1 text-16 font-bold text-default">Setoran mingguan Ibu</span>
            <span className="text-12 text-caption">
              {ready ? 'Hadiah terbuka' : `${left} minggu lagi`}
            </span>
          </div>

          {/* The board. Four slots, plus one more for every week that was
              missed — the row grows, the reward does not move. */}
          <div className="mt-16 grid grid-cols-4 gap-8">
            {cells.map((cell) => (
              <WeekTile key={cell.week} cell={cell} />
            ))}
          </div>

          {/* The oversized closing tile, the grid's red packet. */}
          <div
            className={`mt-8 flex items-center gap-12 rounded-12 p-16 ${
              ready
                ? 'bg-primary-500 text-neutral-white'
                : 'border border-primary-200 bg-primary-50'
            }`}
          >
            <span
              className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-full ${
                ready ? 'bg-primary-600 text-neutral-white' : 'bg-primary-500 text-neutral-white'
              }`}
            >
              <Withdraw size={24} />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-20 font-bold ${ready ? '' : 'text-primary-500'}`}>
                {short(MILESTONE_REWARD)}
              </span>
              <span className={`mt-2 block text-12 ${ready ? '' : 'text-caption'}`}>
                {ready
                  ? 'Sudah bisa Ibu cairkan'
                  : `Terbuka setelah ${CHAPTER_LENGTH} minggu lancar`}
              </span>
            </span>
          </div>
        </div>

        <div className="border-t border-default p-16">
          <WeekTasks />
        </div>

        {/* The endgame as the board's final, still-locked item. */}
        <div className="border-t border-default bg-neutral-50 p-16">
          <div className="flex items-center gap-12">
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-yellow-50 text-yellow-600">
              <Medal size={24} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-12 uppercase text-caption">Hadiah akhir</span>
              <span className="mt-2 block text-14 font-bold text-default">
                Limit naik {short(LIMIT_INCREASE)}
              </span>
            </span>
            <span className="shrink-0 text-12 text-caption">
              {goodWeeks(s)}/{TOTAL_WEEKS}
            </span>
          </div>
          <div className="mt-12">
            <Meter percent={journeyPercent(s)} tone="yellow" />
          </div>
        </div>

        <LadderLink />
      </div>
    </HomeShell>
  )
}
