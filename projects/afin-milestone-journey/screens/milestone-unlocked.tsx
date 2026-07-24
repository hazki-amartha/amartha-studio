'use client'

// The reward screen. It exists to make a causal claim — you did these four
// things, so this money opened — and the "Kenapa Ibu dapat ini?" list is the
// load-bearing part, not decoration. Without it the payout reads as a promotion;
// with it, it reads as something she earned and can earn again.
//
// "Nanti saja" is a real option and stays quiet rather than absent: a mitra who
// does not want more debt this month should be able to decline without feeling
// she has forfeited the milestone.

import { NavigationHeader } from '@/design-system/components'
import { Check, LockKeyOpen } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { FullWidthButton, StickyBar } from '../lib/ui'

const REASONS = [
  'Hadir kumpulan majelis setiap minggu',
  'Bayar angsuran tepat waktu setiap minggu',
  'Menabung rutin di Celengan',
  'Pakai Poket untuk transaksi',
]

export function MilestoneUnlockedScreen() {
  const flow = useFlow()

  return (
    <Screen
      topBar={
        <NavigationHeader title="Milestone minggu ke-12" onBack={() => flow.go('progress')} />
      }
    >
      <div className="flex flex-col items-center gap-8 pt-16 text-center">
        <span className="flex h-48 w-48 items-center justify-center rounded-full bg-green-50 text-green-500">
          <LockKeyOpen size={24} />
        </span>
        <p className="text-18 font-bold text-default">
          Ibu berhasil disiplin 12 minggu berturut-turut! 🎉
        </p>
        <p className="text-12 text-caption">
          Sebagai apresiasi, Ibu buka tambahan pencairan modal usaha.
        </p>
      </div>

      <div className="rounded-12 border border-primary-200 bg-primary-50 p-20">
        <p className="text-12 text-primary-400">Modal tambahan yang bisa dicairkan</p>
        <p className="mt-4 text-24 font-bold text-primary-500">Rp1.250.000</p>
        <p className="mt-4 text-12 text-caption">25% dari plafon Ibu saat ini</p>
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
        <FullWidthButton onClick={() => flow.go('disburse-amount')}>
          Cairkan sekarang
        </FullWidthButton>
        <FullWidthButton variant="ghost" onClick={() => flow.go('progress')}>
          Nanti saja
        </FullWidthButton>
      </StickyBar>
    </Screen>
  )
}
