// Copy this folder to projects/<your-slug>/ and fill in every field.
// slug must match the folder name and your line in projects/registry.ts.

import type { ProjectConfig } from '@/platform/types'

export const config: ProjectConfig = {
  slug: 'my-project',
  name: 'My Project',
  owner: 'Your Name',
  description: 'One paragraph on what this prototype explores.',
  device: 'mobile',
  status: 'draft',
  createdAt: '2026-01-01',
}
