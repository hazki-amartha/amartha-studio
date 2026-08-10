// =============================================================================
// Project registry — APPEND-ONLY.
// Add exactly one line for your project above the marker comment, and the
// matching line in projects/configs.ts. Never modify or remove another
// designer's line.
//
// This map loads a project's FULL module — screens included — so it is imported
// from client code only (the prototype view, the flow canvas, the shell's
// project list). Server code reads projects/configs.ts instead; see the note at
// the top of that file for why the two are kept apart.
// =============================================================================

import type { Registry } from '@/platform/types'

export const registry: Registry = {
  'apartner-majelis-view': () => import('./apartner-majelis-view').then((m) => m.project),
  'afin-milestone-journey': () => import('./afin-milestone-journey').then((m) => m.project),
  'afin-weekly-checkin': () => import('./afin-weekly-checkin').then((m) => m.project),
  'amarthafin-live': () => import('./amarthafin-live').then((m) => m.project),
  'ngmis-live': () => import('./ngmis-live').then((m) => m.project),
  'agent-dashboard': () => import('./agent-dashboard').then((m) => m.project),
  'ngmis-bm-monitoring': () => import('./ngmis-bm-monitoring').then((m) => m.project),
  'apartner-bm-majelis-view': () =>
    import('./apartner-bm-majelis-view').then((m) => m.project),
  'ngmis-bm-bp-progress': () => import('./ngmis-bm-bp-progress').then((m) => m.project),
  'hello-world': () => import('./hello-world').then((m) => m.project),
  'ngmis-bm-monitoring-v2': () => import('./ngmis-bm-monitoring-v2').then((m) => m.project),
  // <append new projects above this line — one line per project>
}
