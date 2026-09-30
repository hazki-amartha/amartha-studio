'use client'

// The create-PIN step, shared by "Buat PIN" and "Ulangi PIN". PRD 4.2 / F: in
// production this is the bank's webview; it is drawn in AmarthaFin styling
// because the product is white-labelled.

import { useEffect, useState } from 'react'
import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { CodeBoxes, Keypad, PageTitle, StepHeader } from './ui'

export function PinStep({
  title,
  next,
  header = 'Buka Rekening',
  stage = 4,
  description = '6 angka untuk setiap transaksi dari rekening ini. PIN ini berbeda dengan PIN AmarthaFin.',
  onDone,
}: {
  title: string
  next: string
  header?: string
  stage?: 1 | 2 | 3 | 4 | null
  description?: string
  onDone?: () => void
}) {
  const flow = useFlow()
  const [pin, setPin] = useState('')

  useEffect(() => {
    if (pin.length === 6) {
      const t = setTimeout(() => {
        onDone?.()
        flow.go(next)
      }, 300)
      return () => clearTimeout(t)
    }
  }, [pin, next, flow, onDone])

  return (
    <Screen canvas="white" topBar={<NavigationHeader title={header} onBack={flow.back} />}>
      {stage ? <StepHeader stage={stage} /> : null}
      <PageTitle title={title} description={description} />
      <div className="py-8">
        <CodeBoxes value={pin} masked />
      </div>
      <p className="text-center text-12 text-caption">Hindari angka berurutan atau tanggal lahir.</p>
      <div className="mt-auto pb-16">
        <Keypad
          onDigit={(d) => setPin((p) => (p.length < 6 ? p + d : p))}
          onDelete={() => setPin((p) => p.slice(0, -1))}
        />
      </div>
    </Screen>
  )
}
