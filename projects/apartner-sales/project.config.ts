import type { ProjectConfig } from '@/platform/types'

export const config: ProjectConfig = {
  slug: 'apartner-sales',
  name: 'A-Partner Sales',
  businessUnit: 'Lending',
  platform: 'APartner',
  owner: ['Chandra', 'Hazki', 'Patricia'],
  description:
    "The BP's Sales module on its own — the lead pipeline, the follow-up call, and the sosialisasi that fills them.",
  device: 'mobile',
  status: 'draft',
  createdAt: '2026-09-08',
  updatedAt: '2026-09-09',
  // Only the Sales screens live here; everything else the BP can reach from
  // the tab bar is the Majelis View app itself.
  extends: 'apartner-majelis-view',
}
