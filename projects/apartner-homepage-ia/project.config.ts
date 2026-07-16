import type { ProjectConfig } from '@/platform/types'

export const config: ProjectConfig = {
  slug: 'apartner-homepage-ia',
  name: 'A-Partner — Homepage IA',
  owner: 'Chandra, Patricia',
  description:
    "Information-architecture exploration for the A-Partner field-officer app: three tabs (Beranda / Majelis / KPI) plus five pushed pages. The spine of it is the KPI page — each metric group links straight into the tasks that move it and into the majelis ranked worst-first on it, so a score always has a next action attached.",
  device: 'mobile',
  status: 'draft',
  createdAt: '2026-07-15',
  notes: [
    'Translated from the team\'s standalone JSX draft (apartner-homepage-ia v13).',
    'Tabs are real screens here, not in-place swaps — the bottom bar navigates with go(), and leaving a tab clears that tab\'s filters, as the source shell did.',
    'mitra-detail is built but has no inbound go(), mirroring the source, which keeps MitraDetail defined and deliberately unreachable. Open it from the flow view.',
  ],
}
