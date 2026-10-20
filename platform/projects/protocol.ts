// =============================================================================
// New project · what crosses the wire between the gallery's New Project button
// and app/api/projects. The project is created in the database, so every save
// after that is live — the designer builds it by prompting in Chat or tweaking
// in Edit mode, with nothing to push.
// =============================================================================

import type { BusinessUnit, DeviceKind, Platform } from '@/platform/types'

/** A live reference a project can start inside: its start screen is copied in
 *  to change, and every other screen is inherited (`extends`). The platform and
 *  device come with it — a project inside A-Partner is an A-Partner project. */
export interface LiveStart {
  id: 'amarthafin-live' | 'apartner-sot' | 'ngmis-live'
  app: string
  platform: Platform
  device: DeviceKind
  /** Where the prototype opens, in the dialog's words. */
  opensOn: string
}

export const LIVE_STARTS: LiveStart[] = [
  { id: 'amarthafin-live', app: 'AmarthaFin', platform: 'AFIN', device: 'mobile', opensOn: 'its homepage' },
  { id: 'apartner-sot', app: 'A-Partner', platform: 'APartner', device: 'mobile', opensOn: 'Beranda, the BP’s home' },
  { id: 'ngmis-live', app: 'NG-MIS', platform: 'NGMIS', device: 'desktop', opensOn: 'the customer list' },
]

/** Where a project starts: one empty screen, or inside a live app. */
export type ProjectStart = 'blank' | LiveStart['id']

export const liveStart = (start: unknown): LiveStart | null => LIVE_STARTS.find((s) => s.id === start) ?? null

/** A blank project's frame follows its platform: NG-MIS is a desktop back office. */
export const deviceFor = (platform: Platform): DeviceKind => (platform === 'NGMIS' ? 'desktop' : 'mobile')

export interface NewProjectRequest {
  name: string
  /** Typed; matched to the names people go by, ignoring case. Ignored when
   *  signed in — the account names it. */
  owner?: string
  businessUnit: BusinessUnit
  /** A blank project's only — a live start brings its own. */
  platform?: Platform
  start: ProjectStart
}

/** `owner` comes back spelled the way the studio spells that designer.
 *  `signIn`: the laptop isn't signed in to the studio, which saving needs. */
export type NewProjectResponse =
  | { ok: true; slug: string; owner: string }
  | { ok: false; reason: string; signIn?: string }
