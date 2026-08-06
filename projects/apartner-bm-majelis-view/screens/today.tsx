'use client'

// Tugas — the BM's day, and it is two cards long.
//
// The BP direction opens on a list of field stops: majelis, doorsteps,
// sosialisasi, the cash that leaves her hands at the end. None of that is the
// BM's work. Hers is the pair of briefings that BRACKET the day — she opens the
// branch with the BPs at the Amartha Point in the morning and closes it with
// them in the evening — so the page is that pair and nothing else.
//
// The field tasks are removed rather than hidden: a day that shows a BM eight
// stops she is not riding to is a day that reads as somebody else's.
//
// Both cards open a page that is deliberately empty for now. What a briefing
// actually contains is the next question, and drawing a guess at it here would
// answer it before it is asked.

import { Badge } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { BRIEFINGS, findDay, kmShort, type Briefing } from '../lib/schedule'
import { IconInbox } from '../lib/icons'
import { unreadComms, useApp } from '../lib/store'
import { TabBar } from '../lib/tabs'
import { AppScreen, HeaderAction, Overline } from '../lib/ui'

export function TodayScreen() {
  const flow = useFlow()
  const s = useApp()
  const day = findDay(s.day)

  // Two lines, so this is a project-local header rather than the 48px TopBar
  // primitive: the date leads and what the day holds is its subtitle.
  const header = (
    <header className="flex shrink-0 items-center gap-8 bg-neutral-white px-16 py-8">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-16 font-bold text-default">{day.date}</span>
        <span className="text-12 font-regular text-caption">{BRIEFINGS.length} tugas hari ini</span>
      </div>
      <HeaderAction label="Kotak masuk" count={unreadComms(s)} onClick={() => flow.go('comms')}>
        <IconInbox size={20} />
      </HeaderAction>
    </header>
  )

  return (
    <AppScreen topBar={header}>
      <Overline>Belum selesai</Overline>
      <div className="flex flex-col gap-8 pb-16">
        {BRIEFINGS.map((briefing) => (
          <BriefingRow
            key={briefing.id}
            briefing={briefing}
            onOpen={() => flow.go(briefing.screen)}
          />
        ))}
      </div>

      <TabBar active="today" />
    </AppScreen>
  )
}

/**
 * The task card, kept in the shape the BP direction uses — the 40px code tile,
 * then title-and-time over the address, then the labels — so the two apps read
 * as one app seen from two chairs.
 *
 * The title carries the clock rather than a separate meta line above it: a
 * briefing is one appointment at one time, and splitting "Morning briefing" from
 * "08.00" across two lines made the card ask to be read twice.
 */
function BriefingRow({ briefing, onOpen }: { briefing: Briefing; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-12 rounded-12 border border-default bg-neutral-white p-12 text-left active:bg-neutral-50"
    >
      <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-primary-50 text-12 font-bold text-primary-500">
        {briefing.code}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <span className="flex items-center gap-8">
          <span className="min-w-0 flex-1 text-16 font-bold text-default">
            {briefing.title} · {briefing.time}
          </span>
          {/* Every briefing starts the day unstarted. The status stays on the
              card because it is the column the BM skims — which of the two she
              still owes — even when there are only two rows to skim. */}
          <span className="flex shrink-0">
            <Badge intent="neutral">Belum mulai</Badge>
          </span>
        </span>
        <span className="line-clamp-2 text-14 font-regular text-default">{briefing.place}</span>
        <span className="flex flex-wrap items-center gap-4 pt-2">
          <Badge intent="neutral">{kmShort(briefing.distanceKm)}</Badge>
        </span>
      </div>
    </button>
  )
}
