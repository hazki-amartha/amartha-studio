'use client'

// The chapter closing. Reached on its own the moment the fourth good week
// stamps — no claim tap, per the auto-fill decision.
//
// This is the only screen allowed to be loud about the limit increase. Home
// keeps it to a thin line all year precisely so that here, on the twelve
// occasions a mitra is already feeling good, the bar visibly moving toward
// week 48 lands as news rather than as a nag.
//
// It does not hand over cash. The reward grows the pot and names the window it
// opens at, which keeps earning and borrowing in two different moments — she
// banks this now and decides about debt later, rather than being congratulated
// into a withdrawal.

import { Button } from '@/design-system/components'
import { Medal, Withdraw } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  MILESTONE_REWARD,
  TOTAL_CHAPTERS,
  TOTAL_WEEKS,
  goodWeeks,
  groupStatus,
  journeyPercent,
  limitOnOffer,
  milestonesEarned,
  pot,
  short,
} from '../lib/data'
import { useApp } from '../lib/store'
import { Meter, windowLine } from '../lib/ui'

export function MilestoneScreen() {
  const flow = useFlow()
  const s = useApp()
  const earned = milestonesEarned(s)
  const left = TOTAL_CHAPTERS - earned

  return (
    <Screen statusBar="none">
      <div className="-mx-16 -mt-48 bg-gradient-to-br from-primary-400 to-primary-700 px-16 pb-32 pt-48 text-center text-neutral-white">
        <span className="mx-auto flex h-48 w-48 items-center justify-center rounded-full bg-neutral-white text-primary-500">
          <Withdraw size={24} />
        </span>
        <p className="mt-16 text-16">Empat minggu lancar, Bu Siti 👏</p>
        <p className="mt-8 text-24 font-bold">+{short(MILESTONE_REWARD)}</p>
        <p className="mt-8 text-12 text-neutral-200">masuk ke pencairan Ibu berikutnya</p>
      </div>

      {/* The pot, not a payout. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <div className="flex items-baseline gap-8">
          <span className="min-w-0 flex-1 text-12 text-caption">Siap dicairkan</span>
          <span className="shrink-0 text-20 font-bold text-default">{short(pot(s))}</span>
        </div>
        <p className="mt-8 text-12 text-caption">{windowLine(s)}</p>
      </div>

      {/* The endgame, moved. The whole reason this screen exists twelve times. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <div className="flex items-center gap-12">
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-yellow-50 text-yellow-600">
            <Medal size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-14 font-bold text-default">
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
        <p className="mt-12 text-12 text-caption">
          {left > 0
            ? `${left} hadiah lagi sampai limit Ibu naik.`
            : 'Limit Ibu sudah naik. Selamat!'}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-8 pb-16">
        <Button variant="primary" size="lg" onClick={flow.back}>
          Lanjut
        </Button>
        <Button variant="ghost" size="lg" onClick={() => flow.go('progress')}>
          Lihat perjalanan Ibu
        </Button>
      </div>
    </Screen>
  )
}
