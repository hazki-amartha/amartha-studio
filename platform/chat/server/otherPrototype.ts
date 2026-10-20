// =============================================================================
// Chat · another prototype, read-only — how the deployed Chat looks at one the
// designer names ("use what we decided in Checker Maker"). A turn's workspace
// holds only its own project and the live references (./cloud.ts), so this
// reads the other one from the database: its memory first, then any one of its
// files on request.
//
// Published prototypes only: a branch that hasn't been pushed, or a deleted
// project, is never found. On a laptop Chat reads the files themselves, and
// scripts/chat-guard.mjs keeps it out of unpushed branches the same way.
// =============================================================================

import type { DbProjectConfig } from '@/platform/dbProjects/server'
import { MEMORY_FILE } from './memory'

/** Where prototypes come from — the studio database in ./cloud.ts, a fake in tests. */
export interface PrototypeSource {
  configs(): Promise<DbProjectConfig[]>
  files(slug: string): Promise<Map<string, { content: string }>>
}

const MAX_FILE = 20_000
const MAX_MEMORY = 6_000

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')
const capped = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}\n… (cut here)` : text)

/** The read_prototype tool's answer, as text for the agent. `current` is the
 *  turn's own project. */
export async function readPrototype(
  source: PrototypeSource,
  ask: { project: string; file?: string },
  current: string,
): Promise<string> {
  const key = norm(ask.project)
  const published = (await source.configs()).filter((c) => !c.draft && !c.deleted)
  const exact = published.filter((c) => norm(c.slug) === key || norm(c.name) === key)
  const matches = exact.length ? exact : published.filter((c) => key && (norm(c.slug).includes(key) || norm(c.name).includes(key)))
  if (!key || !matches.length) {
    return `No prototype in the studio database is called “${ask.project}”. Ask the designer which one they mean — git-only prototypes and branches that haven’t been pushed can’t be opened here.`
  }
  if (matches.length > 1) {
    return `More than one prototype matches “${ask.project}”: ${matches.map((c) => `${c.name} (\`${c.slug}\`)`).join(', ')}. Ask the designer which one.`
  }
  const found = matches[0]
  if (found.slug === current) return `“${found.name}” is the prototype you are working on — its files are in your workspace.`

  const files = await source.files(found.slug)
  if (ask.file) {
    const path = ask.file.replace(/^\.?\//, '')
    const file = files.get(path)
    if (!file) return `“${found.name}” has no file ${path}. Its files: ${[...files.keys()].sort().join(', ')}.`
    return `${found.name} · ${path} (read-only):\n\n${capped(file.content, MAX_FILE)}`
  }
  const memory = files.get(MEMORY_FILE)?.content.trim()
  return [
    `${found.name} (\`${found.slug}\`), by ${found.owner} — read-only.`,
    '',
    memory ? `Its memory:\n${capped(memory, MAX_MEMORY)}` : 'It has no memory yet.',
    '',
    `Its files: ${[...files.keys()].filter((p) => p !== MEMORY_FILE).sort().join(', ')}`,
  ].join('\n')
}
