// =============================================================================
// DB projects · the laptop's copy, for the Chat agent.
//
// The agent (Claude Code on this laptop) edits files, not rows. So a chat turn
// on /db/<slug> brackets the agent with two steps:
//
//   before  pullToDisk   the database's files → projects/<slug>/, so the agent
//                        starts from what every viewer is looking at
//   after   pushFromDisk what the turn changed → the database, which tells
//                        every open /db/<slug> to reload
//
// The database is the source of truth; the folder is the agent's workbench.
// Dev server only — Chat never runs on a deployment.
// =============================================================================

import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { readDbFiles, saveDbFiles } from './server'

const SYNCED = /\.(tsx?|jsx?|json)$/

function projectDir(slug: string): string {
  return path.join(process.cwd(), 'projects', slug)
}

async function diskFiles(slug: string): Promise<Map<string, string>> {
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

/** Write the database's files over the folder. Returns the database's copy —
 *  the baseline pushFromDisk compares the turn's result against. */
export async function pullToDisk(slug: string): Promise<Map<string, string>> {
  const files = await readDbFiles(slug)
  const root = projectDir(slug)
  const onDisk = await diskFiles(slug)
  for (const [rel, content] of files) {
    if (onDisk.get(rel) === content) continue
    const full = path.join(root, rel)
    if (!full.startsWith(root + path.sep)) continue
    await mkdir(path.dirname(full), { recursive: true })
    await writeFile(full, content, 'utf8')
  }
  return files
}

/** Save to the database every file the turn created or changed, compared with
 *  the copy pulled before it. Returns the paths saved. */
export async function pushFromDisk(slug: string, baseline: Map<string, string>, by: string | null): Promise<string[]> {
  const now = await diskFiles(slug)
  const changed = [...now].filter(([rel, content]) => baseline.get(rel) !== content)
  await saveDbFiles(
    slug,
    changed.map(([rel, content]) => ({ path: rel, content })),
    by,
  )
  return changed.map(([rel]) => rel)
}
