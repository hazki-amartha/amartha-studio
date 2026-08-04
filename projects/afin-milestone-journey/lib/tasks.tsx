'use client'

// The goal card's checklist rows and the payout tile that sits under them.
//
// Home draws the whole set; the personal-progress page reuses the instalment
// row and the tile, so the two screens cannot disagree about what is owed or
// what is claimable — they read the same store and render the same markup.
// Project-local (CLAUDE.md §4); see NOTES.md.

import type { ReactNode } from 'react'
import { Check } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { BILL_DUE, WEEKLY_BILL, rupiah } from './data'
import { isSettled, outstanding, useApp, type AppState } from './store'
import { TaskButton } from './ui'

/** How far past due the unpaid week is, in the at-risk state. */
const DAYS_LATE = 3

/**
 * Where the instalment row stands. Settled ticks it; behind on the week raises
 * the alarm; cash with the field officer ticks it grey, her part being done. A
 * part-payment does none of those — it is still simply to do.
 */
export const billStatus = (s: AppState): TaskStatus =>
  isSettled(s) ? 'done' : s.billState === 'titip' ? 'pending' : s.atRisk ? 'alert' : 'todo'

/**
 * Money already on the table. Drawn the same on home and on the progress page:
 * a tinted tile, the figure the ladder says is hers, and one solid button.
 */
export function PayoutTile({ amount, onCairkan }: { amount: string; onCairkan: () => void }) {
  return (
    <div className="flex items-center gap-12 rounded-12 bg-blue-50 p-12">
      <div className="min-w-0 flex-1">
        <p className="text-12 text-neutral-700">Dana siap dicairkan</p>
        <p className="text-18 font-bold text-green-600">{amount}</p>
      </div>
      <button
        type="button"
        onClick={onCairkan}
        className="shrink-0 rounded-full bg-primary-500 px-16 py-8 text-14 font-bold text-neutral-white"
      >
        Cairkan
      </button>
    </div>
  )
}

/**
 * Where a habit stands this week: still to do, kept, slipped, or done on her
 * side and waiting on someone else's.
 */
export type TaskStatus = 'todo' | 'done' | 'alert' | 'pending'

export function Task({
  status,
  title,
  description,
  action,
}: {
  status: TaskStatus
  title: string
  description: ReactNode
  /** The trailing control. Omit for an informational row with no action. */
  action?: ReactNode
}) {
  return (
    <div className="flex items-center gap-12">
      <TaskMark status={status} />
      <div className="min-w-0 flex-1">
        <p className="text-14 font-bold text-default">{title}</p>
        <div className="mt-4 text-12 text-neutral-700">{description}</div>
      </div>
      {action}
    </div>
  )
}

/**
 * The mark at the head of a row. It replaced a tinted avatar per habit, which
 * said what KIND of thing the row was (something the title already said) and
 * left no room for the one thing a list of habits is for: whether she has done
 * it.
 *
 * Circles, and deliberately NOT checkboxes. None of these three states are hers
 * to set — paying ticks the bill, turning up ticks the kumpulan, and the
 * majelis row is nine other people — so a box with a border would promise a
 * control she cannot use, and would compete with the real button sitting at the
 * other end of the same row. A filled circle reads as a status reached; the
 * empty one is a slot waiting, with no border to invite a tap.
 */
function TaskMark({ status }: { status: TaskStatus }) {
  if (status === 'done') {
    return (
      <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-green-500 text-neutral-white">
        <Check size={16} />
      </span>
    )
  }
  // Ticked, but grey: she has done her part and the confirmation is somebody
  // else's move. Green would claim the money has landed when it has not.
  if (status === 'pending') {
    return (
      <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-neutral-500 text-neutral-white">
        <Check size={16} />
      </span>
    )
  }
  // Amber, not red, and tinted rather than solid: the warning is a nudge to act
  // this week, not an error. The 500-on-50 pairing is the design system's status
  // treatment (see CHEATSHEET), so it reads as the same caution as the Badge.
  if (status === 'alert') {
    return (
      <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-orange-50 text-14 font-bold text-orange-500">
        !
      </span>
    )
  }
  return <span className="h-24 w-24 shrink-0 rounded-full bg-neutral-200" />
}

/**
 * The instalment, on ONE line: the figure, then in brackets the thing that
 * qualifies it. Normally that is the week it falls due; on a late row the
 * lateness takes the slot instead, being the more urgent of the two facts and
 * the one that makes the date redundant. Keeping it to a single line holds the
 * row to two, level with the ones beneath it.
 */
export function BillLine() {
  const s = useApp()

  // Settled: struck through and muted. The tick at the head of the row says
  // "done"; the strike says this particular figure is no longer owed.
  if (s.billState === 'paid' && s.paidAmount >= WEEKLY_BILL) {
    return (
      <p className="text-disabled line-through">
        {rupiah(WEEKLY_BILL)} ({BILL_DUE})
      </p>
    )
  }
  // Cash is with the field officer. No date and no brackets: the deadline is
  // no longer the point once she has handed the money over, and what she wants
  // to read back is that the handover was registered.
  if (s.billState === 'titip') {
    return <p>{rupiah(WEEKLY_BILL)} - Sudah titip bayar</p>
  }
  // Part-paid: what is LEFT, not what the week cost. Orange, because it is a
  // shortfall to close rather than a deadline already missed.
  if (s.billState === 'paid') {
    return (
      <p className="text-orange-500">
        Kurang {rupiah(outstanding(s))} <DueDate />
      </p>
    )
  }
  // Unpaid and behind: the whole line reddens, and the brackets carry the
  // lateness. She does not need telling when it was due once it is not.
  if (s.atRisk) {
    return (
      <p className="text-red-500">
        {rupiah(WEEKLY_BILL)} (Telat {DAYS_LATE} Hari)
      </p>
    )
  }
  return (
    <p>
      {rupiah(WEEKLY_BILL)} <DueDate />
    </p>
  )
}

/** The week it falls due, a shade quieter than the figure it qualifies. */
function DueDate() {
  return <span className="text-disabled">({BILL_DUE})</span>
}

export function BayarButton({ onPay }: { onPay: () => void }) {
  const flow = useFlow()
  const s = useApp()

  if (s.billState === 'pending') {
    return (
      <TaskButton tone="orange" onClick={() => flow.go('pending')}>
        Cek status
      </TaskButton>
    )
  }
  // Cash with the officer, or settled: no control in either case. Nothing is
  // hers to chase once the money has left her hands — the next move is his —
  // and the dead "Lunas" pill was a button that could not be pressed, sitting
  // where every other row keeps a real one. The mark at the head of the row
  // says it without the false affordance.
  if (s.billState === 'titip') {
    return null
  }
  if (s.billState === 'paid' && s.paidAmount >= WEEKLY_BILL) {
    return null
  }
  return (
    <TaskButton tone="primary" onClick={onPay}>
      Bayar
    </TaskButton>
  )
}
