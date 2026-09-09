'use client'

// The Sales page as a board of TASK CATEGORIES, not an agenda.
//
// The redesign groups the BP's day by the KIND of sales task rather than by
// clock slot: Reactivation, POI Visit, 2nd Follow-up, Referral, 1st Follow-up.
// Each category shows a "selesai / total" tally and a short stack of the tasks
// still open; a "Lihat semua" link opens the full list for that category.
//
// A task is one of two things — a lead to work, or a POI to visit — and every
// task belongs to exactly one category, derived here so the screens stay thin.
//
//   reactivation      a cold lead (not-interested / rejected) waiting to reopen
//   poi-visit         a scheduled sosialisasi (a SosialisasiEvent)
//   second-follow-up  a POI-sourced lead already called at least once
//   referral          a lead who came in through a referral
//   first-follow-up   a POI-sourced lead not yet followed up by phone
//
// "done" marks a task the BP has already carried past its work: a lead that has
// reached a survey (survey-created onward) is a follow-up/referral that paid
// off, so it counts as completed rather than pending. Cold leads and POI visits
// are never "done" here — reactivation waits on a date, and a visit is run in
// its own screen.

import type { ReactNode } from 'react'
import { EVENTS, type SosialisasiEvent } from './events'
import { addressLine, majelisLine, sourceDetail, type Agenda, type PipelineLead } from './pipeline'

export type TaskCategory =
  | 'reactivation'
  | 'poi-visit'
  | 'second-follow-up'
  | 'referral'
  | 'first-follow-up'

/**
 * The order the categories stack in. Per the wireframe note ("sorting of task
 * category will get adjusted"), this is the one place that order is decided.
 */
export const TASK_CATEGORY_ORDER: TaskCategory[] = [
  'reactivation',
  'poi-visit',
  'second-follow-up',
  'referral',
  'first-follow-up',
]

export const TASK_CATEGORY_LABEL: Record<TaskCategory, string> = {
  reactivation: 'Reactivation',
  'poi-visit': 'POI Visit',
  'second-follow-up': '2nd Follow-up',
  referral: 'Referral',
  'first-follow-up': '1st Follow-up',
}

/**
 * Whether a lead still belongs on the Sales list at all. Once her application
 * is under way — a survey has been created for her (assisted or self), through
 * submission and approval — she leaves Sales for the Mitra list; the BP has no
 * follow-up to schedule, the system is processing her. Sales carries only leads
 * still being worked (new / interested) or waiting to reopen (the two cold
 * statuses), and every one of those always has a next follow-up scheduled.
 */
export function inSalesFunnel(lead: PipelineLead): boolean {
  return (
    lead.status === 'new' ||
    lead.status === 'interested' ||
    lead.status === 'not-interested' ||
    lead.status === 'rejected'
  )
}

/** Which category a lead sits in — one bucket each, by a fixed priority. */
export function leadCategory(lead: PipelineLead): TaskCategory {
  if (lead.status === 'not-interested' || lead.status === 'rejected') return 'reactivation'
  // An application under way — assisted saved, or self-service sent — is a repeat
  // touch, so she sits with the 2nd follow-ups.
  if (lead.assistedStarted || lead.selfServiceStarted) return 'second-follow-up'
  if (lead.source === 'referral') return 'referral'
  const calls = lead.log.filter((l) => l.via === 'telepon').length
  return calls >= 1 ? 'second-follow-up' : 'first-follow-up'
}

// --- The unified task list -------------------------------------------------

/**
 * How many days from today a task is due: 0 today, negative overdue, positive
 * upcoming. `dueDays` on the agenda is the source of truth; a row without one
 * falls back to its `day` bucket (today → 0, upcoming → +3) so older seed data
 * still schedules sensibly. A task with no agenda at all counts as due today.
 */
export function agendaDueDays(agenda?: Agenda): number {
  if (!agenda) return 0
  if (typeof agenda.dueDays === 'number') return agenda.dueDays
  return agenda.day === 'today' ? 0 : 3
}

/** Days a lead's follow-up is overdue — 0 when it is on time or still upcoming. */
export function overdueDays(agenda?: Agenda): number {
  const d = agendaDueDays(agenda)
  return d < 0 ? -d : 0
}

export type SalesTask =
  | {
      kind: 'lead'
      id: string
      category: TaskCategory
      dueDays: number
      lead: PipelineLead
    }
  | {
      kind: 'poi'
      id: string
      category: 'poi-visit'
      dueDays: number
      event: SosialisasiEvent
    }

/** Every task the Sales page knows about — categorised leads plus scheduled POIs.
 *  Completed POIs are dropped: a finished sosialisasi has no next schedule. */
export function buildTasks(leads: PipelineLead[], completedPois: string[] = []): SalesTask[] {
  const leadTasks: SalesTask[] = leads
    // Leads whose application has started have left for the Mitra list.
    .filter(inSalesFunnel)
    .map((lead) => ({
      kind: 'lead',
      id: lead.id,
      category: leadCategory(lead),
      dueDays: agendaDueDays(lead.agenda),
      lead,
    }))
  // Only POIs actually on the calendar are tasks; the historical one (no agenda)
  // exists so leads have somewhere to have come from, not as a visit to run — and
  // a completed one has dropped its schedule, so it is no longer a task either.
  const poiTasks: SalesTask[] = EVENTS.filter(
    (e) => e.agenda && !completedPois.includes(e.id),
  ).map((event) => ({
    kind: 'poi',
    id: event.id,
    category: 'poi-visit',
    dueDays: agendaDueDays(event.agenda),
    event,
  }))
  return [...leadTasks, ...poiTasks]
}

