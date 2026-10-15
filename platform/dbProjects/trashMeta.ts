// =============================================================================
// DB projects · deleting — what a deleted project is, and what crosses the wire.
//
// A deleted project keeps every file; one more, deleted.json, says it was
// deleted, by whom and when. That hides it from the gallery and the sidebar,
// lists it under "Recently deleted", and drops it from every laptop's
// projects/_db/ — and Restore is just removing the file again. After
// KEEP_DAYS the studio removes the project for good (./trash.ts).
//
// Client-safe: no server imports here.
// =============================================================================

/** The file that marks a project deleted. JSON, so it is never compiled. */
export const TRASH_FILE = 'deleted.json'

/** How long a deleted project can be restored. */
export const KEEP_DAYS = 30

export interface DeletedMeta {
  deletedAt: string
  deletedBy: string | null
  /** Set on a branch that went with its project — restoring the project brings it back. */
  withProject?: string
}

export function parseDeletedMeta(text: string): DeletedMeta | null {
  try {
    const meta = JSON.parse(text) as Partial<DeletedMeta>
    if (typeof meta.deletedAt !== 'string') return null
    return {
      deletedAt: meta.deletedAt,
      deletedBy: meta.deletedBy ?? null,
      ...(typeof meta.withProject === 'string' ? { withProject: meta.withProject } : {}),
    }
  } catch {
    return null
  }
}

export const deletedMetaText = (meta: DeletedMeta) => `${JSON.stringify(meta, null, 2)}\n`

/** Whole days until a project deleted at `deletedAt` is gone for good. */
export function daysLeft(deletedAt: string, now = Date.now()): number {
  const left = new Date(deletedAt).getTime() + KEEP_DAYS * 86_400_000 - now
  return Math.max(0, Math.ceil(left / 86_400_000))
}

/** POST /api/db-projects/<slug>/trash */
export type TrashAction = { action: 'delete' } | { action: 'restore' }

export type TrashResult = { ok: true } | { ok: false; reason: string }

/** Whether the person looking may delete a project, as the gallery shows it:
 *  allowed, or the reason it can't be deleted. Null means no menu at all. */
export type DeleteState = { ok: true; branches: number } | { ok: false; reason: string }
