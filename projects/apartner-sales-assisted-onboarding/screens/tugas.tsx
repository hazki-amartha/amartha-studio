'use client'

// Tugas — the BP's task page (the "Tugas" bottom-nav tab). Structured after the
// A-Partner BP New Concept schedule: a colour-coded tile per task, a section
// heading, and one card per task. This prototype's Tugas page carries the
// Group Formation tasks — a new majelis whose members have cleared underwriting,
// waiting for its first MV.
//
// Tapping a task asks the gate question first ("Semua calon mitra sudah
// berkumpul?"): yes opens the formation wizard; not yet reschedules the task to
// next week, the same shape as a skipped visit on the reference schedule.

import { useState } from 'react'
import { Badge, BottomSheet, Button, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { dateFromToday } from '../lib/pipeline'
import {
  GROUP_FORMATION_TASKS,
  groupTaskStore,
  useGroupTasks,
  type GroupFormationTask,
} from '../lib/group-tasks'
import { setFormation } from '../lib/formation'
import { TabBar } from '../lib/tabs'
import { AppScreen, EmptyState, VisitTitle } from '../lib/ui'

/** The task tile — the "GF" code for group formation, like the schedule's codes. */
function KindTile() {
  return (
    <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-primary-50 text-12 font-bold text-primary-500">
      GF
    </span>
  )
}

function GroupTaskCard({
  task,
  rescheduledTo,
  onOpen,
}: {
  task: GroupFormationTask
  /** Set once the task was skipped — the next-week date it moved to. */
  rescheduledTo?: string
  onOpen: () => void
}) {
  const body = (
    <>
      <KindTile />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <span className="flex items-center gap-8">
          <span className="min-w-0 flex-1 truncate text-14 font-regular text-caption">
            Group Formation · {task.time}
          </span>
          {rescheduledTo ? (
            <Badge intent="neutral">Dijadwalkan ulang</Badge>
          ) : (
            <Badge intent="orange">Belum mulai</Badge>
          )}
        </span>
        <span className="text-16 font-bold text-default">Majelis {task.majelisName}</span>
        {rescheduledTo ? (
          <span className="text-12 font-regular text-caption">Dipindah ke {rescheduledTo}</span>
        ) : null}
      </div>
    </>
  )

  if (rescheduledTo) {
    return (
      <div className="flex w-full items-start gap-12 rounded-12 border border-dashed border-default bg-neutral-white p-12">
        {body}
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-12 rounded-12 border border-default bg-neutral-white p-12 text-left active:bg-neutral-50"
    >
      {body}
    </button>
  )
}

export function TugasScreen() {
  const flow = useFlow()
  const { rescheduled } = useGroupTasks()
  const tasks = GROUP_FORMATION_TASKS
  const [gate, setGate] = useState<GroupFormationTask | null>(null)

  function startActivation(task: GroupFormationTask) {
    setGate(null)
    setFormation({ mode: 'form', majelisName: `Majelis ${task.majelisName}`, memberCount: task.memberCount })
    flow.go('group-formation')
  }

  function skipTask(task: GroupFormationTask) {
    setGate(null)
    groupTaskStore.reschedule(task.id, dateFromToday(7))
  }

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          hideBack
          title={<VisitTitle title="Tugas hari ini" when={`${tasks.length} tugas`} />}
        />
      }
    >
      {tasks.length === 0 ? (
        <EmptyState title="Tidak ada tugas" body="Belum ada tugas hari ini." />
      ) : (
        <div className="flex flex-col gap-8">
          <span className="pt-4 text-16 font-bold text-default">Pembentukan Majelis</span>
          {tasks.map((task) => (
            <GroupTaskCard
              key={task.id}
              task={task}
              rescheduledTo={rescheduled[task.id]}
              onOpen={() => setGate(task)}
            />
          ))}
        </div>
      )}

      {/* The gate: is the group actually here? */}
      <BottomSheet
        open={Boolean(gate)}
        onClose={() => setGate(null)}
        title="Semua calon mitra sudah berkumpul?"
      >
        <div className="flex flex-col gap-8">
          <Button size="lg" className="w-full" onClick={() => gate && startActivation(gate)}>
            Ya, mulai aktifkan majelis
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => gate && skipTask(gate)}
          >
            Belum, lewati tugas
          </Button>
          <span className="text-center text-12 text-caption">
            Tugas akan dijadwalkan ulang otomatis ke minggu depan.
          </span>
        </div>
      </BottomSheet>

      <TabBar active="today" />
    </AppScreen>
  )
}
