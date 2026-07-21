// Copy this folder to projects/<your-slug>/ and fill in every field below.
// `slug` MUST match the folder name AND your line in projects/registry.ts.

import type { ProjectConfig } from '@/platform/types'

export const config: ProjectConfig = {
  slug: 'my-project', // kebab-case, unique across the repo
  name: 'My Project', // feature or initiative name — platform carries the product
  // platform: 'APartner', // 'APartner' | 'AFIN' | 'NGMIS' — omit for studio-internal work
  owner: 'Your Name', // the DESIGNER's name (or ['A', 'B'] for several) — ask if unknown; never guess
  description: 'One paragraph on what this prototype explores.',
  device: 'mobile', // v1 ships 'mobile' only
  status: 'draft', // 'draft' | 'in-review' | 'final'
  createdAt: '2026-01-01', // ISO date, set once at creation, never edited
  // updatedAt: '2026-01-01', // ISO date of the last meaningful change; omit until first edit
  // notes: ['Project-wide annotation shown beside the device on desktop.'],
}
