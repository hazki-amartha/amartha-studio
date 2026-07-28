'use client'

// Option A — the strip.
//
// The layout argued for in discussion: the limit increase on top as a
// destination that carries no mechanics, the current chapter beneath it as a
// row of week tiles, and the reward as a full-width bar closing the row. Near
// and far rewards sit at different altitudes, so they stop competing.
//
// Closest to the first reference: one horizontal run of tiles, today marked,
// the rest dim.

import {
  CHAPTER_LENGTH,
  MILESTONE_REWARD,
  chapterCells,
  rewardReady,
  short,
  weeksToReward,
} from '../lib/data'
import { useApp } from '../lib/store'
import { Destination, HomeShell, LadderLink, WeekTasks, WeekTile } from '../lib/ui'
import { LockKeyOpen, Withdraw } from '@/design-system/icons'

export function HomeAScreen() {
  const s = useApp()
  const cells = chapterCells(s)
  const ready = rewardReady(s)
  const left = weeksToReward(s)

  return (
    <HomeShell>
      <div className="overflow-hidden rounded-12 border border-default bg-neutral-white">
        <div className="p-16">
          <Destination />
        </div>

        <div className="border-t border-default p-16">
          <div className="flex items-baseline gap-12">
            <span className="flex-1 text-14 font-bold text-default">Hadiah berikutnya</span>
            <span className="text-12 text-caption">
              {ready ? 'Sudah terbuka' : `${left} minggu lagi`}
            </span>
          </div>

          <div className="mt-12 flex gap-8">
            {cells.map((cell) => (
              <WeekTile key={cell.week} cell={cell} />
            ))}
          </div>

          <div
            className={`mt-12 flex items-center gap-8 rounded-8 p-12 ${
              ready
                ? 'bg-primary-500 text-neutral-white'
                : 'border border-primary-200 bg-primary-50 text-primary-500'
            }`}
          >
            {ready ? <Withdraw size={20} /> : <LockKeyOpen size={20} />}
            <span className="min-w-0 flex-1 text-14 font-bold">
              Cair {short(MILESTONE_REWARD)}
            </span>
            <span className="shrink-0 text-12">
              {ready ? 'Siap dicairkan' : `Setelah ${CHAPTER_LENGTH} minggu lancar`}
            </span>
          </div>
        </div>

        <div className="border-t border-default p-16">
          <WeekTasks />
        </div>

        <LadderLink />
      </div>
    </HomeShell>
  )
}
