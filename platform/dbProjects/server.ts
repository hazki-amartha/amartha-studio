// =============================================================================
// DB projects · a project whose source lives in Supabase, not projects/<slug>/.
// Proof of concept, served at /db/<slug>.
//
// Server-only. Reads the project's files (supabase/migrations/
// 20260929_studio_project_files.sql) with the service-role key, compiles each
// .ts/.tsx to a CommonJS module with Sucrase, and generates the Tailwind CSS
// for exactly the classes the files name. The browser (./loader.ts) links the
// modules against the studio's own design system and runtime — so a project
// ships only its own code, and a save shows up without a build or a deploy.
//
// Compiled output is cached per content hash: a save is a new hash, a re-read
// of unchanged files costs one query and no compile.
// =============================================================================

import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import { transform } from 'sucrase'
import studioTailwind from '@/tailwind.config'
import { serviceRoleKey, supabaseEnv } from '@/platform/auth/env'
import type { ProjectConfig } from '@/platform/types'
import { SAVED_EVENT, savedChannel, type DbProjectBuild } from './protocol'

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

export function createAdminClient() {
  const env = supabaseEnv()
  const key = serviceRoleKey()
  if (!env || !key) return null
  return createClient(env.url, key, {
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
  const db = createAdminClient()
  if (!db) return { error: 'Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).' }

  const { data, error } = await db.from(FILES_TABLE).select('path, content').eq('slug', slug).order('path')
  if (error) return { error: error.message }
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

/** One file's current content, or null when the project has no such file. */
export async function readDbFile(slug: string, path: string): Promise<string | null> {
  const db = createAdminClient()
  if (!db) throw new Error('Supabase is not configured.')
  const { data, error } = await db.from(FILES_TABLE).select('content').eq('slug', slug).eq('path', path).maybeSingle()
  if (error) throw new Error(error.message)
  return data?.content ?? null
}

/** Every file of a project, path → content. Empty when it isn't in the database. */
export async function readDbFiles(slug: string): Promise<Map<string, string>> {
  const db = createAdminClient()
  if (!db) throw new Error('Supabase is not configured.')
  const { data, error } = await db.from(FILES_TABLE).select('path, content').eq('slug', slug)
  if (error) throw new Error(error.message)
  return new Map(data.map((r) => [r.path as string, r.content as string]))
}

export async function isDbProject(slug: string): Promise<boolean> {
  const db = createAdminClient()
  if (!db) return false
  const { count } = await db.from(FILES_TABLE).select('path', { count: 'exact', head: true }).eq('slug', slug)
  return (count ?? 0) > 0
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
  if (!db) throw new Error('Supabase is not configured.')
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

/** The content a file had just before the save recorded as history row `id`. */
export async function contentBefore(
  slug: string,
  id: number,
): Promise<{ path: string; after: string | null; before: string | null } | null> {
  const db = createAdminClient()
  if (!db) throw new Error('Supabase is not configured.')
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
  const env = supabaseEnv()
  const key = serviceRoleKey()
  if (!env || !key) return
  try {
    await fetch(`${env.url}/realtime/v1/api/broadcast`, {
      method: 'POST',
      cache: 'no-store',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
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

/** The config of every project in the database, newest first. */
export async function listDbConfigs(): Promise<ProjectConfig[]> {
  const db = createAdminClient()
  if (!db) return []
  const { data, error } = await db.from(FILES_TABLE).select('slug, content').eq('path', 'project.config.ts')
  if (error) {
    console.error('[dbProjects] listing failed:', error.message)
    return []
  }
  return data
    .map((r) => configOf(r.slug as string, r.content as string))
    .filter((c): c is ProjectConfig => c !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
