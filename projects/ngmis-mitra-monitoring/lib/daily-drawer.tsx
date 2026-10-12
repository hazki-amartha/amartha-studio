'use client'

// The BP's daily diagnosis — opened from "See detail" on Progres harian's Tugas
// table (beside a BP's name, or under a figure that missed target). Slides in
// from the right: the BP's majelis visits for the day, filterable by outcome,
// each with the repayment and attendance it reported, the cash collected, and —
// when the report looks wrong — a Verify call to action.

import { useState } from 'react'
import { Badge, Button, Input } from '@/design-system/components'
import {
  CalendarDots,
  CheckCircleFill,
  Cross,
  Hourglass,
  MagnifyingGlass,
  MapPin,
  Prohibit,
  WarningFill,
} from '@/design-system/icons'
import type { GapFocus } from './daily-scorecard'
import { PHOTOS } from './photos'
import { Select } from './ui'
import { rupiah } from './daily-data'

const DRAWER_W = 640

type Outcome = 'held' | 'postponed' | 'skipped' | 'pending'

interface Majelis {
  id: string
  name: string
  desa: string
  outcome: Outcome
  reported?: string
  /** Why a postponed majelis didn't meet. */
  reason?: string
  /** When a postponed majelis is rescheduled to. */
  rescheduledTo?: string
  mitra: number
  paid: number
  full: number
  partial: number
  attended: number
  cash: number
  settled: boolean
  /** Why the report looks wrong — present means it needs verifying. */
  flag?: string
  /** The attendance photo — a flagged report can carry one that isn't a majelis. */
  photo?: 'tree' | 'home' | 'sandal' | 'house'
  /** Present on a home visit: the mitra's majelis and what the visit produced. */
  home?: {
    majelis: string
    /** Who the BP actually met: the mitra, no one, or the mitra's family. */
    result: 'mitra' | 'none' | 'family'
    /** Why the mitra wasn't met — on `none` and `family` visits. */
    reason?: string
    /** Whether the angsuran collected on the visit was paid in full or in part. */
    installment?: 'full' | 'partial'
    /** A promise to pay made on the visit, when there is one. */
    janji?: { date: string; amount: number }
  }
}

// Seven assigned majelis visits for the day: four held (two flagged), one
// rescheduled, one skipped by the BP with a reason and proof photo, and one
// not yet reported.
const MAJELIS: Majelis[] = [
  {
    id: 'melati',
    name: 'Melati Majelis',
    desa: 'Desa Kudu',
    outcome: 'held',
    reported: '09:18',
    mitra: 15,
    paid: 10,
    full: 9,
    partial: 1,
    attended: 8,
    cash: 1_230_000,
    settled: true,
    flag: 'Report submitted 1.8 km from the Majelis location.',
    photo: 'tree',
  },
  {
    id: 'mawar',
    name: 'Mawar Majelis',
    desa: 'Desa Jati',
    outcome: 'postponed',
    reason: 'Group requested a different time.',
    rescheduledTo: 'Mon, 10 Aug 2026 · 10:00',
    mitra: 0,
    paid: 0,
    full: 0,
    partial: 0,
    attended: 0,
    cash: 0,
    settled: true,
  },
  {
    id: 'anggrek',
    name: 'Anggrek Majelis',
    desa: 'Desa Sukamaju',
    outcome: 'held',
    reported: '10:42',
    mitra: 14,
    paid: 12,
    full: 12,
    partial: 0,
    attended: 13,
    cash: 980_000,
    settled: false,
    photo: 'home',
  },
  {
    id: 'kenanga',
    name: 'Kenanga Majelis',
    desa: 'Desa Pagaden',
    outcome: 'held',
    reported: '11:05',
    mitra: 12,
    paid: 9,
    full: 8,
    partial: 1,
    attended: 10,
    cash: 740_000,
    settled: true,
    flag: 'Report submitted 3.2 km from the Majelis location.',
    photo: 'sandal',
  },
  {
    id: 'cempaka',
    name: 'Cempaka Majelis',
    desa: 'Desa Karang',
    outcome: 'skipped',
    reported: '08:50',
    reason: 'Majelis no longer meets',
    photo: 'house',
    mitra: 0,
    paid: 0,
    full: 0,
    partial: 0,
    attended: 0,
    cash: 0,
    settled: true,
  },
  {
    id: 'teratai',
    name: 'Teratai Majelis',
    desa: 'Desa Mekar',
    outcome: 'pending',
    mitra: 0,
    paid: 0,
    full: 0,
    partial: 0,
    attended: 0,
    cash: 0,
    settled: true,
  },
  {
    id: 'dahlia',
    name: 'Dahlia Majelis',
    desa: 'Desa Cikuya',
    outcome: 'held',
    reported: '13:20',
    mitra: 11,
    paid: 11,
    full: 11,
    partial: 0,
    attended: 11,
    cash: 1_100_000,
    settled: true,
    photo: 'home',
  },
]

