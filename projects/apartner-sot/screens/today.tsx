'use client'

// Tugas — the day's task list, per the BP APP 2026 Figma ("Default - Sorted by
// current logic").
//
// Three tabs: Hari ini, Besok, and Pending — the visits that left today
// (moved, closed after three moves, or skipped with proof). Hari ini is one flat
// list in clock order with its state on the right of every row; search and the
// kind chips narrow it, the sliders button filters by state. Finished work that
// hasn't left the handset is sent with the floating Kirim Tugas button.
//
// Every row starts its task on tap. The cash widget moved to Beranda.

import { useState, type ReactNode } from 'react'
import { Badge } from '@/design-system/components'
import type { BadgeIntent } from '@/design-system/components/Badge'
import {
  Bell,
  Door,
  File,
  HandCoins,
  PaperPlaneTilt,
  Sliders,
  TrendUp,
  User,
  Users,
  Wallet,
} from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  CLOSING_TASK,
  TOMORROW_TASKS,
  findMajelisEntry,
  withScheduled,
  type Task,
} from '../lib/schedule'
import { SkipVisitSheet, VisitGateSheet } from '../lib/visit-sheets'
import {
  pendingSync,
  rejectedTasks,
  rescheduledTasks,
  skippedTasks,
  scheduledFor,
  store,
  taskStatus,
  todayTasks,
  useApp,
  type TaskStatus,
} from '../lib/store'
import { TabBar } from '../lib/tabs'
import { AppScreen, EmptyState, OptionSheet, SearchField } from '../lib/ui'

const KIND_NAME: Record<Task['kind'], string> = {
  majelis: 'Pelayanan',
  'home-visit': 'Home Visit',
  setoran: 'Tutup Hari',
  sosialisasi: 'Sosialisasi',
  'follow-up': 'Follow Up',
  reminder: 'Ingatkan Majelis',
  bukti: 'Dokumen',
}

const KIND_ICON: Record<Task['kind'], ReactNode> = {
  majelis: <HandCoins size={20} />,
  'home-visit': <Door size={20} />,
  setoran: <Wallet size={20} />,
  sosialisasi: <Users size={20} />,
  'follow-up': <User size={20} />,
  reminder: <Bell size={20} />,
  bukti: <File size={20} />,
}

const KIND_CHIPS: { label: string; value: Task['kind'] | null }[] = [
  { label: 'Semua', value: null },
  { label: 'Pelayanan', value: 'majelis' },
  { label: 'Homevisit', value: 'home-visit' },
  { label: 'Dokumen', value: 'bukti' },
]

/** The four states, once — the filter sheet and the row badge both read this. */
const STATUS_META: Record<TaskStatus, { label: string; intent: BadgeIntent }> = {
  belum: { label: 'Belum Mulai', intent: 'neutral' },
  dikerjakan: { label: 'Dikerjakan', intent: 'yellow' },
  selesai: { label: 'Selesai', intent: 'blue' },
  terkirim: { label: 'Terkirim', intent: 'green' },
}

const STATUS_OPTIONS: { label: string; value: TaskStatus | null }[] = [
  { label: 'Semua status', value: null },
  ...(Object.keys(STATUS_META) as TaskStatus[]).map((k) => ({ label: STATUS_META[k].label, value: k })),
]

type Tab = 'today' | 'tomorrow' | 'pending'

const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Hari ini' },
  { id: 'tomorrow', label: 'Besok' },
  { id: 'pending', label: 'Pending' },
]

/** One row of the list: tile, "kind • slot", name, labels — state on the right. */
function TaskRow({
  task,
  status,
  meta,
  note,
  onClick,
}: {
  task: Task
  status?: ReactNode
  meta?: string
  note?: string
  onClick?: () => void
}) {
  const body = (
    <>
      <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 border border-default text-default">
        {KIND_ICON[task.kind]}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-4">
        <span className="flex items-start gap-8">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-14 text-default">
              {meta ?? `${KIND_NAME[task.kind]} • ${task.time} - ${task.until}`}
            </span>
            <span className="truncate text-14 font-bold text-default">{task.title}</span>
          </span>
          {status ? <span className="flex shrink-0">{status}</span> : null}
        </span>
        {task.payLikely ? (
          <span className="flex">
            <span className="flex items-center gap-4 rounded-4 border border-default px-4 py-2 text-12 text-default">
              <span className="text-primary-500">
                <TrendUp size={16} />
              </span>
              Kemungkinan Bayar Tinggi
            </span>
          </span>
        ) : null}
        {note ? <span className="text-12 text-caption">{note}</span> : null}
      </span>
    </>
  )
  const cls = 'flex w-full items-start gap-12 border-b border-light py-16 text-left last:border-b-0'
  return onClick ? (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  )
}

const StatusBadge = ({ status }: { status: TaskStatus }) => (
  <Badge intent={STATUS_META[status].intent} size="sm">
    {STATUS_META[status].label}
  </Badge>
)

