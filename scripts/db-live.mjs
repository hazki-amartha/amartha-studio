#!/usr/bin/env node
// =============================================================================
// db-live — keeps this laptop's copy of every database project in step with
// the database, both ways, while designers work on it with Claude Code.
//
// A database project (platform/dbProjects) has one shared copy, and it is
// live. Designers still work on files: each project is mirrored to
// projects/_db/<slug>/ (outside git and the type-check), and this process runs
// alongside the dev server — `npm run dev` starts it; one per laptop. Someone
// else's private branch never reaches it: the studio leaves it out of the
// change list for whoever signed in here (platform/dbProjects/branchAccess.ts),
// and a branch that goes private leaves the list, so its folder goes too.
//
//   their save → your files    Every 10s while someone works on this laptop —
//                              every minute once it sits idle — it looks for
//                              files someone else saved. A file you haven't
//                              touched is replaced. A file you have is MERGED
//                              (git merge-file): their change and yours both
//                              kept.
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
// It holds no database key and no sign-in of its own: it only talks to this
// laptop's dev server, which reads and saves through the deployed studio as the
// designer signed in on this laptop (platform/dbProjects/remote.ts). Not signed
// in, it still brings others' saves down; saving waits for the sign-in.
//
// State (the database version each local file was last in step with) lives in
// node_modules/.cache/db-live/, so a restart picks up where it left off.
// =============================================================================

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, watch, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIR = join(ROOT, 'projects', '_db')
const CACHE = join(ROOT, 'node_modules', '.cache', 'db-live')
const STATE_FILE = join(CACHE, 'state.json')
const PID_FILE = join(CACHE, 'pid')
// When the last look began, written as it ends: what the dev server waits on
// before a Chat turn (platform/dbProjects/disk.ts), and how a second start
// tells a working sync from one that stopped looking.
const LOOKED_FILE = join(CACHE, 'looked')
// Written by a second start to ask the running sync to look now.
const WAKE_FILE = join(CACHE, 'wake')
const API = 'http://127.0.0.1:4000'
const SYNCED = /\.(tsx?|jsx?|json|md)$/ // .md: NOTES.md (CLAUDE.md §4) — as platform/dbProjects/disk.ts
const MARKERS = /^(<{7}|>{7}) /m
// Every look is a call to the deployed studio, whose CPU is metered — and at
// one look every 2s, laptops left running all day used most of it. So it looks
// often only while someone works here (an edit in projects/_db/, a Chat turn
// starting), and seldom once the laptop has sat idle.
const BUSY_POLL_MS = 10_000
const IDLE_POLL_MS = 60_000
const IDLE_AFTER_MS = 10 * 60_000
// The studio answers "nothing changed" with its version alone. Now and then
// the whole list anyway, for what that can't see: a folder deleted here by
// hand, an edit made straight in the database.
const FULL_EVERY_MS = 10 * 60_000
// A sync that hasn't looked in this long is stuck, or an older version that
// still looks every 2s: a second start replaces it.
const STALE_MS = 3 * 60_000
const SETTLE_MS = 400
// A request that never answers (the laptop slept mid-request) must fail, not
// hang: the next poll and every later push wait on it.
const TIMEOUT_MS = 30_000

const log = (msg) => console.log(`[db-live ${new Date().toLocaleTimeString()}] ${msg}`)

// --- setup ---------------------------------------------------------------------

function pidInFile() {
  try {
    return Number(readFileSync(PID_FILE, 'utf8')) || null
  } catch {
    return null
  }
}

/** The live sync already running on this laptop, if any. */
function runningSync() {
  const pid = pidInFile()
  if (!pid || pid === process.pid) return null
  try {
    process.kill(pid, 0)
  } catch {
    return null // Stale pid file — that process is gone.
  }
  try {
    // After a restart, the pid may belong to some other program.
    return execFileSync('ps', ['-p', String(pid), '-o', 'command='], { encoding: 'utf8' }).includes('db-live.mjs') ? pid : null
  } catch {
    return pid // No ps to ask: trust the pid file.
  }
}

/** When the running sync last showed it's working: it started, or ended a look. */
function lastSign() {
  let t = 0
  for (const file of [PID_FILE, LOOKED_FILE]) {
    try {
      t = Math.max(t, statSync(file).mtimeMs)
    } catch {}
  }
  return t
}

async function replace(pid) {
  try {
    process.kill(pid, 'SIGTERM')
    for (let i = 0; i < 50; i++) {
      await new Promise((r) => setTimeout(r, 100))
      process.kill(pid, 0) // Throws once it's gone.
    }
    process.kill(pid, 'SIGKILL')
  } catch {}
}

mkdirSync(CACHE, { recursive: true })
// One per laptop: a second copy would race the first over the same files. A
// second start — `npm run dev`, or the dev server before a Chat turn — asks
// the running one to look now, and exits. One that has stopped looking it
// replaces, so a laptop that pulls this version stops looking every 2s.
const running = runningSync()
if (running && Date.now() - lastSign() < STALE_MS) {
  writeFileSync(WAKE_FILE, String(Date.now()))
  process.exit(0)
}
if (running) {
  await replace(running)
  log('Took over from a live sync that had stopped looking (an older version, or stuck).')
}
writeFileSync(PID_FILE, String(process.pid))
const cleanup = () => {
  try {
    if (readFileSync(PID_FILE, 'utf8') === String(process.pid)) rmSync(PID_FILE)
  } catch {}
}
process.on('exit', cleanup)
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(0))

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

