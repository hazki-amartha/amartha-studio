'use client'

// Progress — the 48-week tenor as a ladder of rewards rather than a countdown.
//
// The ordering is the point: an unlocked rung sits at the TOP, above the one
// she is working toward, so the first thing on the page is money she can take
// today. A chronological list would bury it under whatever week she is on.
//
// Locked rungs stay visible and stay specific — "pelunasan dini", "limit baru
// Rp8jt" — because a lock only motivates if you can read what is behind it.

import { NavigationHeader } from '@/design-system/components'
import { Check, ChevronRight, LockKey } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { HISTORY, MEMBERS, MILESTONES, type Milestone } from '../lib/data'
import { healthOf, type Health } from '../lib/milestone-tracker'

const STATUS_TONE = {
  green: 'bg-green-50 text-green-600',
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

  // The two health reads that open the page, from the same data their detail
  // pages use: her own bayar/hadir record, and the majelis's payments.
  const weeks = HISTORY.length
  const personal = healthOf(
    Math.min(HISTORY.filter((e) => e.bayar).length, HISTORY.filter((e) => e.kumpulan).length),
    weeks,
  )
  const majelis = healthOf(MEMBERS.filter((m) => m.bayar).length, MEMBERS.length)
  const tunggakan = MEMBERS.filter((m) => !m.bayar).length

  return (
    <Screen
      topBar={<NavigationHeader title="Perjalanan pendanaan" onBack={() => flow.go('home')} />}
    >
      <div className="flex flex-col gap-16 pb-16">
        {/* Both health reads sit at the top of the page rather than behind a
            header menu — a risky majelis is the thing she most needs to see,
            and a dropdown hides it until she thinks to look. */}
        <div className="overflow-hidden rounded-12 border border-default bg-neutral-white">
          <ProgressMenuItem
            label="Progress pribadi"
            subtitle="Semua pembayaran lunas"
            health={personal}
            onOpen={() => flow.go('riwayat')}
          />
          <div className="h-px bg-neutral-200" />
          <ProgressMenuItem
            label="Progress majelis"
            subtitle={`${tunggakan} anggota punya tunggakan`}
            health={majelis}
            onOpen={() => flow.go('majelis')}
          />
        </div>

        {MILESTONES.map((m, i) => (
          <MilestoneRung
            key={m.label}
            milestone={m}
            showConnector={i < MILESTONES.length - 1}
            onOpen={() => flow.go(m.detail)}
          />
        ))}
      </div>
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
      className="flex w-full items-center gap-8 p-16 text-left"
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
                : 'bg-neutral-50 text-neutral-400'
          }`}
        >
          {state === 'unlocked' ? (
            <Check size={20} />
          ) : state === 'next' ? (
            <span className="text-16">🎯</span>
          ) : (
            <LockKey size={20} />
          )}
        </span>
      </div>

      <div
        className={`min-w-0 flex-1 rounded-12 border bg-neutral-white p-16 ${
          state === 'next' ? 'border-primary-500' : 'border-default'
        }`}
      >
        {/* Date on the left, a health pill pinned top-right on each upcoming
            rung — its tone mirrors the worst habit on that milestone's tracker. */}
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

        <p className="mt-16 text-14 text-caption">{actionLabel}</p>
        {amount ? <p className="text-18 font-bold text-primary-500">{amount}</p> : null}

        {state === 'unlocked' && cta && onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="mt-12 w-full rounded-full bg-primary-500 px-16 py-12 text-14 font-bold text-neutral-white"
          >
            {cta}
          </button>
        ) : onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="mt-12 w-full rounded-full border border-primary-500 px-16 py-12 text-14 font-bold text-primary-500"
          >
            Lihat progress
          </button>
        ) : null}
      </div>
    </div>
  )
}
