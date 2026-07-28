'use client'

// Option C — the board, wired to the endgame in one line.
//
// A variation of B, and the lightest of the three. Same four-tile board, same
// oversized reward closing it — but the endgame gets neither a header (A) nor a
// block of its own (B). It is a single line attached to the reward tile: this
// is hadiah 4, there are 12, the twelfth raises the limit.
//
// The strip of twelve stamps that used to sit here now lives on the progress
// page. Home keeps three blocks and nothing else: the board, the connector
// line, and the two things that fill a week.

import {
  CHAPTER_LENGTH,
  MILESTONE_REWARD,
  TOTAL_CHAPTERS,
  chapterCells,
  groupStatus,
  limitOnOffer,
  milestonesEarned,
  rewardReady,
  short,
  weeksToReward,
} from '../lib/data'
import { useApp } from '../lib/store'
import { HomeShell, LadderLink, MajelisCard, WeekTasks, WeekTile, windowLine } from '../lib/ui'
import { Medal, Withdraw } from '@/design-system/icons'

export function HomeCScreen() {
  const s = useApp()
  const cells = chapterCells(s)
  const ready = rewardReady(s)
  const left = weeksToReward(s)
  const earned = milestonesEarned(s)
  // The milestone this month's board is filling, 1-based.
  const current = Math.min(earned + 1, TOTAL_CHAPTERS)

  return (
    <HomeShell ladder="rewards">
      <div className="overflow-hidden rounded-16 border border-default bg-neutral-white">
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
                {ready ? windowLine(s) : `Terbuka setelah ${CHAPTER_LENGTH} minggu lancar`}
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

          {/* The whole endgame, in one line. The only thing on this card that
              says the month and the year are the same argument. */}
          <div className="mt-12 flex items-center gap-8 text-12">
            <Medal size={20} className="shrink-0 text-yellow-600" />
            <span className="min-w-0 flex-1 text-caption">
              Kumpulkan {TOTAL_CHAPTERS} hadiah, limit naik{' '}
              {groupStatus(s) === 'lewat' ? '' : 's/d '}
              <span className="font-bold text-default">{short(limitOnOffer(s))}</span>
            </span>
            <span className="shrink-0 font-bold text-default">
              {earned}/{TOTAL_CHAPTERS}
            </span>
          </div>
        </div>

        <div className="border-t border-default p-16">
          <WeekTasks />
        </div>

        <LadderLink ladder="rewards" />
      </div>

      <MajelisCard />
    </HomeShell>
  )
}
