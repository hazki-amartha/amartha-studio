'use client'

// Data Underwriting — reference material the BM opens from the step-1
// reference card, not a step of the 4-step flow itself. The highlight up top
// repeats what she already saw collapsed on validasi-mitra.tsx, so the two
// pages read as the same fact set at two levels of detail.

import { Card } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { useOpenCase } from '../lib/validasi-store'
import { ValidasiHeader } from '../lib/validasi-ui'
import { DataUnderwritingBody, UnderwritingHighlight } from '../lib/validasi-reference'
import { AppScreen } from '../lib/ui'

export function ValidasiDataScreen() {
  const flow = useFlow()
  const c = useOpenCase()

  return (
    <AppScreen topBar={<ValidasiHeader case={c} onBack={() => flow.go('validasi-mitra')} />}>
      <UnderwritingHighlight case={c} />
      <Card>
        <DataUnderwritingBody case={c} />
      </Card>
    </AppScreen>
  )
}
