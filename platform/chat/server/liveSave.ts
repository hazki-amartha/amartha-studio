// =============================================================================
// Chat · saving a turn's edits as they happen, not when the turn ends.
//
// After every edit the agent makes, `sync()` lines the workspace up with the
// database, file by file:
//
//   edited here, untouched there   → saved, if the whole project passes the checks
//   untouched here, saved there    → the workspace takes their version, quietly
//   edited on both sides           → three-way merged (../../dbProjects/merge.ts);
//                                    clean → saved, and the agent is told to re-read;
//                                    clashing lines → conflict markers left in the
//                                    file for the agent to resolve, nothing saved
//   new there                      → copied into the workspace
//
// Other designers, the laptop sync and other chat sessions on the same project
// all save through the same compare-and-set (saveIfUnchanged), so nobody's
// change is overwritten — at worst it is merged. An edit that fails the checks
// (a screen file written before index.ts lists it) just waits for the edit that
// makes the project whole again.
// =============================================================================

import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { checkDbProject } from '@/platform/dbProjects/checks'
import { CONFLICT_MARKER, mergeText } from '@/platform/dbProjects/merge'
import { readDbRows, saveIfUnchanged } from '@/platform/dbProjects/server'

interface Row {
  content: string
  at: string
}

export async function readTree(dir: string, prefix = ''): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  if (!existsSync(dir)) return out
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) for (const [k, v] of await readTree(path.join(dir, entry.name), rel)) out.set(k, v)
    else if (entry.isFile()) out.set(rel, await readFile(path.join(dir, entry.name), 'utf8'))
  }
  return out
}

export class LiveSave {
  /** Per file, the database version the workspace last agreed with. */
  private base: Map<string, Row>
  /** Paths saved during this turn. */
  readonly saved = new Set<string>()
  /** Files holding conflict markers the agent still has to resolve. */
  readonly clashes = new Set<string>()
  /** Why the latest pending edits could not be saved, if they couldn't. */
  problems: string[] = []
  private queue: Promise<unknown> = Promise.resolve()

  constructor(
    private readonly slug: string,
    private readonly dir: string,
    rows: Map<string, Row>,
    private readonly by: string,
  ) {
    this.base = new Map(rows)
  }

  /** Edits made but not saved yet. */
  async pending(): Promise<string[]> {
    const now = await readTree(this.dir)
    return [...now].filter(([p, c]) => this.base.get(p)?.content !== c).map(([p]) => p)
  }

  /** One sync at a time; returns notes the agent should read, if any. */
  sync(): Promise<string[]> {
    const run = this.queue.then(() => this.run())
    this.queue = run.catch(() => {})
    return run
  }

  private async write(rel: string, content: string) {
    const file = path.join(this.dir, rel)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, content)
  }

  private async run(): Promise<string[]> {
    const notes: string[] = []
    const [now, db] = await Promise.all([readTree(this.dir), readDbRows(this.slug)])
    const candidates = new Map<string, { content: string; baseAt: string | null }>()

    for (const p of new Set([...now.keys(), ...db.keys()])) {
      const mine = now.get(p)
      const base = this.base.get(p)
      const theirs = db.get(p)

      if (mine === undefined) {
        // Chat can't delete, so a file missing here is one someone else added.
        if (theirs && !base) {
          await this.write(p, theirs.content)
          this.base.set(p, theirs)
          notes.push(`${p} was just added by someone else.`)
        }
        continue
      }
      if (CONFLICT_MARKER.test(mine)) {
        this.clashes.add(p)
        continue
      }
      this.clashes.delete(p)

      const edited = !base || mine !== base.content
      const moved = theirs !== undefined && theirs.at !== base?.at
      if (!edited) {
        if (moved) {
          await this.write(p, theirs.content)
          this.base.set(p, theirs)
        }
        continue
      }
      if (!moved) {
        candidates.set(p, { content: mine, baseAt: base?.at ?? null })
        continue
      }

      const merged = mergeText(base?.content ?? '', mine, theirs.content)
      await this.write(p, merged.text)
      this.base.set(p, theirs)
      if (merged.conflict) {
        this.clashes.add(p)
        notes.push(
          `${p} was changed by someone else on the same lines you edited. The file now has <<<<<<< conflict markers — ` +
            'resolve them keeping both changes; it saves once they are gone.',
        )
      } else {
        notes.push(`${p} was also changed by someone else; their change is merged in. Re-read it before editing it again.`)
        candidates.set(p, { content: merged.text, baseAt: theirs.at })
      }
    }

    if (!candidates.size) return notes

    const current = new Map([...db].map(([p, r]) => [p, r.content]))
    const after = new Map(current)
    for (const [p, c] of candidates) after.set(p, c.content)
    this.problems = await checkDbProject(this.slug, after, current, [...candidates.keys()])
    if (this.problems.length) return notes

    const { saved } = await saveIfUnchanged(
      this.slug,
      [...candidates].map(([p, c]) => ({ path: p, content: c.content, baseAt: c.baseAt })),
      this.by,
    )
    // A file someone saved in the instant between reading and writing stays
    // pending; the next sync merges it.
    for (const [p, s] of saved) {
      this.base.set(p, { content: candidates.get(p)!.content, at: s.at })
      this.saved.add(p)
    }
    return notes
  }
}
