'use client'

// Jadwal — the entry screen. One question: what do I do now?
//
// Ported from `apartner-task-first`, and the port is the point: the two
// directions now share an L0 so what is being compared is the pelayanan itself,
// not the way in to it. What changes here is where "Mulai Pelayanan" LANDS.
//
// In task-first the button opens step 1, which asks attendance and payment on
// one card. Here it opens Kunjungan 1 — Kehadiran directly: the roster screen
// this direction is named after is deliberately NOT in the way. The BP who was
// sent here by the schedule already knows which group she is standing in front
// of; making her read the roster first would be a page between her and the work.
// The roster keeps its own way in — the Majelis tab — where it answers a
// question ("who is in this group?") rather than delaying one.

import { useState } from 'react'
import { Badge, BottomSheet, Button, Card } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { DAYS, TASKS, TOMORROW_TASKS, findDay, type Task } from '../lib/schedule'
import {
  IconBell,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconInbox,
  IconPin,
  IconUsers,
} from '../lib/icons'
import { doneTaskList, laterTasks, nowTask, store, useApp } from '../lib/store'
import { TabBar } from '../lib/tabs'
import { AgendaRow, Collapsible, HeaderAction, IconTile, Overline } from '../lib/ui'

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
  const done = doneTaskList(s)
  const day = findDay(s.day)

  const subtitle =
    s.day === 'tomorrow'
      ? `${TOMORROW_TASKS.length} pelayanan terjadwal`
      : `${done.length} dari ${TASKS.length} selesai`

  // Straight into stage 1. The task id rides along so submitting the recap
  // closes this row rather than leaving a finished pelayanan on the day.
  function start(task: Task) {
    store.startVisit(task.id)
    flow.go('attendance')
  }

  // Two lines, so this is a project-local header rather than the 48px TopBar
  // primitive: the date is the tappable thing (it opens the day switcher) and
  // the progress count is its subtitle. Inbox and the bell are separate icons
  // because they are separate senders — the business talking TO the BP, and the
  // system reporting what happened.
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
  // the day's shape on the same clock rail.
  if (s.day === 'tomorrow') {
    return (
      <Screen topBar={header}>
        <Overline>Jadwal besok</Overline>
        <div className="flex flex-col gap-8">
          {TOMORROW_TASKS.map((task) => (
            <AgendaRow key={task.id} time={task.time}>
              <Card>
                <div className="flex items-center gap-12">
                  <IconTile tint="primary">
                    <IconUsers size={20} />
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
      {/* --- Sekarang: the only card that grows a button. */}
      {now ? (
        <>
          <Overline>Sekarang</Overline>
          <AgendaRow time={now.time} until={now.until}>
            <Card>
              <div className="flex flex-col gap-12">
                <div className="flex items-start gap-12">
                  <IconTile tint="primary">
                    <IconUsers size={20} />
                  </IconTile>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex">
                      <Badge intent="primary">Kunjungan Majelis</Badge>
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
                    for the BP — she never derives it from a dashboard. */}
                <div className="rounded-8 bg-neutral-50 px-12 py-8 text-12 text-default">
                  {now.reason}
                </div>

                <Button size="md" className="w-full" onClick={() => start(now)}>
                  Mulai Pelayanan
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
              Semua {done.length} pelayanan sudah dituntaskan. Sampai jumpa besok.
            </span>
          </div>
        </Card>
      )}

      {/* --- Berikutnya: a light timeline, but every row can launch its own
          pelayanan. The day advances by itself, yet a BP whose plan slips can
          start the group in front of her without draining the queue in clock
          order first. The chevron is the tappable tell. */}
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
                  <IconTile tint="primary">
                    <IconUsers size={20} />
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

      {/* --- Sudah selesai: out of the way. */}
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
