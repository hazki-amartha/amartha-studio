'use client'

import { useState } from 'react'
import { Button, Card, Input, ListRow, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'

const QUICK_AMOUNTS = ['50.000', '100.000', '250.000']

export function AmountScreen() {
  const flow = useFlow()
  const [amount, setAmount] = useState('')

  return (
    <Screen topBar={<NavigationHeader title="Top Up Poket" hideBack />}>
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
    </Screen>
  )
}
