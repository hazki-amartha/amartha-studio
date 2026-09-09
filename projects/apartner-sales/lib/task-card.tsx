'use client'

// The Sales page's group card — one per task type.
//
// The head is one line and only one line: an icon, the group's name, and how
// much of it is cleared. Everything else that used to sit up there — a flow
// line explaining the job, chips qualifying it — has gone, because the tasks
// themselves are now on the card, and a heading that explains what is directly
// underneath it is a heading nobody reads twice.
//
// The card does not drill down. Its tasks are NESTED inside it — the head is a
// heading, not a button, and carries no chevron, because there is nothing
// behind it to open: what the group contains is already on the card. The whole
// pipeline lives one level up, behind "Lihat semua" in the top bar.
//
// The bar is not decoration. A count alone ("5 of 15") is read as arithmetic; a
// bar is read as position, and position is what tells her at 14.00 whether the
// afternoon is recoverable. It sits under the title, inside the head, because
// it measures that name — and because a card that spends a full row on it reads
// taller than the fact deserves.

import type { ReactNode } from 'react'

export type Tint = 'primary' | 'blue' | 'green' | 'orange' | 'red'

// Each tint as a 50-tint ground under a 500 foreground — the same pairing the
// Badge uses, so an icon tile and a status badge on the same page agree.
const TILE: Record<Tint, string> = {
  primary: 'bg-primary-50 text-primary-500',
  blue: 'bg-blue-50 text-blue-500',
  green: 'bg-green-50 text-green-500',
  orange: 'bg-orange-50 text-orange-500',
  red: 'bg-red-50 text-red-500',
}

const FILL: Record<Tint, string> = {
  primary: 'bg-primary-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
}

/** The progress rail. Width is the one dimension that cannot come from a token. */
export function Meter({ percent, tint }: { percent: number; tint: Tint }) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div className="h-8 w-full rounded-full bg-neutral-200">
      <div className={`h-8 rounded-full ${FILL[tint]}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}

export function TaskCard({
  icon,
  tint,
  title,
  done,
  total,
  action,
  children,
}: {
  icon: ReactNode
  tint: Tint
  title: string
  /** How many of this task are cleared, and how many there are in total. */
  done: number
  total: number
  /** An action pinned to the head — an "add", not a way into the group. */
  action?: ReactNode
  /** The group's own tasks, drawn inside the card. */
  children?: ReactNode
}) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <div className="flex flex-col gap-12 rounded-16 bg-neutral-white p-12">
      {/* The head names the group, counts it, and carries the bar under the
          title rather than on a row of its own — the bar belongs to the name it
          measures, and a card that spends a whole row on it reads taller than
          the fact deserves. Nothing here is tappable: the tasks themselves are
          the targets, and they are below. */}
      <div className="flex items-stretch gap-8">
        {/* The tile stretches to the title-and-bar column, so the icon reads as
            the group's marker rather than as a bullet beside its first line. */}
        <span className={`flex w-32 shrink-0 items-center justify-center rounded-8 ${TILE[tint]}`}>
          {icon}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-4">
          {/* Name and count share the line; the bar runs the full width beneath
              them, so it measures the whole head rather than half of it. */}
          <span className="flex items-baseline gap-8">
            <span className="min-w-0 flex-1 truncate text-14 font-bold text-default">{title}</span>
            <span className="flex shrink-0 items-baseline gap-2">
              <span className="text-16 font-bold text-default">{done}</span>
              <span className="text-12 text-caption">/ {total}</span>
            </span>
          </span>
          <Meter percent={percent} tint={tint} />
        </span>
        {action ? <span className="shrink-0 self-center">{action}</span> : null}
      </div>

      {/* The group's tasks, inside the card that counts them. The bar is
          separation enough — a rule under it only draws a second line. */}
      {children ? <div className="flex flex-col gap-8">{children}</div> : null}
    </div>
  )
}

// --- Option B's task cards --------------------------------------------------
// Option A prints a task's facts as stacked caption lines, each prefixed by what
// it is ("Source: Referral · Ibu Yanti"). Option B prints them as LABELS: the
// prefix is what the chip already looks like. WHEN sits on the name's line, at
// the trailing edge, because down a stack of cards the times line up into a
// column the BP can read without reading anything else; WHO she is stays under
// the name, where a fact about the lead belongs. Only Option B does this — the
// two boards are being compared, so the difference has to stay on one of them.

/** A quiet label — a fact about a task, not a count of it. */
export function TaskLabel({ tint, children }: { tint?: Tint; children: ReactNode }) {
  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-full px-8 py-2 text-12 font-regular ${
        tint ? TILE[tint] : 'bg-neutral-200 text-neutral-700'
      }`}
    >
      {children}
    </span>
  )
}

/** The shell both Option B cards share: one tappable box. */
function BoardCardShell({ onOpen, children }: { onOpen: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-8 overflow-hidden rounded-12 border border-default bg-neutral-white p-12 text-left active:bg-neutral-50"
    >
      {children}
    </button>
  )
}

export function BoardLeadCard({
  name,
  schedule,
  late,
  source,
  address,
  onOpen,
}: {
  name: string
  /** "Hari ini" / "Kemarin" / "3 hari lagi" — the first label on the row. */
  schedule: string
  /** Days the follow-up has slipped; it tints the schedule label red. */
  late: number
  source: string
  address: string
  onOpen: () => void
}) {
  return (
    <BoardCardShell onOpen={onOpen}>
      <span className="flex w-full items-start gap-8">
        <span className="min-w-0 flex-1 truncate text-14 font-bold text-default">{name}</span>
        <TaskLabel tint={late > 0 ? 'red' : undefined}>{schedule}</TaskLabel>
      </span>
      {/* The source label scrolls rather than wraps: a referral can name both a
          person and her majelis, and a card that grows a line stops being
          scannable down the stack. */}
      <span className="flex w-full items-center overflow-x-auto">
        <TaskLabel>{source}</TaskLabel>
      </span>
      {address ? (
        <span className="w-full truncate text-12 text-caption">{address}</span>
      ) : null}
    </BoardCardShell>
  )
}

export function BoardPoiCard({
  title,
  schedule,
  poiType,
  place,
  onOpen,
}: {
  title: string
  schedule: string
  poiType: string
  place: string
  onOpen: () => void
}) {
  return (
    <BoardCardShell onOpen={onOpen}>
      <span className="flex w-full items-start gap-8">
        <span className="min-w-0 flex-1 truncate text-14 font-bold text-default">{title}</span>
        <TaskLabel>{schedule}</TaskLabel>
      </span>
      <span className="flex w-full items-center overflow-x-auto">
        <TaskLabel>{poiType}</TaskLabel>
      </span>
      <span className="w-full truncate text-12 text-caption">{place}</span>
    </BoardCardShell>
  )
}
