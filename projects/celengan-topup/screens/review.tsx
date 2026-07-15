'use client'

import { useState } from 'react'
import {
  Badge,
  BottomSheet,
  Button,
  Card,
  ListRow,
  NavigationHeader,
} from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { formatRupiah } from '../lib/data'
import { selectedGoal, selectedMethod, useTopUp } from '../lib/store'

const FEE = 0

export function ReviewScreen() {
  const flow = useFlow()
  const s = useTopUp()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const goal = selectedGoal(s)
  const method = selectedMethod(s)
  const total = s.amount + FEE

  function confirm() {
    setConfirmOpen(false)
    // A disrupted payment method lands on the failure state.
    flow.go(method.disrupted ? 'failed' : 'success')
  }

  return (
    <Screen topBar={<NavigationHeader title="Ringkasan" onBack={flow.back} />}>
      <Card flush>
        <ListRow title="Celengan" trailing={goal.name} />
        <ListRow title="Nominal" trailing={formatRupiah(s.amount)} />
        <ListRow title="Biaya admin" trailing={formatRupiah(FEE)} />
        <ListRow title="Metode" description={method.detail} trailing={method.name} />
        <ListRow
          title="Status"
          trailing={
            method.disrupted ? (
              <Badge intent="red">Gangguan</Badge>
            ) : (
              <Badge intent="orange">Menunggu bayar</Badge>
            )
          }
        />
      </Card>
      <Card flush>
        <ListRow
          title="Total bayar"
          trailing={<span className="text-16 font-bold text-default">{formatRupiah(total)}</span>}
        />
      </Card>
      <Button size="lg" onClick={() => setConfirmOpen(true)}>
        Bayar sekarang
      </Button>

      <BottomSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Konfirmasi top up"
        description={`${formatRupiah(total)} akan ditambahkan ke ${goal.name} lewat ${method.name}.`}
        slotPosition="below"
        slot={
          <Card flush>
            <ListRow title="Nominal" trailing={formatRupiah(s.amount)} />
            <ListRow title="Metode" trailing={method.name} />
          </Card>
        }
        primaryAction={
          <Button onClick={confirm}>Konfirmasi</Button>
        }
        secondaryAction={
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>
            Batal
          </Button>
        }
      />
    </Screen>
  )
}
