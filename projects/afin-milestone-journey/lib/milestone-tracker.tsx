'use client'

// The shared shape behind every milestone's dedicated tracker page. Each
// milestone gets its own thin screen that fills this in with its date, reward,
// and the habits that earn it — so the pages read as one family while staying
// distinct trackers. Project-local component (CLAUDE.md §4); see NOTES.md.

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { IconTile } from './ui'

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
  onBack,
}: {
  date: string
  weeksLeft: string
  emoji: string
  headline: string
  caption: string
  reward: { label: string; value: string; sub: string }
  tasks: TrackerTask[]
  onBack: () => void
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
        <p className="text-12 text-primary-400">{reward.label}</p>
        <p className="mt-4 text-24 font-bold text-primary-500">{reward.value}</p>
        <p className="mt-4 text-12 text-caption">{reward.sub}</p>
      </div>

      <div className="flex flex-col gap-8">
        <h2 className="text-16 font-bold text-default">Yang perlu dijaga</h2>
        <div className="flex flex-col gap-12">
          {tasks.map((t) => (
            <TaskRow key={`${t.who}-${t.habit}`} {...t} />
          ))}
        </div>
      </div>
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
