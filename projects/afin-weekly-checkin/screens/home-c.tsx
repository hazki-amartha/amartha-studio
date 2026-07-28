'use client'

// Option C — the board, wired to the endgame.
//
// A variation of B rather than a different species. Same four-tile board, same
// oversized reward closing it — but the reward is no longer the end of the
// argument. A short rail runs from it down into a strip of twelve milestone
// stamps, and the limit increase sits at the bottom of that strip as what
// collecting all twelve buys.
//
// So the card answers "why does this month matter" without a destination
// header: this month is one of twelve, and the twelve are the limit increase.
// The reward tile and its stamp in the strip carry the same number, which is
// the whole connection.

import {
  CHAPTER_LENGTH,
  LIMIT_INCREASE,
  MILESTONE_REWARD,
  TOTAL_CHAPTERS,
  chapterCells,
  milestonesEarned,
  rewardReady,
  short,
  weeksToReward,
} from '../lib/data'
import { useApp } from '../lib/store'
import { HomeShell, LadderLink, WeekTasks, WeekTile } from '../lib/ui'
import { Check, Medal, Withdraw } from '@/design-system/icons'

export function HomeCScreen() {
  const s = useApp()
  const cells = chapterCells(s)
  const ready = rewardReady(s)
  const left = weeksToReward(s)
  const earned = milestonesEarned(s)
  // The milestone this month's board is filling, 1-based.
  const current = Math.min(earned + 1, TOTAL_CHAPTERS)

  return (
    <HomeShell>
      <div className="overflow-hidden rounded-12 border border-default bg-neutral-white">
        <div className="p-16">
          <div className="flex items-baseline gap-12">
            <span className="flex-1 text-16 font-bold text-default">Setoran mingguan Ibu</span>
            <span className="text-12 text-caption">
              {ready ? 'Hadiah terbuka' : `${left} minggu lagi`}
            </span>
          </div>

          <div className="mt-16 grid grid-cols-4 gap-8">
            {cells.map((cell) => (
              <WeekTile key={cell.week} cell={cell} />
            ))}
          </div>

          {/* The board's closing tile, tagged with its number so it can be found
              again in the strip below. */}
          <div
            className={`mt-8 flex items-center gap-12 rounded-12 p-16 ${
              ready ? 'bg-primary-500 text-neutral-white' : 'border border-primary-200 bg-primary-50'
            }`}
          >
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-500 text-neutral-white">
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
            <span
              className={`shrink-0 rounded-full px-8 py-2 text-10 font-bold ${
                ready ? 'bg-primary-600 text-neutral-white' : 'bg-primary-500 text-neutral-white'
              }`}
            >
              Hadiah {current}
            </span>
          </div>

          {/* The rail. The only thing on the card that says the month and the
              year are the same argument. */}
          <span className="mx-auto block h-16 w-2 bg-primary-200" />

          <div className="rounded-12 bg-neutral-50 p-12">
            <p className="text-14 font-bold text-default">
              Kumpulkan {TOTAL_CHAPTERS} hadiah, limit Ibu naik
            </p>
            <p className="mt-2 text-12 text-caption">
              {earned} dari {TOTAL_CHAPTERS} hadiah sudah Ibu kumpulkan
            </p>

            <div className="mt-12 grid grid-cols-6 gap-4">
              {Array.from({ length: TOTAL_CHAPTERS }, (_, i) => i + 1).map((n) => (
                <Stamp
                  key={n}
                  n={n}
                  status={n <= earned ? 'earned' : n === current ? 'current' : 'locked'}
                />
              ))}
            </div>

            <span className="mx-auto block h-12 w-2 bg-neutral-200" />

            <div className="flex items-center gap-12 rounded-8 border border-default bg-neutral-white p-12">
              <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-yellow-50 text-yellow-600">
                <Medal size={24} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-14 font-bold text-default">
                  Limit naik {short(LIMIT_INCREASE)}
                </span>
                <span className="mt-2 block text-12 text-caption">
                  Setelah hadiah ke-{TOTAL_CHAPTERS}
                </span>
              </span>
            </div>
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
