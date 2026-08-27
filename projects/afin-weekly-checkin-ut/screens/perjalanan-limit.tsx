'use client'

import { NavigationHeader } from '@/design-system/components'
import { LockKey } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'

// ── Data ────────────────────────────────────────────────────────────────────

type MilestoneState = 'next' | 'locked'

interface Milestone {
  label: string
  countdown: string
  actionLabel: string
  amount?: string
  amountTo?: string
  footnote?: { before: string; strong: string; after: string }
  state: MilestoneState
}

const MILESTONES: Milestone[] = [
  {
    label: '15 September 2026',
    countdown: '14 minggu lagi',
    actionLabel: 'Bisa dicairkan',
    amount: 'Rp1,25jt',
    amountTo: 'Rp1,5jt',
    state: 'next',
  },
  {
    label: '5 Desember 2026',
    countdown: '26 minggu lagi',
    actionLabel: 'Bisa dicairkan',
    amount: 'Rp1,25jt',
    amountTo: 'Rp1,5jt',
    state: 'locked',
  },
  {
    label: '27 Februari 2027',
    countdown: '38 minggu lagi',
    actionLabel: 'Bisa dicairkan',
    amount: 'Rp1,25jt',
    amountTo: 'Rp1,5jt',
    state: 'locked',
  },
  {
    label: '8 Juni 2027 🏆',
    countdown: '48 minggu lagi',
    actionLabel: 'Peningkatan limit',
    amount: 's/d Rp7jt',
    footnote: {
      before: 'Bisa',
      strong: 's/d Rp8jt',
      after: 'jika performa pembayaran kelompok juga bagus',
    },
    state: 'locked',
  },
]

// ── Rung ────────────────────────────────────────────────────────────────────

function Rung({ milestone, showConnector }: { milestone: Milestone; showConnector: boolean }) {
  const { label, countdown, actionLabel, amount, amountTo, footnote, state } = milestone
  const muted = state === 'locked'

  return (
    <div className="flex gap-12">
      {/* timeline node + connector */}
      <div className="relative flex shrink-0 justify-center" style={{ width: '40px' }}>
        {showConnector && (
          <span
            className="absolute"
            style={{
              left: '50%',
              top: '40px',
              bottom: '-16px',
              width: '2px',
              transform: 'translateX(-50%)',
              background: '#E2D8F3',
            }}
          />
        )}
        <span
          className="relative z-10 flex items-center justify-center rounded-full"
          style={{
            width: '40px',
            height: '40px',
            background: state === 'next' ? '#853291' : '#F4F0F9',
            flexShrink: 0,
          }}
        >
          {state === 'next' ? (
            <span style={{ fontSize: '18px' }}>🎯</span>
          ) : (
            <LockKey size={20} className="text-caption" />
          )}
        </span>
      </div>

      {/* card */}
      <div
        className="min-w-0 flex-1 overflow-hidden rounded-12"
        style={{ border: '1px solid #E9DEF6' }}
      >
        <div className="bg-neutral-white p-16">
          <div className="flex items-start gap-8">
            <div className="min-w-0 flex-1">
              <span className={`text-16 font-bold ${muted ? 'text-caption' : 'text-default'}`}>
                {label}
              </span>
              <p className="mt-2 text-12 text-caption">{countdown}</p>
            </div>
            {!muted && (
              <span
                className="shrink-0 rounded-full text-12 font-bold"
                style={{ background: '#EBF4FF', color: '#1D72C5', padding: '4px 10px', whiteSpace: 'nowrap' }}
              >
                Lancar
              </span>
            )}
          </div>

          <div style={{ height: '1px', background: '#F4F0F9', margin: '16px 0' }} />

          <div className="flex items-center gap-8">
            <div className="min-w-0 flex-1">
              <p className="text-14 text-caption">{actionLabel}</p>
              {amount && (
                <p className="mt-2 font-bold" style={{ fontSize: '18px', color: muted ? '#9AA0AE' : '#0F7A3D' }}>
                  {amountTo ? `${amount} – ${amountTo}` : amount}
                </p>
              )}
            </div>
            {state === 'next' && (
              <button
                type="button"
                className="shrink-0 rounded-full font-bold text-primary-500"
                style={{ border: '1.5px solid #853291', padding: '8px 16px', fontSize: '14px' }}
              >
                Detail
              </button>
            )}
          </div>
        </div>

        {footnote && (
          <div
            className="px-16 py-8"
            style={{ borderTop: '1px solid #F4F0F9', background: '#FAF8FD' }}
          >
            <p className="text-12 text-caption">
              {footnote.before}{' '}
              <span className="font-bold text-caption">{footnote.strong}</span>{' '}
              {footnote.after}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Screen ───────────────────────────────────────────────────────────────────

export function PerjalananLimitScreen() {
  const flow = useFlow()
  return (
    <Screen topBar={<NavigationHeader title="Hadiah bayar pinjaman" onBack={flow.back} />}>
      <div className="flex flex-col gap-16 pb-16">
        {MILESTONES.map((m, i) => (
          <Rung key={m.label} milestone={m} showConnector={i < MILESTONES.length - 1} />
        ))}
      </div>
    </Screen>
  )
}
