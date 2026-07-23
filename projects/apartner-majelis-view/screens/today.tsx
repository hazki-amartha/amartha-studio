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
//
// Every row on this page starts its task. Berikutnya used to open the RECORD
// instead — a roster for a majelis, her page for a home visit — on the argument
// that looking ahead should not be the same gesture as clocking in. Reverted:
// a day does not run in clock order. She arrives early, a group is late, the
// 13.00 door is on the way back from the 10.00 balai. A schedule that only ever
// hands her the top row makes the app disagree with the road, and the work she
// actually wants to start sits behind a screen that exists to be read.
//
// So the schedule is a list of tasks and a tap begins one. Reading a group
// without starting anything is still there — it is what the Majelis tab is.

import { useState } from 'react'
import { Badge, BottomSheet, Button, Card } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { DAYS, TASKS, TOMORROW_TASKS, findDay, withScheduled, type Task } from '../lib/schedule'
import {
  IconBell,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconHome,
  IconChat,
  IconInbox,
  IconMegaphone,
  IconPin,
  IconUsers,
  IconWallet,
} from '../lib/icons'
import { doneTaskList, laterTasks, nowTask, scheduledFor, store, useApp } from '../lib/store'
import { TabBar } from '../lib/tabs'
import { AgendaRow, Collapsible, HeaderAction, IconTile, Overline, type Tint } from '../lib/ui'

// The two kinds are told apart by their tile, never by hunting for a word: a
// group of women at a balai, or one door.
function KindIcon({ kind }: { kind: Task['kind'] }) {
  if (kind === 'setoran') return <IconWallet size={20} />
  if (kind === 'sosialisasi') return <IconMegaphone size={20} />
  if (kind === 'follow-up') return <IconChat size={20} />
  return kind === 'majelis' ? <IconUsers size={20} /> : <IconHome size={20} />
}

// The two NTB kinds get their own tints rather than borrowing purple. Purple is
// the colour of servicing a majelis on this schedule, and a prospecting stop
// that looks like a pelayanan is a stop the eye stops distinguishing.
const KIND_TINT: Record<Task['kind'], Tint> = {
  majelis: 'primary',
  'home-visit': 'red',
  setoran: 'green',
  sosialisasi: 'blue',
  'follow-up': 'orange',
}

const kindTint = (kind: Task['kind']): Tint => KIND_TINT[kind]

// The short code every row wears. It is the BP's own shorthand — MV, HV, Sos are
// what she and her BM say to each other — and it earns the space because it fits
// on ONE line beside a title, which "Pelayanan Majelis" does not. The tile colour
// already carries the kind for the eye; the badge is what names it.
const KIND_LABEL: Record<Task['kind'], string> = {
  majelis: 'MV',
  'home-visit': 'HV',
  setoran: 'Setoran',
  sosialisasi: 'Sos',
  'follow-up': 'FU',
}

const kindLabel = (kind: Task['kind']) => KIND_LABEL[kind]

/** The badge itself, so the focus card, Berikutnya and Besok cannot drift. */
function KindBadge({ kind }: { kind: Task['kind'] }) {
  return <Badge intent={kindTint(kind)}>{kindLabel(kind)}</Badge>
}

// The verb on the focus card. A sosialisasi is not "started" the way a
// pelayanan is and a follow-up is a call, not a journey.
const KIND_CTA: Record<Task['kind'], string> = {
  majelis: 'Mulai Pelayanan',
  'home-visit': 'Mulai Kunjungan',
  setoran: 'Setor Sekarang',
  sosialisasi: 'Mulai Sosialisasi',
  'follow-up': 'Mulai Follow Up',
}

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

  // Tomorrow is the rostered day PLUS whatever the BP promised today. A
  // follow-up she committed to on a call at 11.45 is a real appointment, and
  // the only place it can be honoured is the day it falls on.
  const tomorrow = withScheduled(TOMORROW_TASKS, scheduledFor(s, 'tomorrow'))

  const subtitle =
    s.day === 'tomorrow'
      ? `${tomorrow.length} kunjungan terjadwal`
      : `${done.length} dari ${TASKS.length} selesai`

  // Straight into the work. A majelis goes to stage 1, a home visit to its own
  // step 1. The task id rides along either way, so submitting closes this row
  // rather than leaving finished work on the day.
  function start(task: Task) {
    if (task.kind === 'setoran') {
      store.startDeposit(task.id)
      flow.go('deposit')
      return
    }
    if (task.kind === 'home-visit') {
      store.startHomeVisit(task.id)
      flow.go('home-visit')
      return
    }
    if (task.kind === 'sosialisasi') {
      store.startSosialisasi(task.id)
      flow.go('sosialisasi')
      return
    }
    if (task.kind === 'follow-up') {
      store.startFollowUp(task.id)
      flow.go('follow-up')
      return
    }
    store.startVisit(task.majelisId ?? 'mawar', task.id)
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
          {tomorrow.map((task) => (
            <AgendaRow key={task.id} time={task.time}>
              <Card>
                <div className="flex items-center gap-12">
                  <IconTile tint={kindTint(task.kind)}>
                    <KindIcon kind={task.kind} />
                  </IconTile>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="flex min-w-0 items-center gap-4">
                      <KindBadge kind={task.kind} />
                      <span className="truncate text-14 font-bold text-default">{task.title}</span>
                    </span>
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
                  <IconTile tint={kindTint(now.kind)}>
                    <KindIcon kind={now.kind} />
                  </IconTile>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex">
                      <KindBadge kind={now.kind} />
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

                {/* The only control on this page that starts anything. */}
                <Button size="md" className="w-full" onClick={() => start(now)}>
                  {KIND_CTA[now.kind]}
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

      {/* --- Berikutnya: the rest of the day, and every row starts its task —
          the same thing the button above does, just for a stop she is reaching
          out of order. The chevron is the tappable tell. */}
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
                  <IconTile tint={kindTint(task.kind)}>
                    <KindIcon kind={task.kind} />
                  </IconTile>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="flex min-w-0 items-center gap-4">
                      <KindBadge kind={task.kind} />
                      <span className="truncate text-14 font-bold text-default">{task.title}</span>
                    </span>
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
