'use client'

// The other half of the reward screen: the same goal, the same date, the same
// Rp1.250.000 — not paid out.
//
// It is built as the mirror of milestone-unlocked on purpose. That screen makes
// a causal claim ("you did these four things, so this opened"); this one makes
// the same claim in reverse. The amount is struck through rather than hidden,
// and the two reasons are followed by a way into Riwayat — so a reason is
// something she can go and check rather than the app's word against hers.
//
// One button, "Tutup". There is nothing to do here today; the next goal is
// already on the ladder behind this screen, and offering an action would
// suggest this one can still be rescued.

import { NavigationHeader } from '@/design-system/components'
import { ChevronRight, Cross, LockKey } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { FullWidthButton, StickyBar } from '../lib/ui'

const REASONS = ['Kumpulan tidak teratur', 'Pembayaran terlambat']

export function MilestoneMissedScreen() {
  const flow = useFlow()

  return (
    <Screen canvas="white" topBar={<NavigationHeader title="14 Jul 2026" onBack={() => flow.go('progress')} />}>
      <div className="flex flex-col items-center gap-8 pt-16 text-center">
        <span className="flex h-48 w-48 items-center justify-center rounded-full bg-red-50 text-red-500">
          <LockKey size={24} />
        </span>
        <p className="text-18 font-bold text-default">
          Pencairan modal tambahan belum bisa dibuka
        </p>
        <p className="text-12 text-caption">
          Goal 12 minggu belum tercapai, jadi tambahan modal ini belum bisa Ibu cairkan.
        </p>
      </div>

      {/* Stated, not hidden. She was told what this goal was worth when it was
          still ahead of her; removing the number now would read as the app
          quietly changing the terms. */}
      <div className="rounded-12 border border-default bg-neutral-50 p-20">
        <p className="text-12 text-caption">Modal tambahan yang belum bisa dicairkan</p>
        <p className="mt-4 text-24 font-bold text-disabled line-through">Rp1.250.000</p>
      </div>

      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <p className="mb-12 text-14 font-bold text-default">Kenapa belum bisa?</p>
        {REASONS.map((reason) => (
          <div key={reason} className="flex items-center gap-8 py-4">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
              <Cross size={16} />
            </span>
            <span className="text-12 text-caption">{reason}</span>
          </div>
        ))}
      </div>

      {/* The receipts live on Riwayat rather than being restated here — one
          record, one place, and a reason she can go and check. */}
      <button
        type="button"
        onClick={() => flow.go('riwayat')}
        className="flex w-full items-center gap-12 rounded-12 border border-default bg-neutral-white p-16 text-left"
      >
        <span className="min-w-0 flex-1 text-14 font-bold text-default">
          Riwayat pembayaran &amp; kehadiran
        </span>
        <span className="shrink-0 text-disabled">
          <ChevronRight size={20} />
        </span>
      </button>

      <StickyBar>
        <FullWidthButton onClick={() => flow.go('progress')}>Tutup</FullWidthButton>
      </StickyBar>
    </Screen>
  )
}
