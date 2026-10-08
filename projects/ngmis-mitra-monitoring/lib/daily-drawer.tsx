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
  Sliders,
  WarningFill,
} from '@/design-system/icons'
import { PHOTOS } from './photos'
import { Select } from './ui'
import { rupiah } from './daily-data'

const DRAWER_W = 640

type Outcome = 'held' | 'postponed'

interface Majelis {
  id: string
  name: string
  desa: string
  outcome: Outcome
  reported?: string
  /** Why a postponed majelis didn't meet. */
  reason?: string
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
  photo?: 'tree' | 'home' | 'sandal'
}

// Five assigned majelis visits for the day: four held (two flagged), one postponed.
const MAJELIS: Majelis[] = [
  {
    id: 'melati', name: 'Melati Majelis', desa: 'Desa Kudu', outcome: 'held', reported: '09:18',
    mitra: 15, paid: 10, full: 9, partial: 1, attended: 8, cash: 1_230_000, settled: true,
    flag: 'Report submitted 1.8 km from the Majelis location.',
    photo: 'tree',
  },
  {
    id: 'mawar', name: 'Mawar Majelis', desa: 'Desa Jati', outcome: 'postponed',
    reason: 'Group requested a different time.',
    mitra: 0, paid: 0, full: 0, partial: 0, attended: 0, cash: 0, settled: true,
  },
  {
    id: 'anggrek', name: 'Anggrek Majelis', desa: 'Desa Sukamaju', outcome: 'held', reported: '10:42',
    mitra: 14, paid: 12, full: 12, partial: 0, attended: 13, cash: 980_000, settled: false,
    photo: 'home',
  },
  {
    id: 'kenanga', name: 'Kenanga Majelis', desa: 'Desa Pagaden', outcome: 'held', reported: '11:05',
    mitra: 12, paid: 9, full: 8, partial: 1, attended: 10, cash: 740_000, settled: true,
    flag: 'Report submitted 3.2 km from the Majelis location.',
    photo: 'sandal',
  },
  {
    id: 'dahlia', name: 'Dahlia Majelis', desa: 'Desa Cikuya', outcome: 'held', reported: '13:20',
    mitra: 11, paid: 11, full: 11, partial: 0, attended: 11, cash: 1_100_000, settled: true,
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

type Filter = 'all' | 'completed' | 'not-completed' | 'verify'

export function DailyDrawer({ bpName, onClose }: { bpName: string; onClose: () => void }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [resolved, setResolved] = useState<Record<string, Resolution>>({})

  const needsVerify = (m: Majelis) => !!m.flag && !resolved[m.id]
  const counts: Record<Filter, number> = {
    all: MAJELIS.length,
    completed: MAJELIS.filter((m) => m.outcome === 'held').length,
    'not-completed': MAJELIS.filter((m) => m.outcome === 'postponed').length,
    verify: MAJELIS.filter(needsVerify).length,
  }
  const shown = MAJELIS.filter(
    (m) =>
      (filter === 'all' ||
        (filter === 'completed' && m.outcome === 'held') ||
        (filter === 'not-completed' && m.outcome === 'postponed') ||
        (filter === 'verify' && needsVerify(m))) &&
      `${m.name} ${m.desa}`.toLowerCase().includes(query.trim().toLowerCase()),
  )

  const TABS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Semua' },
    { id: 'completed', label: 'Sudah dikerjakan' },
    { id: 'not-completed', label: 'Belum dikerjakan' },
    { id: 'verify', label: 'Butuh konfirmasi' },
  ]

  return (
    <div className="absolute inset-0 z-20 flex justify-end bg-overlay">
      <div
        className="flex h-full w-full flex-col bg-neutral-50"
        style={{ maxWidth: DRAWER_W }}
      >
        <div className="flex shrink-0 items-start justify-between gap-16 border-b border-default bg-neutral-white p-24">
          <div className="flex flex-col gap-4">
            <span className="text-12 font-bold text-caption">Daily diagnosis</span>
            <span className="text-20 font-bold text-default">{bpName}</span>
            <span className="flex items-center gap-8 text-14 text-caption">
              <CalendarDots size={16} />
              Fri, 7 Aug 2026
            </span>
          </div>
          <button type="button" aria-label="Tutup" onClick={onClose} className="text-default">
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
                value="majelis"
                onChange={() => undefined}
                options={[{ value: 'majelis', label: 'Majelis visits' }]}
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => undefined}>
              <span className="flex items-center gap-8">
                <Sliders size={16} />
                Filters
              </span>
            </Button>
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
          <span className="text-12 text-caption">
            Completion is BP-reported. Verification is reviewed separately.
          </span>

          {shown.length === 0 ? (
            <span className="py-32 text-center text-14 text-caption">No majelis match.</span>
          ) : (
            shown.map((m) => (
              <MajelisCard
                key={m.id}
                m={m}
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
  resolution,
  onResolve,
}: {
  m: Majelis
  resolution?: Resolution
  onResolve: (r: Resolution) => void
}) {
  const held = m.outcome === 'held'
  return (
    <div className="flex flex-col gap-12 rounded-16 border border-default bg-neutral-white p-12">
      <div className="flex items-start justify-between gap-12">
        <div className="flex flex-col gap-2">
          <span className="text-16 font-bold text-default">{m.name}</span>
          <span className="flex items-center gap-4 text-12 text-caption">
            <MapPin size={16} />
            {m.desa}
            {m.reported ? ` · Reported ${m.reported}` : ''}
          </span>
        </div>
        {held ? (
          <Badge intent="green" variant="subtle" size="sm" leadingIcon={<CheckCircleFill size={16} />}>
            Pelayanan dilakukan
          </Badge>
        ) : (
          <Badge intent="orange" variant="subtle" size="sm" leadingIcon={<Hourglass size={16} />}>
            Pelayanan di reschedule
          </Badge>
        )}
      </div>
      <div className="border-t border-default" />

      {held ? (
        <>
          <div className="flex gap-12">
            <Stat
              label="Repayment"
              value={m.paid}
              total={m.mitra}
              unit="Mitra paid"
              note={`${m.full} full · ${m.partial} partial`}
            />
            <Stat label="Attendance" value={m.attended} total={m.mitra} unit="Mitra attended" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PHOTOS[m.photo ?? 'group']}
              alt="Attendance photo"
              className="shrink-0 rounded-8 object-cover"
              style={{ width: 96, height: 96, objectPosition: m.photo === 'tree' ? '50% 20%' : undefined }}
            />
          </div>

          <div className="flex items-center gap-12 rounded-12 bg-neutral-50 p-12">
            <div className="flex flex-1 flex-col gap-2">
              <span className="text-12 text-caption">Cash collected</span>
              <span className="text-20 font-bold text-default">{rupiah(m.cash)}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <span className="text-12 text-caption">Settlement status</span>
              <span className="flex">
                {m.settled ? (
                  <Badge intent="green" variant="subtle" size="sm" leadingIcon={<CheckCircleFill size={16} />}>
                    Settled
                  </Badge>
                ) : (
                  <Badge intent="neutral" variant="subtle" size="sm" leadingIcon={<Hourglass size={16} />}>
                    Not settled
                  </Badge>
                )}
              </span>
            </div>
          </div>

          {m.flag ? <FlagReview flag={m.flag} resolution={resolution} onResolve={onResolve} /> : null}
        </>
      ) : (
        <span className="text-14 text-default">{m.reason}</span>
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
          {resolution.reason ? <span className="text-12 text-caption">{resolution.reason}</span> : null}
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
