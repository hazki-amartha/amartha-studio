'use client'

// KPI — blank, on purpose.
//
// The BP direction's scoreboard came across with the fork: seven monthly
// parameters, each with a bonus, all of them measuring one field officer's own
// collection and growth. None of that is what a Branch Manager is scored on —
// she is measured on the BPs she runs, not on a book she carries herself — so
// leaving the BP's seven here would put a page of confident numbers in front of
// the designer that describe the wrong person.
//
// It has moved off the bottom bar into Profil (that slot is Sales now), so it is
// reached with a back button rather than a tab. What belongs on it is the next
// conversation.

import { NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { AppScreen, EmptyState } from '../lib/ui'

export function KpiScreen() {
  const flow = useFlow()
  return (
    <AppScreen topBar={<NavigationHeader title="KPI" onBack={() => flow.back()} />}>
      <EmptyState title="Belum ada isi" body="Halaman KPI untuk BM menyusul." />
    </AppScreen>
  )
}
