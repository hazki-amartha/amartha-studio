// =============================================================================
// DB projects · drafts — start one, push it back, or throw it away.
//
// Server-only. A draft (./draftMeta.ts) is a copy of a project under its own
// slug, `<project>-draft-<name>`, with draft.json saying what it's a copy of
// and the project's newest history row at that moment (`baseVersion`).
//
//   start     copy every file of the project; project.config.ts gets the
//             draft's slug and name, so it's a valid project of its own.
//   push      a three-way merge per file — the project as the draft last saw
//             it (rebuilt from history at `baseVersion`), the draft, and the
//             project now. Lines only one side changed merge on their own.
//             Lines both changed are a conflict: nothing reaches the project;
//             instead the draft catches up with it, conflicting files marked
//             <<<<<<< yours / >>>>>>> theirs, and `baseVersion` moves up — so
//             once the markers are resolved, the next push goes through. A
//             clean merge passes the same checks as any save, lands, and the
//             draft is deleted.
//   discard   delete the draft.
//
// Like every other write, it happens on the deployed studio, which holds the
// database key. A laptop's dev server passes the request on as the designer
// signed in there (./remote.ts).
// =============================================================================

import { slugFor } from '@/platform/projects/server/create'
import { checkDbProject } from './checks'
import { DRAFT_FILE, draftMetaText, parseDraftMeta, type DraftActionResult, type DraftMeta, type DraftsResponse } from './draftMeta'
import { mergeText } from './merge'
import { remote } from './remote'
import {
  announceSave,
  createAdminClient,
  FILES_TABLE,
  listDbConfigs,
  readDbRows,
  saveDbFiles,
  saveIfUnchanged,
  VERSIONS_TABLE,
} from './server'

const CONFIG = 'project.config.ts'

export class DraftRefused extends Error {}

// --- project.config.ts -----------------------------------------------------------

const fieldPattern = (field: string) => new RegExp(`^(\\s*${field}\\s*:\\s*)(['"\`])((?:\\\\.|(?!\\2).)*)\\2`, 'm')

/** A string field of a config, as written. */
export function configField(source: string, field: string): string | null {
  const m = fieldPattern(field).exec(source)
  return m ? m[3].replace(/\\(.)/g, '$1') : null
}

