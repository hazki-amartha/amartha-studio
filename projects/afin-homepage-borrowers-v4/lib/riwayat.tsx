'use client'

// Progress-limit detail + payment schedule (Figma section 2967:34429). Both
// screens read the Minggu Home Var D is on, so the history always matches the
// bars on the homepage card: P → paid & present, W → part-paid & absent,
// M → unpaid & absent.

import type { ReactNode } from 'react'
import type { SegmentTone } from './store'

export const ASSET = '/prototypes/afin-homepage-borrowers-v4'
export const CARD_SHADOW = { boxShadow: '0 1px 1px rgba(164, 172, 185, 0.24)' }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const FIRST_WEEK = new Date(2026, 8, 1) // Minggu 1 = 1 Sep 2026

/** "1 Sep 2026", "13 Oct 2026" — Minggu n falls 7 days after Minggu n-1. */
export function weekDate(week: number): string {
  const d = new Date(FIRST_WEEK)
  d.setDate(d.getDate() + (week - 1) * 7)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Weeks already due on the current card — the non-"upcoming" bars. */
export function elapsedWeeks(segments: SegmentTone[]): SegmentTone[] {
  return segments.filter((s) => s !== 'upcoming')
}

export function WeekCard({ title, date, children }: { title: string; date: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-12 rounded-16 bg-neutral-white p-12" style={CARD_SHADOW}>
      <div className="flex items-center gap-8 text-14 font-bold text-default">
        <p className="flex-1">{title}</p>
        <p className="flex-1 text-right">{date}</p>
      </div>
      {children ? (
        <>
          <div className="border-t border-default" />
          {children}
        </>
      ) : null}
    </div>
  )
}

type Status = { icon: 'check' | 'x' | 'half'; text: string; color: string }

function StatusCell({ label, status }: { label: string; status: Status }) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <p className="text-14 text-caption">{label}</p>
      <p className="flex items-center gap-4">
        <img src={`${ASSET}/status-${status.icon}.svg`} alt="" width={20} height={20} className="shrink-0" />
        <span className={`text-14 font-bold ${status.color}`}>{status.text}</span>
      </p>
    </div>
  )
}

const PAYMENT: Record<Exclude<SegmentTone, 'upcoming'>, [string, Status]> = {
  paid: ['Bayar lunas', { icon: 'check', text: 'Rp135.000', color: 'text-green-600' }],
  partial: ['Bayar Sebagian', { icon: 'half', text: 'Rp30.000', color: 'text-orange-600' }],
  missed: ['Pembayaran', { icon: 'x', text: 'Tidak bayar', color: 'text-red-500' }],
}

export function HistoryCard({
  week,
  tone,
  amountOverride,
}: {
  week: number
  tone: Exclude<SegmentTone, 'upcoming'>
  amountOverride?: string
}) {
  const [payLabel, payDefault] = PAYMENT[tone]
  const pay: Status = amountOverride ? { ...payDefault, text: amountOverride } : payDefault
  const present: Status =
    tone === 'paid'
      ? { icon: 'check', text: 'Hadir', color: 'text-green-600' }
      : { icon: 'x', text: 'Tidak Hadir', color: 'text-red-500' }
  return (
    <WeekCard title={`Minggu ${week}`} date={weekDate(week)}>
      <div className="flex items-stretch gap-16">
        <StatusCell label={payLabel} status={pay} />
        <div className="border-l border-default" />
        <StatusCell label="Hadir Kumpulan" status={present} />
      </div>
    </WeekCard>
  )
}
