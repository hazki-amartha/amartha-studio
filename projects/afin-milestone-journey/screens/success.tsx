'use client'

// Settled. A receipt rather than a celebration: paying a weekly instalment is
// the fourteenth time she has done it, and the thing she wants is proof with a
// timestamp on it, not confetti.

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { methodName, rupiah } from '../lib/data'
import { IconCheck } from '../lib/icons'
import { useApp } from '../lib/store'
import { FullWidthButton, ResultHeader, StatRow, StickyBar } from '../lib/ui'

export function SuccessScreen() {
  const flow = useFlow()
  const s = useApp()
  const display = s.method === 'poket' ? 'Poket — Amartha Wallet' : methodName(s.method)

  return (
    <Screen topBar={<NavigationHeader title="Pembayaran" hideBack />}>
      <ResultHeader
        tint="green"
        icon={<IconCheck size={24} />}
        title="Pembayaran berhasil"
        description="Angsuran Ibu Siti sudah masuk. Terima kasih!"
      />

      <div className="rounded-12 bg-primary-50 p-16">
        <StatRow label="Dibayar" value={rupiah(s.amount)} border />
        <StatRow label="Metode" value={display} border />
        <StatRow label="Waktu" value="19 Agu 2024, 10:24" />
      </div>

      <StickyBar>
        <FullWidthButton onClick={() => flow.go('home')}>Kembali ke beranda</FullWidthButton>
      </StickyBar>
    </Screen>
  )
}
