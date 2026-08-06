'use client'

// Evening briefing — the page behind the second card on Tugas.
//
// Empty for the same reason as the morning one: the card is what is being
// reviewed, and what closing the branch day with the BPs actually involves is
// the next question rather than this screen's guess.

import { NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { BRIEFINGS } from '../lib/schedule'
import { AppScreen, EmptyState, VisitTitle } from '../lib/ui'

export function BriefingEveningScreen() {
  const flow = useFlow()
  const briefing = BRIEFINGS[1]

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={briefing.name} when={`${briefing.time} · ${briefing.place}`} />}
          onBack={() => flow.go('today')}
        />
      }
    >
      <EmptyState title="Belum ada isi" body="Halaman briefing sore menyusul." />
    </AppScreen>
  )
}
