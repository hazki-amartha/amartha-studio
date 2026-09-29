#!/usr/bin/env node
// =============================================================================
// db:sync — mirror projects/<slug>/ into the database (proof of concept for
// /db/<slug>; see platform/dbProjects).
//
//   npm run db:sync -- <slug>            upload once
//   npm run db:sync -- <slug> --watch    upload, then on every file save
//
// A local agent (or anyone with an editor) keeps editing plain files; each save
// lands in studio_project_files, the old content in studio_project_file_versions,
// and a Realtime broadcast tells every open /db/<slug> to reload the project.
// No commit, no push, no deploy.
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (read from the
// environment, then .env.local).
// =============================================================================

import { execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync, watch } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const ROOT = new URL('..', import.meta.url).pathname.replace(/%20/g, ' ')
const [slug, ...flags] = process.argv.slice(2)
const WATCH = flags.includes('--watch')
const SYNCED = /\.(tsx?|jsx?|json)$/

if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: npm run db:sync -- <slug> [--watch]')
  process.exit(1)
}
const dir = join(ROOT, 'projects', slug)
if (!existsSync(dir)) {
  console.error(`No folder projects/${slug}/`)
  process.exit(1)
}

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
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. in .env.local).')
  process.exit(1)
}
const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
let who = null
try {
  who = execSync('git config user.name', { encoding: 'utf8' }).trim() || null
} catch {}

function localFiles() {
  const out = new Map()
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name)
      if (statSync(p).isDirectory()) walk(p)
      else if (SYNCED.test(name)) out.set(relative(dir, p).split(sep).join('/'), readFileSync(p, 'utf8'))
    }
  }
  walk(dir)
  return out
}

async function sync() {
  const local = localFiles()
  const { data, error } = await db.from('studio_project_files').select('path, content').eq('slug', slug)
  if (error) throw new Error(error.message)
  const remote = new Map(data.map((r) => [r.path, r.content]))

  const changed = [...local].filter(([p, c]) => remote.get(p) !== c)
  const removed = [...remote.keys()].filter((p) => !local.has(p))
  if (!changed.length && !removed.length) return 0

  const now = new Date().toISOString()
  if (changed.length) {
    const rows = changed.map(([path, content]) => ({ slug, path, content, updated_at: now, updated_by: who }))
    const up = await db.from('studio_project_files').upsert(rows)
    if (up.error) throw new Error(up.error.message)
  }
  if (removed.length) {
    const del = await db.from('studio_project_files').delete().eq('slug', slug).in('path', removed)
    if (del.error) throw new Error(del.error.message)
  }
  const versions = [
    ...changed.map(([path, content]) => ({ slug, path, content, saved_by: who })),
    ...removed.map((path) => ({ slug, path, content: null, saved_by: who })),
  ]
  const ver = await db.from('studio_project_file_versions').insert(versions)
  if (ver.error) throw new Error(ver.error.message)

  await broadcast()
  for (const [p] of changed) console.log(`  saved   ${p}`)
  for (const p of removed) console.log(`  removed ${p}`)
  return changed.length + removed.length
}

/** Tell open /db/<slug> viewers to reload — Realtime broadcast over REST. */
async function broadcast() {
  const res = await fetch(`${url}/realtime/v1/api/broadcast`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ topic: `studio-project:${slug}`, event: 'saved', payload: { at: Date.now() } }] }),
  })
  if (!res.ok) console.warn(`  (broadcast failed: ${res.status} — viewers pick the save up on focus)`)
}

const n = await sync()
console.log(`${slug}: ${n ? `${n} file(s) synced` : 'already in sync'}`)

if (WATCH) {
  console.log(`Watching projects/${slug}/ — every save goes live on /db/${slug}. Ctrl+C to stop.`)
  let timer = null
  let running = Promise.resolve()
  watch(dir, { recursive: true }, () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      running = running.then(sync).catch((e) => console.error(`  sync failed: ${e.message}`))
    }, 250)
  })
}
