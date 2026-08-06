'use client'

// The reward screen. It exists to make a causal claim — you did these four
// things, so this money opened — and the "Kenapa Ibu dapat ini?" list is the
// load-bearing part, not decoration. Without it the payout reads as a promotion;
// with it, it reads as something she earned and can earn again.
//
// One screen serves every unlocked rung, so its figures follow the milestone the
// ladder is currently offering: the week-12 pencairan by default, and the far
// bigger limit rise once that is the rung she has reached.
//
// "Nanti saja" is a real option and stays quiet rather than absent: a mitra who
// does not want more debt this month should be able to decline without feeling
// she has forfeited the milestone.

import { NavigationHeader } from '@/design-system/components'
import { Check, LockKeyOpen } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { claimableOf } from '../lib/data'
import { store, useApp } from '../lib/store'
import { FullWidthButton, StickyBar } from '../lib/ui'

const REASONS = [
  'Hadir kumpulan majelis setiap minggu',
  'Bayar angsuran tepat waktu setiap minggu',
  'Menabung rutin di Celengan',
  'Pakai Poket untuk transaksi',
]

// The two rungs that open this screen. The limit rise rides on a full cycle of
// discipline and lifts the whole plafon; the pencairan is the quarterly reward.
const LIMIT_RISE = {
  date: '23 Mar 2027',
  headline: 'Ibu berhasil disiplin 48 minggu berturut-turut! 🎉',
  intro: 'Sebagai apresiasi, plafon kredit Ibu naik ke tingkat berikutnya.',
  rewardLabel: 'Modal yang bisa dicairkan',
  rewardValue: 'Rp8.000.000',
  rewardSub: 'Limit kredit baru Ibu',
  amount: 8000000,
}

const PENCAIRAN = {
  date: '14 Jul 2026',
  headline: 'Ibu berhasil disiplin 12 minggu berturut-turut! 🎉',
  intro: 'Sebagai apresiasi, Ibu buka tambahan pencairan modal usaha.',
  rewardLabel: 'Modal tambahan yang bisa dicairkan',
  rewardValue: 'Rp1.250.000',
  rewardSub: '25% dari plafon Ibu saat ini',
  amount: 1250000,
}

export function MilestoneUnlockedScreen() {
  const flow = useFlow()
  const s = useApp()

  const claimable = claimableOf(s.journeyPhase)
  const copy = claimable?.actionLabel === 'Peningkatan limit' ? LIMIT_RISE : PENCAIRAN

  return (
    <Screen topBar={<NavigationHeader title={copy.date} onBack={() => flow.go('progress')} />}>
      <div className="flex flex-col items-center gap-8 pt-16 text-center">
        <span className="flex h-48 w-48 items-center justify-center rounded-full bg-green-50 text-green-500">
          <LockKeyOpen size={24} />
        </span>
        <p className="text-18 font-bold text-default">{copy.headline}</p>
        <p className="text-12 text-caption">{copy.intro}</p>
      </div>

      <div className="rounded-12 border border-primary-200 bg-primary-50 p-20">
        <p className="text-12 text-primary-400">{copy.rewardLabel}</p>
        <p className="mt-4 text-24 font-bold text-primary-500">{copy.rewardValue}</p>
        <p className="mt-4 text-12 text-caption">{copy.rewardSub}</p>
      </div>

      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <p className="mb-12 text-14 font-bold text-default">Kenapa Ibu dapat ini?</p>
        {REASONS.map((reason) => (
          <div key={reason} className="flex items-center gap-8 py-4">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-500">
              <Check size={16} />
            </span>
            <span className="text-12 text-caption">{reason}</span>
          </div>
        ))}
      </div>

      <StickyBar>
        <FullWidthButton
          onClick={() => {
            store.startDisburse(copy.amount)
            flow.go('disburse-amount')
          }}
        >
          Cairkan sekarang
        </FullWidthButton>
        <FullWidthButton variant="ghost" onClick={() => flow.go('progress')}>
          Nanti saja
        </FullWidthButton>
      </StickyBar>
    </Screen>
  )
}
