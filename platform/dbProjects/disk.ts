// =============================================================================
// DB projects · the laptop's copy, for the Chat agent.
//
// The agent (Claude Code on this laptop) edits files, not rows. So a chat turn
// on a database project brackets the agent with two steps:
//
//   before  pullToDisk   the database's files → projects/<slug>/, so the agent
//                        starts from what every viewer is looking at
//   after   pushFromDisk what the turn changed → the database, which tells
//                        every open copy of the link to reload
//
// A turn whose changes fail the checks (./checks.ts) is not saved, and its work
// stays on disk: the next pull keeps a file the agent changed unless someone
// else has saved that file since, so "fix it" picks up where the turn left off.
// Dev server only — Chat never runs on a deployment.
// =============================================================================

import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { checkDbProject } from './checks'
import { readDbFiles, saveDbFiles } from './server'

const SYNCED = /\.(tsx?|jsx?|json)$/

/** Per project, the database's content at the last pull or save — what the
 *  disk copy was last in step with. */
const lastSynced = new Map<string, Map<string, string>>()

export class ChecksFailed extends Error {
  constructor(readonly problems: string[]) {
    super(problems.join('; '))
  }
}

function projectDir(slug: string): string {
  return path.join(process.cwd(), 'projects', slug)
}

export async function diskFiles(slug: string): Promise<Map<string, string>> {
  const root = projectDir(slug)
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

/** Bring the folder up to the database. A file is overwritten when the
 *  database moved since the last sync, or when the disk copy hasn't — never a
 *  local change nobody has saved over. Returns the database's copy: the
 *  baseline pushFromDisk compares the turn's result against. */
export async function pullToDisk(slug: string): Promise<Map<string, string>> {
  const files = await readDbFiles(slug)
  const synced = lastSynced.get(slug)
  const root = projectDir(slug)
  const onDisk = await diskFiles(slug)
  for (const [rel, content] of files) {
    const local = onDisk.get(rel)
    if (local === content) continue
    const dbMoved = !synced || synced.get(rel) !== content
    const diskMoved = synced !== undefined && local !== undefined && local !== synced.get(rel)
    if (diskMoved && !dbMoved) continue
    const full = path.join(root, rel)
    if (!full.startsWith(root + path.sep)) continue
    await mkdir(path.dirname(full), { recursive: true })
    await writeFile(full, content, 'utf8')
  }
  lastSynced.set(slug, files)
  return files
}

/** What the folder would change in the database, checked. */
export async function diskChanges(
  slug: string,
  baseline: Map<string, string>,
): Promise<{ changed: [string, string][]; problems: string[] }> {
  const now = await diskFiles(slug)
  const changed = [...now].filter(([rel, content]) => baseline.get(rel) !== content)
  if (!changed.length) return { changed, problems: [] }
  const after = new Map(baseline)
  for (const [rel, content] of changed) after.set(rel, content)
  const problems = await checkDbProject(slug, after, baseline, changed.map(([rel]) => rel))
  return { changed, problems }
}

/** Save to the database every file the turn created or changed, if the result
 *  passes the checks. Returns the paths saved; throws ChecksFailed if not. */
export async function pushFromDisk(slug: string, baseline: Map<string, string>, by: string | null): Promise<string[]> {
  const { changed, problems } = await diskChanges(slug, baseline)
  if (problems.length) throw new ChecksFailed(problems)
  await saveDbFiles(
    slug,
    changed.map(([rel, content]) => ({ path: rel, content })),
    by,
  )
  const synced = new Map(baseline)
  for (const [rel, content] of changed) synced.set(rel, content)
  lastSynced.set(slug, synced)
  return changed.map(([rel]) => rel)
}
