'use client'

// Claimed, not confirmed. Every off-app method lands here, and the home screen's
// task turns amber to match — the mitra has done her part and the app says so,
// without pretending the money has arrived.
//
// The second button is a prototype control, not a feature: there is no backend
// to wait for, so the demo needs a way to reach the settled state. It is labelled
// as a simulation so nobody mistakes it for something the mitra would ever see.

import { NavigationHeader } from '@/design-system/components'
import { Hourglass } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { methodName, rupiah } from '../lib/data'
import { store, useApp } from '../lib/store'
import { FullWidthButton, ResultHeader, StatRow, StickyBar } from '../lib/ui'

export function PendingScreen() {
  const flow = useFlow()
  const s = useApp()

  return (
    <Screen topBar={<NavigationHeader title="Status pembayaran" onBack={() => flow.go('home')} />}>
      <ResultHeader
        tint="orange"
        icon={<Hourglass size={24} />}
        title="Menunggu konfirmasi"
        description="Pembayaran sedang diverifikasi. Biasanya selesai dalam 5–15 menit."
      />

      <div className="rounded-12 bg-primary-50 p-16">
        <StatRow label="Jumlah" value={rupiah(s.amount)} border />
        <StatRow label="Metode" value={methodName(s.method)} />
      </div>

      <StickyBar>
        <FullWidthButton variant="secondary" onClick={() => flow.go('home')}>
          Kembali ke beranda
        </FullWidthButton>
        <FullWidthButton
          variant="ghost"
          onClick={() => {
            store.confirmPending()
            flow.go('success')
          }}
        >
          Simulasi: konfirmasi backend
        </FullWidthButton>
      </StickyBar>
    </Screen>
  )
}
