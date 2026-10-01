'use client'

// Three visual treatments of the "Potensi naik limit hingga" card, each its
// own screen (screens/home-var-a/b/c.tsx). Same IA in all three — hook,
// status, bayar-angsuran/hadir-kumpulan progress, a trimmed explanation — the
// difference is how much of it is text vs. drawn. Kept project-local: these
// are one-off explorations, not candidates for @/design-system/components.

import { type ReactNode } from 'react'
import { Badge } from '@/design-system/components'
import { CalendarDots, CheckCircleFill, CoinOneHand, CrossCircleFill } from '@/design-system/icons'
import { type LoanStatus, type WeekStatus, useHomeVarB } from './store'
import { StatDivider, StatusCard, StatusCardHeader } from './ui'

function LimitCardHeader({ intent = 'green', label = 'Sangat Lancar' }: { intent?: 'green' | 'red'; label?: string }) {
  return (
    <StatusCardHeader>
      <div className="flex items-start justify-between gap-8">
        <p className="flex-1 text-14 font-bold text-default">Potensi naik limit hingga Rp6jt-8jt 🎉</p>
        <Badge intent={intent} variant="solid">
          {label}
        </Badge>
      </div>
      <p className="text-12 text-default">Limit saat ini Rp5.000.000</p>
    </StatusCardHeader>
  )
}

// --- Variant A: progress bars ----------------------------------------------

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = Math.min(100, Math.round((value / total) * 100))
  return (
    <div className="h-8 w-full overflow-hidden rounded-full bg-neutral-200">
      <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

function ProgressStat({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-8">
        <p className="text-12 text-default">{label}</p>
        <p className="text-12 text-default">
          <span className="font-bold">{value}</span> dari {total} minggu
        </p>
      </div>
      <ProgressBar value={value} total={total} />
    </div>
  )
}

export function LimitCardProgress() {
  return (
    <StatusCard>
      <LimitCardHeader />
      <ProgressStat label="Bayar angsuran" value={1} total={48} />
      <ProgressStat label="Hadir kumpulan" value={1} total={48} />
      <p className="text-12 text-default">
        Pertahankan lancar 47 minggu lagi untuk naik limit.{' '}
        <span className="font-bold text-primary-500">Lihat detail</span>
      </p>
    </StatusCard>
  )
}

// --- Variant B: weekly payment checklist (5-week rolling window) -----------

const WINDOW = 5

/** Right-pads a week-status history to a fixed 5-slot rolling window — the
 *  most recent weeks first in reading order, with not-yet-due weeks shown as
 *  `upcoming` placeholders when the loan is younger than the window. */
function toWindow(weeks: WeekStatus[]): (WeekStatus | 'upcoming')[] {
  const visible = weeks.slice(-WINDOW)
  const upcoming: 'upcoming'[] = Array(WINDOW - visible.length).fill('upcoming')
  return [...visible, ...upcoming]
}

function WeekDot({ status }: { status: WeekStatus | 'upcoming' }) {
  if (status === 'lunas') return <CheckCircleFill size={20} className="shrink-0 text-green-600" />
  if (status === 'kosong') return <CrossCircleFill size={20} className="shrink-0 text-red-500" />
  if (status === 'partial') return <span className="size-20 shrink-0 rounded-full bg-orange-500" />
  return <span className="size-20 shrink-0 rounded-full border border-default" />
}

function HistoryStat({
  label,
  elapsed,
  total,
  statuses,
}: {
  label: string
  elapsed: number
  total: number
  statuses: (WeekStatus | 'upcoming')[]
}) {
  return (
    <div className="flex items-center justify-between gap-8">
      <p className="text-12 text-default">{label}</p>
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4">
          {statuses.map((s, i) => (
            <WeekDot key={i} status={s} />
          ))}
        </div>
        <p className="whitespace-nowrap text-12 text-default">
          <span className="font-bold">{elapsed}</span>/{total}
        </p>
      </div>
    </div>
  )
}

const STATUS_BADGE: Record<LoanStatus, { intent: 'green' | 'red'; label: string }> = {
  lancar: { intent: 'green', label: 'Lancar' },
  bahaya: { intent: 'red', label: 'Bahaya' },
}

const STATUS_EXPLANATION: Record<LoanStatus, ReactNode> = {
  lancar: (
    <>
      Pertahankan lancar untuk menjaga potensi limit baru.{' '}
      <span className="font-bold text-primary-500">Lihat detail</span>
    </>
  ),
  bahaya: (
    <>
      2 minggu terakhir belum lunas. Segera lunasi agar limit tidak terdampak.{' '}
      <span className="font-bold text-primary-500">Lihat detail</span>
    </>
  ),
}

export function LimitCardHistory() {
  const { weeks, status } = useHomeVarB()
  const badge = STATUS_BADGE[status]
  const elapsed = weeks.length
  const attendanceWeeks: WeekStatus[] = Array(elapsed).fill('lunas')

  return (
    <StatusCard>
      <LimitCardHeader intent={badge.intent} label={badge.label} />

      <p className="text-12 font-medium text-default">5 minggu terakhir</p>
      <HistoryStat label="Bayar angsuran" elapsed={elapsed} total={48} statuses={toWindow(weeks)} />
      <StatDivider />
      <HistoryStat label="Hadir kumpulan" elapsed={elapsed} total={48} statuses={toWindow(attendanceWeeks)} />

      <p className="text-12 text-default">{STATUS_EXPLANATION[status]}</p>
    </StatusCard>
  )
}

// --- Variant C: compact stat chips -------------------------------------------

function StatChip({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-1 items-center gap-8 rounded-12 bg-neutral-50 p-12">
      <span className="flex size-32 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
        {icon}
      </span>
      <div className="flex flex-col">
        <p className="text-14 font-bold text-default">{value}</p>
        <p className="text-12 text-default">{label}</p>
      </div>
    </div>
  )
}

export function LimitCardCompact() {
  return (
    <StatusCard>
      <LimitCardHeader />
      <div className="flex items-center gap-8">
        <StatChip icon={<CoinOneHand size={16} />} value="1/48 mgu" label="Bayar angsuran" />
        <StatChip icon={<CalendarDots size={16} />} value="1/48 mgu" label="Hadir kumpulan" />
      </div>
      <p className="text-12 text-default">47 minggu lagi menuju limit baru.</p>
    </StatusCard>
  )
}
