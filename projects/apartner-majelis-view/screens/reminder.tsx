'use client'

// Ingatkan Majelis — the morning message out to every group meeting today.
//
// It is one task, not one per majelis. A BP sends these in a single sitting
// before she leaves the house, so a schedule that listed three reminder rows
// would be three rows she ticks in ten seconds and then re-reads all day.
//
// The app does not send. It writes the message and she pastes it into the
// group herself, exactly as the visit recap does — WhatsApp owns the send, and
// a prototype that really opened it would throw the viewer out of the device
// frame with no way back (CLAUDE.md §3).
//
// Which groups appear is DERIVED from today's schedule (`todayMajelisTasks`)
// rather than listed here. The reminder is a fact about the day, and a
// second hand-maintained list of "who meets today" is the kind that quietly
// stops matching the agenda above it.
//
// Each group carries its own TICK, held in the store rather than in this
// screen. It is a record she comes back to: two groups messaged before she
// rides out, the third at 11.00 when the ketua finally answers. Screens
// remount on navigation, so a local tick would greet her with a clean slate
// and no way to tell which group she still owes.

import { Badge, Button, NavigationHeader } from '@/design-system/components'
import { CheckCircleFill, Copy } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { findMajelisEntry, todayMajelisTasks, type Task } from '../lib/schedule'
import { store, useApp } from '../lib/store'
import { AppScreen, SectionTitle, StickyBar } from '../lib/ui'

/** What she pastes. Derived per group so the time and place are the real ones. */
function messageFor(task: Task): string {
  const group = findMajelisEntry(task.majelisId ?? 'mawar')
  return [
    `Assalamualaikum Ibu-ibu ${group.name} 🙏`,
    ``,
    `Pengingat: hari ini ada kumpulan pukul ${task.time} di ${task.place}.`,
    ``,
    `Mohon hadir tepat waktu dan siapkan angsuran minggu ini.`,
    ``,
    `Terima kasih.`,
  ].join('\n')
}

export function ReminderScreen() {
  const flow = useFlow()
  const s = useApp()
  const tasks = todayMajelisTasks()

  const doneCount = tasks.filter((t) => s.remindedTasks.includes(t.id)).length
  const left = tasks.length - doneCount

  function finish() {
    store.finishTask()
    flow.go('today')
  }

  return (
    <AppScreen
      topBar={<NavigationHeader title="Ingatkan majelis" onBack={() => flow.back()} />}
    >
      <p className="text-12 text-caption">
        {tasks.length} majelis ada kumpulan hari ini. Salin pesannya, tempel di grup WhatsApp
        masing-masing, lalu tandai yang sudah diingatkan.
      </p>

      {/* The count as a heading, so she can answer "who do I still owe?" without
          reading three cards. */}
      <SectionTitle>
        Grup hari ini · {doneCount}/{tasks.length} diingatkan
      </SectionTitle>

      <div className="flex flex-col gap-8">
        {tasks.map((task) => {
          const group = findMajelisEntry(task.majelisId ?? 'mawar')
          const done = s.remindedTasks.includes(task.id)
          return (
            <div
              key={task.id}
              className={`flex flex-col gap-12 rounded-12 border bg-neutral-white p-12 ${
                done ? 'border-green-200' : 'border-default'
              }`}
            >
              <div className="flex items-start gap-8">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="text-14 font-bold text-default">{group.name}</span>
                  <span className="text-12 text-caption">
                    Kumpulan {task.time} · {task.place}
                  </span>
                </div>
                {done ? <Badge intent="green">Sudah diingatkan</Badge> : null}
              </div>

              <p className="whitespace-pre-line rounded-8 bg-neutral-50 p-12 text-12 text-default">
                {messageFor(task)}
              </p>

              {/* Copy and tick are two separate gestures on purpose. Copying is
                  not evidence she SENT it — she still has to switch apps and
                  paste — so the app must not tick the row on her behalf and
                  then be wrong about a group that never got the message. */}
              <div className="flex items-center gap-8">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigator.clipboard?.writeText(messageFor(task))}
                >
                  <span className="flex items-center justify-center gap-8">
                    <Copy size={20} />
                    Salin pesan
                  </span>
                </Button>
                <button
                  type="button"
                  onClick={() => store.toggleReminded(task.id)}
                  aria-pressed={done}
                  className={`flex shrink-0 items-center gap-8 rounded-full border px-12 py-8 text-12 font-bold ${
                    done
                      ? 'border-green-200 bg-green-50 text-green-500'
                      : 'border-default text-caption'
                  }`}
                >
                  <CheckCircleFill size={20} />
                  {done ? 'Sudah' : 'Tandai'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <StickyBar>
        {/* The task does not close until every group is ticked. It is the same
            gate the attendance register runs on, and for the same reason: this
            is a record other people rely on — a majelis that never got its
            message and a majelis nobody ticked read identically afterwards, so
            the app refuses to call the job done while one is unaccounted for.
            The tick is hers to give; she can mark a group she messaged from
            her own phone, so the gate never blocks work she has actually done. */}
        <Button size="lg" className="w-full" onClick={finish} disabled={left > 0}>
          Selesai
        </Button>
        {left > 0 ? (
          <p className="text-center text-12 text-caption">
            Tandai {left} grup lagi untuk menyelesaikan tugas ini
          </p>
        ) : null}
      </StickyBar>
    </AppScreen>
  )
}
