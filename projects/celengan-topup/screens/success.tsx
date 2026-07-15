'use client'

import { Badge, Button, Card, ListRow, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { formatRupiah } from '../lib/data'
import { selectedGoal, selectedMethod, store, useTopUp } from '../lib/store'

export function SuccessScreen() {
  const flow = useFlow()
  const s = useTopUp()

  const goal = selectedGoal(s)
  const method = selectedMethod(s)
  const newBalance = goal.saved + s.amount

  function done() {
    store.reset()
    flow.go('goal')
  }

  return (
    <Screen topBar={<NavigationHeader title="Top Up Berhasil" hideBack />}>
      <div className="flex flex-col items-center gap-8 pt-24">
        <span className="flex h-48 w-48 items-center justify-center rounded-full bg-green-50 text-green-500">
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12.5l3 3 5-6" />
          </svg>
        </span>
        <span className="text-24 font-bold text-default">{formatRupiah(s.amount)}</span>
        <Badge intent="green">Berhasil</Badge>
        <p className="text-14 text-caption">Dana sudah masuk ke {goal.name}.</p>
      </div>
      <Card flush>
        <ListRow title="Celengan" trailing={goal.name} />
        <ListRow title="Metode" trailing={method.name} />
        <ListRow title="Saldo celengan" trailing={formatRupiah(newBalance)} />
      </Card>
      <Button size="lg" variant="outline" onClick={() => flow.go('receipt')}>
        Lihat bukti transaksi
      </Button>
      <Button size="lg" onClick={done}>
        Selesai
      </Button>
    </Screen>
  )
}