/** What the BM decided after verifying a flagged report. */
interface Resolution {
  alert: boolean
  /** Why it is an alert — only when `alert`. */
  reason?: string
}

const ALERT_REASONS = ['Location too far from majelis', 'Fake photo', 'Meeting not held', 'Other']

// Seven assigned home visits: four done (one flagged, one where the mitra
// wasn't met, one where only family was met), one skipped, one rescheduled, one not yet reported. `name` is the mitra visited.
const HOME_VISITS: Majelis[] = [
  {
    id: 'hv-marlina',
    name: 'Marlina',
    desa: 'Desa Jati',
    outcome: 'held',
    reported: '08:55',
    home: { majelis: 'Majelis Mawar', result: 'mitra', installment: 'full' },
    mitra: 0,
    paid: 250_000,
    full: 0,
    partial: 0,
    attended: 0,
    cash: 250_000,
    settled: false,
    photo: 'home',
  },
  {
    id: 'hv-retno',
    name: 'Retno Wulandari',
    desa: 'Desa Sukamaju',
    outcome: 'held',
    reported: '10:15',
    home: {
      majelis: 'Majelis Anggrek',
      result: 'mitra',
      installment: 'partial',
      janji: { date: 'Fri, 14 Aug 2026', amount: 150_000 },
    },
    mitra: 0,
    paid: 100_000,
    full: 0,
    partial: 0,
    attended: 0,
    cash: 100_000,
    settled: true,
    flag: "Report submitted 2.1 km from the mitra's home.",
    photo: 'sandal',
  },
  {
    id: 'hv-dewi',
    name: 'Dewi Lestari',
    desa: 'Desa Kudu',
    outcome: 'held',
    reported: '11:40',
    home: {
      majelis: 'Majelis Melati',
      result: 'none',
      reason: 'Mitra is working',
    },
    mitra: 0,
    paid: 0,
    full: 0,
    partial: 0,
    attended: 0,
    cash: 0,
    settled: true,
    photo: 'home',
  },
  {
    id: 'hv-sri',
    name: 'Sri Rahayu',
    desa: 'Desa Karang',
    outcome: 'held',
    reported: '12:10',
    home: {
      majelis: 'Majelis Cempaka',
      result: 'family',
      reason: 'Mitra went to the market',
      janji: { date: 'Wed, 12 Aug 2026', amount: 250_000 },
    },
    mitra: 0,
    paid: 0,
    full: 0,
    partial: 0,
    attended: 0,
    cash: 0,
    settled: true,
    photo: 'home',
  },
  {
    id: 'hv-yuni',
    name: 'Yuni Astuti',
    desa: 'Desa Kudu',
    outcome: 'skipped',
    reported: '09:30',
    home: { majelis: 'Majelis Kenanga', result: 'none' },
    reason: 'Mitra pindah domisili',
    photo: 'house',
    mitra: 0,
    paid: 0,
    full: 0,
    partial: 0,
    attended: 0,
    cash: 0,
    settled: true,
  },
  {
    id: 'hv-lestari',
    name: 'Lestari',
    desa: 'Desa Pagaden',
    outcome: 'postponed',
    home: { majelis: 'Majelis Melati', result: 'none' },
    reason: 'Mitra was not at home.',
    rescheduledTo: 'Today, Fri 7 Aug 2026 · 17:00',
    mitra: 0,
    paid: 0,
    full: 0,
    partial: 0,
    attended: 0,
    cash: 0,
    settled: true,
  },
  {
    id: 'hv-fitriani',
    name: 'Fitriani',
    desa: 'Desa Cikuya',
    outcome: 'pending',
    home: { majelis: 'Majelis Dahlia', result: 'none' },
    mitra: 0,
    paid: 0,
    full: 0,
    partial: 0,
    attended: 0,
    cash: 0,
    settled: true,
  },
]

