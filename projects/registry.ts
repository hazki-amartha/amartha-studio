// =============================================================================
// Project registry — APPEND-ONLY.
// Add exactly one line for your project above the marker comment.
// Never modify or remove another designer's line.
// =============================================================================

import type { Registry } from '@/platform/types'

export const registry: Registry = {
  'sample-topup': () => import('./sample-topup').then((m) => m.project),
  // <append new projects above this line — one line per project>
}
