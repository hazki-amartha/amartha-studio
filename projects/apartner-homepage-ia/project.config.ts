import type { ProjectConfig } from '@/platform/types'

export const config: ProjectConfig = {
  slug: 'apartner-homepage-ia',
  name: 'Homepage-IA Concept',
  platform: 'APartner',
  owner: ['Chandra', 'Patricia'],
  description:
    'Information-architecture exploration for the A-Partner field-officer app: three tabs (Beranda / Majelis / KPI) plus eight pushed pages, including the full Kunjungan Majelis visit mode, a branching Kunjungan Rumah wizard, and a Setor Titip Bayar settlement flow. KPI is a flat-Rp model — each parameter earns its own bonus outright, and links straight into the tasks that move it.',
  device: 'mobile',
  status: 'draft',
  createdAt: '2026-07-15',
  updatedAt: '2026-07-20',
  notes: [
    'Translated from the team\'s standalone JSX draft (apartner-homepage-ia_6).',
    'Tabs are real screens here, not in-place swaps — the bottom bar navigates with go(), and leaving a tab clears that tab\'s filters, as the source shell did.',
    'mitra-detail is live in this revision (previously parked) — the source now routes Kunjungan Rumah tasks and browse-mode mitra cards straight to it.',
  ],
}
