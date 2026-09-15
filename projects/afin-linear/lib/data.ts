import type { AppState } from './store'

export const TOTAL_WEEKS = 48
export const STRETCH = 12
/** Majelis milestones at weeks 12, 24 and 36 — week 48 is the limit increase. */
export const MILESTONE_COUNT = 3
export const MILESTONES = [1, 2, 3]

export const CURRENT_LIMIT = 5_000_000
export const BONUS = 1_000_000
export const GROUP_SIZE = 15
/** Absences she can have and still be Sangat Lancar. */
export const ABSENCE_OK = 2

export const MAJELIS_NAME = 'Majelis Melati'

/** Her majelis, herself first. GROUP_SIZE long; the unpaid ones come off the end. */
export const MEMBERS: { name: string; ketua?: boolean }[] = [
  { name: 'Ibu Siti' },
  { name: 'Alen Kurnia', ketua: true },
  { name: 'Arin Nita' },
  { name: 'Suyamti' },
  { name: 'Dewi Sartika' },
  { name: 'Ratna Wati' },
  { name: 'Sri Wahyuni' },
  { name: 'Fitri Handayani' },
  { name: 'Nurul Hidayah' },
  { name: 'Marlina' },
  { name: 'Yuli Astuti' },
  { name: 'Wartini' },
  { name: 'Eka Susanti' },
  { name: 'Rohmah' },
  { name: 'Lestari' },
]

// --- Her own 48 weeks --------------------------------------------------------

export type Kondisi = 'sangat-lancar' | 'lancar' | 'kurang-lancar'

/**
 * `cap` is only ever shown as "s/d" — an upper bound, never a promise.
 * Kurang Lancar has none: the increase is not certain at all.
 */
export const KONDISI: Record<Kondisi, { label: string; intent: 'green' | 'orange'; cap: number | null }> = {
  'sangat-lancar': { label: 'Sangat Lancar', intent: 'green', cap: 8_000_000 },
  lancar: { label: 'Lancar', intent: 'green', cap: 7_500_000 },
  'kurang-lancar': { label: 'Kurang Lancar', intent: 'orange', cap: null },
}

export function kondisiOf(s: AppState): Kondisi {
  if (s.late.length > 0) return 'kurang-lancar'
  if (s.absent.length > ABSENCE_OK) return 'lancar'
  return 'sangat-lancar'
}

export const onTime = (s: AppState) => s.weeksDone - s.late.length
export const attended = (s: AppState) => s.weeksDone - s.absent.length
export const weeksLeft = (s: AppState) => TOTAL_WEEKS - s.weeksDone

// --- The majelis, every 12 weeks ---------------------------------------------

export type MilestoneStatus = 'siap' | 'cair' | 'lewat' | 'berjalan' | 'nanti'

/** The milestone now being walked toward, or null once week 36 is behind. */
export function currentMilestone(s: AppState): number | null {
  const i = Math.floor(s.weeksDone / STRETCH) + 1
  return i <= MILESTONE_COUNT ? i : null
}

export function milestoneStatus(s: AppState, index: number): MilestoneStatus {
  const closed = s.milestones[index - 1]
  if (closed) return closed
  return index === currentMilestone(s) ? 'berjalan' : 'nanti'
}

export function readyMilestone(s: AppState): number | null {
  const i = s.milestones.indexOf('siap')
  return i === -1 ? null : i + 1
}

export function weeksToMilestone(s: AppState): number {
  const m = currentMilestone(s)
  return m ? m * STRETCH - s.weeksDone : 0
}

/** She must pay on time herself, inside this stretch, to share the majelis's reward. */
export function eligible(s: AppState): boolean {
  const from = Math.floor(s.weeksDone / STRETCH) * STRETCH
  return !s.late.some((w) => w > from)
}

/** Weeks already behind her inside the stretch she is in, 0–12. */
export function stretchWeeks(s: AppState): number {
  const m = currentMilestone(s)
  return m ? s.weeksDone - (m - 1) * STRETCH : STRETCH
}

/** Everything a home option needs to say about the next bonus, in one value. */
export type BonusState =
  | { kind: 'ready'; index: number }
  | { kind: 'over' }
  | { kind: 'blocked'; index: number }
  | { kind: 'watch'; index: number; left: number; unpaid: number }
  | { kind: 'on-track'; index: number; left: number; missed: boolean }

export function bonusState(s: AppState): BonusState {
  const ready = readyMilestone(s)
  if (ready !== null) return { kind: 'ready', index: ready }
  const index = currentMilestone(s)
  if (index === null) return { kind: 'over' }
  if (!eligible(s)) return { kind: 'blocked', index }
  const left = weeksToMilestone(s)
  if (s.groupShort > 0) return { kind: 'watch', index, left, unpaid: s.groupShort }
  return { kind: 'on-track', index, left, missed: s.milestones[index - 2] === 'lewat' }
}

export type MajelisKondisi = 'lancar' | 'jaga'

export const MAJELIS_KONDISI: Record<MajelisKondisi, { label: string; intent: 'green' | 'orange' }> = {
  lancar: { label: 'Sangat Lancar', intent: 'green' },
  jaga: { label: 'Perlu Dijaga', intent: 'orange' },
}

export const majelisOf = (s: AppState): MajelisKondisi => (s.groupShort > 0 ? 'jaga' : 'lancar')

// --- Formatting --------------------------------------------------------------

export function short(amount: number): string {
  if (amount >= 1_000_000) {
    const jt = amount / 1_000_000
    return `Rp${Number.isInteger(jt) ? jt : jt.toFixed(1).replace('.', ',')}jt`
  }
  return `Rp${Math.round(amount / 1_000)}rb`
}

export function rupiah(amount: number): string {
  return `Rp${amount.toLocaleString('id-ID')}`
}
