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
import { Check, ChevronRight, LightbulbFilament, LockKey } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { HISTORY, MEMBERS, MILESTONE_SETS, type Milestone } from '../lib/data'
import { useApp } from '../lib/store'
import { healthOf, type Health } from '../lib/milestone-tracker'

const STATUS_TONE = {
  green: 'bg-green-50 text-green-600',
  blue: 'bg-blue-50 text-blue-600',
  orange: 'bg-orange-50 text-orange-700',
  red: 'bg-red-50 text-red-600',
} as const

const HEALTH_LABEL: Record<Health, { label: string; tone: keyof typeof STATUS_TONE }> = {
  sehat: { label: 'Sehat', tone: 'green' },
  berisiko: { label: 'Berisiko', tone: 'orange' },
  buruk: { label: 'Tidak sehat', tone: 'red' },
}

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

function ProgressMenuItem({
  label,
  subtitle,
  health,
  onOpen,
}: {
  label: string
  subtitle: string
  health: Health
  onOpen: () => void
}) {
  const h = HEALTH_LABEL[health]
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-8 py-12 text-left"
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-14 font-bold text-default">{label}</span>
        <span className="text-12 text-caption">{subtitle}</span>
      </span>
      <span className={`shrink-0 rounded-full px-8 py-2 text-12 font-bold ${STATUS_TONE[h.tone]}`}>
        {h.label}
      </span>
      <span className="shrink-0 text-disabled">
        <ChevronRight size={16} />
      </span>
    </button>
  )
}

function MilestoneRung({
  milestone,
  showConnector,
  onOpen,
}: {
  milestone: Milestone
  showConnector: boolean
  onOpen?: () => void
}) {
  const { label, status, countdown, actionLabel, amount, state, cta } = milestone

  return (
    <div className="flex gap-12">
      {/* The node column, stretched to the card's height so the connector can
          run from this node down to the next — a timeline the eye reads as
          progress. It carries the rung's status on its own, so the card beside
          it never has to repeat "terkunci" in words. */}
      <div className="relative flex w-40 shrink-0 justify-center self-stretch">
        {showConnector ? (
          <span
            className={`absolute left-1/2 top-40 -bottom-16 w-2 -translate-x-1/2 ${
              state === 'unlocked' ? 'bg-green-500' : 'bg-neutral-200'
            }`}
          />
        ) : null}
        <span
          className={`relative z-10 flex h-40 w-40 items-center justify-center rounded-full ${
            state === 'unlocked'
              ? 'bg-green-500 text-neutral-white'
              : state === 'next'
                ? 'bg-primary-500 text-neutral-white'
                : state === 'missed'
                  ? 'bg-red-500 text-neutral-white'
                  : 'bg-neutral-50 text-neutral-400'
          }`}
        >
          {state === 'unlocked' ? (
            <Check size={20} />
          ) : state === 'next' ? (
            <span className="text-16">🎯</span>
          ) : state === 'missed' ? (
            <span className="text-18 font-bold">✕</span>
          ) : (
            <LockKey size={20} />
          )}
        </span>
      </div>

      <div className="min-w-0 flex-1 rounded-12 border border-default bg-neutral-white p-16">
        {/* Date + countdown on the left, the status pill on the right. */}
        <div className="flex items-start gap-8">
          <div className="min-w-0 flex-1">
            <span className="text-16 font-bold text-default">{label}</span>
            {countdown ? <p className="mt-2 text-12 text-caption">{countdown}</p> : null}
          </div>
          {status ? (
            <span
              className={`shrink-0 rounded-full px-8 py-2 text-12 font-bold ${STATUS_TONE[status.tone]}`}
            >
              {status.label}
            </span>
          ) : null}
        </div>

        <div className="my-16 border-t border-light" />

        {/* The reward on the left, the way in on the right — on one row. */}
        <div className="flex items-center gap-8">
          <div className="min-w-0 flex-1">
            <p className="text-14 text-caption">{actionLabel}</p>
            {amount ? <p className="mt-2 text-18 font-bold text-green-600">{amount}</p> : null}
          </div>
          {cta && onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              className="shrink-0 rounded-full bg-primary-500 px-16 py-8 text-14 font-bold text-neutral-white"
            >
              {cta}
            </button>
          ) : onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              className="shrink-0 rounded-full border border-primary-500 px-16 py-8 text-14 font-bold text-primary-500"
            >
              Lihat
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
