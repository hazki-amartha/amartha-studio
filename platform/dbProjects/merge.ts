// =============================================================================
// DB projects · three-way merge on the server, for saves that find a file moved
// on since they read it (platform/chat/server/cloud.ts). The laptop sync does
// the same with `git merge-file` (scripts/db-live.mjs); a Vercel function has
// no git, so this is node-diff3, with the same conflict markers.
//
// One rule beyond a plain merge: where both sides only ADDED lines at the same
// spot and removed nothing — two sessions each appending a screen to index.ts —
// both additions are kept, theirs first (it was saved first). Anything else that
// touches the same lines is a real conflict and comes back marked.
// =============================================================================

import { diff3Merge } from 'node-diff3'

export interface MergeResult {
  text: string
  /** True when the text carries conflict markers and must not be saved. */
  conflict: boolean
}

export const CONFLICT_MARKER = /^(<{7}|={7}|>{7})( |$)/m

export function mergeText(base: string, yours: string, theirs: string): MergeResult {
  if (yours === theirs) return { text: yours, conflict: false }
  if (theirs === base) return { text: yours, conflict: false }
  if (yours === base) return { text: theirs, conflict: false }

  const out: string[] = []
  let conflict = false
  for (const region of diff3Merge(yours.split('\n'), base.split('\n'), theirs.split('\n'), { excludeFalseConflicts: true })) {
    if (region.ok) {
      out.push(...region.ok)
    } else if (region.conflict) {
      const { a, o, b } = region.conflict
      if (o.length === 0) {
        out.push(...b, ...a)
      } else {
        conflict = true
        out.push('<<<<<<< yours', ...a, '=======', ...b, '>>>>>>> theirs (just saved)')
      }
    }
  }
  return { text: out.join('\n'), conflict }
}
