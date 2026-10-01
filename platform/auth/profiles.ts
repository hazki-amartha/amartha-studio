// =============================================================================
// Auth · the name each person goes by — server only.
//
// One name per Amartha account (studio_profiles, in the studio's own database:
// supabase/migrations/20261001_studio_profiles.sql). It is what their comments
// go out under and what their projects are owned under, so it must be unique.
//
// Made on first sign-in: user_roles.display_name when the studio owner set
// one, else the first name on the Google account ("Hazki Hariowibowo" →
// "Hazki"), else the email's — taking more of the name when that's taken. The
// person changes it from the account menu (renameProfile), which carries their
// database projects along.
//
// Before the table exists — or on a laptop, which holds no database key — the
// name is worked out the same way and simply not stored.
// =============================================================================

import { createClient } from '@supabase/supabase-js'
import owners from '@/platform/projects/owners.json'
import { configs } from '@/projects/configs'
import { remote } from '@/platform/dbProjects/remote'

const TABLE = 'studio_profiles'
const VALID = /^\p{L}[\p{L} .'-]{1,29}$/u

/** The studio database, deployed only (as platform/dbProjects/server.ts). */
function db() {
  const url = process.env.STUDIO_DB_SUPABASE_URL?.trim()
  const key = process.env.STUDIO_DB_SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  })
}

const same = (a: string, b: string) => a.toLocaleLowerCase() === b.toLocaleLowerCase()
const tidy = (name: string) => name.trim().replace(/\s+/g, ' ')
const capital = (word: string) => (word === word.toLowerCase() ? word.charAt(0).toUpperCase() + word.slice(1) : word)

/** Names to try for a new account, most wanted first. */
function candidates(email: string, seed: string | null, google: string | null): string[] {
  const out: string[] = []
  if (seed) out.push(tidy(seed))
  const words = (google ?? '').trim().split(/\s+/).filter(Boolean).map(capital)
  for (let n = 1; n <= words.length; n++) out.push(words.slice(0, n).join(' '))
  const local = email.split('@')[0].split(/[._-]+/).filter(Boolean).map(capital)
  for (let n = 1; n <= local.length; n++) out.push(local.slice(0, n).join(' '))
  return [...new Set(out.filter((c) => VALID.test(c)))]
}

// Read on every signed-in request, so kept briefly. A rename updates it here;
// other server instances catch up within the minute.
const cache = new Map<string, { name: string; at: number }>()
const TTL = 60_000

/**
 * The name this account goes by, made and stored on first sight. `seed` is
 * user_roles.display_name, `google` the Google profile's full name.
 */
export async function profileName(email: string, seed: string | null, google: string | null): Promise<string> {
  const key = email.toLowerCase()
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL) return hit.name
  const tries = candidates(key, seed, google)
  const fallback = tries[0] ?? key.split('@')[0]
  const client = db()
  if (!client) return fallback

  const found = await client.from(TABLE).select('name').eq('email', key).maybeSingle()
  if (found.error) {
    // Most likely the table isn't there yet: work it out, store nothing.
    console.error('[profiles] lookup failed:', found.error.message)
    return fallback
  }
  let name = (found.data?.name as string | undefined) ?? null
  if (!name) {
    for (let i = 0; i < tries.length + 3 && !name; i++) {
      // Every candidate taken: the first one, numbered.
      const want = i < tries.length ? tries[i] : `${fallback} ${i - tries.length + 2}`
      const made = await client.from(TABLE).insert({ email: key, name: want })
      if (!made.error) name = want
      else if (made.error.code === '23505') {
        // Unique violation: this name is someone else's — or this account was
        // made a moment ago by another request.
        const again = await client.from(TABLE).select('name').eq('email', key).maybeSingle()
        if (again.data?.name) name = again.data.name as string
      } else {
        console.error('[profiles] create failed:', made.error.message)
        return fallback
      }
    }
  }
  name ??= fallback
  cache.set(key, { name, at: Date.now() })
  return name
}

let names: { at: number; list: Promise<string[]> } | null = null

/** Every name a project may be owned under: the git roster (owners.json) and
 *  everyone who has signed in. A laptop asks the deployed studio. */
export async function knownNames(): Promise<string[]> {
  if (names && Date.now() - names.at < 30_000) return names.list
  const list = (async () => {
    const client = db()
    let stored: string[] = []
    if (client) {
      const { data, error } = await client.from(TABLE).select('name')
      if (!error) stored = data.map((r) => r.name as string)
    } else {
      stored = await remote<{ names: string[] }>('/api/names')
        .then((r) => r.names)
        .catch(() => [])
    }
    return [...new Set([...owners, ...stored])]
  })()
  names = { at: Date.now(), list }
  return list
}

export type RenameResult = { ok: true; name: string } | { ok: false; reason: string }

/**
 * Change the name an account goes by, and the owner of every database project
 * it owns. A git project's owner lives in a committed file, so whoever owns
 * one is renamed by the studio owner instead.
 */
export async function renameProfile(email: string, current: string, wanted: string): Promise<RenameResult> {
  const name = tidy(wanted)
  if (!VALID.test(name)) return { ok: false, reason: 'Use 2–30 letters — spaces, dots, hyphens and apostrophes are fine.' }
  if (name === current) return { ok: true, name }
  const client = db()
  if (!client) return { ok: false, reason: 'Names can’t be changed here — try again on the studio link.' }

  if (!same(name, current)) {
    const gitOwned: string[] = []
    for (const [slug, load] of Object.entries(configs)) {
      const config = await load().catch(() => null)
      if (config && [config.owner].flat().some((o) => same(o, current))) gitOwned.push(slug)
    }
    if (gitOwned.length) {
      return { ok: false, reason: `You own projects kept in git (${gitOwned.join(', ')}), so ask the studio owner to change your name.` }
    }
  }

  const key = email.toLowerCase()
  const saved = await client.from(TABLE).upsert({ email: key, name, updated_at: new Date().toISOString() })
  if (saved.error) {
    return {
      ok: false,
      reason: saved.error.code === '23505' ? `Someone already goes by “${name}”.` : 'Your name couldn’t be saved — try again.',
    }
  }
  cache.set(key, { name, at: Date.now() })
  names = null

  // Carry the database projects along. Loaded here only: it brings the
  // compiler with it, which no other path in this file needs.
  const { listDbConfigs, readDbFiles, saveDbFiles } = await import('@/platform/dbProjects/server')
  for (const config of await listDbConfigs()) {
    if (![config.owner].flat().some((o) => same(o, current))) continue
    const source = (await readDbFiles(config.slug)).get('project.config.ts')
    if (!source) continue
    const quoted = new RegExp(`(owner\\s*:[^\\n]*?)(['"\`])${current.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\2`, 'gi')
    const next = source.replace(quoted, (_, head: string, q: string) => `${head}${q}${name}${q}`)
    if (next !== source) await saveDbFiles(config.slug, [{ path: 'project.config.ts', content: next }], name)
  }
  return { ok: true, name }
}
