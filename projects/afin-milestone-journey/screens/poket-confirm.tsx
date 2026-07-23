'use client'

// The one method that settles instantly, so it is the one that needs a
// before/after. Three blocks — balance, debit, balance — because a wallet
// payment is irreversible from the mitra's side and "Rp80.000 → Rp0" is the
// fact she will want to have seen before tapping, not after.

import { NavigationHeader } from '@/design-system/components'
import { Wallet } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { store, useApp } from '../lib/store'
import { FullWidthButton, Hero, InfoBlock, StickyBar } from '../lib/ui'

export function PoketConfirmScreen() {
  const flow = useFlow()
  const s = useApp()

  const pay = () => {
    store.payWithPoket()
    flow.go('success')
  }

  return (
    <Screen
      topBar={<NavigationHeader title="Konfirmasi pembayaran" onBack={() => flow.go('method')} />}
    >
      <Hero icon={<Wallet size={24} />} name="Poket — Amartha Wallet" amount={rupiah(s.amount)} />

      <InfoBlock label="Saldo Poket sebelum">
        <div className="text-18 font-bold text-default">{rupiah(s.poketBalance)}</div>
      </InfoBlock>
      <InfoBlock label="Dibayarkan">
        <div className="text-18 font-bold text-red-500">- {rupiah(s.amount)}</div>
      </InfoBlock>
      <InfoBlock label="Saldo Poket setelah" highlight>
        <div className="text-18 font-bold text-primary-500">
          {rupiah(s.poketBalance - s.amount)}
        </div>
      </InfoBlock>

      <StickyBar>
        <FullWidthButton onClick={pay}>Bayar sekarang</FullWidthButton>
      </StickyBar>
    </Screen>
  )
}
