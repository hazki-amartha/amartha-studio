// =============================================================================
// DB projects · renaming a project and changing its owners — what crosses the
// wire (./details.ts does the work).
//
// Client-safe: no server imports here.
// =============================================================================

/** The longest name a project may have — the gallery card wraps, but not forever. */
export const NAME_MAX = 60

/** POST /api/db-projects/<slug>/details — either field, or both. */
export interface DetailsChange {
  name?: string
  owners?: string[]
}

export type DetailsResult = { ok: true } | { ok: false; reason: string }
