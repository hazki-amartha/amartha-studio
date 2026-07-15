'use client'

import { Badge, Button, Card, ListRow, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { formatRupiah } from '../lib/data'
import { selectedGoal, selectedMethod, useTopUp } from '../lib/store'

export function FailedScreen() {
  const flow = useFlow()
  const s = useTopUp()

  const goal = selectedGoal(s)
  const method = selectedMethod(s)

  return (
    <Screen topBar={<NavigationHeader title="Pembayaran Gagal" hideBack />}>
      <div className="flex flex-col items-center gap-8 pt-24">
        <span className="flex h-48 w-48 items-center justify-center rounded-full bg-red-50 text-red-500">
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
            <path d="M8 8l8 8M16 8l-8 8" />
          </svg>
        </span>
        <span className="text-20 font-bold text-default">Pembayaran gagal</span>
        <Badge intent="red">Gagal</Badge>
        <p className="text-14 text-caption">
          {method.name} sedang ada gangguan. Dana kamu tidak terpotong.
        </p>
      </div>
      <Card flush>
        <ListRow title="Celengan" trailing={goal.name} />
        <ListRow title="Nominal" trailing={formatRupiah(s.amount)} />
        <ListRow title="Metode" trailing={<Badge intent="red">Gangguan</Badge>} />
      </Card>
      <Button size="lg" onClick={() => flow.go('method')}>
        Ganti metode pembayaran
      </Button>
      <Button size="lg" variant="outline" onClick={() => flow.go('review')}>
        Coba lagi
      </Button>
    </Screen>
  )
}
