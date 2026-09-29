'use client'

// The create-PIN step, shared by "Buat PIN" and "Ulangi PIN". PRD 4.2 / F: in
// production this is the bank's webview; it is drawn in AmarthaFin styling
// because the product is white-labelled.

import { useEffect, useState } from 'react'
import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { CodeBoxes, Keypad, PageTitle, StepHeader } from './ui'

export function PinStep({ title, next }: { title: string; next: string }) {
  const flow = useFlow()
  const [pin, setPin] = useState('')

  useEffect(() => {
    if (pin.length === 6) {
      const t = setTimeout(() => flow.go(next), 300)
      return () => clearTimeout(t)
    }
  }, [pin, next, flow])

  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Buka Rekening" onBack={flow.back} />}>
      <StepHeader stage={4} />
      <PageTitle
        title={title}
        description="6 angka untuk setiap transaksi dari rekening ini. PIN ini berbeda dengan PIN AmarthaFin."
      />
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