function withConfigField(source: string, field: string, value: string): string {
  const quoted = `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
  return source.replace(fieldPattern(field), (_m, head: string) => `${head}${quoted}`)
}

/** The config as the other project would write it: its slug and its name. */
export const asProject = (source: string, slug: string, name: string) =>
  withConfigField(withConfigField(source, 'slug', slug), 'name', name)

// --- listing -------------------------------------------------------------------

/** Whether <slug> is a draft, and the drafts of its project. Reads only, so a
 *  laptop answers it from the studio's project list. */
export async function draftsOf(slug: string): Promise<DraftsResponse> {
  const configs = await listDbConfigs()
  const self = configs.find((c) => c.slug === slug)
  const parent = self?.draft?.draftOf ?? slug
  const parentName = configs.find((c) => c.slug === parent)?.name ?? parent
  return {
    draft: self?.draft ? { ...self.draft, parentName } : null,
    drafts: configs
      .filter((c) => c.draft?.draftOf === parent)
      .map((c) => ({ slug: c.slug, name: c.draft!.name, createdBy: c.draft!.createdBy, createdAt: c.draft!.createdAt }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  }
}

// --- the database, directly (the deployed studio) ---------------------------------

type Db = NonNullable<ReturnType<typeof createAdminClient>>

/** The project's newest history row — the point a draft forks or catches up at. */
async function newestVersion(db: Db, slug: string): Promise<number> {
  const { data, error } = await db
    .from(VERSIONS_TABLE)
    .select('id')
    .eq('slug', slug)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data?.id as number | undefined) ?? 0
}

/** Each file as it was at history row `version` — the merge's common ancestor. */
async function filesAt(db: Db, slug: string, version: number, paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  await Promise.all(
    paths.map(async (path) => {
      const { data, error } = await db
        .from(VERSIONS_TABLE)
        .select('content')
        .eq('slug', slug)
        .eq('path', path)
        .lte('id', version)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw new Error(error.message)
      if (typeof data?.content === 'string') out.set(path, data.content)
    }),
  )
  return out
}

async function deleteFiles(db: Db, slug: string, paths: string[], by: string | null) {
  if (!paths.length) return
  const del = await db.from(FILES_TABLE).delete().eq('slug', slug).in('path', paths)
  if (del.error) throw new Error(del.error.message)
  // A null content in history records the deletion.
  const ver = await db.from(VERSIONS_TABLE).insert(paths.map((path) => ({ slug, path, content: null, saved_by: by })))
  if (ver.error) throw new Error(ver.error.message)
}

async function deleteProject(db: Db, slug: string) {
  const del = await db.from(FILES_TABLE).delete().eq('slug', slug)
  if (del.error) throw new Error(del.error.message)
  await announceSave(slug)
}

async function draftOf(slug: string): Promise<{ meta: DraftMeta; rows: Map<string, { content: string; at: string }> }> {
  const rows = await readDbRows(slug)
  const meta = rows.get(DRAFT_FILE) ? parseDraftMeta(rows.get(DRAFT_FILE)!.content) : null
  if (!meta) throw new DraftRefused('This project isn’t a draft.')
  return { meta, rows }
}

// --- start -----------------------------------------------------------------------

export async function startDraft(project: string, name: string, by: string | null): Promise<DraftActionResult> {
  const db = createAdminClient()
  if (!db) return passOn(project, { action: 'start', name })

  const label = name.trim().slice(0, 40)
  // "Draft Hazki" shouldn't make <project>-draft-draft-hazki.
  const tail = slugFor(label).replace(/^draft-/, '') || slugFor(label)
  if (!tail) throw new DraftRefused('Give the draft a name with some letters or numbers in it.')

  const configs = await listDbConfigs()
  const parent = configs.find((c) => c.slug === project)
  if (!parent) throw new DraftRefused('Only a project that lives in the database can have drafts.')
  if (parent.draft) throw new DraftRefused('This is already a draft — start one from the project itself.')

  const taken = new Set(configs.map((c) => c.slug))
  const base = `${project}-draft-${tail}`
  let slug = base
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`

  // History first, files second: a save landing in between is then in the
  // draft's files but newer than its base, which merges as a change both
  // sides made identically — never as one the draft lost.
  const baseVersion = await newestVersion(db, project)
  const rows = await readDbRows(project)
  const files = [...rows]
    .filter(([path]) => path !== DRAFT_FILE)
    .map(([path, r]) => ({
      path,
      content: path === CONFIG ? asProject(r.content, slug, `${parent.name} · ${label}`) : r.content,
    }))
  const meta: DraftMeta = { draftOf: project, name: label, createdBy: by, createdAt: new Date().toISOString(), baseVersion }
  files.push({ path: DRAFT_FILE, content: draftMetaText(meta) })
  await saveDbFiles(slug, files, by)
  return { ok: true, slug }
}

// --- push ------------------------------------------------------------------------