type Task = 'all' | 'majelis' | 'home'

const RESULT_LABEL = {
  mitra: 'Met mitra',
  none: 'Did not meet mitra',
  family: 'Met family',
} as const

/** Which drawer task a Tugas row opens onto; the other rows have no task list. */
const GAP_TASK: Record<string, Task> = { pelayanan: 'majelis', 'home-visit': 'home' }

type Filter = 'all' | 'completed' | 'not-completed' | 'verify'

export function DailyDrawer({
  bpName,
  gap,
  onClose,
  onOpenCash,
}: {
  bpName: string
  /** Set when opened from a figure that missed target: the drawer lands on that task's gap. */
  gap?: GapFocus
  onClose: () => void
  /** Jump to the Sisa setor tunai tab, from a majelis whose cash isn't settled. */
  onOpenCash: (bpName: string) => void
}) {
  const focus = gap && GAP_TASK[gap.rowId] ? { ...gap, task: GAP_TASK[gap.rowId] } : undefined
  const [task, setTask] = useState<Task>(focus?.task ?? 'all')
  const [filter, setFilter] = useState<Filter>(focus ? 'not-completed' : 'all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'default' | 'latest' | 'earliest'>('default')
  const [resolved, setResolved] = useState<Record<string, Resolution>>({})

  // A skipped task counts as done: the BP closed it out with a reason and proof.
  const isDone = (m: Majelis) => m.outcome === 'held' || m.outcome === 'skipped'
  const needsVerify = (m: Majelis) => !!m.flag && !resolved[m.id]
  // From a missed figure the list is exactly that figure's tasks: as many done as
  // the BP reported, and the rest not done — so the gap can be read off it.
  const full =
    task === 'majelis' ? MAJELIS : task === 'home' ? HOME_VISITS : [...MAJELIS, ...HOME_VISITS]
  const focused = focus && focus.task === task
  const list = focused
    ? [
        ...full.filter(isDone).slice(0, focus.done),
        ...full.filter((m) => !isDone(m)).slice(0, Math.max(focus.target - focus.done, 0)),
      ]
    : full
  const counts: Record<Filter, number> = {
    all: list.length,
    completed: list.filter(isDone).length,
    'not-completed': list.filter((m) => !isDone(m)).length,
    verify: list.filter(needsVerify).length,
  }
  const filtered = list.filter(
    (m) =>
      (filter === 'all' ||
        (filter === 'completed' && isDone(m)) ||
        (filter === 'not-completed' && !isDone(m)) ||
        (filter === 'verify' && needsVerify(m))) &&
      `${m.name} ${m.desa} ${m.home?.majelis ?? ''}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  )
  // Sorted by the time the BP reported; a task with no report time sits last.
  const shown =
    sort === 'default'
      ? filtered
      : [...filtered].sort((a, b) => {
          if (!a.reported) return 1
          if (!b.reported) return -1
          return sort === 'latest'
            ? b.reported.localeCompare(a.reported)
            : a.reported.localeCompare(b.reported)
        })

  const TABS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'completed', label: 'Done' },
    { id: 'not-completed', label: 'Not done' },
    { id: 'verify', label: 'Needs confirmation' },
  ]

  return (
    <div className="absolute inset-0 z-20 flex justify-end bg-overlay">
      <div className="flex h-full w-full flex-col bg-neutral-50" style={{ maxWidth: DRAWER_W }}>
        <div className="flex shrink-0 items-start justify-between gap-16 border-b border-default bg-neutral-white p-24">
          <div className="flex flex-col gap-4">
            <span className="text-12 font-bold text-caption">Daily diagnosis</span>
            <span className="text-20 font-bold text-default">{bpName}</span>
            <span className="flex items-center gap-8 text-14 text-caption">
              <CalendarDots size={16} />
              Fri, 7 Aug 2026
            </span>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="text-default">
            <Cross size={20} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-12 overflow-y-auto p-24">
          <Input
            size="sm"
            prefix={<MagnifyingGlass size={16} />}
            placeholder="Search Mitra or Majelis"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-12">
            <div className="min-w-0 flex-1">
              <Select
                label="Task"
                fullWidth
                value={task}
                onChange={(v) => {
                  setTask(v as Task)
                  setFilter('all')
                }}
                options={[
                  { value: 'all', label: 'All tasks' },
                  { value: 'majelis', label: 'Majelis visits' },
                  { value: 'home', label: 'Home visits' },
                ]}
              />
            </div>
            <Select
              label="Sort"
              value={sort}
              onChange={(v) => setSort(v as typeof sort)}
              options={[
                { value: 'default', label: 'Default order' },
                { value: 'latest', label: 'Reported time: latest first' },
                { value: 'earliest', label: 'Reported time: earliest first' },
              ]}
            />
          </div>

          <div className="flex items-center rounded-12 border border-default bg-neutral-white p-4">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={`flex flex-1 items-center justify-center gap-8 whitespace-nowrap rounded-8 px-8 py-8 text-14 ${
                  filter === t.id
                    ? 'bg-primary-50 font-bold text-primary-500'
                    : 'font-regular text-default'
                }`}
              >
                {t.label}
                <span className="font-bold">{counts[t.id]}</span>
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <span className="py-32 text-center text-14 text-caption">No majelis match.</span>
          ) : (
            shown.map((m) => (
              <MajelisCard
                showType={task === 'all'}
                key={m.id}
                m={m}
                onOpenCash={() => onOpenCash(bpName)}
                resolution={resolved[m.id]}
                onResolve={(r) => setResolved((v) => ({ ...v, [m.id]: r }))}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  total,
  unit,
  note,
}: {
  label: string
  value: number
  total: number
  unit: string
  note?: string
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <span className="text-14 text-default">{label}</span>
      <span className="text-24 font-bold text-default">
        {value} <span className="text-14 font-regular text-caption">/ {total}</span>
      </span>
      <span className="text-12 text-caption">{unit}</span>
      {note ? <span className="text-12 text-caption">{note}</span> : null}
    </div>
  )
}

function MajelisCard({
  m,
  showType,
  resolution,
  onResolve,
  onOpenCash,
}: {
  m: Majelis
  /** In the all-tasks list each card names its task, since the layouts differ. */
  showType: boolean
  onOpenCash: () => void
  resolution?: Resolution
  onResolve: (r: Resolution) => void
}) {
  const held = m.outcome === 'held'
  return (
    <div className="flex flex-col gap-12 rounded-16 border border-default bg-neutral-white p-12">
      <div className="flex items-start justify-between gap-12">
        <div className="flex flex-col gap-2">
          {showType ? (
            <span className="text-12 text-caption">{m.home ? 'Home visit' : 'Majelis visit'}</span>
          ) : null}
          <span className="text-16 font-bold text-default">{m.name}</span>
          <span className="flex items-center gap-4 text-12 text-caption">
            <MapPin size={16} />
            {m.home ? `${m.home.majelis} · ` : ''}
            {m.desa}
            {m.reported ? ` · Reported ${m.reported}` : ''}
          </span>
        </div>
        {held ? (
          <Badge
            intent="green"
            variant="subtle"
            size="sm"
            leadingIcon={<CheckCircleFill size={16} />}
          >
            Task done
          </Badge>
        ) : m.outcome === 'skipped' ? (
          <Badge intent="red" variant="subtle" size="sm" leadingIcon={<Prohibit size={16} />}>
            Task skipped
          </Badge>
        ) : m.outcome === 'pending' ? (
          <Badge intent="neutral" variant="subtle" size="sm" leadingIcon={<Hourglass size={16} />}>
            Task not yet done
          </Badge>
        ) : (
          <Badge intent="orange" variant="subtle" size="sm" leadingIcon={<Hourglass size={16} />}>
            Task rescheduled
          </Badge>
        )}
      </div>
      <div className="border-t border-default" />

      {held ? (
        <>
          <div className="flex gap-12">
            {m.home ? (
              <>
                <div className="flex min-w-0 flex-1 flex-col gap-4">
                  <span className="text-14 text-default">Payment</span>
                  <span className="text-24 font-bold text-default">{rupiah(m.paid)}</span>
                  {m.paid > 0 ? (
                    <span className="text-12 text-caption">
                      {m.home.installment === 'partial' ? 'Partial angsuran' : 'Full angsuran'}
                    </span>
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-4">
                  <span className="text-14 text-default">Visit result</span>
                  <span className="text-16 font-bold text-default">
                    {RESULT_LABEL[m.home.result]}
                  </span>
                  {m.home.reason ? (
                    <span className="text-12 text-caption">{m.home.reason}</span>
                  ) : null}
                  {m.home.janji ? (
                    <span className="text-12 text-caption">
                      Janji bayar, {m.home.janji.date} · {rupiah(m.home.janji.amount)}
                    </span>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <Stat
                  label="Repayment"
                  value={m.paid}
                  total={m.mitra}
                  unit="Mitra paid"
                  note={`${m.full} full · ${m.partial} partial`}
                />
                <Stat label="Attendance" value={m.attended} total={m.mitra} unit="Mitra attended" />
              </>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PHOTOS[m.photo ?? 'group']}
              alt="Attendance photo"
              className="shrink-0 rounded-8 object-cover"
              style={{
                width: 96,
                height: 96,
                objectPosition: m.photo === 'tree' ? '50% 20%' : undefined,
              }}
            />
          </div>

          {m.home && m.home.result !== 'mitra' ? null : (
            <div className="flex items-center gap-12 rounded-12 bg-neutral-50 p-12">
              <div className="flex flex-1 flex-col gap-2">
                <span className="text-12 text-caption">Cash collected</span>
                <span className="text-20 font-bold text-default">{rupiah(m.cash)}</span>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <span className="text-12 text-caption">Settlement status</span>
                <span className="flex items-center">
                  {m.settled ? (
                    <Badge
                      intent="green"
                      variant="subtle"
                      size="sm"
                      leadingIcon={<CheckCircleFill size={16} />}
                    >
                      Settled
                    </Badge>
                  ) : (
                    <>
                      <Badge
                        intent="neutral"
                        variant="subtle"
                        size="sm"
                        leadingIcon={<Hourglass size={16} />}
                      >
                        Not settled
                      </Badge>
                      <button
                        type="button"
                        onClick={onOpenCash}
                        className="ml-8 text-14 font-bold text-link active:opacity-70"
                      >
                        Check Sisa setor tunai
                      </button>
                    </>
                  )}
                </span>
              </div>
            </div>
          )}

          {m.flag ? (
            <FlagReview flag={m.flag} resolution={resolution} onResolve={onResolve} />
          ) : null}
        </>
      ) : m.outcome === 'skipped' ? (
        <div className="flex gap-12">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <span className="text-14 text-default">
              {m.home ? 'Reason for skipping the visit' : 'Reason for skipping the majelis'}
            </span>
            <span className="text-16 font-bold text-default">{m.reason}</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PHOTOS[m.photo ?? 'house']}
            alt="Absence proof photo"
            className="shrink-0 rounded-8 object-cover"
            style={{ width: 96, height: 96 }}
          />
        </div>
      ) : m.outcome === 'pending' ? (
        <span className="text-14 text-default">No report from the BP yet.</span>
      ) : (
        <div className="flex flex-col gap-8">
          <span className="text-14 text-default">{m.reason}</span>
          {m.rescheduledTo ? (
            <span className="flex items-center gap-8 text-14 font-bold text-default">
              <CalendarDots size={16} />
              Rescheduled to {m.rescheduledTo}
            </span>
          ) : null}
        </div>
      )}
    </div>
  )
}

/**
 * The flagged-report flow, inside the card. The banner's Verify opens a first
 * question — is this something alerting? — and "Yes" asks one more (what
 * kind) before it is recorded. "No" closes it straight away.
 */
function FlagReview({
  flag,
  resolution,
  onResolve,
}: {
  flag: string
  resolution?: Resolution
  onResolve: (r: Resolution) => void
}) {
  const [step, setStep] = useState<'banner' | 'ask' | 'reason'>('banner')
  const [reason, setReason] = useState<string | null>(null)

  if (resolution) {
    return resolution.alert ? (
      <div className="flex items-center gap-8 rounded-12 bg-red-50 p-12">
        <span className="text-red-500">
          <WarningFill size={16} />
        </span>
        <span className="flex flex-col">
          <span className="text-14 font-bold text-default">Marked as an alert</span>
          {resolution.reason ? (
            <span className="text-12 text-caption">{resolution.reason}</span>
          ) : null}
        </span>
      </div>
    ) : (
      <div className="flex items-center gap-8 rounded-12 bg-green-50 p-12 text-14 font-bold text-green-500">
        <CheckCircleFill size={16} /> Verified, not an alert
      </div>
    )
  }

  if (step === 'banner') {
    return (
      <div className="flex items-center justify-between gap-12 rounded-12 bg-orange-50 p-12">
        <div className="flex items-center gap-12">
          <span className="text-orange-500">
            <WarningFill size={24} />
          </span>
          <span className="flex flex-col gap-2">
            <span className="text-14 font-bold text-default">Looks like a fake submission</span>
            <span className="text-12 text-caption">{flag}</span>
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setStep('ask')}>
          Verify
        </Button>
      </div>
    )
  }

  if (step === 'ask') {
    return (
      <div className="flex flex-col gap-12 rounded-12 bg-orange-50 p-12">
        <span className="flex flex-col gap-2">
          <span className="text-14 font-bold text-default">Is this something alerting?</span>
          <span className="text-12 text-caption">{flag}</span>
        </span>
        <div className="flex items-center gap-12">
          <Button variant="primary" size="sm" onClick={() => setStep('reason')}>
            Yes, it&apos;s an alert
          </Button>
          <Button variant="outline" size="sm" onClick={() => onResolve({ alert: false })}>
            No, not an issue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-12 rounded-12 bg-orange-50 p-12">
      <span className="text-14 font-bold text-default">What is the issue?</span>
      <div className="flex flex-wrap gap-8">
        {ALERT_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(r)}
            className={`rounded-full border px-12 py-4 text-14 ${
              reason === r
                ? 'border-primary-500 bg-primary-50 font-bold text-primary-500'
                : 'border-default bg-neutral-white font-regular text-default'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-12">
        <Button
          variant="primary"
          size="sm"
          disabled={!reason}
          onClick={() => onResolve({ alert: true, reason: reason ?? undefined })}
        >
          Submit
        </Button>
        <Button variant="outline" size="sm" onClick={() => setStep('ask')}>
          Back
        </Button>
      </div>
    </div>
  )
}
