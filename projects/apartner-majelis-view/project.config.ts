import type { ProjectConfig } from '@/platform/types'

export const config: ProjectConfig = {
  slug: 'apartner-majelis-view',
  name: 'Majelis View Concept',
  platform: 'APartner',
  owner: ['Chandra', 'Hazki', 'Patricia'],
  description:
    'A third direction on the majelis visit, taking its flow from the Majelis View reference: a visit is a gated three-stage sequence — attendance, then collection, then growth — and collecting from a mitra opens a full page built around a week-by-week repayment strip rather than a bottom sheet. Forked from apartner-task-first, which instead records attendance and payment together in one pass.',
  device: 'mobile',
  status: 'draft',
  createdAt: '2026-07-20',
  updatedAt: '2026-07-23',
  notes: [
    'Sibling to apartner-task-first, not a replacement. That one puts attendance and payment on one card so the BP makes a single pass; this one gates collection behind a completed attendance step, which is what the reference direction specifies.',
    'The bet being tested: does a full collect PAGE — week strip, outstanding split into this-week / missed / partial balance, and a live "remaining after this" — beat a bottom sheet at the moment the BP is negotiating an amount in front of the mitra?',
    'Only the majelis branch exists here. There is no schedule, KPI, or home-visit flow — the majelis roster itself is the entry point.',
  ],
}
