'use client'

import { Screen, TopBar } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { DanaCard } from '../lib/DanaCard'
import { LimitCard } from '../lib/LimitCard'
import { LoanCard } from '../lib/LoanCard'

export function SettledScreen() {
  const flow = useFlow()

  return (
    <Screen topBar={<TopBar>Beranda</TopBar>}>
      <LoanCard state="settled" onPrimary={() => flow.go('ontrack')} />
      <DanaCard state="settled" />
      <LimitCard />
    </Screen>
  )
}