export async function pushDraft(slug: string, by: string | null): Promise<DraftActionResult> {
  const db = createAdminClient()
  if (!db) return passOn(slug, { action: 'push' })

  const { meta, rows: draftRows } = await draftOf(slug)
  const project = meta.draftOf
  const caughtUpTo = await newestVersion(db, project)
  const live = await readDbRows(project)
  if (!live.size) throw new DraftRefused(`The project this is a draft of (${project}) isn’t in the studio any more.`)

  const draftConfig = draftRows.get(CONFIG)?.content
  const liveConfig = live.get(CONFIG)?.content
  const projectName = (liveConfig && configField(liveConfig, 'name')) ?? project
  const draftName = (draftConfig && configField(draftConfig, 'name')) ?? slug

  // The draft's files as the project would hold them.
  const yours = new Map<string, string>()
  for (const [path, r] of draftRows) {
    if (path === DRAFT_FILE) continue
    yours.set(path, path === CONFIG ? asProject(r.content, project, projectName) : r.content)
  }
  const paths = [...new Set([...yours.keys(), ...live.keys()])].filter((p) => p !== DRAFT_FILE)
  const base = await filesAt(db, project, meta.baseVersion, paths)

  const { result, conflicts } = mergeDraft(
    paths,
    base,
    yours,
    new Map([...live].map(([p, r]) => [p, r.content])),
  )

  if (conflicts.length) {
    await catchUp(db, slug, draftRows, result, { ...meta, baseVersion: caughtUpTo }, draftName, by)
    return {
      ok: false,
      reason: `${conflicts.length === 1 ? 'This file' : 'These files'} changed on the project in the same places as in this draft, so nothing went live. The draft now has both versions marked — resolve them, then push again.`,
      conflicts,
    }
  }

  const changed = [...result].filter(([path, text]) => text !== undefined && text !== live.get(path)?.content)
  const removed = [...result].filter(([path, text]) => text === undefined && live.has(path)).map(([path]) => path)
  if (!changed.length && !removed.length) {
    await deleteProject(db, slug)
    return { ok: true, slug: project }
  }

  const current = new Map([...live].map(([p, r]) => [p, r.content]))
  const after = new Map(current)
  for (const [path, text] of changed) after.set(path, text!)
  for (const path of removed) after.delete(path)
  const problems = await checkDbProject(
    project,
    after,
    current,
    changed.map(([p]) => p),
  )
  if (problems.length) {
    return { ok: false, reason: 'The draft can’t go live until these are fixed in it:', problems }
  }

  const saved = await saveIfUnchanged(
    project,
    changed.map(([path, content]) => ({ path, content: content!, baseAt: live.get(path)?.at ?? null })),
    by,
  )
  if (saved.conflicts.length) {
    // Someone saved the project between our read and our write. What did land
    // is the merge's result, so pushing again is safe: it merges from there.
    return { ok: false, reason: 'Someone saved to the project at the same moment — push again.' }
  }
  await deleteFiles(db, project, removed, by)
  if (removed.length) await announceSave(project)
  await deleteProject(db, slug)
  return { ok: true, slug: project }
}

/**
 * Every file as it ends up after the draft is merged into the project —
 * undefined meaning gone — and the files both sides changed in the same places.
 */
export function mergeDraft(
  paths: string[],
  base: Map<string, string>,
  yours: Map<string, string>,
  live: Map<string, string>,
): { result: Map<string, string | undefined>; conflicts: string[] } {
  const result = new Map<string, string | undefined>()
  const conflicts: string[] = []
  for (const path of paths) {
    const b = base.get(path)
    const y = yours.get(path)
    const t = live.get(path)
    if (y === b) result.set(path, t) // The draft didn't touch it.
    else if (y === undefined) result.set(path, t === b ? undefined : t) // Deleted in the draft — unless live changed it since.
    else if (t === undefined) result.set(path, y) // New in the draft, or live deleted what the draft changed: keep the draft's.
    else {
      const merged = mergeText(b ?? '', y, t)
      if (merged.conflict) conflicts.push(path)
      result.set(path, merged.text)
    }
  }
  return { result, conflicts }
}

/** Bring the draft up to the project: the merge's result, markers and all,
 *  saved into the draft, with its base moved to now. */
async function catchUp(
  db: Db,
  slug: string,
  draftRows: Map<string, { content: string; at: string }>,
  result: Map<string, string | undefined>,
  meta: DraftMeta,
  draftName: string,
  by: string | null,
) {
  const files: { path: string; content: string }[] = []
  const gone: string[] = []
  for (const [path, text] of result) {
    if (text === undefined) {
      if (draftRows.has(path)) gone.push(path)
      continue
    }
    const content = path === CONFIG ? asProject(text, slug, draftName) : text
    if (draftRows.get(path)?.content !== content) files.push({ path, content })
  }
  files.push({ path: DRAFT_FILE, content: draftMetaText(meta) })
  await saveDbFiles(slug, files, by)
  await deleteFiles(db, slug, gone, by)
}

// --- discard -------------------------------------------------------------------

export async function discardDraft(slug: string): Promise<DraftActionResult> {
  const db = createAdminClient()
  if (!db) return passOn(slug, { action: 'discard' })
  const { meta } = await draftOf(slug)
  await deleteProject(db, slug)
  return { ok: true, slug: meta.draftOf }
}

// --- a laptop ----------------------------------------------------------------------

function passOn(slug: string, body: { action: string; name?: string }): Promise<DraftActionResult> {
  return remote<DraftActionResult>(`/api/db-projects/${encodeURIComponent(slug)}/draft`, {
    method: 'POST',
    body: JSON.stringify(body),
    write: true,
  })
}
