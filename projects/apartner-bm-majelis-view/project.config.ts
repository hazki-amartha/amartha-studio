import type { ProjectConfig } from '@/platform/types'

export const config: ProjectConfig = {
  slug: 'apartner-bm-majelis-view',
  name: 'A-Partner BM New Concept',
  platform: 'APartner',
  owner: ['Chandra', 'Hazki', 'Patricia'],
  description:
    "The A-Partner app seen from the Branch Manager's chair: the same majelis and mitra directories the BP works from, but filtered by Business Partner so the BM can read her branch one BP at a time. Her own day is the two briefings that bracket it — a morning briefing at the Amartha Point before the BPs go out, and an evening briefing when they come back.",
  device: 'mobile',
  status: 'draft',
  createdAt: '2026-08-06',
  notes: [
    'The BM manages Business Partners, so every majelis and mitra carries the BP who owns it — on the card and on the detail page — and the directories can be filtered down to a single BP.',
    'The card component is shared between the list and the detail page, so BP information reads identically in both places.',
    'The day is two fixed briefings at the Amartha Point rather than a route of visits: the BM opens and closes the branch day, the BPs run the field.',
  ],
}
