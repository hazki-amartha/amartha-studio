'use client'

// The shared shape behind every milestone's dedicated tracker page. Each
// milestone gets its own thin screen that fills this in with its date, reward,
// and the habits that earn it — so the pages read as one family while staying
// distinct trackers. Project-local component (CLAUDE.md §4); see NOTES.md.
//
// A reached milestone flips the lower half from "what to keep up" to "why you
// earned it": pass `reasons` instead of `tasks` and the section becomes the
// success page's "Kenapa Ibu dapat ini?" list. The reward card can likewise
// carry a `lines` breakdown in place of a single figure.

import { NavigationHeader } from '@/design-system/components'
import { Check } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { FullWidthButton, IconTile, StickyBar } from './ui'

// Health is derived from how much of each habit is on track, but only the word
// shows — the fraction lives on the detail page the row links to.
export type Health = 'sehat' | 'berisiko' | 'buruk'

const HEALTH: Record<Health, { label: string; cls: string }> = {
  sehat: { label: 'Sehat', cls: 'bg-green-50 text-green-600' },
  berisiko: { label: 'Berisiko', cls: 'bg-orange-50 text-orange-700' },
  buruk: { label: 'Tidak sehat', cls: 'bg-red-50 text-red-600' },
}

export const healthOf = (part: number, whole: number): Health => {
  const ratio = part / whole
  return ratio >= 0.8 ? 'sehat' : ratio >= 0.5 ? 'berisiko' : 'buruk'
}

export interface TrackerTask {
  /** Who the habit belongs to — "Ibu Siti" or the majelis's name. */
  who: string
  /** The habit, in the mitra's words — "Lancar bayar angsuran". */
  habit: string
  health: Health
  onOpen: () => void
}

export function MilestoneTracker({
  date,
  weeksLeft,
  emoji,
  headline,
  caption,
  reward,
  tasks,
  reasons,
  onBack,
  action,
}: {
  date: string
  weeksLeft: string
  emoji: string
  headline: string
  caption: string
  /** The prize. `value`/`sub` state it as one figure; `items` breaks it into a
   *  scannable label/value list instead — used once the reward is a compound
   *  thing (a payoff plus a fresh disbursement) rather than a single number. */
  reward: {
    label?: string
    value?: string
    sub?: string
    items?: { label: string; value: string; sub?: string }[]
  }
  /** The habits that earn the milestone — shown while it is still ahead. */
  tasks?: TrackerTask[]
  /** Once reached, the habits give way to the reasons she earned it — the
   *  success page's "Kenapa Ibu dapat ini?" list. Takes precedence over `tasks`. */
  reasons?: string[]
  onBack: () => void
  /** Shown once the milestone is reached and there is something to do about it —
   *  a primary call to action, with an optional quiet way to defer. Mirrors the
   *  reward screen the other milestones open when unlocked. */
  action?: {
    label: string
    onAction: () => void
    secondaryLabel?: string
    onSecondary?: () => void
  }
}) {
  return (
    <Screen
      topBar={
        <NavigationHeader
          title={
            <span className="flex flex-col leading-tight">
              <span>{date}</span>
              <span className="text-12 font-regular text-caption">{weeksLeft}</span>
            </span>
          }
          onBack={onBack}
        />
      }
    >
      <div className="flex flex-col items-center gap-8 pt-16 text-center">
        <IconTile tint="primary" size={48} round>
          <span className="text-24">{emoji}</span>
        </IconTile>
        <p className="text-18 font-bold text-default">{headline}</p>
        <p className="text-12 text-caption">{caption}</p>
      </div>

      <div className="rounded-12 border border-primary-200 bg-primary-50 p-20">
        {reward.label ? <p className="text-12 text-primary-400">{reward.label}</p> : null}
        {reward.items ? (
          <div className={`flex flex-col gap-12 ${reward.label ? 'mt-12' : ''}`}>
            {reward.items.map((item, i) => (
              <div
                key={item.label}
                className={i > 0 ? 'border-t border-primary-200 pt-12' : undefined}
              >
                <p className="text-12 text-caption">{item.label}</p>
                <p className="mt-2 flex items-baseline gap-4">
                  <span className="text-18 font-bold text-primary-500">{item.value}</span>
                  {item.sub ? (
                    <span className="text-18 font-bold text-primary-500">{item.sub}</span>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <>
            <p className={`text-24 font-bold text-primary-500 ${reward.label ? 'mt-4' : ''}`}>
              {reward.value}
            </p>
            <p className="mt-4 text-12 text-caption">{reward.sub}</p>
          </>
        )}
      </div>

      <div className="flex flex-col gap-8">
        <h2 className="text-16 font-bold text-default">
          {reasons ? 'Kenapa Ibu dapat ini?' : 'Yang perlu dijaga'}
        </h2>
        {reasons ? (
          <div className="rounded-12 border border-default bg-neutral-white p-16">
            {reasons.map((reason) => (
              <div key={reason} className="flex items-center gap-8 py-4">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-500">
                  <Check size={16} />
                </span>
                <span className="text-14 text-caption">{reason}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {(tasks ?? []).map((t) => (
              <TaskRow key={`${t.who}-${t.habit}`} {...t} />
            ))}
          </div>
        )}
      </div>

      {action ? (
        <StickyBar>
          <FullWidthButton onClick={action.onAction}>{action.label}</FullWidthButton>
          {action.secondaryLabel && action.onSecondary ? (
            <FullWidthButton variant="ghost" onClick={action.onSecondary}>
              {action.secondaryLabel}
            </FullWidthButton>
          ) : null}
        </StickyBar>
      ) : null}
    </Screen>
  )
}

function TaskRow({ who, habit, health, onOpen }: TrackerTask) {
  const h = HEALTH[health]

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-8 rounded-12 border border-default bg-neutral-white p-16 text-left"
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-16 font-bold text-default">{who}</span>
        <span className="mt-2 text-14 text-caption">{habit}</span>
      </span>
      <span className={`shrink-0 rounded-full px-8 py-2 text-12 font-bold ${h.cls}`}>{h.label}</span>
    </button>
  )
}
