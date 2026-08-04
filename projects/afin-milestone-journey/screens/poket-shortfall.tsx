'use client'

// Not enough in the wallet. A dead end would be the easy build; this is a fork,
// and both exits are real: top up, or pay another way. Offering only the top-up
// would make an app-owned balance a prerequisite for paying a loan, which it
// isn't — five other methods are one tap back.

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { IconWalletOff } from '../lib/icons'
import { chargeable, shortfall, useApp } from '../lib/store'
import { FullWidthButton, ResultHeader, StatRow, StickyBar } from '../lib/ui'

export function PoketShortfallScreen() {
  const flow = useFlow()
  const s = useApp()

  return (
    <Screen topBar={<NavigationHeader title="Saldo tidak cukup" onBack={() => flow.go('konfirmasi')} />}>
      <ResultHeader
        tint="red"
        icon={<IconWalletOff size={24} />}
        title="Saldo Poket kurang"
        description="Tambahkan saldo dulu biar bisa bayar pakai Poket."
      />

      <div className="rounded-12 border border-primary-200 bg-primary-50 p-16">
        <StatRow label="Saldo Poket" value={rupiah(s.poketBalance)} border />
        <StatRow label="Yang perlu dibayar" value={rupiah(chargeable(s))} border />
        <StatRow label="Kekurangan" value={rupiah(shortfall(s))} tone="red" />
      </div>

      <StickyBar>
        <FullWidthButton onClick={() => flow.go('topup')}>Isi Saldo Poket</FullWidthButton>
        <FullWidthButton variant="secondary" onClick={() => flow.go('konfirmasi')}>
          Pilih metode lain
        </FullWidthButton>
      </StickyBar>
    </Screen>
  )
}
