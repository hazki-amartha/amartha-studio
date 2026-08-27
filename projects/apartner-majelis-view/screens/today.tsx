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

import { useState, type ReactNode } from 'react'
import { Badge, BottomSheet, Button, Card } from '@/design-system/components'
import type { BadgeIntent } from '@/design-system/components/Badge'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import {
  CLOSING_TASK,
  DAYS,
  DEPOSIT,
  TASKS,
  TOMORROW_TASKS,
  findDay,
  findMajelisEntry,
  kmShort,
  withScheduled,
  type Task,
} from '../lib/schedule'
import { IconCheck, IconChevronDown, IconInbox, IconWallet } from '../lib/icons'
import { CloudArrowUp } from '@/design-system/icons'
import { SkipVisitSheet, VisitGateSheet } from '../lib/visit-sheets'
import {
  canSettle,
  settlementsLeft,
  depositExpected,
  pendingSync,
  rejectedTasks,
  rescheduledTasks,
  skippedTasks,
  settledTotal,
  scheduledFor,
  store,
  taskStatus,
  todayTasks,
  unreadComms,
  useApp,
  type TaskStatus,
} from '../lib/store'
import { pipelineStore } from '../lib/pipeline-store'
import { TabBar } from '../lib/tabs'
import { AppScreen, EmptyState, FilterBar, FilterChip, HeaderAction, OptionSheet, Overline, ResetLink, SettlementHistorySheet, type Tint } from '../lib/ui'

// Which pipeline lead a scheduled Follow-Up task works. The rostered call for
// "Ibu Nia Kurniasih" opens her pipeline record (p4).
const FU_PIPELINE_LEAD: Record<string, string> = { l1: 'p4', l2: 'p2' }

// The two NTB kinds get their own tints rather than borrowing purple. Purple is
// the colour of servicing a majelis on this schedule, and a prospecting stop
// that looks like a pelayanan is a stop the eye stops distinguishing.
const KIND_TINT: Record<Task['kind'], Tint> = {
  majelis: 'primary',
  'home-visit': 'red',
  setoran: 'green',
  sosialisasi: 'blue',
  'follow-up': 'orange',
  // Purple, same as a pelayanan: reminding a majelis IS majelis work, done the
  // morning before. The code below is what tells the two apart.
  reminder: 'primary',
  // Orange, the app's colour for something that needs attention now: a nominal
  // was corrected upstream and the proof she already sent is stale.
  bukti: 'orange',
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
  reminder: 'Ingat',
  bukti: 'BB',
}

/**
 * The same five kinds spelled out, for the line above the title. The tile's
 * code and this are one fact drawn twice on purpose: the code is what the eye
 * sorts the agenda by at a glance, the words are what the card says out loud —
 * and a BP new to the app learns the codes off this line rather than off a
 * legend she has to go and find.
 */
const KIND_NAME: Record<Task['kind'], string> = {
  majelis: 'Majelis Visit',
  'home-visit': 'Home Visit',
  setoran: 'Tutup Hari',
  sosialisasi: 'Sosialisasi',
  'follow-up': 'Follow Up',
  reminder: 'Ingatkan Majelis',
  bukti: 'Kirim Bukti Bayar',
}

/**
 * The tile at the head of every task, and it holds the CODE rather than a
 * pictogram. The icons were a second vocabulary to learn — a house, a group of
 * women, a megaphone — that resolved to the same five words the BP already has
 * names for, and at 20px a megaphone and a speech bubble are one blur apart.
 * The tint still does the pre-attentive work; the letters remove the guess.
 *
 * Square and fixed at 40, so the code sits in a tile rather than a slab and
 * every card's text starts on the same left edge whatever the code.
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
      className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-8 text-12 font-bold ${tone}`}
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
    <button
      type="button"
      onClick={onStart}
      className="flex w-full items-start gap-12 rounded-12 border border-default bg-neutral-white p-12 text-left active:bg-neutral-50"
    >
      <KindTag kind={task.kind} />
      <TaskBody
        task={task}
        status={<Badge intent={STATUS_META[status].intent}>{STATUS_META[status].label}</Badge>}
      />
    </button>
  )
}

/**
 * Everything on a task card except the tile: the kind and the time, the name,
 * the address, and whatever labels the stop carries.
 *
 * The ORDER is the change. The card used to open on the title with the time
 * buried in a grey line beneath it; now the kind and the clock sit on top as
 * the card's own header — "Majelis Visit · 08.00" — and the name reads as the
 * answer to it. That line is also where the state goes, at the right edge, so
 * every card says what/when on the left and where-it-stands on the right
 * regardless of how long the name underneath runs.
 *
 * The address wraps to two lines rather than truncating. A kampung address is
 * where she is actually going, and "Kp. Cibeuteung RT 02, Ciseeng…" with the RT
 * cut off is the one part she needed.
 *
 * Three sizes, and only three: the name is 16 bold — it is the one thing she
 * is looking FOR — the two lines of prose around it are 14, and the tags stay
 * at 12 because a label is not something you read, it is something you notice.
 */
