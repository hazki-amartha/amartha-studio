// =============================================================================
// Design · a file's version — the TypeScript twin of `versionOf` in stamp.cjs.
//
// Server-only (node:crypto). The loader stamps this hash beside every address;
// a backend recomputes it over the file it is about to write and refuses when
// they differ. scripts/test-design.mjs asserts the two implementations agree.
// =============================================================================

import { createHash } from 'crypto'

export function versionOf(source: string): string {
  return createHash('sha1').update(source).digest('hex').slice(0, 10)
}
