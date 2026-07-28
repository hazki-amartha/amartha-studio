'use client'

// Option C — the track.
//
// The least gamey of the three, and the only one where near and far reward sit
// on the SAME line: weeks are dots along a path, the milestone is a station on
// it, and the week-48 limit increase is the end of the same path, greyed out
// but visible from week one. Nothing is stacked, so the card carries one
// sentence and one graphic instead of two blocks.
//
// It gives up the collectible feeling of A and B. What it buys is that the
// endgame never needs its own row — which is the cheapest possible answer to
// "how do we keep the limit increase on screen for eleven months without it
// turning into wallpaper".

import {
  MILESTONE_REWARD,
  TOTAL_WEEKS,
  chapterCells,
  rewardReady,
  short,
  weeksToReward,
} from '../lib/data'
import { LIMIT_INCREASE } from '../lib/data'
import { useApp } from '../lib/store'
import { HomeShell, LadderLink, WeekTasks } from '../lib/ui'
import { Check, Medal, Minus, Withdraw } from '@/design-system/icons'

export function HomeCScreen() {
  const s = useApp()
  const cells = chapterCells(s)
  const ready = rewardReady(s)
  const left = weeksToReward(s)

  return (
    <HomeShell>
      <div className="overflow-hidden rounded-12 border border-light bg-neutral-white">
        <div className="p-16">
          {/* The one message on the card. */}
          <p className="text-16 font-bold text-default">
            {ready
              ? `Ibu bisa cairkan ${short(MILESTONE_REWARD)}`
              : `${left} minggu lagi Ibu bisa cairkan ${short(MILESTONE_REWARD)}`}
          </p>

          {/* The path. Week dots, the milestone station, then a faded run to the
              end of the tenor — one line holding both rewards. */}
          <div className="mt-20 flex items-center">
            {cells.map((cell, i) => (
              <span key={cell.week} className="flex flex-1 items-center">
                {i > 0 ? <Rail tone={cell.status === 'future' ? 'dim' : 'lit'} /> : null}
                <Node status={cell.status} />
              </span>
            ))}

            <Rail tone={ready ? 'lit' : 'dim'} />
            <span
              className={`flex h-32 w-32 shrink-0 items-center justify-center rounded-full ${
                ready
                  ? 'bg-primary-500 text-neutral-white'
                  : 'border border-primary-200 bg-primary-50 text-primary-500'
              }`}
            >
              <Withdraw size={20} />
            </span>

            <Rail tone="dim" />
            <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-500">
              <Medal size={20} />
            </span>
          </div>

          <div className="mt-8 flex items-start gap-8">
            <span className="min-w-0 flex-1 text-10 text-caption">
              Minggu {cells[0].week}–{cells[cells.length - 1].week}
            </span>
            <span className="min-w-0 shrink-0 text-right text-10 text-caption">
              Minggu {TOTAL_WEEKS} · limit naik {short(LIMIT_INCREASE)}
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

function Rail({ tone }: { tone: 'lit' | 'dim' }) {
  return (
    <span
      className={`h-4 min-w-8 flex-1 rounded-full ${tone === 'lit' ? 'bg-primary-500' : 'bg-neutral-200'}`}
    />
  )
}

function Node({ status }: { status: 'done' | 'missed' | 'active' | 'future' }) {
  const s = useApp()

  if (status === 'done') {
    return (
      <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-500 text-neutral-white">
        <Check size={16} />
      </span>
    )
  }
  if (status === 'missed') {
    return (
      <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-orange-500">
        <Minus size={16} />
      </span>
    )
  }
  if (status === 'active') {
    // The two halves of a good week, read at a glance: paid, attended, both.
    const filled = (s.paid ? 1 : 0) + (s.attended ? 1 : 0)
    return (
      <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-primary-500 bg-neutral-white">
        <span className={`h-8 w-8 rounded-full ${filled > 0 ? 'bg-primary-500' : 'bg-primary-200'}`} />
      </span>
    )
  }
  return <span className="h-20 w-20 shrink-0 rounded-full border border-default bg-neutral-white" />
}
