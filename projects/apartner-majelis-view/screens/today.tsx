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
  DEPOSIT,
  TASKS,
  TOMORROW_TASKS,
  findDay,
  km,
  withScheduled,
  type Task,
} from '../lib/schedule'
import { IconCheck, IconChevronDown, IconChevronRight, IconInbox, IconWallet } from '../lib/icons'
import { CloudArrowUp } from '@/design-system/icons'
import {
  canSettleMidDay,
  midDayUsed,
  pendingSync,
  settledTotal,
  unsettledTotal,
  scheduledFor,
  store,
  taskStatus,
  useApp,
  type TaskStatus,
} from '../lib/store'
import { TabBar } from '../lib/tabs'
import {
  AgendaRow,
  EmptyState,
  FilterBar,
  FilterChip,
  HeaderAction,
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
  setoran: 'Tutup',
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

/**
 * ONE card, every task, every section.
 *
 * The page used to open on a focus card — one stop drawn larger, with the verb
 * on a button, under a heading that said "Sekarang". It was answering "what do
 * I do next" on a day that does not run in clock order: she arrives early, a
 * group is late, the 13.00 door is on the way back from the 10.00 balai. The
 * app picked a row, the road picked another, and the biggest thing on screen
 * was the one she wasn't doing.
 *
 * So the day is a list of equals and she picks. Every row starts its task on
 * tap, which is what the button did — it was never a second gesture, only a
 * bigger one for whichever row the clock happened to favour.
 */
function TaskRow({
  task,
  status,
  onStart,
}: {
  task: Task
  status: TaskStatus
  onStart: () => void
}) {
  return (
    <AgendaRow time={task.time}>
      <button
        type="button"
        onClick={onStart}
        className="flex w-full items-center gap-12 rounded-12 bg-neutral-white p-12 text-left active:bg-neutral-50"
      >
        <KindTag kind={task.kind} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* The status rides on the title line as small coloured text, not a
              pill. The section says whether work is left and the sync widget
              says what has not gone, so this is the refinement inside each —
              belum vs dikerjakan, selesai vs terkirim — and a refinement should
              not be the loudest object on the row. `shrink-0` keeps it whole
              and lets the name take the truncation. */}
          <span className="flex min-w-0 items-baseline gap-8">
            <span className="truncate text-14 font-bold text-default">{task.title}</span>
            <span className={`shrink-0 text-10 ${STATUS_META[status].tone}`}>
              {STATUS_META[status].label}
            </span>
          </span>
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
  )
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
    <>
      {/* Distance on its own line, directly under the address it qualifies —
          they are one thought ("where, and how far"), and the two read as a
          pair only when nothing sits between them. */}
      {task.distanceKm !== undefined ? (
        <span className="text-10 text-disabled">{km(task.distanceKm)}</span>
      ) : null}
      {/* Last, and the only badge left on the card. Everything above it is a
          fact about the stop; this is a prediction about the person, and it
          earns the bottom line by being the one thing here that is not simply
          true yet. */}
      {task.payLikely ? (
        <span className="flex">
          <Badge intent="green">Kemungkinan bayar tinggi</Badge>
        </span>
      ) : null}
    </>
  )
}

/**
 * The four states, once. The filter sheet, the chip and the mark on the card
 * all read this, so none of them can drift on the wording of a state.
 *
 * Tones, not pills: on the card this is a MARK beside a name, and a badge there
 * takes ~90px off a line that has to hold "Follow Up: Ibu Nia Kurniasih". Blue
 * for Selesai and green only for Terkirim, because green is this app's colour
 * for settled and work still sitting on the handset has not settled.
 */
const STATUS_META: Record<TaskStatus, { label: string; tone: string }> = {
  belum: { label: 'Belum mulai', tone: 'text-disabled' },
  dikerjakan: { label: 'Dikerjakan', tone: 'text-orange-500' },
  selesai: { label: 'Selesai', tone: 'text-blue-500' },
  terkirim: { label: 'Terkirim', tone: 'text-green-500' },
}

