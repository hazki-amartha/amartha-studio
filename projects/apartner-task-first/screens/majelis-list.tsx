'use client'

// The Majelis tab — every group the BP carries, not just today's.
//
// This is the one thing the schedule genuinely cannot do. "Open the app, see
// the next thing to do" answers "what now?", but a BP also gets asked "kapan
// majelis Anggrek?" by a BM, or needs to reach a group whose visit was moved.
// Without this tab the only way to a majelis is to wait for it to come up on
// the schedule, which is not how a week actually goes.
//
// It stays a DIRECTORY, not a dashboard: what a group is, when it meets, and
// the one number worth carrying (how many mitra are behind). No portfolio
// percentages — those are BM monitoring numbers, and keeping them off the BP's
// surfaces is a standing decision in this direction, not an oversight here.

import { Badge, Card } from '@/design-system/components'
import { Screen, TopBar } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MAJELIS_DIRECTORY, TASKS } from '../lib/data'
import { IconChevronRight, IconPin } from '../lib/icons'
import { store, useApp } from '../lib/store'
import { TabBar } from '../lib/tabs'
import { Overline } from '../lib/ui'

// Which groups the schedule is already sending her to today. They sort first —
// the tab does not compete with the schedule, it agrees with it.
const TODAY_IDS = TASKS.filter((t) => t.majelisId).map((t) => t.majelisId)

export function MajelisListScreen() {
  const flow = useFlow()
  const s = useApp()

  const today = MAJELIS_DIRECTORY.filter((m) => TODAY_IDS.includes(m.id))
  const rest = MAJELIS_DIRECTORY.filter((m) => !TODAY_IDS.includes(m.id))

  function open(id: string) {
    store.openVisit(id)
    flow.go('majelis-visit')
  }

  function Row({ id }: { id: string }) {
    const m = MAJELIS_DIRECTORY.find((x) => x.id === id)
    if (!m) return null
    const task = TASKS.find((t) => t.majelisId === m.id)
    const done = task ? s.doneTasks.includes(task.id) : false

    return (
      <button
        type="button"
        onClick={() => open(m.id)}
        className="flex items-center gap-12 rounded-12 bg-neutral-white p-12 text-left active:bg-neutral-50"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-8">
            <span className="truncate text-14 font-bold text-default">{m.name}</span>
            {done ? <Badge intent="green">Selesai</Badge> : null}
          </div>
          <span className="flex items-center gap-4 text-12 text-caption">
            <IconPin size={16} />
            <span className="truncate">{m.place}</span>
          </span>
          <span className="text-12 text-caption">
            {m.day}, {m.time} · {m.members} mitra
          </span>
        </div>
        {m.menunggak > 0 ? (
          <Badge intent="orange">{m.menunggak} menunggak</Badge>
        ) : (
          <Badge intent="green">Lancar</Badge>
        )}
        <span className="shrink-0 text-disabled">
          <IconChevronRight size={20} />
        </span>
      </button>
    )
  }

  return (
    <Screen
      topBar={
        <TopBar>
          <span className="flex-1">Majelis</span>
          <span className="text-12 font-regular text-caption">
            {MAJELIS_DIRECTORY.length} majelis
          </span>
        </TopBar>
      }
    >
      <Overline>Hari ini</Overline>
      <div className="flex flex-col gap-8">
        {today.map((m) => (
          <Row key={m.id} id={m.id} />
        ))}
      </div>

      <Overline>Majelis lain</Overline>
      <div className="flex flex-col gap-8">
        {rest.map((m) => (
          <Row key={m.id} id={m.id} />
        ))}
      </div>

      {/* Honest about the prototype's edges rather than faking five rosters. */}
      <Card className="border-dashed">
        <p className="text-12 text-caption">
          Di prototipe ini hanya Majelis Mawar yang punya daftar mitra lengkap.
        </p>
      </Card>

      <TabBar active="majelis-list" />
    </Screen>
  )
}