export function TodayScreen() {
  const flow = useFlow()
  const s = useApp()
  const [tab, setTab] = useState<Tab>(s.day === 'tomorrow' ? 'tomorrow' : 'today')
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<Task['kind'] | null>(null)
  const [status, setStatus] = useState<TaskStatus | null>(null)
  const [statusOpen, setStatusOpen] = useState(false)
  // The majelis task waiting on the door question, and — if the answer was "no
  // one came" — the same task waiting on its proof.
  const [gating, setGating] = useState<Task | null>(null)
  const [skipping, setSkipping] = useState<Task | null>(null)

  const plate = todayTasks(s)
  const pending = pendingSync(s).filter((t) => plate.includes(t))
  const closingStatus: TaskStatus = s.depositDone ? 'terkirim' : 'belum'
  const statusOf = (t: Task): TaskStatus => (t.id === CLOSING_TASK.id ? closingStatus : taskStatus(s, t.id))

  const q = query.trim().toLowerCase()
  const matches = (t: Task) =>
    (!kind || t.kind === kind) && (!q || t.title.toLowerCase().includes(q))

  const today = [...plate, CLOSING_TASK].filter(
    (t) => matches(t) && (!status || statusOf(t) === status),
  )
  const tomorrow = withScheduled(TOMORROW_TASKS, scheduledFor(s, 'tomorrow')).filter(matches)
  const moved = [
    ...rescheduledTasks(s).map((t) => ({ t, tag: 'Dijadwalkan ulang' })),
    ...rejectedTasks(s).map((t) => ({ t, tag: 'Ditolak' })),
    ...skippedTasks(s).map((t) => ({ t, tag: 'Dilewati' })),
  ].filter(({ t }) => matches(t))

  const count = tab === 'today' ? today.length : tab === 'tomorrow' ? tomorrow.length : moved.length

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

  function confirmSkip(task: Task, reason: string, visitDate: string | null) {
    store.skipVisit(task.id, reason, visitDate)
    setSkipping(null)
  }

  const header = (
    <header className="flex shrink-0 flex-col bg-neutral-white">
      <div className="flex items-center gap-8 px-16 py-12">
        <span className="min-w-0 flex-1 text-20 font-bold text-default">Tugas</span>
      </div>
      <div className="flex border-b border-default px-8">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id)
              if (t.id !== 'pending') store.setDay(t.id)
            }}
            className={`border-b-2 px-12 py-12 text-16 ${
              tab === t.id ? 'border-primary-500 text-primary-500' : 'border-transparent text-caption'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </header>
  )

  return (
    <AppScreen topBar={header}>
      <SearchField value={query} onChange={setQuery} placeholder="Cari tugas" label="Cari tugas" />

      <div className="-mx-16 flex items-center gap-8 overflow-x-auto px-16">
        {tab === 'today' ? (
          <button
            type="button"
            aria-label="Filter status"
            onClick={() => setStatusOpen(true)}
            className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-8 border ${
              status ? 'border-primary-500 bg-primary-50 text-primary-500' : 'border-default bg-neutral-white text-default'
            }`}
          >
            <Sliders size={16} />
          </button>
        ) : null}
        {KIND_CHIPS.map((c) => (
          <button
            key={c.label}
            type="button"
            aria-pressed={kind === c.value}
            onClick={() => setKind(c.value)}
            className={`shrink-0 rounded-8 border px-12 py-8 text-14 ${
              kind === c.value
                ? 'border-primary-500 bg-primary-50 text-primary-500'
                : 'border-default bg-neutral-white text-default'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <span className="text-12 text-caption">{count} Tugas</span>

      <div className="flex flex-col rounded-16 bg-neutral-white px-12 pb-48">
        {count === 0 ? <EmptyState title="Tidak ada tugas" body="Coba kata kunci atau filter lain." /> : null}

        {tab === 'today'
          ? today.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                status={<StatusBadge status={statusOf(task)} />}
                onClick={() => start(task)}
              />
            ))
          : null}

        {tab === 'tomorrow' ? tomorrow.map((task) => <TaskRow key={task.id} task={task} />) : null}

        {tab === 'pending'
          ? moved.map(({ t, tag }) => {
              const r = s.reschedules[t.id]
              return (
                <TaskRow
                  key={t.id}
                  task={t}
                  meta={r && tag === 'Dijadwalkan ulang' ? `${KIND_NAME[t.kind]} • Dipindah ke ${r.date}` : undefined}
                  status={
                    <Badge intent={tag === 'Ditolak' ? 'red' : 'neutral'} size="sm">
                      {tag}
                    </Badge>
                  }
                  note={
                    tag === 'Dijadwalkan ulang'
                      ? r?.reason
                      : tag === 'Ditolak'
                        ? s.rejects[t.id]
                        : 'Bukti foto & lokasi tersimpan'
                  }
                />
              )
            })
          : null}
      </div>

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
        onConfirm={(reason, visitDate) => skipping && confirmSkip(skipping, reason, visitDate)}
      />
      <OptionSheet
        open={statusOpen}
        title="Status tugas"
        name="status-tugas"
        options={STATUS_OPTIONS}
        value={status}
        onPick={(v) => {
          setStatus(v)
          setStatusOpen(false)
        }}
        onClose={() => setStatusOpen(false)}
      />
      <TabBar
        active="today"
        action={
          tab === 'today' && pending.length > 0 ? (
            <button
              type="button"
              onClick={() => flow.go('kirim-tugas')}
              className="flex items-center gap-8 rounded-full bg-primary-500 px-20 py-12 text-16 font-bold text-neutral-white shadow-lg"
            >
              <PaperPlaneTilt size={20} />
              Kirim Tugas
            </button>
          ) : null
        }
      />
    </AppScreen>
  )
}
