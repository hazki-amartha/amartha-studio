#!/usr/bin/env node
// =============================================================================
// db-live — keeps this laptop's copy of every database project in step with
// the database, both ways, while designers work on it with Claude Code.
//
// A database project (platform/dbProjects) has one shared copy, and it is
// live. Designers still work on files: each project is mirrored to
// projects/_db/<slug>/ (outside git and the type-check), and this process runs
// alongside the dev server — `npm run dev` starts it; one per laptop.
//
//   their save → your files    Every 2s it looks for files someone else saved.
//                              A file you haven't touched is replaced. A file
//                              you have is MERGED (git merge-file): their
//                              change and yours both kept.
//   your edit → the database   A few hundred ms after a file changes, it is
//                              saved through the dev server — the same checks
//                              as every save, and only if nobody saved that
//                              file since your copy of it. If someone did, it
//                              merges their version in and tries again.
//
// When a merge can't be done line by line (you both changed the same lines),
// the file gets git's conflict markers — <<<<<<< yours / >>>>>>> theirs —
// exactly as a merge would, and is not saved until they're resolved. Claude
// Code knows what to do with those; `npm run check:project` reports them.
//
// State (the database version each local file was last in step with) lives in
// node_modules/.cache/db-live/, so a restart picks up where it left off.
// =============================================================================

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, watch, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIR = join(ROOT, 'projects', '_db')
const CACHE = join(ROOT, 'node_modules', '.cache', 'db-live')
const STATE_FILE = join(CACHE, 'state.json')
const PID_FILE = join(CACHE, 'pid')
const API = 'http://127.0.0.1:4000'
const TABLE = 'studio_project_files'
const SYNCED = /\.(tsx?|jsx?|json)$/
const MARKERS = /^(<{7}|>{7}) /m
const POLL_MS = 2000
const SETTLE_MS = 400

const log = (msg) => console.log(`[db-live ${new Date().toLocaleTimeString()}] ${msg}`)

// --- setup ---------------------------------------------------------------------

function env(name) {
  if (process.env[name]) return process.env[name].trim()
  const file = join(ROOT, '.env.local')
  if (!existsSync(file)) return ''
  const line = readFileSync(file, 'utf8').split('\n').find((l) => l.startsWith(`${name}=`))
  return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '') : ''
}

const url = env('NEXT_PUBLIC_SUPABASE_URL')
const key = env('SUPABASE_SERVICE_ROLE_KEY')
if (!url || !key) {
  log('No Supabase keys in .env.local — database projects stay off this laptop.')
  process.exit(0)
}

mkdirSync(CACHE, { recursive: true })
// One per laptop: a second copy would race the first over the same files.
if (existsSync(PID_FILE)) {
  const pid = Number(readFileSync(PID_FILE, 'utf8'))
  try {
    if (pid && pid !== process.pid) {
      process.kill(pid, 0)
      process.exit(0)
    }
  } catch {
    // Stale pid file — that process is gone.
  }
}
writeFileSync(PID_FILE, String(process.pid))
const cleanup = () => {
  try {
    if (readFileSync(PID_FILE, 'utf8') === String(process.pid)) rmSync(PID_FILE)
  } catch {}
}
process.on('exit', cleanup)
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(0))

const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
let who = null
try {
  who = execFileSync('git', ['config', 'user.name'], { cwd: ROOT, encoding: 'utf8' }).trim() || null
} catch {}

/** slug → path → { base, at }: the database version this file was last in step with. */
let state = {}
try {
  state = JSON.parse(readFileSync(STATE_FILE, 'utf8'))
} catch {}
let saveTimer = null
function persist() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => writeFileSync(STATE_FILE, JSON.stringify(state)), 200)
}
function known(slug, rel) {
  return state[slug]?.[rel]
}
function remember(slug, rel, base, at) {
  ;(state[slug] ??= {})[rel] = { base, at }
  persist()
}

// --- files -----------------------------------------------------------------------

const local = (slug, rel) => join(DIR, slug, ...rel.split('/'))

function readLocal(slug, rel) {
  try {
    return readFileSync(local(slug, rel), 'utf8')
  } catch {
    return null
  }
}

function writeLocal(slug, rel, text) {
  const file = local(slug, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, text)
}

function localFiles(slug) {
  const root = join(DIR, slug)
  const out = new Map()
  const walk = (d) => {
    let names = []
    try {
      names = readdirSync(d)
    } catch {
      return
    }
    for (const name of names) {
      const p = join(d, name)
      if (statSync(p).isDirectory()) walk(p)
      else if (SYNCED.test(name)) out.set(relative(root, p).split(sep).join('/'), readFileSync(p, 'utf8'))
    }
  }
  walk(root)
  return out
}

