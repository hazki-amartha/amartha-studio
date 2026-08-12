import type { ProjectConfig } from '@/platform/types'

export const config: ProjectConfig = {
  slug: 'apartner-majelis-view',
  name: 'A-Partner BP New Concept',
  businessUnit: 'Lending',
  platform: 'APartner',
  owner: ['Chandra', 'Hazki', 'Patricia'],
  description:
    'The BP\'s field day, built around a gated majelis visit: attendance, then collection, then growth.',
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
