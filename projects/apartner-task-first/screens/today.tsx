'use client'

// The schedule. One question: what do I do now?
//
// The answer is a single card with a single button. Everything else on the
// screen is deliberately not actionable — later tasks are a timeline the BP
// reads, not a list they choose from, and finished tasks collapse away. There
// is no KPI, no progress ring, and no collection total: nothing here asks the
// BP to synthesise a number before they can move.

import { useState } from 'react'
import { Badge, BottomSheet, Button, Card } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { DAYS, TASKS, TOMORROW_TASKS, findDay, type Task } from '../lib/data'
import {
  IconBell,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconHome,
  IconInbox,
  IconPin,
  IconUsers,
} from '../lib/icons'
import { doneTasks, laterTasks, nowTask, store, useApp } from '../lib/store'
import { TabBar } from '../lib/tabs'
import { AgendaRow, Collapsible, HeaderAction, IconTile, Overline } from '../lib/ui'

function KindIcon({ kind }: { kind: Task['kind'] }) {
  return kind === 'majelis' ? <IconUsers size={20} /> : <IconHome size={20} />
}

const kindLabel = (kind: Task['kind']) => (kind === 'majelis' ? 'Kunjungan Majelis' : 'Home Visit')

/**
 * The day switcher. Two options, so a sheet rather than a floating menu: the
 * date lives in a top bar the Screen pins, and a popover anchored inside pinned
 * chrome fights the frame's clipping for no benefit at this size.
 */
function DayPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp()
  return (
    <BottomSheet open={open} onClose={onClose} title="Pilih tanggal">
      <div className="flex flex-col gap-8">
        {DAYS.map((d) => {
          const active = d.key === s.day
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => {
                store.setDay(d.key)
                onClose()
              }}
              className={`flex items-center gap-12 rounded-12 border p-12 text-left ${
                active ? 'border-primary-500 bg-primary-50' : 'border-default bg-neutral-white'
              }`}
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-14 font-bold text-default">{d.label}</span>
                <span className="text-12 text-caption">{d.date}</span>
              </div>
              {active ? (
                <span className="shrink-0 text-primary-500">
                  <IconCheck size={20} />
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </BottomSheet>
  )
}

export function TodayScreen() {
  const flow = useFlow()
  const s = useApp()
  const [picking, setPicking] = useState(false)
  const now = nowTask(s)
  const later = laterTasks(s)
  const done = doneTasks(s)
  const day = findDay(s.day)

  const subtitle =
    s.day === 'tomorrow'
      ? `${TOMORROW_TASKS.length} kunjungan terjadwal`
      : `${done.length} dari ${TASKS.length} selesai`

  function start(task: Task) {
    if (task.kind === 'majelis' && task.majelisId) {
      store.openVisit(task.majelisId)
      flow.go('majelis-visit')
    } else if (task.kind === 'home-visit') {
      store.openHomeVisit(task.id)
      flow.go('home-visit')
    }
  }

  // The day, then the two things that arrive from outside the schedule. They
  // are separate icons because they are separate senders: Inbox is the business
  // talking TO the BP (announcements, priority updates) and can wait; the bell
  // is the system reporting what happened (a majelis paid up), and is read at a
  // glance. Merging them would put an announcement and a settled repayment in
  // one queue, where the announcement always loses.
  //
  // Two lines, so this is a project-local header rather than the 48px TopBar
  // primitive: the date is the tappable thing (it opens the day switcher) and
  // the progress count is its subtitle. Stacking them keeps the count attached
  // to the day it counts — switch to besok and it becomes a task count, because
  // nothing on tomorrow is finished yet.
  const header = (
    <header className="flex shrink-0 items-center gap-8 bg-neutral-white px-16 py-8">
      <button
        type="button"
        onClick={() => setPicking(true)}
        aria-label={`Ganti tanggal — sekarang ${day.date}`}
        className="flex min-w-0 flex-1 flex-col text-left"
      >
        <span className="flex items-center gap-4">
          <span className="truncate text-16 font-bold text-default">{day.date}</span>
          <span className="shrink-0 text-caption">
            <IconChevronDown size={16} />
          </span>
        </span>
        <span className="text-12 font-regular text-caption">{subtitle}</span>
      </button>
      <HeaderAction label="Kotak masuk" count={2} onClick={() => {}}>
        <IconInbox size={20} />
      </HeaderAction>
      <HeaderAction label="Notifikasi" count={5} onClick={() => {}}>
        <IconBell size={20} />
      </HeaderAction>
    </header>
  )

  // --- Besok: a preview, not a workspace. No focus card, no launchers — just
  // the day's shape on the same clock rail, so "what am I riding to first
  // tomorrow?" is answerable without pretending the day has started.
  if (s.day === 'tomorrow') {
    return (
      <Screen topBar={header}>
        <Overline>Jadwal besok</Overline>
        <div className="flex flex-col gap-8">
          {TOMORROW_TASKS.map((task) => (
            <AgendaRow key={task.id} time={task.time}>
              <Card>
                <div className="flex items-center gap-12">
                  <IconTile tint={task.kind === 'majelis' ? 'primary' : 'red'}>
                    <KindIcon kind={task.kind} />
                  </IconTile>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-14 font-bold text-default">{task.title}</span>
                    <span className="flex items-center gap-4 text-12 text-caption">
                      <span className="shrink-0">
                        <IconPin size={16} />
                      </span>
                      <span className="truncate">{task.place}</span>
                    </span>
                  </div>
                </div>
              </Card>
            </AgendaRow>
          ))}
        </div>
        <DayPicker open={picking} onClose={() => setPicking(false)} />
        <TabBar active="today" />
      </Screen>
    )
  }

  return (
    <Screen topBar={header}>
      {/* --- Now: the only actionable thing on the screen. */}
      {now ? (
        <>
          <Overline>Sekarang</Overline>
          {/* Same skeleton as a Berikutnya row — gutter time, then a card that
              opens with the tinted kind icon. The focus card differs only by
              growing downward: place, reason, button. Nothing moves sideways
              between the two states, so the eye keeps its anchors. */}
          <AgendaRow time={now.time} until={now.until}>
            <Card>
              <div className="flex flex-col gap-12">
                <div className="flex items-start gap-12">
                  <IconTile tint={now.kind === 'majelis' ? 'primary' : 'red'}>
                    <KindIcon kind={now.kind} />
                  </IconTile>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex">
                      <Badge intent={now.kind === 'majelis' ? 'primary' : 'red'}>
                        {kindLabel(now.kind)}
                      </Badge>
                    </div>
                    <span className="text-18 font-bold text-default">{now.title}</span>
                    <span className="flex items-start gap-4 text-12 text-caption">
                      <span className="shrink-0">
                        <IconPin size={16} />
                      </span>
                      {now.place}
                    </span>
                  </div>
                </div>

                {/* The one line that says why this task exists. Already reasoned
                    for the BP — they never derive it from a dashboard. */}
                <div className="rounded-8 bg-neutral-50 px-12 py-8 text-12 text-default">
                  {now.reason}
                </div>

                <Button size="md" className="w-full" onClick={() => start(now)}>
                  Mulai Kunjungan
                </Button>
              </div>
            </Card>
          </AgendaRow>
        </>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-8 py-24 text-center">
            <span className="text-20 font-bold text-default">Tugas hari ini selesai</span>
            <span className="text-12 text-caption">
              Semua {done.length} kunjungan sudah dituntaskan. Sampai jumpa besok.
            </span>
          </div>
        </Card>
      )}

      {/* --- Later: still a lightweight timeline — no KPIs, no filters — but
          each row can launch its own visit directly. The schedule still
          advances by itself, yet a BP whose plan slips (mitra is home now, a
          majelis moved) can start the task in front of them without draining
          the queue in clock order first. The chevron is the tappable tell. */}
      {later.length > 0 ? (
        <>
          <Overline>Berikutnya</Overline>
          <div className="flex flex-col gap-8">
            {later.map((task) => (
              <AgendaRow key={task.id} time={task.time}>
                <button
                  type="button"
                  onClick={() => start(task)}
                  className="flex w-full items-center gap-12 rounded-12 bg-neutral-white p-12 text-left active:bg-neutral-50"
                >
                  {/* Same tinted tile, same first position as the focus card.
                      With the time gone from inside the card, the icon is what
                      tells a majelis from a home visit at a glance. */}
                  <IconTile tint={task.kind === 'majelis' ? 'primary' : 'red'}>
                    <KindIcon kind={task.kind} />
                  </IconTile>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-14 font-bold text-default">{task.title}</span>
                    <span className="truncate text-12 text-caption">{task.reason}</span>
                  </div>
                  <span className="shrink-0 text-disabled">
                    <IconChevronRight size={20} />
                  </span>
                </button>
              </AgendaRow>
            ))}
          </div>
        </>
      ) : null}

      {/* --- Done: out of the way. */}
      {done.length > 0 ? (
        <Collapsible title="Sudah selesai" hint={`${done.length} tugas`}>
          {done.map((task) => (
            <div key={task.id} className="flex items-center gap-8">
              {/* Right-aligned in the same 40px column as the live agenda's
                  gutter, so the clock rail runs unbroken through the day. */}
              <span className="w-40 shrink-0 text-right text-12 text-disabled">{task.time}</span>
              <span className="flex-1 text-14 text-caption line-through">{task.title}</span>
              <Badge intent="green" leadingIcon={<IconCheck size={16} />}>
                Selesai
              </Badge>
            </div>
          ))}
        </Collapsible>
      ) : null}

      <DayPicker open={picking} onClose={() => setPicking(false)} />
      <TabBar active="today" />
    </Screen>
  )
}
