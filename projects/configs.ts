// =============================================================================
// Project config registry — APPEND-ONLY, and the twin of registry.ts.
// Add exactly one line for your project above the marker comment.
// Never modify or remove another designer's line.
//
// Why this exists as its own file, rather than a second map inside
// registry.ts: a Server Component that imports a module is charged for
// everything reachable from it, and that includes modules behind a dynamic
// import(). registry.ts reaches every screen in the studio, so the gallery and
// the prototype route — which only ever want a project's NAME and STATUS —
// were loading every screen of every project just by importing it. Reading a
// config has to happen through a file that has never heard of the screens.
//
// So: server code imports this file, client code imports registry.ts. The two
// must list the same slugs; `npm run check:flows` fails if they drift.
// =============================================================================

import type { ConfigRegistry } from '@/platform/types'

export const configs: ConfigRegistry = {
  'apartner-majelis-view': () =>
    import('./apartner-majelis-view/project.config').then((m) => m.config),
  'afin-milestone-journey': () =>
    import('./afin-milestone-journey/project.config').then((m) => m.config),
  'afin-weekly-checkin': () => import('./afin-weekly-checkin/project.config').then((m) => m.config),
  'amarthafin-live': () => import('./amarthafin-live/project.config').then((m) => m.config),
  'ngmis-live': () => import('./ngmis-live/project.config').then((m) => m.config),
  'agent-dashboard': () =>
    import('./agent-dashboard/project.config').then((m) => m.config),
  'ngmis-bm-monitoring': () =>
    import('./ngmis-bm-monitoring/project.config').then((m) => m.config),
  'apartner-bm-majelis-view': () =>
    import('./apartner-bm-majelis-view/project.config').then((m) => m.config),
  'ngmis-bm-bp-progress': () =>
    import('./ngmis-bm-bp-progress/project.config').then((m) => m.config),
  'hello-world': () => import('./hello-world/project.config').then((m) => m.config),
  'ngmis-bm-monitoring-v2': () =>
    import('./ngmis-bm-monitoring-v2/project.config').then((m) => m.config),
  'ngmis-cash-outstanding': () =>
    import('./ngmis-cash-outstanding/project.config').then((m) => m.config),
  'afin-weekly-checkin-ut': () =>
    import('./afin-weekly-checkin-ut/project.config').then((m) => m.config),
  // <append new projects above this line — one line per project>
}
