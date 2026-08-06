'use client'

// The briefing's running order, and the pieces both briefing pages draw it
// with. Morning and evening are the same meeting at two ends of a day — same
// roll call, same checklist shape, same photo at the close — so the agenda is
// authored here as data and the page is the list of it.

import type { ReactNode } from 'react'
import { IconCheck } from './icons'

export interface AgendaItem {
  id: string
  title: string
  /** The one line under the title: what it is, or where to open it. */
  subtitle?: string
  /** The steps to work through, printed as a numbered list under a rule. */
  steps?: string[]
}

/**
 * The morning's running order, straight off the reference.
 *
 * The NG-MIS paths are printed as TEXT, not linked. NG-MIS is another system;
 * a prototype that navigated out of itself would leave the review stranded in
 * an app nobody opened it to look at.
 */
export const MORNING_AGENDA: AgendaItem[] = [
  {
    id: 'repayment',
    title: 'Bahas target repayment',
    subtitle: 'Buka NG-MIS: Branches / Monitoring / Repayment',
    steps: [
      'Share target & capaian bulan ini',
      'Share target & capaian minggu ini',
      'Share target & capaian hari ini',
    ],
  },
  {
    id: 'disbursement',
    title: 'Bahas target disbursement',
    subtitle: 'Buka NG-MIS: Branches / Monitoring / Disbursement',
    steps: [
      'Share target & capaian bulan ini',
      'Share target & capaian minggu ini',
      'Share target & capaian hari ini',
    ],
  },
  {
    id: 'tugas',
    title: 'Bahas tugas hari ini untuk setiap BP',
    subtitle: 'Buka NG-MIS: Branches / Monitoring / Tugas',
    steps: [
      'Pastikan tugas di BP App dan NG-MIS sama',
      'Pastikan tiap BP mengerti pentingnya setiap tugas yang mereka punya',
      'Bahas strategi menyelesaikan tugas',
    ],
  },
]

/**
 * One agenda item as a card the BM ticks off.
 *
 * The mark is on the LEFT of the title and the whole card is the target: she is
 * running a meeting with seven people in front of her, and a checkbox sized for
 * a cursor is not something you hit while talking.
 */
export function AgendaCard({
  item,
  done,
  onToggle,
}: {
  item: AgendaItem
  done: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={done}
      className="flex w-full items-start gap-12 rounded-12 border border-default bg-neutral-white p-12 text-left active:bg-neutral-50"
    >
      <CheckMark done={done} />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <span className="text-16 font-bold text-default">{item.title}</span>
        {item.subtitle ? (
          <span className="text-14 font-regular text-caption">{item.subtitle}</span>
        ) : null}
        {item.steps ? (
          <ol className="mt-8 flex flex-col gap-8 border-t border-default pt-12">
            {item.steps.map((step, i) => (
              <li key={step} className="flex gap-12">
                <span className="w-12 shrink-0 text-14 font-bold text-default">{i + 1}</span>
                <span className="min-w-0 flex-1 text-14 font-regular text-default">{step}</span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </button>
  )
}

/**
 * The tick, at ONE size everywhere — every agenda row and every absensi name
 * carries the same 24px circle, so the two lists read as one checklist rather
 * than two controls that happen to share a page.
 *
 * Unchecked is a solid neutral-400 ring, not a dashed hairline: the dashed
 * `border-default` was too faint to read as "waiting to be ticked", so an empty
 * row looked like it had no control at all.
 */
export function CheckMark({ done }: { done: boolean }) {
  return (
    <span
      className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full ${
        done
          ? 'bg-primary-500 text-neutral-white'
          : 'border border-neutral-400 bg-neutral-white'
      }`}
    >
      {done ? <IconCheck size={16} /> : null}
    </span>
  )
}

/** A titled block on the briefing page — the absensi and the photo both sit in one. */
export function BriefingCard({
  title,
  hint,
  children,
}: {
  title: string
  /** Right-aligned in the header — the absensi's count, and its disclosure. */
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-12 rounded-12 border border-default bg-neutral-white p-12">
      <div className="flex items-center gap-8">
        <span className="min-w-0 flex-1 text-16 font-bold text-default">{title}</span>
        {hint ? <span className="flex shrink-0 items-center gap-4">{hint}</span> : null}
      </div>
      {children}
    </div>
  )
}
