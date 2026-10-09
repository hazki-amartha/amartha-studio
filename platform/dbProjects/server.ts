// =============================================================================
// DB projects · a project whose source lives in the studio database, not in git.
//
// Server-only. Two ways to the database, chosen by what this server holds:
//
//   the deployed studio   STUDIO_DB_SUPABASE_URL + _SERVICE_ROLE_KEY (put on
//                         Vercel by the Supabase integration): reads and writes
//                         the tables directly. The only place that does.
//   a laptop              neither — every read and save goes through the
//                         deployed studio's API (./remote.ts), as the designer
//                         signed in on this laptop. No laptop holds a key.
//
// The database is its own Supabase project (amartha-studio); Google sign-in
// stays on Vocus's. Tables: supabase/migrations/20260929_studio_project_files.sql.
//
// Reads a project's files, compiles each
// .ts/.tsx to a CommonJS module with Sucrase, and generates the Tailwind CSS
// for exactly the classes the files name. The browser (./loader.ts) links the
// modules against the studio's own design system and runtime — so a project
// ships only its own code, and a save shows up without a build or a deploy.
//
// Compiled output is cached per content hash: a save is a new hash, a re-read
// of unchanged files costs one query and no compile.
// =============================================================================

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import { transform } from 'sucrase'
import studioTailwind from '@/tailwind.config'
import type { ProjectConfig } from '@/platform/types'
import { SAVED_EVENT, savedChannel, type DbProjectBuild } from './protocol'
import { laptopCredentials, remote } from './remote'
import { DRAFT_FILE, parseDraftMeta, type DraftMeta } from './draftMeta'

export const FILES_TABLE = 'studio_project_files'
export const VERSIONS_TABLE = 'studio_project_file_versions'

// Design mode addresses a JSX node by `data-src="projects/<slug>/<file>:line:col"`,
// which the webpack loader stamps into git projects at build time. A database
// project never goes through webpack, so the same stamp runs here, before the
// compile — and Edit mode can address its elements exactly as it does a git
// project's.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { stampSource } = require('../design/stamp.cjs') as {
  stampSource: (source: string, file: string) => { code: string } | null
}

function adminEnv(): { url: string; key: string } | null {
  const url = process.env.STUDIO_DB_SUPABASE_URL?.trim()
  const key = process.env.STUDIO_DB_SUPABASE_SERVICE_ROLE_KEY?.trim()
  return url && key ? { url, key } : null
}

/** Direct access — the deployed studio only. Null on a laptop. */
export function createAdminClient() {
  const env = adminEnv()
  if (!env) return null
  return createClient(env.url, env.key, {
    auth: { autoRefreshToken: false, persistSession: false },
    // Next caches server-side fetch() by default, and supabase-js reads over
    // fetch — so the first read of a project was served forever after and
    // saves never reached the link. Every read must see the latest save.
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  })
}

const COMPILED = /\.(tsx?|jsx?)$/
const cache = new Map<string, DbProjectBuild>()

