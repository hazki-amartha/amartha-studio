'use client'

// Perjalanan pendanaan — alternative layout.
//
// Same ladder as `progress.tsx`, same demo phases; what differs is the top of
// the page. This one opens on a tip card that states the argument in a
// paragraph — discipline compounds toward a bigger limit — and keeps the two
// progress reads behind a bottom sheet rather than in a band of their own.
//
// The ladder itself is shared and unchanged: an unlocked rung sits at the TOP,
// above the one she is working toward, so the first thing on the page is money
// she can take today. Locked rungs stay visible and stay specific — "pelunasan
// dini", "limit baru Rp8jt" — because a lock only motivates if you can read
// what is behind it.

import { useState } from 'react'
import { BottomSheet, NavigationHeader } from '@/design-system/components'
import { LightbulbFilament } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { HISTORY, MILESTONE_SETS, hasPreviousCycle } from '../lib/data'
import { members, rewardAtRisk, useApp } from '../lib/store'
import { healthOf } from '../lib/milestone-tracker'
import { MilestoneRung, PreviousCycleLink, ProgressMenuItem, withRewardRisk } from '../lib/journey'

export function ProgressAltScreen() {
  const flow = useFlow()
  const app = useApp()
  const { journeyPhase } = app
  const [progressOpen, setProgressOpen] = useState(false)

  // Which snapshot of the ladder to draw — the demo-state controls set the phase.
  const milestones = withRewardRisk(MILESTONE_SETS[journeyPhase], rewardAtRisk(app))

  // The two reads behind the "Lihat status" menu, from the same data their
  // detail pages use: her own bayar/hadir record, and the majelis's payments.
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
      <div className="flex flex-col gap-16 pb-16">
        {/* A tip that frames the ladder — discipline compounds toward a bigger
            limit — with the way into the two progress reads inline. */}
        <div className="flex items-start gap-12 rounded-12 bg-blue-50 p-16">
          <span className="shrink-0 text-caption">
            <LightbulbFilament size={24} />
          </span>
          <p className="text-14 text-caption">
            Pembayaran dan kehadiran rutin Ibu dan anggota majelis lainnya bisa menghasilkan limit
            yang lebih besar.{' '}
            <button
              type="button"
              onClick={() => setProgressOpen(true)}
              className="p-0 align-baseline text-14 font-bold text-primary-500"
            >
              Lihat status
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
            label="Status pribadi"
            subtitle="Mempengaruhi semua tahapan kenaikan limit."
            health={personal}
            onOpen={() => {
              setProgressOpen(false)
              flow.go('riwayat')
            }}
          />
          <div className="h-px bg-neutral-200" />
          <ProgressMenuItem
            label="Status majelis"
            subtitle="Mempengaruhi kenaikan limit akhir."
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
