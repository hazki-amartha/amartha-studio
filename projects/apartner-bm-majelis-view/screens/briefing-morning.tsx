'use client'

// Morning briefing — the page behind the first card on Tugas.
//
// Deliberately empty. The card is the thing under review; what a briefing
// actually asks the BM to do — the roll call, the targets read out, the
// yesterday that has to be answered for — is the next conversation, and drawing
// a guess at it here would answer it before it is asked.

import { NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { BRIEFINGS } from '../lib/schedule'
import { AppScreen, EmptyState, VisitTitle } from '../lib/ui'

export function BriefingMorningScreen() {
  const flow = useFlow()
  const briefing = BRIEFINGS[0]

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={briefing.name} when={`${briefing.time} · ${briefing.place}`} />}
          onBack={() => flow.go('today')}
        />
      }
    >
      <EmptyState title="Belum ada isi" body="Halaman briefing pagi menyusul." />
    </AppScreen>
  )
}
