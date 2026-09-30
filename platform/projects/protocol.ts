// =============================================================================
// New project · what crosses the wire between the gallery's New Project button
// and app/api/projects. The project is created in the database, so every save
// after that is live — the designer builds it by prompting in Chat or tweaking
// in Edit mode, with nothing to push.
// =============================================================================

import type { BusinessUnit, Platform } from '@/platform/types'
import owners from './owners.json'

/** The designers a project may name as owner — check:flows holds every
 *  project to the same list, so a name typed in the form must be one. */
export const OWNERS: readonly string[] = owners

/** Where a project starts: one empty screen, or inside the shipped
 *  AmarthaFin app (its home copied in to change, the rest inherited). */
export type ProjectStart = 'blank' | 'amarthafin-live'

export interface NewProjectRequest {
  name: string
  /** Typed; matched to OWNERS ignoring case. Ignored when signed in as a
   *  known designer — the account names it. */
  owner?: string
  businessUnit: BusinessUnit
  platform: Platform
  start: ProjectStart
}

/** `owner` comes back spelled the way the studio spells that designer. */
export type NewProjectResponse = { ok: true; slug: string; owner: string } | { ok: false; reason: string }

/** The known designer an account's name is, if it is one — first names are
 *  how OWNERS spells people ("Hazki Hariowibowo" → "Hazki"). */
export function ownerFor(label: string | null | undefined): string | null {
  const first = label?.trim().split(/[\s@._-]+/)[0]?.toLowerCase()
  return (first && OWNERS.find((o) => o.toLowerCase() === first)) || null
}