/** git's three-way merge: `base` is what both started from. */
function merge3(base, yours, theirs) {
  const dir = mkdtempSync(join(tmpdir(), 'db-live-'))
  const [y, b, t] = ['yours', 'base', 'theirs'].map((n) => join(dir, n))
  writeFileSync(y, yours)
  writeFileSync(b, base)
  writeFileSync(t, theirs)
  try {
    const text = execFileSync('git', ['merge-file', '-p', '-L', 'yours', '-L', 'before', '-L', 'theirs (just saved)', y, b, t], {
      encoding: 'utf8',
    })
    return { clean: true, text }
  } catch (e) {
    if (typeof e.status === 'number' && e.status > 0 && typeof e.stdout === 'string') return { clean: false, text: e.stdout }
    throw e
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// --- their saves → this laptop -----------------------------------------------------

/** Bring one file up to the database's copy, keeping any local edit. */
function applyRemote(slug, rel, content, at) {
  const mine = readLocal(slug, rel)
  const was = known(slug, rel)
  if (mine === null || mine === content || (was && mine === was.base) || !was) {
    if (mine !== content) {
      if (mine !== null && !was) log(`${slug}/${rel}: replaced with the database copy (this laptop's copy predates the sync).`)
      writeLocal(slug, rel, content)
    }
    remember(slug, rel, content, at)
    return
  }
  const merged = merge3(was.base, mine, content)
  writeLocal(slug, rel, merged.text)
  remember(slug, rel, content, at)
  log(
    merged.clean
      ? `${slug}/${rel}: merged someone else's save into your edit.`
      : `${slug}/${rel}: CONFLICT — you and someone else changed the same lines. Resolve the <<<<<<< markers; it saves once they're gone.`,
  )
}

let polling = false
async function poll() {
  if (polling) return
  polling = true
  try {
    const { data, error } = await db.from(TABLE).select('slug, path, updated_at')
    if (error) throw new Error(error.message)
    const stale = new Map()
    for (const r of data) {
      if (known(r.slug, r.path)?.at === r.updated_at && existsSync(local(r.slug, r.path))) continue
      if (!stale.has(r.slug)) stale.set(r.slug, [])
      stale.get(r.slug).push(r.path)
    }
    for (const [slug, paths] of stale) {
      const { data: rows, error: e2 } = await db
        .from(TABLE)
        .select('path, content, updated_at')
        .eq('slug', slug)
        .in('path', paths)
      if (e2) throw new Error(e2.message)
      for (const r of rows) applyRemote(slug, r.path, r.content, r.updated_at)
    }
    // Catch edits the watcher missed.
    for (const slug of Object.keys(state)) queue(slug)
  } catch (e) {
    log(`Couldn't reach the database: ${e.message}`)
  } finally {
    polling = false
  }
}

// --- this laptop → the database ------------------------------------------------------

const lastRefused = new Map()

async function push(slug) {
  const changes = []
  for (const [rel, text] of localFiles(slug)) {
    const was = known(slug, rel)
    if (was && text === was.base) continue
    if (MARKERS.test(text)) continue
    changes.push({ path: rel, content: text, baseAt: was?.at ?? null })
  }
  if (!changes.length) return
  const signature = JSON.stringify(changes.map((c) => [c.path, c.content]))
  if (lastRefused.get(slug) === signature) return

  let res
  try {
    const r = await fetch(`${API}/api/db-projects/${encodeURIComponent(slug)}/sync`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ changes, by: who }),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    res = await r.json()
  } catch {
    return // The dev server isn't up yet; the next pass tries again.
  }

  for (const [rel, at] of Object.entries(res.saved)) {
    remember(slug, rel, changes.find((c) => c.path === rel).content, at)
    log(`${slug}/${rel}: saved — live on the link.`)
  }
  for (const c of res.conflicts) applyRemote(slug, c.path, c.content, c.at)
  if (res.problems.length) {
    lastRefused.set(slug, signature)
    log(`${slug}: not saved — ${res.problems.join('; ')}`)
  } else lastRefused.delete(slug)
}

const dirty = new Set()
let pushTimer = null
let pushing = Promise.resolve()
function queue(slug) {
  dirty.add(slug)
  clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    const slugs = [...dirty]
    dirty.clear()
    pushing = pushing.then(async () => {
      for (const s of slugs) await push(s)
    })
  }, SETTLE_MS)
}

// --- run -------------------------------------------------------------------------------

mkdirSync(DIR, { recursive: true })
log(`Live sync on — database projects are in projects/_db/. Saving as ${who ?? 'this laptop'}.`)
await poll()
watch(DIR, { recursive: true }, (_event, file) => {
  const slug = file ? String(file).split(sep)[0] : null
  if (slug) queue(slug)
})
setInterval(poll, POLL_MS)
