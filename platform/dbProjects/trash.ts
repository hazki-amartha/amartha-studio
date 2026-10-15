// =============================================================================
// DB projects · delete a project, or restore it (./trashMeta.ts says what a
// deleted project is).
//
// Server-only. Who may: the project's owner, or a studio admin — editing is
// open to every editor, deleting isn't. What can't be deleted at all: a live
// project (production's record) and a project another one extends (it would
// break). A project's branches go with it and come back with it.
//
// A laptop holds no database key, so it passes the request on to the deployed
// studio as the designer signed in here; the studio decides.
// =============================================================================

import { configs as gitConfigs } from '@/projects/configs'
import { getStudioUser } from '@/platform/auth/server'
import type { MeResponse } from '@/platform/auth/protocol'
import { remote } from './remote'
import { announceSave, createAdminClient, FILES_TABLE, listDbConfigs, saveDbFiles, type DbProjectConfig } from './server'
import { deletedMetaText, TRASH_FILE, type DeleteState, type TrashAction, type TrashResult } from './trashMeta'

/** The person asking, as deleting needs them: their studio name and whether they're an admin. */
export interface Deleter {
  name: string
  admin: boolean
}

/**
 * Who is looking at the gallery. Deployed: their session. On a laptop: whoever
 * signed in here, as the deployed studio knows them — the laptop can't see
 * roles itself. Null when nobody is signed in.
 */
export async function currentDeleter(): Promise<Deleter | null> {
  const user =
    process.env.NODE_ENV === 'development' && !createAdminClient()
      ? await remote<MeResponse>('/api/me')
          .then((r) => r.user)
          .catch(() => null)
      : await getStudioUser()
  if (!user || (user.role !== 'editor' && user.role !== 'admin')) return null
  return { name: user.displayName ?? user.label, admin: user.role === 'admin' }
}

const owners = (c: { owner: string | string[] }) => (Array.isArray(c.owner) ? c.owner : [c.owner])

export function owns(who: Deleter, config: { owner: string | string[] }): boolean {
  return who.admin || owners(config).some((o) => o.trim().toLowerCase() === who.name.trim().toLowerCase())
}

/**
 * Whether `slug` can be deleted, ignoring who asks: null if it can, else why
 * not, in the words the gallery shows.
 */
async function blocker(slug: string, all: DbProjectConfig[]): Promise<string | null> {
  const self = all.find((c) => c.slug === slug)
  if (!self) return 'Only projects made in the studio can be deleted here.'
  if (self.status === 'live') return 'Live projects are production’s record and can’t be deleted.'
  const git = await Promise.all(Object.values(gitConfigs).map((load) => load()))
  const dependents = [...all.filter((c) => !c.deleted && !c.draft), ...git]
    .filter((c) => c.extends === slug && c.slug !== slug)
    .map((c) => c.name)
  if (dependents.length) return `Can’t delete — ${[...new Set(dependents)].join(', ')} build${dependents.length === 1 ? 's' : ''} on it.`
  return null
}

/** For each database project the person may delete: allowed, or why not. */
export async function deleteStates(who: Deleter | null): Promise<Record<string, DeleteState>> {
  if (!who) return {}
  const all = await listDbConfigs()
  const out: Record<string, DeleteState> = {}
  for (const c of all) {
    if (c.draft || c.deleted || !owns(who, c)) continue
    const reason = await blocker(c.slug, all)
    out[c.slug] = reason
      ? { ok: false, reason }
      : { ok: true, branches: all.filter((b) => b.draft?.draftOf === c.slug && !b.deleted).length }
  }
  return out
}

/** Delete or restore `slug`, as `who`. On a laptop, passed on to the studio. */
export async function trash(slug: string, action: TrashAction['action'], who: Deleter | null): Promise<TrashResult> {
  const db = createAdminClient()
  if (!db) {
    return remote<TrashResult>(`/api/db-projects/${encodeURIComponent(slug)}/trash`, {
      method: 'POST',
      body: JSON.stringify({ action }),
      write: true,
    })
  }
  if (!who) return { ok: false, reason: 'Sign in as a studio editor first.' }

  const all = await listDbConfigs()
  const self = all.find((c) => c.slug === slug)
  if (!self) return { ok: false, reason: 'That project isn’t in the studio.' }
  if (self.draft) return { ok: false, reason: 'A branch is discarded from its Edit panel, not deleted.' }
  if (!owns(who, self)) return { ok: false, reason: 'Only the project’s owner or a studio admin can do that.' }

  if (action === 'delete') {
    if (self.deleted) return { ok: true }
    const reason = await blocker(slug, all)
    if (reason) return { ok: false, reason }
    const deletedAt = new Date().toISOString()
    // Branches first: if this stops halfway, the project is still in the gallery to try again.
    for (const branch of all.filter((c) => c.draft?.draftOf === slug && !c.deleted)) {
      await saveDbFiles(
        branch.slug,
        [{ path: TRASH_FILE, content: deletedMetaText({ deletedAt, deletedBy: who.name, withProject: slug }) }],
        who.name,
      )
    }
    await saveDbFiles(slug, [{ path: TRASH_FILE, content: deletedMetaText({ deletedAt, deletedBy: who.name }) }], who.name)
    return { ok: true }
  }

  if (!self.deleted) return { ok: true }
  // The project first, so a half-done restore leaves it usable.
  const branches = all.filter((c) => c.deleted?.withProject === slug).map((c) => c.slug)
  for (const s of [slug, ...branches]) {
    const del = await db.from(FILES_TABLE).delete().eq('slug', s).eq('path', TRASH_FILE)
    if (del.error) throw new Error(del.error.message)
    await announceSave(s)
  }
  return { ok: true }
}
