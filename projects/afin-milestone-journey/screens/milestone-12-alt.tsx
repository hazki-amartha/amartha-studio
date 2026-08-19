'use client'

// Milestone minggu 12 - alt — the celebration screen a reached rung opens on.
// "Nanti saja" is a real option, not a forfeit: declining opens a sheet that
// deliberately lowers the urgency, because a mitra who does not want more debt
// this month should be able to say no without feeling she has lost the reward.

import { useState } from 'react'
import { BottomSheet, NavigationHeader } from '@/design-system/components'
import { Check, Hourglass, LockKeyOpen, Plus } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { FullWidthButton, StickyBar } from '../lib/ui'

const REASONS = [
  'Hadir kumpulan majelis setiap minggu',
  'Bayar angsuran tepat waktu',
  'Menabung rutin di Celengan',
  'Pakai Poket untuk transaksi',
]

export function Milestone12AltScreen() {
  const flow = useFlow()
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <Screen topBar={<NavigationHeader title="14 Jul 2026" onBack={() => flow.go('perjalanan-alt2')} />}>
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
        <p className="mt-4 text-24 font-bold text-primary-500">hingga Rp1.250.000</p>
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
        <FullWidthButton onClick={() => flow.go('cairkan-alt')}>Cairkan sekarang</FullWidthButton>
        <FullWidthButton variant="ghost" onClick={() => setSheetOpen(true)}>
          Nanti saja
        </FullWidthButton>
      </StickyBar>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Ambil nanti saja?"
        description="Rp1.250.000 Ibu tidak hangus."
        primaryAction={
          <FullWidthButton onClick={() => flow.go('home-alt')}>Ya, nanti saja</FullWidthButton>
        }
        secondaryAction={
          <FullWidthButton variant="ghost" onClick={() => flow.go('cairkan-alt')}>
            Cairkan sekarang
          </FullWidthButton>
        }
        slot={
          <div className="flex flex-col gap-12">
            <div className="flex items-start gap-8">
              <span className="shrink-0 text-caption">
                <Hourglass size={16} />
              </span>
              <p className="text-12 text-caption">
                Masih bisa Ibu ambil kapan saja sampai 26 Jan 2027
              </p>
            </div>
            <div className="flex items-start gap-8">
              <span className="shrink-0 text-caption">
                <Plus size={16} />
              </span>
              <p className="text-12 text-caption">
                Kalau belum diambil, digabung dengan pencairan 26 Jan 2027
              </p>
            </div>
            <div className="rounded-12 bg-orange-50 p-12 text-12 text-orange-700">
              Syaratnya angsuran tetap lancar dan Ibu hadir kumpulan setiap minggu
            </div>
          </div>
        }
      />
    </Screen>
  )
}
