'use client'

import { Screen, TopBar } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { DanaCard } from '../lib/DanaCard'
import { LimitCard } from '../lib/LimitCard'
import { LoanCard } from '../lib/LoanCard'

export function OnTrackScreen() {
  const flow = useFlow()

  return (
    <Screen topBar={<TopBar>Beranda</TopBar>}>
      <LoanCard state="ontrack" onPrimary={() => flow.go('settled')} />
      <DanaCard state="ontrack" />
      <LimitCard />
    </Screen>
  )
}
