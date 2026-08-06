'use client'

// Agen terdekat — the counters she can walk cash to.
//
// The page IS the list. It used to open with an instruction banner, a drawn
// mini-map and a block explaining what "Rekomendasi" weighed; all three are
// gone. She arrives here having already picked the agent road, so the banner
// was telling her what she had just decided, and the recommendation was an
// argument about a list short enough to read in full.
//
// The map moved to its own page, behind Buka Peta on the row it belongs to —
// a map of five counters at once answers a question nobody asked, where a map
// of the one she is considering is the reason she tapped.
//
// The list itself is `AgentList`, shared with the Setor Tunai via Agen page, so
// a counter reads identically whether she is choosing one mid-settlement or
// looking one up on its own.

import { NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { AgentList } from '../lib/agent-list'
import { AppScreen } from '../lib/ui'

export function AgentLocatorScreen() {
  const flow = useFlow()

  return (
    <AppScreen topBar={<NavigationHeader title="Agen terdekat" onBack={() => flow.back()} />}>
      <AgentList onMap={() => flow.go('agent-map')} />
    </AppScreen>
  )
}
