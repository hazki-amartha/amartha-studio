'use client'

import { useState } from 'react'
import { Button, Card, Input, ListRow, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'

const QUICK_AMOUNTS = ['50.000', '100.000', '250.000']

export function AmountScreen() {
  const flow = useFlow()
  const [amount, setAmount] = useState('')

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <NavigationHeader title="Top Up Poket" hideBack />
      <div className="flex flex-col gap-12 px-16 pt-16">
        <Input
          label="Nominal top up"
          prefix="Rp"
          placeholder="0"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          helperText="Minimum Rp10.000"
        />
        <Card flush>
          {QUICK_AMOUNTS.map((v) => (
            <ListRow key={v} title={`Rp${v}`} chevron onClick={() => setAmount(v)} />
          ))}
        </Card>
        <Button size="lg" disabled={!amount} onClick={() => flow.go('confirm')}>
          Continue
        </Button>
      </div>
    </div>
  )
}
