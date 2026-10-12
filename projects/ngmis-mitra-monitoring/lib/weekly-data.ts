// Shared mock model for the Weekly task tab and its weekly diagnosis drawer:
// the working week's days, and a day's per-task snapshot for a BP. Figures are
// derived from a small per-BP profile so the six BPs read differently without a
// hand-typed grid.

import type { Bp } from './daily-data'

export interface Day {
  label: string
  date: string
}

export const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
/** The Monday of the current week (the reporting date, 7 Agu 2026, is a Friday). */
export const THIS_MONDAY = new Date(2026, 7, 3)
export const OLDEST_WEEK = -4

const fmt = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

/** `week` is 0 for this week, -1 for last week, and so on. */
export function weekDays(week: number): Day[] {
  const monday = addDays(THIS_MONDAY, week * 7)
  return DAY_LABELS.map((label, i) => ({ label, date: fmt(addDays(monday, i)) }))
}

/** "3 Agu – 10 Agu 2026": Monday to the following Monday. */
export function weekRange(week: number): string {
  const monday = addDays(THIS_MONDAY, week * 7)
  const next = addDays(monday, 7)
  return `${fmt(monday)} – ${fmt(next)} ${next.getFullYear()}`
}

/** Per-BP profile: how often she misses a day's target (0–3). */
export const SLIP: Record<string, number> = {
  'bp-a': 1,
  'bp-b': 0,
  'bp-c': 3,
  'bp-d': 1,
  'bp-e': 2,
  'bp-f': 3,
}

/** The count tasks Progres harian's Tugas scorecard lists, with a day's target. */
export const COUNT_TASKS = [
  { id: 'pelayanan', label: 'Pelayanan', target: 6 },
  { id: 'home-visit', label: 'Home visit', target: 3 },
  { id: 'reaktivasi', label: 'Reaktivasi & lanjutan', target: 1 },
  { id: 'sosialisasi', label: 'Sosialisasi', target: 2 },
  { id: 'follow-up', label: 'Follow up', target: 2 },
]

export interface Snapshot {
  done: Record<string, number>
  reminded: boolean
  closed: boolean
}

export function snapshot(bp: Bp, dayIndex: number): Snapshot {
  const slip = SLIP[bp.id]
  const done: Record<string, number> = {}
  COUNT_TASKS.forEach((t, k) => {
    const miss = (dayIndex + k + slip) % 4 < slip
    done[t.id] = miss ? Math.max(0, t.target - 1 - ((dayIndex + k) % 2)) : t.target
  })
  return {
    done,
    reminded: (dayIndex + slip) % 4 !== 3 || slip === 0,
    closed: !((dayIndex + slip) % 3 === 0 && slip > 1),
  }
}
