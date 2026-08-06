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
        <span className="text-12 font-regular text-caption">
          {s.doneBriefings.length} dari {BRIEFINGS.length} selesai
        </span>
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
            done={s.doneBriefings.includes(briefing.id)}
            onOpen={() => flow.go(briefing.screen)}
          />
        ))}
      </div>

      <TabBar active="today" />
    </AppScreen>
  )
}

/**
 * The task card, in exactly the shape the BP direction uses: the 40px code
 * tile, then a caption line carrying the kind and the clock with the state
 * pinned to its right, then the name at reading size, the place, and the
 * labels. Same four sizes in the same order, so the two apps read as one app
 * seen from two chairs.
 *
 * The kind and the name are the same two words here, which they are not on a
 * BP's card — "Majelis Visit · 08.00" over "Majelis Mawar". That is what a
 * briefing IS: the appointment and the thing being done have one name.
 */
function BriefingRow({
  briefing,
  done,
  onOpen,
}: {
  briefing: Briefing
  done: boolean
  onOpen: () => void
}) {
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
          <span className="min-w-0 flex-1 truncate text-14 font-regular text-caption">
            {briefing.title} · {briefing.time}
          </span>
          {/* The status is the column the BM skims — which of the two she
              still owes — even when there are only two rows to skim. Blue for
              Selesai, matching the BP app: green is this app's colour for
              settled, and a closed briefing settles nothing. */}
          <span className="flex shrink-0">
            <Badge intent={done ? 'blue' : 'neutral'}>{done ? 'Selesai' : 'Belum mulai'}</Badge>
          </span>
        </span>
        <span className="text-16 font-bold text-default">{briefing.name}</span>
        <span className="line-clamp-2 text-14 font-regular text-default">{briefing.place}</span>
        <span className="flex flex-wrap items-center gap-4 pt-2">
          <Badge intent="neutral">{kmShort(briefing.distanceKm)}</Badge>
        </span>
      </div>
    </button>
  )
}
