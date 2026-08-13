'use client'

// Ingatkan Majelis — the morning message out to every group meeting today.
//
// It is one task, not one per majelis. A BP sends these in a single sitting
// before she leaves the house, so a schedule that listed three reminder rows
// would be three rows she ticks in ten seconds and then re-reads all day.
//
// "Kirim ke WhatsApp" REALLY opens WhatsApp, with the message prefilled. It is
// the one integration in this prototype and it is here because it was asked for
// in words, which is the only bar CLAUDE.md §3 accepts. The cost is real: it
// leaves the device frame, and on a laptop with no WhatsApp it does nothing.
//
// Handing the text off is not the same as sending it, so it does NOT tick the
// row — she still picks a chat and presses send in another app, and may back
// out. The tick stays hers, which is also what lets her mark a group she
// messaged before opening the app.
//
// Which groups appear is DERIVED from today's schedule (`todayTasks`) rather
// than listed here. The reminder is a fact about the day, and a second
// hand-maintained list of "who meets today" is the kind that quietly stops
// matching the agenda above it. That list is the day's PLATE, so a pelayanan
// moved to another day or skipped drops off the reminder by itself — it also
// stops that group's tick from being the one thing standing between the BP and
// closing a day whose kumpulan is no longer happening.
//
// Each group carries its own TICK, held in the store rather than in this
// screen. It is a record she comes back to: two groups messaged before she
// rides out, the third at 11.00 when the ketua finally answers. Screens
// remount on navigation, so a local tick would greet her with a clean slate
// and no way to tell which group she still owes.

import { Badge, Button, NavigationHeader } from '@/design-system/components'
import { CheckCircleFill, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { REMINDER_TASK_ID, findMajelisEntry, type Task } from '../lib/schedule'
import { store, todayTasks, useApp } from '../lib/store'
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
  const tasks = todayTasks(s).filter((t) => t.kind === 'majelis')

  const doneCount = tasks.filter((t) => s.remindedTasks.includes(t.id)).length
  const left = tasks.length - doneCount

  function finish() {
    // The reminder task by id, never `activeTask`'s fallback: opened from
    // anywhere but the schedule row there is no active task, and finishTask's
    // fallback would close a MAJELIS visit instead of this.
    store.finishTask(s.activeTask ?? REMINDER_TASK_ID)
    flow.go('today')
  }

  return (
    <AppScreen
      topBar={<NavigationHeader title="Ingatkan majelis" onBack={() => flow.back()} />}
    >
      <p className="text-12 text-caption">
        {tasks.length} majelis ada kumpulan hari ini. Kirim ke grup masing-masing lewat
        WhatsApp, lalu tandai yang sudah diingatkan.
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

              {/* The one place in this prototype that really leaves it.
                  `wa.me` hands WhatsApp the message already written and lets
                  her pick the chat — asked for in words, which is the only bar
                  CLAUDE.md §3 accepts for wiring a real integration.

                  It does NOT tick the row. Handing the text to WhatsApp is not
                  evidence it was sent: she still picks a chat and presses send
                  in another app, and she may well back out. The tick stays
                  hers, so the register records what she did rather than what
                  the app handed off. */}
              <div className="flex items-center gap-8">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(messageFor(task))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ds-btn ds-btn-outline flex-1"
                >
                  <span className="flex items-center justify-center gap-8">
                    <WhatsappLogo size={20} />
                    Kirim ke WhatsApp
                  </span>
                </a>
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
