'use client'

import { Button, NavigationHeader, SelectableCard } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { GOALS, formatRupiah } from '../lib/data'
import { store, useTopUp } from '../lib/store'

export function GoalScreen() {
  const flow = useFlow()
  const s = useTopUp()

  return (
    <Screen topBar={<NavigationHeader title="Pilih Celengan" hideBack />}>
      <p className="text-14 text-caption">
        Pilih tujuan tabungan yang ingin kamu isi.
      </p>
      <div className="flex flex-col gap-8">
        {GOALS.map((g) => (
          <SelectableCard
            key={g.id}
            name="goal"
            title={g.name}
            description={`${formatRupiah(g.saved)} / ${formatRupiah(g.target)}`}
            checked={s.goalId === g.id}
            onChange={() => store.set({ goalId: g.id })}
          />
        ))}
      </div>
      <Button size="lg" onClick={() => flow.go('amount')}>
        Lanjutkan
      </Button>
    </Screen>
  )
}
