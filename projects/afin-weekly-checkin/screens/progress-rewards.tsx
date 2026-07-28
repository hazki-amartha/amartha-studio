'use client'

// Detail page for the C concept: the unit is the REWARD.
//
// The mirror of the weeks page. Everything counts in twelves — the headline,
// the meter, the grid — and "48" never appears anywhere on it. Weeks exist only
// inside the reward being filled right now, where they are the mechanism for
// earning the next stamp rather than a total to track.
//
// The two pages are alternatives, never companions. Handing a mitra both is the
// thing this split exists to prevent.

import { NavigationHeader } from '@/design-system/components'
import { Check, LockKey, Medal, Withdraw } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  CHAPTER_LENGTH,
  GROUP_BONUS,
  LIMIT_INCREASE,
  MILESTONE_REWARD,
  TOTAL_CHAPTERS,
  chapterCells,
  chapterProgress,
  groupStatus,
  limitOnOffer,
  milestonesEarned,
  pot,
  rewardReady,
  short,
} from '../lib/data'
import { useApp } from '../lib/store'
import { Meter, WeekTile, windowLine } from '../lib/ui'

export function ProgressRewardsScreen() {
  const flow = useFlow()
  const s = useApp()
  const earned = milestonesEarned(s)
  const current = Math.min(earned + 1, TOTAL_CHAPTERS)
  const ready = rewardReady(s)

  return (
    <Screen topBar={<NavigationHeader title="Hadiah Ibu" onBack={flow.back} />}>
      {/* The one thing this page argues, counted in twelves. */}
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
              {earned} dari {TOTAL_CHAPTERS} hadiah terkumpul
            </p>
          </div>
        </div>
        <div className="mt-12">
          <Meter percent={Math.round((earned / TOTAL_CHAPTERS) * 100)} tone="yellow" />
        </div>

        <div className="mt-16 flex flex-col gap-8">
          <SplitLine
            label={`Dari ${TOTAL_CHAPTERS} hadiah Ibu`}
            amount={short(LIMIT_INCREASE)}
          />
          <SplitLine
            label="Dari kelompok lancar"
            amount={short(GROUP_BONUS)}
            struck={groupStatus(s) === 'lewat'}
          />
        </div>
      </div>

      {/* The twelve, at full size. This is the ladder on this page — there is
          no week ladder underneath it. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <p className="text-14 font-bold text-default">Koleksi hadiah Ibu</p>
        <div className="mt-12 grid grid-cols-4 gap-8">
          {Array.from({ length: TOTAL_CHAPTERS }, (_, i) => i + 1).map((n) => (
            <Stamp
              key={n}
              n={n}
              status={n <= earned ? 'earned' : n === current ? 'current' : 'locked'}
              final={n === TOTAL_CHAPTERS}
            />
          ))}
        </div>
        <p className="mt-12 text-12 text-caption">
          Hadiah ke-{TOTAL_CHAPTERS} menaikkan limit Ibu untuk pinjaman berikutnya.
        </p>
      </div>

      {/* Weeks appear exactly once, and only as the inside of the reward being
          filled now. Never as a total. */}
      <div className="rounded-12 border border-primary-500 bg-neutral-white p-16">
        <div className="flex items-baseline gap-8">
          <span className="min-w-0 flex-1 text-14 font-bold text-default">
            Hadiah {current} sedang Ibu isi
          </span>
          <span className="shrink-0 text-12 text-caption">
            {chapterProgress(s)} dari {CHAPTER_LENGTH}
          </span>
        </div>

        <div className="mt-12 flex gap-8">
          {chapterCells(s).map((cell) => (
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
          <Withdraw size={20} />
          <span className="min-w-0 flex-1 text-14 font-bold">{short(MILESTONE_REWARD)}</span>
          <span className="shrink-0 text-12">
            {ready ? 'Terbuka' : `${CHAPTER_LENGTH - chapterProgress(s)} minggu lagi`}
          </span>
        </div>
      </div>

      {/* The pot. A rupiah figure, not a second thing to track — one row. */}
      <div className="flex items-center gap-12 rounded-12 border border-default bg-neutral-white p-12">
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

/** One of the twelve. The last one wears the medal, the rest a payout icon. */
function Stamp({
  n,
  status,
  final,
}: {
  n: number
  status: 'earned' | 'current' | 'locked'
  final: boolean
}) {
  const style =
    status === 'earned'
      ? 'bg-primary-500 text-neutral-white'
      : status === 'current'
        ? 'border-2 border-primary-500 bg-primary-50 text-primary-500'
        : final
          ? 'border border-default bg-yellow-50 text-yellow-600'
          : 'border border-default bg-neutral-white text-disabled'

  return (
    <span className={`flex h-48 flex-col items-center justify-center gap-2 rounded-8 ${style}`}>
      {status === 'earned' ? (
        <Check size={16} />
      ) : final ? (
        <Medal size={16} />
      ) : status === 'current' ? (
        <Withdraw size={16} />
      ) : (
        <LockKey size={16} />
      )}
      <span className="text-10">{n}</span>
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
