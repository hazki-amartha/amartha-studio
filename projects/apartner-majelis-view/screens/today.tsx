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
import { rupiah } from '../lib/data'
import {
  DAYS,
  TARGET_HARIAN,
  TASKS,
  TOMORROW_TASKS,
  findDay,
  km,
  withScheduled,
  type Task,
} from '../lib/schedule'
import { IconCheck, IconChevronDown, IconChevronRight, IconInbox } from '../lib/icons'
import { CloudArrowUp } from '@/design-system/icons'
import {
  collectedToday,
  doneTaskList,
  laterTasks,
  nowTask,
  pendingSync,
  scheduledFor,
  store,
  taskStatus,
  useApp,
  type TaskStatus,
} from '../lib/store'
import { TabBar } from '../lib/tabs'
import {
  AgendaRow,
  Collapsible,
  EmptyState,
  FilterBar,
  FilterChip,
  HeaderAction,
  Meter,
  OptionSheet,
  Overline,
  PinMark,
  ResetLink,
  type Tint,
} from '../lib/ui'

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

// The BP's own shorthand — MV, HV, Sos, FU are what she and her BM already say
// to each other. "Setor" is the odd one out and stays a word: there is no code
// for the deposit because nobody needed one, it happens once a day.
const KIND_LABEL: Record<Task['kind'], string> = {
  majelis: 'MV',
  'home-visit': 'HV',
  setoran: 'Setor',
  sosialisasi: 'Sos',
  'follow-up': 'FU',
}

/**
 * The tile at the head of every task, and it holds the CODE rather than a
 * pictogram. The icons were a second vocabulary to learn — a house, a group of
 * women, a megaphone — that resolved to the same five words the BP already has
 * names for, and at 20px a megaphone and a speech bubble are one blur apart.
 * The tint still does the pre-attentive work; the letters remove the guess.
 *
 * Fixed width, so titles start on one line down the agenda whatever the code.
 */