/**
 * The Sales board's slice: everything due — today's tasks AND any follow-up
 * already overdue. A missed follow-up is still today's work, so it rides the
 * board alongside the ones freshly scheduled for today; only tasks dated
 * forward wait behind "Lihat semua".
 */
export function dueTasks(tasks: SalesTask[]): SalesTask[] {
  return tasks.filter((t) => t.dueDays <= 0)
}

export interface CategoryTally {
  category: TaskCategory
  tasks: SalesTask[]
  total: number
}

/** Groups tasks into the fixed category order, most overdue first. */
export function tallyByCategory(tasks: SalesTask[]): CategoryTally[] {
  return TASK_CATEGORY_ORDER.map((category) => {
    const inCat = tasks
      .filter((t) => t.category === category)
      // Ascending dueDays: overdue (negative) first, then today, then upcoming.
      .sort((a, b) => a.dueDays - b.dueDays)
    return { category, tasks: inCat, total: inCat.length }
  })
}

/** Does this task match a free-text query (name / source / POI title)? */
export function taskMatches(task: SalesTask, q: string): boolean {
  if (!q) return true
  const needle = q.toLowerCase()
  if (task.kind === 'lead') {
    return (
      task.lead.name.toLowerCase().includes(needle) ||
      sourceDetail(task.lead).toLowerCase().includes(needle)
    )
  }
  return (
    task.event.title.toLowerCase().includes(needle) ||
    task.event.poiType.toLowerCase().includes(needle)
  )
}

// --- Card field helpers ----------------------------------------------------

/**
 * A lead's follow-up date, at the top of her card, as the BP reads it — when
 * the follow-up is due, relative to today. An overdue one says so ("Kemarin",
 * "3 hari lalu") rather than "Hari ini", which is how the card admits it slipped.
 */
export function leadScheduleLabel(agenda?: Agenda): string {
  const d = agendaDueDays(agenda)
  if (d === 0) return 'Hari ini'
  if (d < 0) return d === -1 ? 'Kemarin' : `${-d} hari lalu`
  return d === 1 ? 'Besok' : `${d} hari lagi`
}

/**
 * A POI visit's slot, keeping its time — an appointment, not a follow-up, so it
 * is never "overdue": "Hari ini, 14.00" / "Besok, 14.00".
 */
export function poiScheduleLabel(agenda?: Agenda): string {
  if (!agenda) return 'Belum dijadwalkan'
  if (agendaDueDays(agenda) <= 0) {
    return /hari ini/i.test(agenda.when) ? 'Hari ini' : `Hari ini, ${agenda.when}`
  }
  return agenda.when
}

// --- Selected category (survives navigation to the see-all screen) ---------
// A plain module value, like `addLeadEntry`: set right before navigating to the
// task-list screen, read once on mount. State inside a screen is lost on nav.

let selectedCategory: TaskCategory = 'reactivation'

export function setSelectedCategory(category: TaskCategory) {
  selectedCategory = category
}

export function getSelectedCategory(): TaskCategory {
  return selectedCategory
}

// --- Shared task cards -----------------------------------------------------
// Both the Sales board and the see-all list draw the same two cards, so a task
// reads identically wherever the BP meets it.

/** The shell both card kinds share: one tappable box. */
function TaskCardShell({ onOpen, children }: { onOpen: () => void; children: ReactNode }) {
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

export function LeadTaskCard({ lead, onOpen }: { lead: PipelineLead; onOpen: () => void }) {
  const address = addressLine(lead.address)
  const late = overdueDays(lead.agenda)
  return (
    <TaskCardShell onOpen={onOpen}>
      <div className="flex w-full items-start gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* The follow-up date leads the card. It turns orange & bold when
              overdue — the only lateness mark; no separate footer. */}
          <span
            className={
              late > 0
                ? 'truncate text-12 font-bold text-orange-500'
                : 'truncate text-12 text-caption'
            }
          >
            {leadScheduleLabel(lead.agenda)}
          </span>
          <span className="truncate text-16 font-bold text-default">{lead.name}</span>
          <span className="truncate text-12 text-caption">
            Source:{' '}
            {lead.status === 'not-interested' || lead.status === 'rejected'
              ? `Reaktivasi — eks ${majelisLine(lead)}`
              : sourceDetail(lead)}
          </span>
          {address ? <span className="truncate text-12 text-caption">{address}</span> : null}
        </div>
      </div>
    </TaskCardShell>
  )
}

export function PoiTaskCard({
  event,
  onOpen,
}: {
  event: SosialisasiEvent
  onOpen: () => void
}) {
  return (
    <TaskCardShell onOpen={onOpen}>
      <div className="flex w-full min-w-0 flex-col gap-2">
        <span className="truncate text-12 text-caption">{poiScheduleLabel(event.agenda)}</span>
        <span className="truncate text-16 font-bold text-default">{event.title}</span>
        <span className="truncate text-12 text-caption">Lokasi: {event.place}</span>
      </div>
    </TaskCardShell>
  )
}
