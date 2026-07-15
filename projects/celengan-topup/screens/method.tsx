'use client'

import { Badge, Button, NavigationHeader, SelectableCard } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { METHODS, formatRupiah } from '../lib/data'
import { store, useTopUp } from '../lib/store'

export function MethodScreen() {
  const flow = useFlow()
  const s = useTopUp()

  return (
    <Screen topBar={<NavigationHeader title="Metode Pembayaran" onBack={flow.back} />}>
      <p className="text-14 text-caption">
        Bayar {formatRupiah(s.amount)} dengan
      </p>
      <div className="flex flex-col gap-8">
        {METHODS.map((m) => (
          <SelectableCard
            key={m.id}
            name="method"
            title={m.name}
            description={m.detail}
            checked={s.methodId === m.id}
            onChange={() => store.set({ methodId: m.id })}
            slot={
              m.disrupted ? (
                <Badge intent="red">Gangguan</Badge>
              ) : m.id === 'poket' ? (
                <Badge intent="green">Instan</Badge>
              ) : null
            }
          />
        ))}
      </div>
      <Button size="lg" onClick={() => flow.go('review')}>
        Lanjutkan
      </Button>
    </Screen>
  )
}