function TaskBody({
  task,
  meta,
  status,
  note,
}: {
  task: Task
  /** Overrides "kind · time" — a moved visit leads with the day it moved to. */
  meta?: string
  /** The state at the right of the header line. */
  status?: ReactNode
  /** A last line under the labels: why it moved, why it was closed. */
  note?: string
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <span className="flex items-center gap-8">
        <span className="min-w-0 flex-1 truncate text-14 font-regular text-caption">
          {meta ?? `${KIND_NAME[task.kind]} · ${task.time}`}
        </span>
        {status ? <span className="flex shrink-0">{status}</span> : null}
      </span>
      <span className="text-16 font-bold text-default">{task.title}</span>
      <span className="line-clamp-2 text-14 font-regular text-default">{task.place}</span>
      <TaskLabels task={task} />
      {note ? <span className="text-12 font-regular text-caption">{note}</span> : null}
    </div>
  )
}

/**
 * A settled widget, collapsed. Same card, one line, no tile and no control —
 * the two things above the list keep their place in the stack when their work
 * is done, because "nothing to send" and "nothing to settle" are answers a BP
 * wants to SEE rather than infer from an absence. They just stop taking the
 * room they needed while there was something to do.
 */
function DoneLine({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-8 rounded-12 bg-neutral-white px-12 py-8">
      <span className="shrink-0 text-green-500">
        <IconCheck size={16} />
      </span>
      <span className="min-w-0 flex-1 truncate text-12 text-caption">{children}</span>
      {action ? <span className="shrink-0">{action}</span> : null}
    </div>
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
    // Both labels on one row of pills under the address, because they qualify
    // the same stop and stacking them made a two-word fact take two lines. The
    // distance drops to "1,5 km" here: beside the address it is going with,
    // "dari lokasi Anda" is a sentence the pill has no room for and the BP does
    // not need.
    <span className="flex flex-wrap items-center gap-4 pt-2">
      {task.distanceKm !== undefined ? (
        <Badge intent="neutral">{kmShort(task.distanceKm)}</Badge>
      ) : null}
      {/* Last, and the only prediction on the card. Everything beside it is a
          fact about the stop; this is a guess about the person, and it sits in
          green at the end because it is the one thing here not simply true yet. */}
      {task.payLikely ? <Badge intent="green">Kemungkinan bayar tinggi</Badge> : null}
    </span>
  )
}

/**
 * The four states, once. The filter sheet, the chip and the mark on the card
 * all read this, so none of them can drift on the wording of a state.
 *
 * A badge now, not a bare tone. It sits on the card's header line — above the
 * name rather than beside it — so it no longer competes with a long title for
 * width, and a tinted pill is what every other state in this app is drawn as.
 * Blue for Selesai and green only for Terkirim, because green is this app's
 * colour for settled and work still sitting on the handset has not settled.
 */