function KindTag({ kind }: { kind: Task['kind'] }) {
  const tint = kindTint(kind)
  const tone =
    tint === 'red'
      ? 'bg-red-50 text-red-500'
      : tint === 'green'
        ? 'bg-green-50 text-green-500'
        : tint === 'blue'
          ? 'bg-blue-50 text-blue-500'
          : tint === 'orange'
            ? 'bg-orange-50 text-orange-500'
            : 'bg-primary-50 text-primary-500'
  return (
    <span
      className={`flex h-40 w-48 shrink-0 items-center justify-center rounded-8 text-12 font-bold ${tone}`}
    >
      {KIND_LABEL[kind]}
    </span>
  )
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
 * The two labels a task row can wear under its title.
 *
 * Distance is on every stop, because the order of a day is decided by geography
 * as much as by the clock — two stops in one kampung get done together whatever
 * their slots say. "Kemungkinan bayar tinggi" is only ever on a home visit: a
 * majelis is 22 women with 22 answers, so one propensity flag on a group
 * describes nobody in it.
 *
 * The prediction stays a small green label rather than a headline. A BP who
 * reads it as a promise and finds an empty house twice stops believing the
 * next one.
 */
function TaskLabels({ task }: { task: Task }) {
  if (task.distanceKm === undefined && !task.payLikely) return null
  return (
    <span className="flex flex-wrap items-center gap-4">
      {task.distanceKm !== undefined ? (
        <span className="text-10 text-disabled">{km(task.distanceKm)}</span>
      ) : null}
      {task.payLikely ? <Badge intent="green">Kemungkinan bayar tinggi</Badge> : null}
    </span>
  )
}

const KIND_OPTIONS: { label: string; value: Task['kind'] | null }[] = [
  { label: 'Semua tipe', value: null },
  { label: 'Pelayanan Majelis (MV)', value: 'majelis' },
  { label: 'Home Visit (HV)', value: 'home-visit' },
  { label: 'Sosialisasi (Sos)', value: 'sosialisasi' },
  { label: 'Follow Up (FU)', value: 'follow-up' },
  // Setoran is on the list even though it was not asked for: it is a task on
  // the day, and a "Tipe tugas" filter that cannot name one of the five kinds
  // is a filter that lies about what the day contains.
  { label: 'Setoran', value: 'setoran' },
]

const STATUS_OPTIONS: { label: string; value: TaskStatus | null }[] = [
  { label: 'Semua status', value: null },
  { label: 'Belum mulai', value: 'belum' },
  { label: 'Dikerjakan', value: 'dikerjakan' },
  { label: 'Selesai', value: 'selesai' },
  { label: 'Terkirim', value: 'terkirim' },
]

const STATUS_BADGE: Record<TaskStatus, { label: string; intent: 'neutral' | 'orange' | 'blue' | 'green' }> = {
  belum: { label: 'Belum mulai', intent: 'neutral' },
  dikerjakan: { label: 'Dikerjakan', intent: 'orange' },
  // Blue, not green: it is finished but still on the handset, and green is the
  // colour this app uses for "settled". Only Terkirim has actually settled.
  selesai: { label: 'Selesai', intent: 'blue' },
  terkirim: { label: 'Terkirim', intent: 'green' },
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
  const [kind, setKind] = useState<Task['kind'] | null>(null)
  const [status, setStatus] = useState<TaskStatus | null>(null)
  const [menu, setMenu] = useState<'kind' | 'status' | null>(null)
  const now = nowTask(s)
  const later = laterTasks(s)
  const done = doneTaskList(s)
  const day = findDay(s.day)
  const collected = collectedToday(s)
  const progress = Math.round((collected / TARGET_HARIAN) * 100)
  const pending = pendingSync(s)

  // A filter replaces the whole agenda with one flat list. Sekarang/Berikutnya/
  // Selesai is a shape built around WHEN, and a BP filtering by type or status
  // has stopped asking that question — leaving three headings over a filtered
  // day would make her read the same list in three pieces to find two rows.
  const filtering = Boolean(kind || status)
  const matches = TASKS.filter(
    (t) => (!kind || t.kind === kind) && (!status || taskStatus(s, t.id) === status),
  )

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
  // the progress count is its subtitle.
  //
  // One inbox, no bell. They were two senders — the business talking TO the BP,
  // and the system reporting what happened — but a notification is a thing that
  // has already happened, and this page is for what has not. What genuinely
  // needs her is a message; the rest is a second badge competing with the only
  // count on the page that changes her day.
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
                  <KindTag kind={task.kind} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-14 font-bold text-default">{task.title}</span>
                    <span className="flex items-center gap-4 text-12 text-caption">
                      <PinMark />
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
      {/* --- Terkumpul hari ini: the same card apartner-homepage-ia opens on.
          It is the one number a BP is asked for by her BM before the day is
          over, and it belongs above the work rather than at the deposit, where
          it would arrive too late to change how she works the afternoon.
          Without homepage-ia's "Lihat semua": there is no collection ledger to
          send her to here, and a link that opens a list of what she just did is
          a link back to the page she is on. */}
      <Overline>Terkumpul hari ini</Overline>
      <Card>
        <div className="flex flex-col gap-8">
          <div className="flex items-baseline justify-between gap-8">
            <span className="text-16 font-bold text-default">{rupiah(collected)}</span>
            <span className="text-10 text-disabled">Target {rupiah(TARGET_HARIAN)}</span>
          </div>
          <Meter progress={progress} tone={progress >= 100 ? 'green' : 'primary'} />
        </div>
      </Card>

      {/* --- Belum terkirim: the day's work that hasn't left the handset.
          It sits directly above the task list because that is what it is ABOUT
          — those rows, and the fact that finishing them was not the last step.
          A BP closes a visit standing in a balai with no signal; without this
          she finds out on Friday that Tuesday never landed.

          It disappears the moment nothing is pending. A sync widget that stays
          on screen saying "0" is a permanent reminder of a problem she does not
          have, and the empty state of a queue is no queue. */}
      {pending.length > 0 ? (
        <div className="flex items-center gap-12 rounded-12 border border-orange-200 bg-orange-50 p-12">
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-neutral-white text-orange-500">
            <CloudArrowUp size={20} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-14 font-bold text-default">
              {pending.length} tugas belum terkirim
            </span>
            <span className="truncate text-12 text-caption">
              Sudah selesai, masih tersimpan di HP
            </span>
          </div>
          <Button size="sm" className="h-40 shrink-0 px-16" onClick={() => store.sendPending()}>
            Kirim
          </Button>
        </div>
      ) : null}

      {/* Two filters, and they answer the two questions a day gets asked when
          it stops running in order: "what home visits do I still have" and
          "what have I not sent". */}
      <FilterBar>
        <FilterChip
          label={
            kind
              ? (KIND_OPTIONS.find((o) => o.value === kind)?.label.replace(/ \(.*\)/, '') ??
                'Tipe tugas')
              : 'Tipe tugas'
          }
          active={Boolean(kind)}
          open={menu === 'kind'}
          onClick={() => setMenu('kind')}
        />
        <FilterChip
          label={status ? STATUS_BADGE[status].label : 'Status tugas'}
          active={Boolean(status)}
          open={menu === 'status'}
          onClick={() => setMenu('status')}
        />
        {filtering ? (
          <ResetLink
            onClick={() => {
              setKind(null)
              setStatus(null)
            }}
          />
        ) : null}
      </FilterBar>

      {filtering ? (
        <>
          <span className="text-12 text-caption">
            {matches.length} dari {TASKS.length} tugas
          </span>
          <div className="flex flex-col gap-8 pb-16">
            {matches.length === 0 ? (
              <EmptyState title="Tidak ada tugas" body="Coba tipe atau status lain." />
            ) : null}
            {matches.map((task) => (
              <AgendaRow key={task.id} time={task.time}>
                <button
                  type="button"
                  onClick={() => start(task)}
                  className="flex w-full items-center gap-12 rounded-12 bg-neutral-white p-12 text-left active:bg-neutral-50"
                >
                  <KindTag kind={task.kind} />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="truncate text-14 font-bold text-default">{task.title}</span>
                    <span className="flex min-w-0 items-center gap-4 text-12 text-caption">
                      <PinMark />
                      <span className="truncate">{task.place}</span>
                    </span>
                    <TaskLabels task={task} />
                  </div>
                  {/* The status badge earns its place ONLY here. On the normal
                      agenda the section a row sits in already says where it
                      stands; in a flat filtered list there are no sections. */}
                  <Badge intent={STATUS_BADGE[taskStatus(s, task.id)].intent}>
                    {STATUS_BADGE[taskStatus(s, task.id)].label}
                  </Badge>
                </button>
              </AgendaRow>
            ))}
          </div>
        </>
      ) : (
        <>

      {/* --- Sekarang: the only card that grows a button. */}
      {now ? (
        <>
          <Overline>Sekarang</Overline>
          <AgendaRow time={now.time} until={now.until}>
            <Card>
              <div className="flex flex-col gap-12">
                <div className="flex items-start gap-12">
                  <KindTag kind={now.kind} />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="text-18 font-bold text-default">{now.title}</span>
                    <span className="flex items-start gap-4 text-12 text-caption">
                      <PinMark />
                      {now.place}
                    </span>
                    <TaskLabels task={now} />
                  </div>
                </div>

                {/* The "why this task exists" line used to sit here, in a tinted
                    box of its own. It is gone from the focus card: the card is
                    for the stop she is standing at, and a reason is an argument
                    for choosing it — which she is not doing. It still leads
                    every row under Berikutnya, where choosing IS the job. */}

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
                  <KindTag kind={task.kind} />
                  {/* Title and where it is. The "why now" line used to be the
                      subtitle here; a row that carries a reason is a row being
                      argued for, and the schedule already made that call by
                      putting the stop on the day. Where she has to ride is the
                      fact she reads a row for. */}
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="truncate text-14 font-bold text-default">{task.title}</span>
                    <span className="flex min-w-0 items-center gap-4 text-12 text-caption">
                      <PinMark />
                      <span className="truncate">{task.place}</span>
                    </span>
                    <TaskLabels task={task} />
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
              {/* Selesai and Terkirim are told apart here too, or the section
                  the sync widget is about would be the one place that hides
                  which rows it means. */}
              {s.sentTasks.includes(task.id) ? (
                <Badge intent="green" leadingIcon={<IconCheck size={16} />}>
                  Terkirim
                </Badge>
              ) : (
                <Badge intent="blue">Selesai</Badge>
              )}
            </div>
          ))}
        </Collapsible>
      ) : null}
        </>
      )}

      <DayPicker open={picking} onClose={() => setPicking(false)} />
      <OptionSheet
        open={menu === 'kind'}
        title="Tipe tugas"
        name="tipe-tugas"
        options={KIND_OPTIONS}
        value={kind}
        onPick={(v) => {
          setKind(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'status'}
        title="Status tugas"
        name="status-tugas"
        options={STATUS_OPTIONS}
        value={status}
        onPick={(v) => {
          setStatus(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
      <TabBar active="today" />
    </Screen>
  )
}
