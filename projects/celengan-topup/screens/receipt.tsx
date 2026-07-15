'use client'

import { Badge, Button, Card, ListRow, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { formatRupiah } from '../lib/data'
import { selectedGoal, selectedMethod, useTopUp } from '../lib/store'

export function ReceiptScreen() {
  const flow = useFlow()
  const s = useTopUp()

  const goal = selectedGoal(s)
  const method = selectedMethod(s)

  return (
    <Screen topBar={<NavigationHeader title="Bukti Transaksi" onBack={flow.back} />}>
      <Card flush>
        <ListRow title="Status" trailing={<Badge intent="green">Berhasil</Badge>} />
        <ListRow title="ID Transaksi" trailing="CLG-20260715-4471" />
        <ListRow title="Waktu" trailing="15 Jul 2026, 09:41" />
      </Card>
      <Card flush>
        <ListRow title="Celengan" trailing={goal.name} />
        <ListRow title="Nominal" trailing={formatRupiah(s.amount)} />
        <ListRow title="Biaya admin" trailing={formatRupiah(0)} />
        <ListRow title="Metode" description={method.detail} trailing={method.name} />
        <ListRow
          title="Total"
          trailing={<span className="text-16 font-bold text-default">{formatRupiah(s.amount)}</span>}
        />
      </Card>
      <Button size="lg" variant="outline" onClick={() => flow.back()}>
        Kembali
      </Button>
    </Screen>
  )
}