async function api(path) {
  const r = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

/** The studio's version as of the last whole list: sent back, it answers with
 *  the list only if something changed since. */
let version = null
let fullAt = 0
let lastPollError = null
async function poll() {
  const began = Date.now()
  try {
    const since = version && began - fullAt < FULL_EVERY_MS ? `?since=${encodeURIComponent(version)}` : ''
    const { rows, version: latest } = await api(`/api/db-projects/changes${since}`)
    if (rows) {
      const stale = new Set()
      for (const r of rows) {
        if (known(r.slug, r.path)?.at === r.at && existsSync(local(r.slug, r.path))) continue
        stale.add(r.slug)
      }
      for (const slug of stale) {
        const { rows: files } = await api(`/api/db-projects/${encodeURIComponent(slug)}/files`)
        for (const f of files) {
          if (known(slug, f.path)?.at === f.at && existsSync(local(slug, f.path))) continue
          applyRemote(slug, f.path, f.content, f.at)
        }
      }
      if (rows.length) forgetGone(new Set(rows.map((r) => r.slug)))
      version = latest ?? null
      fullAt = began
    }
    lastPollError = null
    // Catch edits the watcher missed.
    for (const slug of Object.keys(state)) queue(slug)
  } catch (e) {
    // Usually the dev server isn't up yet — say so once, not every look.
    if (lastPollError !== e.message) log(`Waiting for the studio (${e.message}).`)
    lastPollError = e.message
  } finally {
    try {
      writeFileSync(LOOKED_FILE, String(began))
    } catch {}
  }
}

/**
 * A project that left the database — a draft that was pushed or discarded —
 * leaves this laptop too, so nobody edits a folder that saves nowhere. Not
 * while it holds edits that never saved: those stay, and it says so once.
 */
const keptGone = new Set()
function forgetGone(present) {
  for (const slug of Object.keys(state)) {
    if (present.has(slug)) continue
    const unsaved = [...localFiles(slug)].some(([rel, text]) => text !== known(slug, rel)?.base)
    if (unsaved) {
      if (!keptGone.has(slug)) log(`${slug}: no longer in the studio, but this laptop has unsaved edits in it — left in place.`)
      keptGone.add(slug)
      continue
    }
    rmSync(join(DIR, slug), { recursive: true, force: true })
    delete state[slug]
    persist()
    log(`${slug}: removed — it's no longer in the studio (a branch that was pushed or discarded).`)
  }
}

// --- this laptop → the database ------------------------------------------------------

const seen = new Map()
const lastRefused = new Map()
let askedToSignIn = false

async function push(slug) {
  const changes = []
  for (const [rel, text] of localFiles(slug)) {
    const was = known(slug, rel)
    if (was && text === was.base) continue
    if (MARKERS.test(text)) continue
    changes.push({ path: rel, content: text, baseAt: was?.at ?? null })
  }
  if (!changes.length) {
    seen.delete(slug)
    return
  }
  const signature = JSON.stringify(changes.map((c) => [c.path, c.content]))
  // An edit this laptop hasn't seen yet: someone is working here.
  if (seen.get(slug) !== signature) {
    seen.set(slug, signature)
    busy()
  }
  if (lastRefused.get(slug) === signature) return

  let res
  try {
    const r = await fetch(`${API}/api/db-projects/${encodeURIComponent(slug)}/sync`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ changes, by: who }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (r.status === 401) {
      if (!askedToSignIn) log('Not saved — this laptop isn’t signed in to the studio. Open http://localhost:4000/auth/laptop/start (one Google sign-in).')
      askedToSignIn = true
      return
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    res = await r.json()
    askedToSignIn = false
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

// --- when to look ------------------------------------------------------------------------

let lastBusy = Date.now() // Starting counts: someone just ran `npm run dev`, or began a Chat turn.
const idle = () => Date.now() - lastBusy > IDLE_AFTER_MS

let soon = false
let wake = () => {}
function lookNow() {
  soon = true
  wake()
}

/** Someone is working here: look often again — and back from idle, at once. */
function busy() {
  if (idle()) lookNow()
  lastBusy = Date.now()
}

// --- run -------------------------------------------------------------------------------

mkdirSync(DIR, { recursive: true })
log('Live sync on — database projects are in projects/_db/.')
// A second start asking for a look (see setup).
watch(CACHE, (_event, file) => {
  if (file !== 'wake') return
  busy()
  lookNow()
})
await poll()
watch(DIR, { recursive: true }, (_event, file) => {
  const slug = file ? String(file).split(sep)[0] : null
  if (slug) queue(slug)
})
for (;;) {
  if (!soon) {
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, idle() ? IDLE_POLL_MS : BUSY_POLL_MS)
      wake = () => {
        clearTimeout(timer)
        resolve()
      }
    })
  }
  soon = false
  // Two that started at once both got this far: the one the pid file names
  // keeps going.
  const owner = pidInFile()
  if (owner && owner !== process.pid) {
    log('Another live sync is running here — this one stops.')
    process.exit(0)
  }
  await poll()
}
