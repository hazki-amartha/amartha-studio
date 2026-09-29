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
import type { DbProjectBuild } from './protocol'

export const FILES_TABLE = 'studio_project_files'

export function createAdminClient() {
  const env = supabaseEnv()
  const key = serviceRoleKey()
  if (!env || !key) return null
  return createClient(env.url, key, { auth: { autoRefreshToken: false, persistSession: false } })
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
      modules[path] = transform(content, {
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
async function tailwindFor(raw: string): Promise<string> {
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
