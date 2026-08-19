'use client'

// Perjalanan 48w - alt 2 — the full-ladder view behind Home - alt's card.
//
// Same LADDER as Perjalanan 48 minggu: the rungs, the phases and the state
// controls all come from MILESTONE_SETS off the store's journeyPhase, so the
// two screens can never disagree about where she is. What differs is the
// PRESENTATION — the two status pills across the top instead of the two
// progress rows, and a rung card that keeps its shape in every state rather
// than collapsing.
//
// One copy change the shared data cannot carry: a missed rung reads
// "Terlewat", never "Gagal", and adds the cost and the way back underneath.

import { NavigationHeader } from '@/design-system/components'
import { Check, ChevronRight, LockKey, WarningCircle } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MILESTONE_SETS, hasPreviousCycle, type Milestone } from '../lib/data'
import { rewardAtRisk as isRewardAtRisk, tunggakan, useApp } from '../lib/store'
import { PreviousCycleLink, STATUS_TONE, withRewardRisk } from '../lib/journey'
import { MISSED_RECOVERY } from '../lib/revolving'
import { StatusPillRow } from '../lib/revolving-ui'

export function PerjalananAlt2Screen() {
  const flow = useFlow()
  const app = useApp()
  const { journeyPhase } = app

  const statusPribadi = isRewardAtRisk(app) ? 'berisiko' : 'sehat'
  const statusMajelis = tunggakan(app) > 0 ? 'berisiko' : 'sehat'

  const milestones = withRewardRisk(MILESTONE_SETS[journeyPhase], isRewardAtRisk(app))

  return (
    <Screen
      topBar={<NavigationHeader title="Angsuran Anda" onBack={() => flow.go('home-alt')} />}
    >
      <div className="-mx-16 -mt-16 border-b border-light bg-neutral-white p-16">
        <StatusPillRow
          statusPribadi={statusPribadi}
          statusMajelis={statusMajelis}
          ctaPribadi={{ label: 'Riwayat angsuran', onClick: () => flow.go('riwayat') }}
          ctaMajelis={{ label: 'Detail majelis', onClick: () => flow.go('majelis-alt') }}
        />
      </div>

      <div className="flex flex-col gap-16 pb-16">
        {milestones.map((m, i) => (
          <Rung
            key={m.label}
            milestone={m}
            showConnector={i < milestones.length - 1}
            // A rung with money on the table opens the alt reward screen; the
            // rest open the tracker page the shared data names.
            onOpen={() => flow.go(m.cta ? 'milestone-12-alt' : m.detail)}
          />
        ))}

        {hasPreviousCycle(journeyPhase) ? <PreviousCycleLink /> : null}
      </div>
    </Screen>
  )
}

function Rung({
  milestone,
  showConnector,
  onOpen,
}: {
  milestone: Milestone
  showConnector: boolean
  onOpen: () => void
}) {
  const { label, countdown, actionLabel, amount, amountTo, footnote, status, state, cta } = milestone

  const missed = state === 'missed'
  // A rung further up the ladder is disabled, exactly as on Perjalanan 48
  // minggu: drained of colour, and with no control on it. It drops its status
  // label too — a read of habits she has not had the chance to keep yet filled
  // the loudest slot on the card with the least useful thing on it, and the
  // lock in the node column already says why the card is quiet.
  const muted = state === 'locked'
  const ink = muted ? 'text-disabled' : undefined

  // The pill takes the shared status where there is one, so "Sudah dicapai",
  // "Lancar" and "Berisiko" read exactly as they do on the other layout.
  const pill = muted
    ? null
    : missed
      ? { label: MISSED_RECOVERY.label, tone: 'orange' as const }
      : status
        ? { label: status.label, tone: status.tone }
        : null

  return (
    <div className="flex gap-12">
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
                : missed
                  ? 'bg-orange-500 text-neutral-white'
                  : 'bg-neutral-50 text-neutral-400'
          }`}
        >
          {state === 'unlocked' ? (
            <Check size={20} />
          ) : missed ? (
            <WarningCircle size={20} />
          ) : state === 'next' ? (
            <span className="text-16">🎯</span>
          ) : (
            <LockKey size={20} />
          )}
        </span>
      </div>

      <div
        className={`min-w-0 flex-1 overflow-hidden rounded-12 border border-default ${
          muted ? 'bg-neutral-50' : 'bg-neutral-white'
        }`}
      >
        <div className="p-16">
          <div className="flex items-start gap-8">
            <div className="min-w-0 flex-1">
              <span className={`text-16 font-bold ${ink ?? 'text-default'}`}>{label}</span>
              {countdown ? (
                <p className={`mt-2 text-12 ${ink ?? 'text-caption'}`}>{countdown}</p>
              ) : null}
            </div>
            {pill ? (
              <span
                className={`shrink-0 rounded-full px-8 py-2 text-12 font-bold ${STATUS_TONE[pill.tone]}`}
              >
                {pill.label}
              </span>
            ) : null}
          </div>

          <div className="my-16 border-t border-light" />

          <div className="flex items-center gap-8">
            <div className="min-w-0 flex-1">
              <p className={`text-14 ${ink ?? 'text-caption'}`}>{actionLabel}</p>
              {amount ? (
                <p className={`mt-2 text-18 font-bold ${ink ?? 'text-green-600'}`}>
                  {amountTo ? `${amount} - ${amountTo}` : amount}
                </p>
              ) : null}
            </div>
            {/* A locked rung gets no control at all: it has no progress of its
                own to show yet, so the card stays inert. */}
            {muted ? null : cta ? (
              <button
                type="button"
                onClick={onOpen}
                className="shrink-0 rounded-full bg-primary-500 px-16 py-8 text-14 font-bold text-neutral-white"
              >
                {cta}
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpen}
                className="shrink-0 text-disabled"
                aria-label="Lihat detail"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>

        {missed ? (
          <div className="border-t border-light bg-orange-50 px-16 py-8">
            <p className="text-12 text-orange-700">{MISSED_RECOVERY.consequence}</p>
            <p className="mt-2 text-12 font-bold text-orange-700">{MISSED_RECOVERY.recovery}</p>
          </div>
        ) : footnote ? (
          <div className="border-t border-light bg-neutral-50 px-16 py-8">
            <p className={`text-14 ${ink ?? 'text-caption'}`}>
              {footnote.before}{' '}
              <span className={`font-bold ${ink ?? 'text-default'}`}>{footnote.strong}</span>{' '}
              {footnote.after}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