const STATUS_META: Record<TaskStatus, { label: string; intent: BadgeIntent }> = {
  belum: { label: 'Belum mulai', intent: 'neutral' },
  dikerjakan: { label: 'Dikerjakan', intent: 'orange' },
  selesai: { label: 'Selesai', intent: 'blue' },
  terkirim: { label: 'Terkirim', intent: 'green' },
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
  const [historyOpen, setHistoryOpen] = useState(false)
  // The majelis task waiting on the door question, and — if the answer was "no
  // one came" — the same task waiting on its proof. Two pieces of state rather
  // than one flag, because the second sheet has to survive the first closing.
  const [gating, setGating] = useState<Task | null>(null)
  const [skipping, setSkipping] = useState<Task | null>(null)
  const day = findDay(s.day)
  const pending = pendingSync(s)
  // What she has collected and not yet handed over — DONE tasks, whether or not
  // their reports have synced. This is the figure the widget shows, because the
  // cash is in her bag the moment she collects it; syncing only decides whether
  // she can put it down yet.
  const inBag = Math.max(0, depositExpected(s) - settledTotal(s))
  // Whether any of that is actually settleable right now: only synced cash can
  // be handed over. When collected cash is all still on the handset this is
  // false, so the Setor button waits on her sending the tasks first.
  const canSetorNow = canSettle(s)
  const underCap = settlementsLeft(s) > 0
  const showSetor = underCap && inBag > 0

  // A filter replaces the whole agenda with one flat list. Sekarang/Berikutnya/
  // Selesai is a shape built around WHEN, and a BP filtering by type has
  // stopped asking that question — leaving two headings over a filtered day
  // would make her read one short list in two pieces.
  // A visit moved to another day is off today's plate entirely — not to-do, not
  // done, and not counted against the day — so it drops out of every bucket
  // below and gets its own section at the foot of the list.
  // A rejected task is gone the same way a rescheduled one is — off today's
  // plate, not to-do and not done — but it landed there by being closed for
  // good rather than moved, so it gets its own section and its own count.
  const rescheduled = rescheduledTasks(s)
  const rejected = rejectedTasks(s)
  const skipped = skippedTasks(s)
  const plate = todayTasks(s)
  const onToday = (t: Task) => plate.includes(t)
  const todayCount = plate.length

  const filtering = Boolean(kind || status)
  const matches = TASKS.filter(
    (t) => onToday(t) && (!kind || t.kind === kind) && (!status || taskStatus(s, t.id) === status),
  )

  // Two buckets, split on the only line that matters to a BP looking at her
  // day: is there still something to do here. "Dikerjakan" belongs with "belum
  // mulai" because a half-finished visit is unfinished work; "terkirim" belongs
  // with "selesai" because both are off her plate, and which of the two it is
  // is the sync widget's business, not the section's.
  const open = TASKS.filter((t) => onToday(t) && ['belum', 'dikerjakan'].includes(taskStatus(s, t.id)))
  const closed = TASKS.filter((t) => onToday(t) && ['selesai', 'terkirim'].includes(taskStatus(s, t.id)))

  // The closing task's own state. It is not a visit, so it lives outside the
  // done/sent arrays taskStatus reads — its one completion is depositDone. Until
  // then it sits in Belum selesai; after, it reads Terkirim in Selesai like any
  // finished task. It stays tappable throughout: the closing screen is where the
  // "all visits done, bag empty" gate is enforced, so an early tap just shows
  // her what is still left.
  const closingStatus: TaskStatus = s.depositDone ? 'terkirim' : 'belum'

  // Tomorrow is the rostered day PLUS whatever the BP promised today. A
  // follow-up she committed to on a call at 11.45 is a real appointment, and
  // the only place it can be honoured is the day it falls on.
  const tomorrow = withScheduled(TOMORROW_TASKS, scheduledFor(s, 'tomorrow'))

  const subtitle =
    s.day === 'tomorrow'
      ? `${tomorrow.length} kunjungan terjadwal`
      : `${closed.length} dari ${todayCount} selesai`

  // Straight into the work, whatever the kind. A majelis used to stop at a
  // doorstep sheet on the way — the address and the KM's number for the ride
  // there — which put a sheet between her and the one button that starts a
  // visit. Those two facts now sit on the Kehadiran stage itself, so the tap
  // does what it says.
  //
  // The task id rides along, so submitting closes this row rather than leaving
  // finished work on the day.
  function start(task: Task) {
    if (task.kind === 'majelis') {
      // One question at the door before the register opens: did the group
      // actually gather? A majelis nobody came to is not a roster with 22
      // absences in it — it is a visit that did not happen, and the two
      // outcomes are worth splitting before either costs a tap.
      setGating(task)
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
      // The Follow-Up task now works a PIPELINE lead, on the same record the
      // Sales detail uses. `startFollowUp` still does the schedule-side
      // bookkeeping (marks the row started, sets the active task).
      store.startFollowUp(task.id)
      pipelineStore.openFollowUp(FU_PIPELINE_LEAD[task.leadId ?? ''] ?? 'p4', task.id)
      flow.go('follow-up')
      return
    }
    if (task.kind === 'reminder') {
      store.startReminder(task.id)
      flow.go('reminder')
      return
    }
    if (task.kind === 'bukti') {
      // The two re-sends: the majelis recap goes to the group, the mitra receipt
      // to one door. No store setup — each draft is authored in lib/bukti.ts.
      flow.go(task.id === 'bb-majelis' ? 'bukti-rekap' : 'bukti-bayar')
      return
    }
    if (task.kind === 'setoran') {
      // The closing task. No store setup — the closing screen reads the day's
      // state directly and runs its own two-check gate.
      flow.go('deposit')
      return
    }
  }

  /** "Kerjakan tugas" — the group is here, so open the register. */
  function workGated(task: Task) {
    setGating(null)
    store.startVisit(task.majelisId ?? 'mawar', task.id)
    flow.go('attendance')
  }

  /** "Lewati tugas" — hand straight to the proof sheet, which is the gate. */
  function skipGated(task: Task) {
    setGating(null)
    setSkipping(task)
  }

  function confirmSkip(task: Task, reason: string) {
    store.skipVisit(task.id, reason)
    setSkipping(null)
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
      <HeaderAction label="Kotak masuk" count={unreadComms(s)} onClick={() => flow.go('comms')}>
        <IconInbox size={20} />
      </HeaderAction>
    </header>
  )

  // --- Besok: a preview, not a workspace. No focus card, no launchers — the
  // day's shape in the same card as today's, minus the status and the chevron,
  // because tomorrow has neither a state nor anywhere to go.
  if (s.day === 'tomorrow') {
    return (
      <AppScreen topBar={header}>
        <Overline>Jadwal besok</Overline>
        <div className="flex flex-col gap-8">
          {tomorrow.map((task) => (
            <Card key={task.id}>
              <div className="flex items-start gap-12">
                <KindTag kind={task.kind} />
                <TaskBody task={task} />
              </div>
            </Card>
          ))}
        </div>
        <DayPicker open={picking} onClose={() => setPicking(false)} />
        <TabBar active="today" />
      </AppScreen>
    )
  }

  return (
    <AppScreen topBar={header}>
      {/* --- Setoran: what is in her bag right now, and the button that puts
          it down. It replaced "Terkumpul hari ini", which was a progress bar
          against a target — a number to feel something about rather than act
          on. This one is the same money phrased as a decision, and it is the
          larger risk: cash on a motorbike, not a percentage. It shows while
          there is anything unsettled; once the bag is empty a single settled
          line takes its place.

          Closing is no longer up here as a widget — it is a task ROW at the
          foot of the list (Tutup Hari Ini), tapped like any other. */}
      {showSetor ? (
        // Same shape as the sync widget below it: tile, two lines, one small
        // button pinned right. They are the two things on this page that are
        // not tasks, and giving them one shape says so — a full-width button
        // made this the loudest object on a page whose subject is the day.
        //
        // The amount is what she has COLLECTED, shown the moment cash is in the
        // bag. But she cannot hand it over until the tasks are sent — the branch
        // settles against the report — so when nothing is synced yet the button
        // is disabled and the second line tells her the one thing that unblocks
        // it: send the tasks.
        <div className="flex items-center gap-12 rounded-12 bg-neutral-white p-12">
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-green-50 text-green-500">
            <IconWallet size={20} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-16 font-bold text-default">{rupiah(inBag)}</span>
            <span className="truncate text-12 text-caption">
              {canSetorNow
                ? `Belum disetor · sisa ${settlementsLeft(s)}x setoran hari ini`
                : 'Kirim tugas untuk lanjut setor'}
            </span>
          </div>
          <Button
            size="sm"
            className="h-40 shrink-0 px-16"
            disabled={!canSetorNow}
            onClick={() => {
              store.openSettlement()
              // Which of the two setoran alternatives this opens is a
              // presentation setting, flipped from the state controls beside
              // the device — never a menu drawn inside the prototype.
              flow.go(s.setorAlt)
            }}
          >
            Setor
          </Button>
        </div>
      ) : null}

      {/* Nothing left to hand over, but something went. The card stays and
          shrinks to its one fact: a settled bag is worth confirming — she is
          carrying nothing, which is the answer to a question she asks herself
          all afternoon. It carries no breakdown of its own, but it does offer a
          way IN to one: "lihat" opens the day's cash story rather than making
          her infer it from an absence. */}
      {!showSetor && settledTotal(s) > 0 ? (
        <DoneLine
          action={
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="text-12 font-bold text-link"
            >
              Lihat
            </button>
          }
        >
          Sudah disetor hari ini: {rupiah(settledTotal(s))}
        </DoneLine>
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

      {pending.length === 0 && s.sentTasks.length > 0 ? (
        <DoneLine>Semua tugas selesai sudah dikirim</DoneLine>
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
            {matches.length} dari {todayCount} tugas
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
      {open.length > 0 || !s.depositDone ? (
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
            {/* Tutup Hari Ini — the last row of the day, a task like the rest.
                Tapping it opens the closing checklist, where the real gate is;
                it holds this spot until the day is actually closed. */}
            {!s.depositDone ? (
              <TaskRow
                task={CLOSING_TASK}
                status={closingStatus}
                onStart={() => start(CLOSING_TASK)}
              />
            ) : null}
          </div>
        </>
      ) : null}

      {/* --- Selesai: same card, still on the rail. It stays a full section
          rather than the collapsed strip it was — the sync widget points at
          these rows, and a Selesai that has not been sent is something she
          needs to be able to SEE, not something behind a disclosure. */}
      {closed.length > 0 || s.depositDone ? (
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
            {/* Once the day is closed the same row lands here, reading Terkirim
                like any finished task — the day has one end, and this is it. */}
            {s.depositDone ? (
              <TaskRow
                task={CLOSING_TASK}
                status={closingStatus}
                onStart={() => start(CLOSING_TASK)}
              />
            ) : null}
          </div>
        </>
      ) : null}

      {/* --- Dijadwalkan ulang: visits the BP moved to another day. On a dashed
          card and not tappable — it is no longer today's work, it is a record
          that the door was handled by being postponed, with why and when it
          lands so the day doesn't read as if she skipped it. */}
      {rescheduled.length > 0 ? (
        <>
          <Overline>Dijadwalkan ulang</Overline>
          <div className="flex flex-col gap-8 pb-16">
            {rescheduled.map((task) => {
              const moved = s.reschedules[task.id]
              return (
                // Same card as every other row, on a dashed border: title,
                // then when-and-where — except "when" is the day it moved TO,
                // because the time it was booked for today stopped being a fact
                // about it the moment she moved it.
                <div
                  key={task.id}
                  className="flex w-full items-start gap-12 rounded-12 border border-dashed border-default bg-neutral-white p-12"
                >
                  <KindTag kind={task.kind} />
                  <TaskBody
                    task={task}
                    meta={`Dipindah ke ${moved.date}`}
                    status={
                      <Badge intent="neutral">
                        Dijadwalkan ulang{moved.count > 1 ? ` ${moved.count}×` : ''}
                      </Badge>
                    }
                    note={moved.reason}
                  />
                </div>
              )
            })}
          </div>
        </>
      ) : null}

      {/* --- Ditolak: tasks closed for good after three reschedules. Same dashed
          card, but there is no future date to show — the point is that it has
          none — so it carries the BP's own reason instead, which is the record
          ops picks the closed task up from. */}
      {rejected.length > 0 ? (
        <>
          <Overline>Ditolak</Overline>
          <div className="flex flex-col gap-8 pb-16">
            {rejected.map((task) => (
              <div
                key={task.id}
                className="flex w-full items-start gap-12 rounded-12 border border-dashed border-default bg-neutral-white p-12"
              >
                <KindTag kind={task.kind} />
                <TaskBody
                  task={task}
                  status={<Badge intent="red">Ditolak</Badge>}
                  note={s.rejects[task.id]}
                />
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* --- Dilewati: majelis visits skipped from step 1 with photo + location
          proof. On the same dashed card, tagged so a skipped kumpulan reads as
          handled-with-evidence rather than as work she never got to. */}
      {skipped.length > 0 ? (
        <>
          <Overline>Dilewati</Overline>
          <div className="flex flex-col gap-8 pb-16">
            {skipped.map((task) => (
              <div
                key={task.id}
                className="flex w-full items-start gap-12 rounded-12 border border-dashed border-default bg-neutral-white p-12"
              >
                <KindTag kind={task.kind} />
                <TaskBody
                  task={task}
                  status={<Badge intent="neutral">Dilewati</Badge>}
                  note="Bukti foto & lokasi tersimpan"
                />
              </div>
            ))}
          </div>
        </>
      ) : null}
        </>
      )}

      <DayPicker open={picking} onClose={() => setPicking(false)} />

      {/* The door question, and the proof it hands off to when the answer is
          that nobody came. Both keyed off the task that was tapped, so the
          skip lands on the right row. */}
      <VisitGateSheet
        open={Boolean(gating)}
        onClose={() => setGating(null)}
        onWork={() => gating && workGated(gating)}
        onSkip={() => gating && skipGated(gating)}
      />
      <SkipVisitSheet
        open={Boolean(skipping)}
        place={findMajelisEntry(skipping?.majelisId ?? 'mawar').place}
        onClose={() => setSkipping(null)}
        onConfirm={(reason) => skipping && confirmSkip(skipping, reason)}
      />

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
      <SettlementHistorySheet open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <TabBar active="today" />
    </AppScreen>
  )
}
