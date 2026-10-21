// =============================================================================
// DB projects · who may see a branch (./draftMeta.ts says what private means).
//
// Server-only. The deployed studio holds the database, so it is where a private
// branch is kept from everyone but its designer and the admins: every route
// that hands out a project's build, files, changes, history, comments or share
// links asks here first, and lists leave out what the viewer may not see.
//
// A laptop reads all of it from the deployed studio as its signed-in designer
// (./remote.ts), so what reaches a laptop is already filtered — the live sync
// never gets a copy of someone else's private branch, and drops one that goes
// private. On a laptop these checks pass.
// =============================================================================

import { requestUser } from '@/platform/auth/laptop'
import type { MeResponse, StudioUser } from '@/platform/auth/protocol'
import { shareAccess } from '@/platform/share/server/access'
import { canSeeDraft, DRAFT_FILE, parseDraftMeta, type DraftMeta } from './draftMeta'
import { remote } from './remote'
import { createAdminClient, FILES_TABLE } from './server'

/** Who is asking. Deployed: their session or their laptop's token. On a
 *  laptop's dev server: whoever signed in on it, as the deployed studio knows
 *  them — the laptop holds no roles of its own. */
export async function viewerOf(request: Request): Promise<StudioUser | null> {
  const user = await requestUser(request)
  if (user || process.env.NODE_ENV !== 'development' || createAdminClient()) return user
  return remote<MeResponse>('/api/me')
    .then((r) => r.user)
    .catch(() => null)
}

/** <slug>'s draft.json, when it is a branch. Null on a laptop, which can't ask. */
async function branchMeta(slug: string): Promise<DraftMeta | null> {
  const db = createAdminClient()
  if (!db) return null
  const { data } = await db.from(FILES_TABLE).select('content').eq('slug', slug).eq('path', DRAFT_FILE).maybeSingle()
  return typeof data?.content === 'string' ? parseDraftMeta(data.content) : null
}

/** Every project but a private branch the viewer didn't start (unless they're
 *  an admin). With `shared`, a share link to it opens it too — its designer
 *  made that link to show it. */
export async function maySee(slug: string, viewer: StudioUser | null, { shared = false } = {}): Promise<boolean> {
  const meta = await branchMeta(slug)
  if (!meta || canSeeDraft(meta, viewer)) return true
  return shared && (await shareAccess(slug)) !== null
}

/** The branches among every project the viewer may not see — what the live
 *  sync's change feed leaves out. One small read: only draft.json rows. */
export async function hiddenBranches(viewer: StudioUser | null): Promise<Set<string>> {
  const db = createAdminClient()
  if (!db) return new Set()
  const { data, error } = await db.from(FILES_TABLE).select('slug, content').eq('path', DRAFT_FILE)
  if (error) throw new Error(error.message)
  return new Set(
    data.flatMap((r) => {
      const meta = parseDraftMeta(r.content as string)
      return meta && !canSeeDraft(meta, viewer) ? [r.slug as string] : []
    }),
  )
}

/** What someone who may not open a branch is told. Its name and designer
 *  stay private; the link already says it's a branch. */
export const PRIVATE_BRANCH = 'This branch is private — only its designer and studio admins can open it.'
