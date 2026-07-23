// =============================================================================
// Project registry — APPEND-ONLY.
// Add exactly one line for your project above the marker comment.
// Never modify or remove another designer's line.
// =============================================================================

import type { Registry } from '@/platform/types'

export const registry: Registry = {
  'apartner-homepage-ia': () => import('./apartner-homepage-ia').then((m) => m.project),
  'homepage-card-states': () => import('./homepage-card-states').then((m) => m.project),
  'apartner-task-first': () => import('./apartner-task-first').then((m) => m.project),
  'apartner-majelis-view': () => import('./apartner-majelis-view').then((m) => m.project),
  'afin-milestone-journey': () => import('./afin-milestone-journey').then((m) => m.project),
  // <append new projects above this line — one line per project>
}
