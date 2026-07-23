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
import { MILESTONES, type Milestone } from '../lib/data'
import { Meter } from '../lib/ui'

export function ProgressScreen() {
  const flow = useFlow()

  return (
    <Screen
      topBar={
        <NavigationHeader title="Perjalanan pendanaan ibu" onBack={() => flow.go('home')} />
      }
    >
      <h1 className="text-20 font-bold text-default">
        Lihat bonus pencairan dibawah ini yang menantimu
      </h1>

      <div className="flex flex-col gap-16 pb-16">
        {MILESTONES.map((m) => (
          <MilestoneRung
            key={m.label}
            milestone={m}
            onOpen={m.state === 'unlocked' ? () => flow.go('milestone-unlocked') : undefined}
          />
        ))}
      </div>
    </Screen>
  )
}

function MilestoneRung({
  milestone,
  onOpen,
}: {
  milestone: Milestone
  onOpen?: () => void
}) {
  const { label, tag, actionLabel, amount, weeksLeft, pct, state, cta } = milestone

  return (
    <div className="flex gap-12">
      {/* The node column. It carries the rung's status on its own, so the card
          beside it never has to repeat "terkunci" in words. */}
      <span
        className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-full ${
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
        <div className="flex items-center gap-8">
          <span className="text-16 font-bold text-default">{label}</span>
          {tag ? (
            <span className="rounded-full bg-primary-50 px-8 py-2 text-12 font-bold text-primary-500">
              {tag}
            </span>
          ) : null}
          <span className="flex-1" />
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
        ) : weeksLeft ? (
          <div className="mt-12 flex flex-col gap-8">
            <p className="text-12 text-caption">{weeksLeft}</p>
            <Meter percent={pct ?? 0} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