export async function buildDbProject(slug: string): Promise<DbProjectBuild | { error: string }> {
  let data: { path: string; content: string }[]
  try {
    data = [...(await readDbRows(slug))]
      .map(([path, r]) => ({ path, content: r.content }))
      .sort((a, b) => a.path.localeCompare(b.path))
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
  if (!data.length) return { error: `No files for "${slug}" in the database.` }

  const hash = createHash('sha1')
  for (const f of data) hash.update(f.path).update('\0').update(f.content).update('\0')
  const version = hash.digest('hex').slice(0, 12)
  const hit = cache.get(slug)
  if (hit?.version === version) return hit

  const modules: Record<string, string> = {}
  const errors: DbProjectBuild['errors'] = []
  const source: string[] = []
  for (const { path, content } of data) {
    if (!COMPILED.test(path)) continue
    source.push(content)
    try {
      const stamped = path.endsWith('.tsx') ? stampSource(content, `projects/${slug}/${path}`) : null
      modules[path] = transform(stamped?.code ?? content, {
        transforms: ['typescript', 'jsx', 'imports'],
        jsxRuntime: 'automatic',
        production: true,
        filePath: path,
      }).code
    } catch (e) {
      errors.push({ path, message: e instanceof Error ? e.message : String(e) })
    }
  }

  const build: DbProjectBuild = { slug, version, modules, css: await tailwindFor(source.join('\n')), errors }
  cache.set(slug, build)
  return build
}

/**
 * The utilities these files name, from the studio's own token-locked config.
 * The global stylesheet only holds classes some file in the repo names, so a
 * class that appears first in a database save would otherwise render as
 * nothing. Preflight and the config's safelist are left out: the page already
 * has both.
 */
export async function tailwindFor(raw: string): Promise<string> {
  const config = {
    ...studioTailwind,
    content: [{ raw, extension: 'tsx' }],
    safelist: [],
    corePlugins: { preflight: false },
  }
  const out = await postcss([tailwindcss(config)]).process('@tailwind components;\n@tailwind utilities;', {
    from: undefined,
  })
  return out.css
}

// --- writing -------------------------------------------------------------------

/** Every file of a project, path → content. Empty when it isn't in the database. */
export async function readDbFiles(slug: string): Promise<Map<string, string>> {
  return new Map([...(await readDbRows(slug))].map(([p, r]) => [p, r.content]))
}

/** The name a person shows up under in "Also here": their studio account's,
 *  or on a laptop, the name they signed in with — else git's user name. */
export function viewerName(signedIn: string | null | undefined): string | null {
  if (signedIn) return signedIn
  if (process.env.NODE_ENV !== 'development') return null
  const creds = laptopCredentials()
  if (creds?.name) return creds.name
  try {
    return execFileSync('git', ['config', 'user.name'], { encoding: 'utf8' }).trim() || null
  } catch {
    return null
  }
}

export async function isDbProject(slug: string): Promise<boolean> {
  const db = createAdminClient()
  if (!db) return (await listDbConfigs()).some((c) => c.slug === slug)
  const { count } = await db.from(FILES_TABLE).select('path', { count: 'exact', head: true }).eq('slug', slug)
  return (count ?? 0) > 0
}

/** Every file of every project, with when it was last saved — what the live
 *  sync polls to see what changed. */
export async function listDbChanges(): Promise<{ slug: string; path: string; at: string }[]> {
  const db = createAdminClient()
  if (!db) return (await remote<{ rows: { slug: string; path: string; at: string }[] }>('/api/db-projects/changes')).rows
  const { data, error } = await db.from(FILES_TABLE).select('slug, path, updated_at')
  if (error) throw new Error(error.message)
  return data.map((r) => ({ slug: r.slug as string, path: r.path as string, at: r.updated_at as string }))
}

/**
 * Save files to a project: the new content, one history row per file, and a
 * Realtime broadcast so every open /db/<slug> reloads. Returns each file's
 * history row id — the handle undo restores from.
 */
export async function saveDbFiles(
  slug: string,
  files: { path: string; content: string }[],
  by: string | null,
): Promise<Map<string, number>> {
  const ids = new Map<string, number>()
  if (!files.length) return ids
  const db = createAdminClient()
  if (!db) {
    // Through the studio, as a laptop: new files only (New Project).
    const { saved, conflicts } = await saveIfUnchanged(
      slug,
      files.map((f) => ({ ...f, baseAt: null })),
      by,
    )
    if (conflicts.length) throw new Error(`${conflicts.join(', ')} already exist.`)
    for (const [p, s] of saved) ids.set(p, s.id)
    return ids
  }
  const now = new Date().toISOString()
  const up = await db
    .from(FILES_TABLE)
    .upsert(files.map((f) => ({ slug, path: f.path, content: f.content, updated_at: now, updated_by: by })))
  if (up.error) throw new Error(up.error.message)
  const ver = await db
    .from(VERSIONS_TABLE)
    .insert(files.map((f) => ({ slug, path: f.path, content: f.content, saved_by: by })))
    .select('id, path')
  if (ver.error) throw new Error(ver.error.message)
  for (const row of ver.data) ids.set(row.path as string, row.id as number)
  await announceSave(slug)
  return ids
}

/** Every file of a project with the moment it was last saved — the token a
 *  conflict-safe save (saveIfUnchanged) compares against. */
export async function readDbRows(slug: string): Promise<Map<string, { content: string; at: string }>> {
  const db = createAdminClient()
  if (!db) {
    const { rows } = await remote<{ rows: { path: string; content: string; at: string }[] }>(
      `/api/db-projects/${encodeURIComponent(slug)}/files`,
    )
    return new Map(rows.map((r) => [r.path, { content: r.content, at: r.at }]))
  }
  const { data, error } = await db.from(FILES_TABLE).select('path, content, updated_at').eq('slug', slug)
  if (error) throw new Error(error.message)
  return new Map(data.map((r) => [r.path as string, { content: r.content as string, at: r.updated_at as string }]))
}

export interface GuardedChange {
  path: string
  content: string
  /** `updated_at` of the copy this change was made on; null for a new file. */
  baseAt: string | null
}

/**
 * Save each file only if nobody saved it since `baseAt` — the check and the
 * write are one statement, so two designers saving the same file at the same
 * moment can't both win. A file that moved on comes back in `conflicts` for
 * the caller to merge; the others are saved, recorded and announced.
 */
export async function saveIfUnchanged(
  slug: string,
  changes: GuardedChange[],
  by: string | null,
): Promise<{ saved: Map<string, { at: string; id: number }>; conflicts: string[] }> {
  const saved = new Map<string, { at: string; id: number }>()
  const conflicts: string[] = []
  if (!changes.length) return { saved, conflicts }
  const db = createAdminClient()
  if (!db) {
    // Through the studio, as this laptop's designer — the studio runs the same
    // checks and the same compare-and-set there.
    const res = await remote<{
      saved: Record<string, string>
      ids: Record<string, number>
      conflicts: { path: string }[]
      problems: string[]
    }>(`/api/db-projects/${encodeURIComponent(slug)}/sync`, {
      method: 'POST',
      body: JSON.stringify({ changes, by }),
      write: true,
    })
    if (res.problems.length) throw new Error(res.problems.join('; '))
    for (const [p, at] of Object.entries(res.saved)) saved.set(p, { at, id: res.ids[p] })
    return { saved, conflicts: res.conflicts.map((c) => c.path) }
  }

  for (const c of changes) {
    const now = new Date().toISOString()
    const row = { slug, path: c.path, content: c.content, updated_at: now, updated_by: by }
    const res =
      c.baseAt === null
        ? await db.from(FILES_TABLE).upsert(row, { onConflict: 'slug,path', ignoreDuplicates: true }).select('updated_at')
        : await db
            .from(FILES_TABLE)
            .update({ content: c.content, updated_at: now, updated_by: by })
            .eq('slug', slug)
            .eq('path', c.path)
            .eq('updated_at', c.baseAt)
            .select('updated_at')
    if (res.error) throw new Error(res.error.message)
    if (!res.data?.length) {
      conflicts.push(c.path)
      continue
    }
    const ver = await db
      .from(VERSIONS_TABLE)
      .insert({ slug, path: c.path, content: c.content, saved_by: by })
      .select('id')
      .single()
    if (ver.error) throw new Error(ver.error.message)
    saved.set(c.path, { at: res.data[0].updated_at as string, id: ver.data.id as number })
  }
  if (saved.size) await announceSave(slug)
  return { saved, conflicts }
}

/** The content a file had just before the save recorded as history row `id`. */
export async function contentBefore(
  slug: string,
  id: number,
): Promise<{ path: string; after: string | null; before: string | null } | null> {
  const db = createAdminClient()
  if (!db) {
    const res = await remote<{ snap: { path: string; after: string | null; before: string | null } | null }>(
      `/api/db-projects/${encodeURIComponent(slug)}/before?id=${id}`,
      { write: true },
    )
    return res.snap
  }
  const row = await db.from(VERSIONS_TABLE).select('path, content').eq('slug', slug).eq('id', id).maybeSingle()
  if (row.error || !row.data) return null
  const prev = await db
    .from(VERSIONS_TABLE)
    .select('content')
    .eq('slug', slug)
    .eq('path', row.data.path)
    .lt('id', id)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (prev.error || !prev.data) return null
  return { path: row.data.path as string, after: row.data.content as string | null, before: prev.data.content as string | null }
}

/** Tell open viewers a save landed — Realtime broadcast over REST. Best effort:
 *  a viewer that misses it still picks the save up on focus. */
export async function announceSave(slug: string): Promise<void> {
  const env = adminEnv()
  if (!env) return // A laptop saves through the studio, which announces.
  try {
    await fetch(`${env.url}/realtime/v1/api/broadcast`, {
      method: 'POST',
      cache: 'no-store',
      headers: { apikey: env.key, Authorization: `Bearer ${env.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ topic: savedChannel(slug), event: SAVED_EVENT, payload: { at: Date.now() } }] }),
    })
  } catch {
    // Viewers fall back to refetching on focus.
  }
}

// --- listing -------------------------------------------------------------------

/**
 * Run a project.config.ts and return its `config`. The file imports only types
 * (erased by the compile), so it runs with no module system at all — anything
 * else it reaches for gets an empty object and the result is checked.
 */
function configOf(slug: string, source: string): ProjectConfig | null {
  try {
    const code = transform(source, { transforms: ['typescript', 'imports'], production: true }).code
    const module = { exports: {} as Record<string, unknown> }
    // eslint-disable-next-line no-new-func
    new Function('require', 'module', 'exports', code)(() => ({}), module, module.exports)
    const config = module.exports.config as ProjectConfig | undefined
    return config && config.slug === slug && typeof config.name === 'string' ? config : null
  } catch {
    return null
  }
}

/** A database project's config, and — for a draft — the project it's a draft
 *  of (./drafts.ts). Drafts are projects too, so /p/<slug>, Chat and the
 *  laptop sync treat them like any other; only lists that show projects to
 *  people leave them out. */
export type DbProjectConfig = ProjectConfig & { draft?: DraftMeta }

/** The config of every project in the database, drafts included, newest first. */
let remoteConfigs: { at: number; list: Promise<DbProjectConfig[]> } | null = null

export async function listDbConfigs(): Promise<DbProjectConfig[]> {
  const db = createAdminClient()
  if (!db) {
    // A laptop: the studio's list, briefly cached — every page asks.
    if (!remoteConfigs || Date.now() - remoteConfigs.at > 3000) {
      remoteConfigs = {
        at: Date.now(),
        list: remote<{ projects: DbProjectConfig[] }>('/api/db-projects')
          .then((r) => r.projects)
          .catch(() => []),
      }
    }
    return remoteConfigs.list
  }
  const { data, error } = await db
    .from(FILES_TABLE)
    .select('slug, path, content')
    .in('path', ['project.config.ts', DRAFT_FILE])
  if (error) {
    console.error('[dbProjects] listing failed:', error.message)
    return []
  }
  const drafts = new Map(
    data.filter((r) => r.path === DRAFT_FILE).flatMap((r) => {
      const meta = parseDraftMeta(r.content as string)
      return meta ? [[r.slug as string, meta] as const] : []
    }),
  )
  return data
    .filter((r) => r.path === 'project.config.ts')
    .map((r) => configOf(r.slug as string, r.content as string))
    .filter((c): c is ProjectConfig => c !== null)
    .map((c) => (drafts.has(c.slug) ? { ...c, draft: drafts.get(c.slug) } : c))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Projects people pick from — the gallery, the sidebar: drafts left out. */
export async function listDbProjects(): Promise<ProjectConfig[]> {
  return (await listDbConfigs()).filter((c) => !c.draft)
}
