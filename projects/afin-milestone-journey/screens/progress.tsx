'use client'

// Progress — the 48-week tenor as a ladder of rewards rather than a countdown.
//
// The ordering is the point: an unlocked rung sits at the TOP, above the one
// she is working toward, so the first thing on the page is money she can take
// today. A chronological list would bury it under whatever week she is on.
//
// Locked rungs stay visible and stay specific — "pelunasan dini", "limit baru
// Rp8jt" — because a lock only motivates if you can read what is behind it.

import { useState } from 'react'
import { BottomSheet, NavigationHeader } from '@/design-system/components'
import { LightbulbFilament } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { HISTORY, MEMBERS, MILESTONE_SETS, hasPreviousCycle } from '../lib/data'
import { useApp } from '../lib/store'
import { healthOf } from '../lib/milestone-tracker'
import { MilestoneRung, PreviousCycleLink, ProgressMenuItem } from '../lib/journey'

export function ProgressScreen() {
  const flow = useFlow()
  const { journeyPhase } = useApp()
  const [progressOpen, setProgressOpen] = useState(false)

  // Which snapshot of the ladder to draw — the demo-state controls set the phase.
  const milestones = MILESTONE_SETS[journeyPhase]

  // The two reads behind the "Lihat progress" menu, from the same data their
  // detail pages use: her own bayar/hadir record, and the majelis's payments.
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
      <div className="flex flex-col gap-16 pb-16">
        {/* A tip that frames the ladder — discipline compounds toward a bigger
            limit — with the way into the two progress reads inline. */}
        <div className="flex items-start gap-12 rounded-12 bg-blue-50 p-16">
          <span className="shrink-0 text-caption">
            <LightbulbFilament size={24} />
          </span>
          <p className="text-14 text-caption">
            Setiap pembayaran tepat waktu yang Ibu dan teman-teman satu majelis lakukan, membawa
            Ibu lebih dekat ke modal yang lebih besar.{' '}
            <button
              type="button"
              onClick={() => setProgressOpen(true)}
              className="p-0 align-baseline text-14 font-bold text-primary-500"
            >
              Lihat progress
            </button>
          </p>
        </div>

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

      <BottomSheet open={progressOpen} onClose={() => setProgressOpen(false)} title="Progress Ibu">
        <div className="flex flex-col">
          <ProgressMenuItem
            label="Progress pribadi"
            subtitle="Berpengaruh ke semua goal"
            health={personal}
            onOpen={() => {
              setProgressOpen(false)
              flow.go('riwayat')
            }}
          />
          <div className="h-px bg-neutral-200" />
          <ProgressMenuItem
            label="Progress majelis"
            subtitle="Berpengaruh ke goal kenaikan limit"
            health={majelis}
            onOpen={() => {
              setProgressOpen(false)
              flow.go('majelis')
            }}
          />
        </div>
      </BottomSheet>
    </Screen>
  )
}
