'use client'

// The schedule. One question: what do I do now?
//
// The answer is a single card with a single button. Everything else on the
// screen is deliberately not actionable — later tasks are a timeline the BP
// reads, not a list they choose from, and finished tasks collapse away. There
// is no KPI, no progress ring, and no collection total: nothing here asks the
// BP to synthesise a number before they can move.

import { Badge, Button, Card } from '@/design-system/components'
import { Screen, TopBar } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { TASKS, type Task } from '../lib/data'
import { IconCheck, IconHome, IconPin, IconUsers } from '../lib/icons'
import { doneTasks, laterTasks, nowTask, store, useApp } from '../lib/store'
import { Collapsible, IconTile, Overline } from '../lib/ui'

function KindIcon({ kind }: { kind: Task['kind'] }) {
  return kind === 'majelis' ? <IconUsers size={20} /> : <IconHome size={20} />
}

const kindLabel = (kind: Task['kind']) => (kind === 'majelis' ? 'Kunjungan Majelis' : 'Home Visit')

export function TodayScreen() {
  const flow = useFlow()
  const s = useApp()
  const now = nowTask(s)
  const later = laterTasks(s)
  const done = doneTasks(s)

  function start(task: Task) {
    if (!task.majelisId) return
    store.openVisit(task.majelisId)
    flow.go('majelis-visit')
  }

  const header = (
    <TopBar>
      <span className="flex-1">Selasa, 21 Juli</span>
      <span className="text-12 font-regular text-caption">
        {done.length} dari {TASKS.length} selesai
      </span>
    </TopBar>
  )

  return (
    <Screen topBar={header}>
      {/* --- Now: the only actionable thing on the screen. */}
      {now ? (
        <>
          <Overline>Sekarang</Overline>
          <Card>
            <div className="flex flex-col gap-12">
              <div className="flex items-start gap-12">
                <IconTile tint={now.kind === 'majelis' ? 'primary' : 'red'}>
                  <KindIcon kind={now.kind} />
                </IconTile>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center gap-8">
                    <span className="text-12 font-bold text-caption">
                      {now.time} – {now.until}
                    </span>
                    <Badge intent={now.kind === 'majelis' ? 'primary' : 'red'}>
                      {kindLabel(now.kind)}
                    </Badge>
                  </div>
                  <span className="text-20 font-bold text-default">{now.title}</span>
                  <span className="flex items-center gap-4 text-12 text-caption">
                    <IconPin size={16} />
                    {now.place}
                  </span>
                </div>
              </div>

              {/* The one line that says why this task exists. Already reasoned
                  for the BP — they never derive it from a dashboard. */}
              <div className="rounded-8 bg-neutral-50 px-12 py-8 text-12 text-default">
                {now.reason}
              </div>

              {now.majelisId ? (
                <Button size="lg" className="w-full" onClick={() => start(now)}>
                  Mulai Kunjungan
                </Button>
              ) : (
                <Button size="lg" className="w-full" disabled>
                  Mulai Kunjungan
                </Button>
              )}
            </div>
          </Card>
        </>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-8 py-24 text-center">
            <span className="text-20 font-bold text-default">Tugas hari ini selesai</span>
            <span className="text-12 text-caption">
              Semua {TASKS.length} kunjungan sudah dituntaskan. Sampai jumpa besok.
            </span>
          </div>
        </Card>
      )}

      {/* --- Later: a timeline to read, not a list to choose from. */}
      {later.length > 0 ? (
        <>
          <Overline>Berikutnya</Overline>
          <div className="flex flex-col gap-8">
            {later.map((task) => (
              <div key={task.id} className="flex items-center gap-12 rounded-12 bg-neutral-white p-12">
                <span className="w-40 shrink-0 text-12 font-bold text-caption">{task.time}</span>
                <span className="text-disabled">
                  <KindIcon kind={task.kind} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-14 font-bold text-default">{task.title}</span>
                  <span className="truncate text-12 text-caption">{task.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* --- Done: out of the way. */}
      {done.length > 0 ? (
        <Collapsible title="Sudah selesai" hint={`${done.length} tugas`}>
          {done.map((task) => (
            <div key={task.id} className="flex items-center gap-12">
              <span className="w-40 shrink-0 text-12 text-disabled">{task.time}</span>
              <span className="flex-1 text-14 text-caption line-through">{task.title}</span>
              <Badge intent="green" leadingIcon={<IconCheck size={16} />}>
                Selesai
              </Badge>
            </div>
          ))}
        </Collapsible>
      ) : null}

      <div className="pb-16" />
    </Screen>
  )
}
