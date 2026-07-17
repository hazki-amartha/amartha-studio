'use client'

import { Screen, TopBar } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { DanaCard } from '../lib/DanaCard'
import { LoanCard } from '../lib/LoanCard'

export function LateScreen() {
  const flow = useFlow()

  // LimitCard is deliberately absent — see index.ts notes.
  return (
    <Screen topBar={<TopBar>Beranda</TopBar>}>
      <LoanCard state="late" onPrimary={() => flow.go('ontrack')} />
      <DanaCard state="late" />
    </Screen>
  )
}
