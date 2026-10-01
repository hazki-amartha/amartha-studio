// =============================================================================
// New project · what crosses the wire between the gallery's New Project button
// and app/api/projects. The project is created in the database, so every save
// after that is live — the designer builds it by prompting in Chat or tweaking
// in Edit mode, with nothing to push.
// =============================================================================

import type { BusinessUnit, Platform } from '@/platform/types'

/** Where a project starts: one empty screen, or inside the shipped
 *  AmarthaFin app (its home copied in to change, the rest inherited). */
export type ProjectStart = 'blank' | 'amarthafin-live'

export interface NewProjectRequest {
  name: string
  /** Typed; matched to the names people go by, ignoring case. Ignored when
   *  signed in — the account names it. */
  owner?: string
  businessUnit: BusinessUnit
  platform: Platform
  start: ProjectStart
}

/** `owner` comes back spelled the way the studio spells that designer. */
export type NewProjectResponse = { ok: true; slug: string; owner: string } | { ok: false; reason: string }
