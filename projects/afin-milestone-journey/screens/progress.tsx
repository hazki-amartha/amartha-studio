'use client'

// Progress — the 48-week tenor as a ladder of rewards rather than a countdown.
//
// The ordering is the point: an unlocked rung sits at the TOP, above the one
// she is working toward, so the first thing on the page is money she can take
// today. A chronological list would bury it under whatever week she is on.
//
// Locked rungs stay visible and stay specific — "pelunasan dini", "limit baru
// Rp8jt" — because a lock only motivates if you can read what is behind it.

import type { ReactNode } from 'react'
import { NavigationHeader } from '@/design-system/components'
import { Check, ChevronRight, LockKey, Majelis, User } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MILESTONES, type Milestone } from '../lib/data'
import { Meter } from '../lib/ui'

// The two "health" reads that decide whether the bonuses in the ladder are
// actually on track: her own repayment/attendance record, and the majelis she
// is graded alongside. Each is one slim tinted tile — icon + who on the first
// line, status word + a way in on the second — so the pair reads at a glance
// without stacking three rows. State is hard-coded here: this is a
// click-through, not a live score (CLAUDE.md §3).
type Health = 'baik' | 'berisiko' | 'buruk'

const HEALTH: Record<
  Health,
  { label: string; status: string; who: string; icon: string; bg: string }
> = {
  baik: {
    label: 'Baik',
    status: 'text-green-500',
    who: 'text-green-700',
    icon: 'text-green-600',
    bg: 'bg-green-50',
  },
  berisiko: {
    label: 'Berisiko',
    status: 'text-orange-500',
    who: 'text-orange-800',
    icon: 'text-orange-700',
    bg: 'bg-orange-50',
  },
  buruk: {
    label: 'Tidak baik',
    status: 'text-red-500',
    who: 'text-red-800',
    icon: 'text-red-700',
    bg: 'bg-red-50',
  },
}

export function ProgressScreen() {
  const flow = useFlow()

  return (
    <Screen
      topBar={
        <NavigationHeader title="Perjalanan pendanaan" onBack={() => flow.go('home')} />
      }
    >
      <section className="flex flex-col gap-8">
        <SectionHead title="Jaga dua hal ini" />
        <div className="flex gap-12">
          <HealthCard
            icon={<User size={16} />}
            title="Performa ibu"
            health="baik"
            onOpen={() => flow.go('riwayat')}
          />
          <HealthCard
            icon={<Majelis size={16} />}
            title="Performa majelis"
            health="berisiko"
            onOpen={() => flow.go('majelis')}
          />
        </div>
      </section>

      <section className="flex flex-col gap-8 pb-16">
        <SectionHead title="Raih target ini" />
        <div className="flex flex-col gap-16">
          {MILESTONES.map((m, i) => (
            <MilestoneRung
              key={m.label}
              milestone={m}
              showConnector={i < MILESTONES.length - 1}
              onOpen={m.state === 'unlocked' ? () => flow.go('milestone-unlocked') : undefined}
            />
          ))}
        </div>
      </section>
    </Screen>
  )
}

function SectionHead({ title }: { title: string }) {
  return <h2 className="text-16 font-bold text-default">{title}</h2>
}

function HealthCard({
  icon,
  title,
  health,
  onOpen,
}: {
  icon: ReactNode
  title: string
  health: Health
  onOpen: () => void
}) {
  const h = HEALTH[health]

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex min-w-0 flex-1 flex-col gap-8 rounded-12 p-12 text-left ${h.bg}`}
    >
      <span className="flex items-center gap-4">
        <span className={`shrink-0 ${h.icon}`}>{icon}</span>
        <span className={`min-w-0 flex-1 truncate text-12 ${h.who}`}>{title}</span>
      </span>

      <span className="flex items-center gap-8">
        <span className={`text-16 font-bold ${h.status}`}>{h.label}</span>
        <span className={`ml-auto shrink-0 ${h.status}`}>
          <ChevronRight size={16} />
        </span>
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
  const { label, tag, countdown, actionLabel, amount, pct, state, cta } = milestone

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
        role={onOpen ? 'button' : undefined}
        tabIndex={onOpen ? 0 : undefined}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (onOpen && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onOpen()
          }
        }}
        className={`min-w-0 flex-1 rounded-12 border bg-neutral-white p-16 ${
          state === 'next' ? 'border-primary-500' : 'border-default'
        } ${onOpen ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-start gap-8">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-8">
              <span className="text-16 font-bold text-default">{label}</span>
              {tag ? (
                <span className="rounded-full bg-primary-50 px-8 py-2 text-12 font-bold text-primary-500">
                  {tag}
                </span>
              ) : null}
            </div>
            {countdown ? <p className="mt-2 text-12 text-caption">{countdown}</p> : null}
          </div>
          <span className="shrink-0 text-disabled">
            <ChevronRight size={20} />
          </span>
        </div>

        <p className="mt-16 text-14 text-caption">{actionLabel}</p>
        {amount ? <p className="text-18 font-bold text-primary-500">{amount}</p> : null}

        {cta && onOpen ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpen()
            }}
            className="mt-12 w-full rounded-full bg-primary-500 px-16 py-12 text-14 font-bold text-neutral-white"
          >
            {cta}
          </button>
        ) : pct != null ? (
          <div className="mt-12">
            <Meter percent={pct} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
