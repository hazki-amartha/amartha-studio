'use client'

// Perjalanan pendanaan — alternative layout.
//
// Same ladder as `progress.tsx`, same demo phases; what differs is the top of
// the page. There is no tip card and nothing behind a sheet: the two progress
// reads ARE the first band, run full-bleed under the header so they read as
// part of the chrome rather than as one more card competing with the rungs.
//
// The tip card's argument — discipline compounds toward a bigger limit — is
// carried by the row subtitles instead of a paragraph: each says which goal the
// read moves.

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { HISTORY, MEMBERS, MILESTONE_SETS, hasPreviousCycle } from '../lib/data'
import { useApp } from '../lib/store'
import { healthOf } from '../lib/milestone-tracker'
import {
  activeIndexOf,
  MilestoneRung,
  PreviousCycleLink,
  ProgressMenuItem,
} from '../lib/journey'

export function ProgressV2Screen() {
  const flow = useFlow()
  const { journeyPhase } = useApp()

  const milestones = MILESTONE_SETS[journeyPhase]
  const activeIndex = activeIndexOf(milestones)

  const weeks = HISTORY.length
  const personal = healthOf(
    Math.min(HISTORY.filter((e) => e.bayar).length, HISTORY.filter((e) => e.kumpulan).length),
    weeks,
  )
  const majelis = healthOf(MEMBERS.filter((m) => m.bayar).length, MEMBERS.length)

  return (
    <Screen
      topBar={<NavigationHeader title="Perjalanan pendanaan" onBack={() => flow.go('home')} />}
    >
      {/* Pulled to the display edges and up against the header: one white band,
          two rows, a hairline between them and one under the band. */}
      <div className="-mx-16 -mt-16 border-b border-light bg-neutral-white">
        <ProgressMenuItem
          inset
          label="Progress pribadi"
          subtitle="Berpengaruh ke semua goal"
          health={personal}
          onOpen={() => flow.go('riwayat')}
        />
        <div className="mx-16 h-px bg-neutral-200" />
        <ProgressMenuItem
          inset
          label="Progress majelis"
          subtitle="Berpengaruh ke goal kenaikan limit"
          health={majelis}
          onOpen={() => flow.go('majelis')}
        />
      </div>

      <div className="flex flex-col gap-16 pb-16">
        {milestones.map((m, i) => (
          <MilestoneRung
            key={m.label}
            milestone={m}
            showConnector={i < milestones.length - 1}
            active={i === activeIndex}
            onOpen={() => flow.go(m.detail)}
          />
        ))}

        {/* Only once a cycle has closed: last cycle's rungs left the ladder,
            so this is where they went. */}
        {hasPreviousCycle(journeyPhase) ? <PreviousCycleLink /> : null}
      </div>
    </Screen>
  )
}
