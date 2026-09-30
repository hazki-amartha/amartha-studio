// =============================================================================
// DB projects · this laptop's copy.
//
// Every database project is mirrored to projects/_db/<slug>/ by the live sync
// (scripts/db-live.mjs), which saves local edits to the database and merges
// other designers' saves into local files. Claude Code — in the Chat panel or
// the terminal — edits that folder like any project folder.
//
// This file is what the dev server needs from that copy: where it is, that it
// exists before a Chat turn starts, and what it would change (for
// `npm run check:project`). Dev server only.
// =============================================================================

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { checkDbProject } from './checks'

const SYNCED = /\.(tsx?|jsx?|json)$/

/** The folder Claude Code edits, relative to the repo. */
export function projectFolder(slug: string, db: boolean): string {
  return db ? `projects/_db/${slug}` : `projects/${slug}`
}

function absFolder(slug: string): string {
  return path.join(process.cwd(), 'projects', '_db', slug)
}

export async function diskFiles(slug: string): Promise<Map<string, string>> {
  const root = absFolder(slug)
  const out = new Map<string, string>()
  async function walk(dir: string) {
    let names: string[]
    try {
      names = await readdir(dir)
    } catch {
      return
    }
    for (const name of names) {
      const full = path.join(dir, name)
      if ((await stat(full)).isDirectory()) await walk(full)
      else if (SYNCED.test(name)) out.set(path.relative(root, full).split(path.sep).join('/'), await readFile(full, 'utf8'))
    }
  }
  await walk(root)
  return out
}

/**
 * Make sure the live sync is running and has written this project to disk.
 * Starting it is safe to repeat — a second copy exits at once. Waits a few
 * seconds for a project this laptop hasn't seen yet.
 */
export async function ensureLocalCopy(slug: string): Promise<boolean> {
  const index = path.join(absFolder(slug), 'index.ts')
  spawn(process.execPath, [path.join(process.cwd(), 'scripts', 'db-live.mjs')], {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore',
  }).unref()
  for (let i = 0; i < 20 && !existsSync(index); i++) await new Promise((r) => setTimeout(r, 500))
  return existsSync(index)
}

/** What the local copy would change in the database, checked. */
export async function diskChanges(
  slug: string,
  baseline: Map<string, string>,
): Promise<{ changed: [string, string][]; problems: string[] }> {
  const now = await diskFiles(slug)
  const changed = [...now].filter(([rel, content]) => baseline.get(rel) !== content)
  if (!changed.length) return { changed, problems: [] }
  const marked = changed.filter(([, content]) => /^(<{7}|>{7}) /m.test(content)).map(([rel]) => rel)
  if (marked.length) {
    return {
      changed,
      problems: marked.map(
        (rel) => `${rel} has conflict markers — you and another designer changed the same lines; keep both changes and remove the markers`,
      ),
    }
  }
  const after = new Map(baseline)
  for (const [rel, content] of changed) after.set(rel, content)
  const problems = await checkDbProject(slug, after, baseline, changed.map(([rel]) => rel))
  return { changed, problems }
}
