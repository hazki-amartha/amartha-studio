'use client'

// Topping up, with the shortfall as the floor. The first preset is the exact
// gap rather than a round number, because the mitra came here to clear one
// specific deficit and making her compute Rp70.000 from two other figures is
// the kind of arithmetic that ends a payment.

import { useState } from 'react'
import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { shortfall, store, useApp } from '../lib/store'
import { Chip, FullWidthButton, StickyBar } from '../lib/ui'

export function TopupScreen() {
  const flow = useFlow()
  const s = useApp()
  const gap = shortfall(s)
  const [value, setValue] = useState(0)

  let helper = 'Minimal sesuai kekurangan'
  let helperError = false
  let canTopup = false

  if (value && value < gap) {
    helper = `Kurang ${rupiah(gap - value)} lagi untuk bayar`
    helperError = true
  } else if (value) {
    helper = `Saldo akan jadi ${rupiah(s.poketBalance + value)}`
    canTopup = true
  }

  return (
    <Screen
      topBar={<NavigationHeader title="Isi Saldo Poket" onBack={() => flow.go('poket-shortfall')} />}
    >
      <div>
        <div className="text-12 text-primary-500">Saldo Poket sekarang</div>
        <div className="mt-4 text-24 font-bold text-default">{rupiah(s.poketBalance)}</div>
        <div className="mt-4 text-12 text-caption">
          Tambahkan minimal{' '}
          <span className="font-bold text-primary-500">{rupiah(gap)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <label htmlFor="topup" className="text-12 font-bold text-caption">
          Jumlah isi saldo
        </label>
        <div className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white p-12">
          <span className="text-18 text-caption">Rp</span>
          <input
            id="topup"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={value > 0 ? value.toLocaleString('id-ID') : ''}
            onChange={(e) => setValue(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)}
            className="min-w-0 flex-1 bg-transparent text-20 font-bold text-default outline-none"
          />
        </div>
        <div className={`text-12 ${helperError ? 'text-red-500' : 'text-caption'}`}>{helper}</div>
      </div>

      <div className="flex flex-wrap gap-8">
        {[gap, 100000, 200000].map((v, i) => (
          <Chip key={i} selected={value === v} onClick={() => setValue(v)}>
            {rupiah(v)}
          </Chip>
        ))}
      </div>

      <StickyBar>
        <FullWidthButton
          disabled={!canTopup}
          onClick={() => {
            store.topUp(value)
            flow.go('poket-confirm')
          }}
        >
          Isi Saldo
        </FullWidthButton>
      </StickyBar>
    </Screen>
  )
}
