// =============================================================================
// DB projects · drafts — what a draft is, and what crosses the wire.
//
// A draft is a database project forked from another one, so someone can try a
// change without it showing on the project's link. It is a whole project of
// its own (its own /p/<slug>, Chat, Edit mode, laptop folder), plus one file
// that says what it is a draft of: draft.json. Pushing it merges its changes
// into the project and deletes it (./drafts.ts).
//
// A new one is private: only its designer and the studio's admins see it — in
// the branch list, on its link, in Chat, on laptops — until its designer shares
// it with the team. Sharing isn't pushing: the project's link is untouched
// until it's pushed. Only its designer or an admin pushes or discards it, or
// changes who sees it. The deployed studio enforces both (./branchAccess.ts).
//
// Client-safe: no server imports here.
// =============================================================================

import type { StudioUser } from '@/platform/auth/protocol'

/** The file that makes a project a draft. JSON, so it is never compiled. */
export const DRAFT_FILE = 'draft.json'

/** Private: its designer and admins. Team: everyone in the studio — what every
 *  branch was before branches could be private, so an older one reads as it. */
export type DraftVisibility = 'private' | 'team'

export interface DraftMeta {
  /** The project this is a draft of. */
  draftOf: string
  /** What the person who started it called it. */
  name: string
  /** Who started it, as the studio named them then — for showing. */
  createdBy: string | null
  /** Who started it, by account: names change, and this decides who may see
   *  and act on it. Null on branches started before it was kept. */
  createdByEmail: string | null
  visibility: DraftVisibility
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
      createdByEmail: typeof meta.createdByEmail === 'string' ? meta.createdByEmail.toLowerCase() : null,
      visibility: meta.visibility === 'private' ? 'private' : 'team',
      createdAt: meta.createdAt ?? '',
      baseVersion: meta.baseVersion,
    }
  } catch {
    return null
  }
}

export const draftMetaText = (meta: DraftMeta) => `${JSON.stringify(meta, null, 2)}\n`

// --- who may -------------------------------------------------------------------

/** Who is asking — a signed-in account, or null for nobody. */
export type DraftViewer = Pick<StudioUser, 'email' | 'displayName' | 'label' | 'role'>

/** The person who started it. Branches from before the account was kept know
 *  their designer only by the name they went by. */
function startedIt(meta: DraftMeta, viewer: DraftViewer): boolean {
  if (meta.createdByEmail) return viewer.email.toLowerCase() === meta.createdByEmail
  return meta.createdBy !== null && meta.createdBy === (viewer.displayName ?? viewer.label)
}

/** Shared with the team: everyone. Private: its designer and admins. */
export function canSeeDraft(meta: DraftMeta, viewer: DraftViewer | null): boolean {
  if (meta.visibility !== 'private') return true
  return Boolean(viewer && (viewer.role === 'admin' || startedIt(meta, viewer)))
}

/** Push it, discard it, or change who sees it: its designer and admins. */
export function canActOnDraft(meta: DraftMeta, viewer: DraftViewer | null): boolean {
  return Boolean(viewer && (viewer.role === 'admin' || startedIt(meta, viewer)))
}

/** A list of projects without the branches the viewer may not see. */
export function visibleTo<T extends { draft?: DraftMeta }>(items: T[], viewer: DraftViewer | null): T[] {
  return items.filter((c) => !c.draft || canSeeDraft(c.draft, viewer))
}

// --- the wire --------------------------------------------------------------------

/** One draft, as the Drafts menu lists it. */
export interface DraftSummary {
  slug: string
  name: string
  createdBy: string | null
  createdAt: string
  visibility: DraftVisibility
  /** The viewer may push it, discard it and change who sees it. */
  mayAct: boolean
}

/** GET /api/db-projects/<slug>/draft */
export interface DraftsResponse {
  /** Set when <slug> is itself a draft. */
  draft: (DraftMeta & { parentName: string; mayAct: boolean }) | null
  /** The drafts of <slug> the viewer may see — or, for a draft, of the project it belongs to. */
  drafts: DraftSummary[]
}

/** POST /api/db-projects/<slug>/draft */
export type DraftAction =
  | { action: 'start'; name: string }
  | { action: 'push' }
  | { action: 'discard' }
  | { action: 'visibility'; visibility: DraftVisibility }

export type DraftActionResult =
  | { ok: true; slug: string }
  | { ok: false; reason: string; conflicts?: string[]; problems?: string[] }

/** What a Chat agent is told when its project is a draft — the laptop's Chat
 *  and the deployed one alike. Without it, an agent reads "saves go live" and
 *  tells the designer their change is on the project's link when it isn't. */
export function draftChatLines(parentName: string): string[] {
  return [
    `This project is a BRANCH of “${parentName}”: a copy for trying changes without them`,
    `showing on that project’s link. Your saves reach this draft only — never tell the`,
    `designer a change is live on “${parentName}”. When they want it there (“push it”),`,
    'tell them to press Push on this branch in the branch menu atop the sidebar: it',
    'merges the branch into the project and deletes the branch. Chat cannot push it.',
  ]
}
