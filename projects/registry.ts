// =============================================================================
// Project registry — APPEND-ONLY.
// Add exactly one line for your project above the marker comment.
// Never modify or remove another designer's line.
// =============================================================================

import type { Registry } from '@/platform/types'

export const registry: Registry = {
  'sample-topup': () => import('./sample-topup').then((m) => m.project),
  'celengan-topup': () => import('./celengan-topup').then((m) => m.project),
  'apartner-homepage-ia': () => import('./apartner-homepage-ia').then((m) => m.project),
  // <append new projects above this line — one line per project>
}
