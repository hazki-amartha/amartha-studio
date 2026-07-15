'use client'

import { useState } from 'react'
import { Button, Input, Modal, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MIN_AMOUNT, QUICK_AMOUNTS, formatRupiah } from '../lib/data'
import { selectedGoal, store, useTopUp } from '../lib/store'

export function AmountScreen() {
  const flow = useFlow()
  const s = useTopUp()
  const [cancelOpen, setCancelOpen] = useState(false)

  const goal = selectedGoal(s)
  const display = s.amount > 0 ? s.amount.toLocaleString('id-ID') : ''
  const belowMin = s.amount > 0 && s.amount < MIN_AMOUNT

  function onInput(raw: string) {
    const digits = raw.replace(/\D/g, '')
    store.set({ amount: digits ? Number(digits) : 0 })
  }

  function cancel() {
    setCancelOpen(false)
    store.reset()
    flow.go('goal')
  }

  return (
    <Screen topBar={<NavigationHeader title="Nominal Top Up" onBack={() => setCancelOpen(true)} />}>
      <p className="text-14 text-caption">
        Isi <span className="font-bold text-default">{goal.name}</span>
      </p>
      <Input
        label="Nominal top up"
        prefix="Rp"
        placeholder="0"
        inputMode="numeric"
        value={display}
        onChange={(e) => onInput(e.target.value)}
        state={belowMin ? 'error' : 'default'}
        helperText={belowMin ? `Minimum ${formatRupiah(MIN_AMOUNT)}` : `Minimum ${formatRupiah(MIN_AMOUNT)}`}
      />
      <div className="flex flex-wrap gap-8">
        {QUICK_AMOUNTS.map((v) => (
          <Button
            key={v}
            variant="outline"
            size="sm"
            onClick={() => store.set({ amount: v })}
          >
            {formatRupiah(v)}
          </Button>
        ))}
      </div>
      <Button
        size="lg"
        disabled={s.amount < MIN_AMOUNT}
        onClick={() => flow.go('method')}
      >
        Lanjutkan
      </Button>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        variant="dialog"
        intent="warning"
        title="Batalkan top up?"
        description="Nominal yang sudah kamu isi tidak akan disimpan."
        primaryAction={
          <Button variant="danger" onClick={cancel}>
            Ya, batalkan
          </Button>
        }
        secondaryAction={
          <Button variant="ghost" onClick={() => setCancelOpen(false)}>
            Lanjut isi
          </Button>
        }
      />
    </Screen>
  )
}
