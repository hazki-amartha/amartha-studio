'use client'

// A real payment context for the account PIN (PRD F): buying pulsa from the
// homepage shortcut row.

import { useState } from 'react'
import { Button, Input, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction } from '../lib/ui'

const NOMINALS = [
  { value: '10.000', price: 'Rp11.500' },
  { value: '25.000', price: 'Rp26.500' },
  { value: '50.000', price: 'Rp51.500' },
  { value: '100.000', price: 'Rp101.500' },
]

export function PpobPulsaScreen() {
  const flow = useFlow()
  const [pick, setPick] = useState('50.000')
  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Pulsa" onBack={flow.back} />}>
      <Input label="Nomor HP" defaultValue="0812-3456-7890" suffix="Telkomsel" />
      <p className="text-14 font-bold text-default">Pilih nominal</p>
      <div className="grid grid-cols-2 gap-8">
        {NOMINALS.map((n) => (
          <button
            key={n.value}
            type="button"
            onClick={() => setPick(n.value)}
            className={`rounded-12 border p-12 text-left ${
              pick === n.value ? 'border-primary-500 bg-primary-50' : 'border-default'
            }`}
          >
            <span className="block text-16 font-bold text-default">{n.value}</span>
            <span className="block text-12 text-caption">Harga {n.price}</span>
          </button>
        ))}
      </div>
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('ppob-confirm')}>
          Lanjut
        </Button>
      </BottomAction>
    </Screen>
  )
}
