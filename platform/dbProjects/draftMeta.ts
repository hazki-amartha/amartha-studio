// =============================================================================
// DB projects · drafts — what a draft is, and what crosses the wire.
//
// A draft is a database project forked from another one, so someone can try a
// change without it showing on the project's link. It is a whole project of
// its own (its own /p/<slug>, Chat, Edit mode, laptop folder), plus one file
// that says what it is a draft of: draft.json. Pushing it merges its changes
// into the project and deletes it (./drafts.ts).
//
// Client-safe: no server imports here.
// =============================================================================

/** The file that makes a project a draft. JSON, so it is never compiled. */
export const DRAFT_FILE = 'draft.json'

export interface DraftMeta {
  /** The project this is a draft of. */
  draftOf: string
  /** What the person who started it called it. */
  name: string
  createdBy: string | null
  createdAt: string
  /**
   * The project as it was when the draft last caught up with it: the newest
   * history row (studio_project_file_versions.id) of the project at that
   * moment. The merge's common ancestor — every file's content at that point
   * is the newest history row at or below it.
   */
  baseVersion: number
}

export function parseDraftMeta(text: string): DraftMeta | null {
  try {
    const meta = JSON.parse(text) as Partial<DraftMeta>
    if (typeof meta.draftOf !== 'string' || typeof meta.name !== 'string' || typeof meta.baseVersion !== 'number') {
      return null
    }
    return {
      draftOf: meta.draftOf,
      name: meta.name,
      createdBy: meta.createdBy ?? null,
      createdAt: meta.createdAt ?? '',
      baseVersion: meta.baseVersion,
    }
  } catch {
    return null
  }
}

export const draftMetaText = (meta: DraftMeta) => `${JSON.stringify(meta, null, 2)}\n`

/** One draft, as the Drafts menu lists it. */
export interface DraftSummary {
  slug: string
  name: string
  createdBy: string | null
  createdAt: string
}

/** GET /api/db-projects/<slug>/draft */
export interface DraftsResponse {
  /** Set when <slug> is itself a draft. */
  draft: (DraftMeta & { parentName: string }) | null
  /** The drafts of <slug> — or, for a draft, of the project it belongs to. */
  drafts: DraftSummary[]
}

/** POST /api/db-projects/<slug>/draft */
export type DraftAction = { action: 'start'; name: string } | { action: 'push' } | { action: 'discard' }

export type DraftActionResult =
  | { ok: true; slug: string }
  | { ok: false; reason: string; conflicts?: string[]; problems?: string[] }
