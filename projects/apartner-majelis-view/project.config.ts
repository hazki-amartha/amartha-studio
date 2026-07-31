import type { ProjectConfig } from '@/platform/types'

export const config: ProjectConfig = {
  slug: 'apartner-majelis-view',
  name: 'A-Partner New Concept',
  platform: 'APartner',
  owner: ['Chandra', 'Hazki', 'Patricia'],
  description:
    "The A-Partner field-officer app built around the majelis visit: a gated three-stage sequence — attendance, then collection, then growth. Collecting from a mitra opens a full page carrying her week-by-week repayment history, so the amount is negotiated against a visible ledger. Around it sits the BP's whole day: the task schedule, the majelis and mitra directories, home visits, prospecting, KPI, and the cash settlement and closing flows.",
  device: 'mobile',
  status: 'in-review',
  createdAt: '2026-07-20',
  updatedAt: '2026-07-31',
  notes: [
    'Attendance is a gate, not a step to skip: collection does not open until every mitra in the group is marked, because the register is a record other people read and audit later.',
    'Collection opens a full page rather than a sheet — the week strip, the outstanding split into this-week and missed, and a live "remaining after this" — because that is the moment the BP is negotiating an amount face to face with the mitra.',
    'The day is a flat list of tasks the BP can start in any order. A day does not run in clock order: she arrives early, a group is late, a doorstep is on the way back from the balai.',
  ],
}