const STATUS_OPTIONS: { label: string; value: TaskStatus | null }[] = [
  { label: 'Semua status', value: null },
  ...(Object.keys(STATUS_META) as TaskStatus[]).map((k) => ({
    label: STATUS_META[k].label,
    value: k,
  })),
]

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
  const day = findDay(s.day)
  const pending = pendingSync(s)
  const toSettle = unsettledTotal(s)

  // A filter replaces the whole agenda with one flat list. Sekarang/Berikutnya/
  // Selesai is a shape built around WHEN, and a BP filtering by type has
  // stopped asking that question — leaving two headings over a filtered day
  // would make her read one short list in two pieces.
  const filtering = Boolean(kind || status)
  const matches = TASKS.filter(
    (t) => (!kind || t.kind === kind) && (!status || taskStatus(s, t.id) === status),
  )

  // Two buckets, split on the only line that matters to a BP looking at her
  // day: is there still something to do here. "Dikerjakan" belongs with "belum
  // mulai" because a half-finished visit is unfinished work; "terkirim" belongs
  // with "selesai" because both are off her plate, and which of the two it is
  // is the sync widget's business, not the section's.
  const open = TASKS.filter((t) => ['belum', 'dikerjakan'].includes(taskStatus(s, t.id)))
  const closed = TASKS.filter((t) => ['selesai', 'terkirim'].includes(taskStatus(s, t.id)))

  // Tomorrow is the rostered day PLUS whatever the BP promised today. A
  // follow-up she committed to on a call at 11.45 is a real appointment, and
  // the only place it can be honoured is the day it falls on.
  const tomorrow = withScheduled(TOMORROW_TASKS, scheduledFor(s, 'tomorrow'))

  const subtitle =
    s.day === 'tomorrow'
      ? `${tomorrow.length} kunjungan terjadwal`
      : `${closed.length} dari ${TASKS.length} selesai`

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
      flow.go('home-brief')
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
      {/* --- Setoran: what is in her bag right now, and the button that puts
          it down. It replaced "Terkumpul hari ini", which was a progress bar
          against a target — a number to feel something about rather than act
          on. This one is the same money phrased as a decision, and it is the
          larger risk: cash on a motorbike, not a percentage.

          It offers no amount. A settlement takes everything outstanding, so
          the only thing she picks is when.

          It DISAPPEARS after two mid-day handovers. The third is the closing
          task, which is hers to reach on the schedule below — a widget that
          stayed visible and refused to work would teach her to distrust it. */}
      {canSettleMidDay(s) ? (
        // Same shape as the sync widget below it: tile, two lines, one small
        // button pinned right. They are the two things on this page that are
        // not tasks, and giving them one shape says so — a full-width button
        // made this the loudest object on a page whose subject is the day.
        <div className="flex items-center gap-12 rounded-12 bg-neutral-white p-12">
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-green-50 text-green-500">
            <IconWallet size={20} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-16 font-bold text-default">{rupiah(toSettle)}</span>
            {/* The count as USED of allowed, not as remaining. "Sisa 2" makes
                her subtract to learn where she is; "0 dari maks 2" is the state
                itself, and it is the number that decides whether she puts the
                money down now or carries it to the next stop. */}
            <span className="truncate text-12 text-caption">
              Belum disetor · {midDayUsed(s)} dari maks {DEPOSIT.maxMidDay} setoran tengah hari
            </span>
          </div>
          <Button
            size="sm"
            className="h-40 shrink-0 px-16"
            onClick={() => {
              store.openSettlement()
              flow.go('deposit')
            }}
          >
            Setor
          </Button>
        </div>
      ) : null}

      {/* Once both mid-day slots are spent, what is left is a statement rather
          than a control: this much is still on her, and the closing task is
          where it goes. Saying nothing at all would leave her carrying money
          the app had stopped mentioning. */}
      {!canSettleMidDay(s) && toSettle > 0 ? (
        <div className="flex items-center gap-12 rounded-12 bg-neutral-white p-12">
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-neutral-50 text-neutral-600">
            <IconWallet size={20} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-12 text-caption">Uang tunai belum disetor</span>
            <span className="text-16 font-bold text-default">{rupiah(toSettle)}</span>
          </div>
          <span className="shrink-0 text-10 text-disabled">Setor di tugas penutup</span>
        </div>
      ) : null}

      {settledTotal(s) > 0 ? (
        <span className="text-10 text-disabled">
          Sudah disetor hari ini: {rupiah(settledTotal(s))} dalam {s.settlements.length} kali
        </span>
      ) : null}

      {/* --- Belum terkirim: the day's work that hasn't left the handset.
          It sits directly above the task list because that is what it is ABOUT
          — those rows, and the fact that finishing them was not the last step.
          A BP closes a visit standing in a balai with no signal; without this
          she finds out on Friday that Tuesday never landed.

          It disappears the moment nothing is pending. A sync widget that stays
          on screen saying "0" is a permanent reminder of a problem she does not
          have, and the empty state of a queue is no queue. */}
      {pending.length > 0 ? (
        <div className="flex items-center gap-12 rounded-12 bg-neutral-white p-12">
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-orange-50 text-orange-500">
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
          label={status ? STATUS_META[status].label : 'Status tugas'}
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
              <TaskRow
                key={task.id}
                task={task}
                status={taskStatus(s, task.id)}
                onStart={() => start(task)}
              />
            ))}
          </div>
        </>
      ) : (
        <>

      {/* --- Belum selesai: everything still owed, in clock order.
          No focus card and no "Sekarang". The page used to draw one stop
          larger with the verb on a button, which answered "what next" on a day
          that does not run in clock order — and the biggest thing on screen was
          regularly the row she was not doing. Now every card is the same card
          and she picks. */}
      {open.length > 0 ? (
        <>
          <Overline>Belum selesai</Overline>
          <div className="flex flex-col gap-8">
            {open.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                status={taskStatus(s, task.id)}
                onStart={() => start(task)}
              />
            ))}
          </div>
        </>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-8 py-24 text-center">
            <span className="text-20 font-bold text-default">Tugas hari ini selesai</span>
            <span className="text-12 text-caption">
              Semua {closed.length} kunjungan sudah dituntaskan. Sampai jumpa besok.
            </span>
          </div>
        </Card>
      )}

      {/* --- Selesai: same card, still on the rail. It stays a full section
          rather than the collapsed strip it was — the sync widget points at
          these rows, and a Selesai that has not been sent is something she
          needs to be able to SEE, not something behind a disclosure. */}
      {closed.length > 0 ? (
        <>
          <Overline>Selesai</Overline>
          <div className="flex flex-col gap-8 pb-16">
            {closed.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                status={taskStatus(s, task.id)}
                onStart={() => start(task)}
              />
            ))}
          </div>
        </>
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
