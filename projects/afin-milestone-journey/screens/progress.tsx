'use client'

// Perjalanan pendanaan — the 48-week tenor as a ladder of rewards rather than
// a countdown.
//
// There is no tip card and nothing behind a sheet: the two progress reads ARE
// the first band, run full-bleed under the header so they read as part of the
// chrome rather than as one more card competing with the rungs. The argument a
// tip card would make — discipline compounds toward a bigger limit — is carried
// by the row subtitles instead of a paragraph: each says which goal the read
// moves.
//
// `progress-alt.tsx` keeps the earlier layout, which put that argument in a
// tip card and the two reads behind a bottom sheet.

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { HISTORY, MILESTONE_SETS, hasPreviousCycle } from '../lib/data'
import { members, useApp } from '../lib/store'
import { healthOf } from '../lib/milestone-tracker'
import { MilestoneRung, PreviousCycleLink, ProgressMenuItem } from '../lib/journey'

export function ProgressScreen() {
  const flow = useFlow()
  const app = useApp()
  const { journeyPhase } = app

  const milestones = MILESTONE_SETS[journeyPhase]

  const weeks = HISTORY.length
  const personal = healthOf(
    Math.min(HISTORY.filter((e) => e.bayar).length, HISTORY.filter((e) => e.kumpulan).length),
    weeks,
  )
  const roster = members(app)
  const majelis = healthOf(roster.filter((m) => m.bayar).length, roster.length)

  return (
    <Screen
      topBar={<NavigationHeader title="Perjalanan naik limit" onBack={() => flow.go('home')} />}
    >
      {/* Pulled to the display edges and up against the header: one white band,
          two rows, a hairline between them and one under the band. */}
      <div className="-mx-16 -mt-16 border-b border-light bg-neutral-white">
        <ProgressMenuItem
          inset
          label="Status pribadi"
          subtitle="Mempengaruhi semua tahapan kenaikan limit."
          health={personal}
          onOpen={() => flow.go('riwayat')}
        />
        <div className="mx-16 h-px bg-neutral-200" />
        <ProgressMenuItem
          inset
          label="Status majelis"
          subtitle="Mempengaruhi kenaikan limit akhir."
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
