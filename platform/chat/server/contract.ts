// =============================================================================
// Chat · CLAUDE.md goes in the system prompt, not in the first message.
//
// Left to itself the CLI loads CLAUDE.md into the conversation's first message,
// beside the note naming the project (./turnNote.ts) — so that message differs
// for every project, and every new session on another project wrote its own
// cached copy of the contract (~3.5k tokens). In the system prompt, which is the
// same for every session, one cached copy serves them all: measured on this
// laptop, a new session on another project went from writing 10.7k tokens to
// writing 0.7k. The route sets CLAUDE_CODE_DISABLE_CLAUDE_MDS so the CLI
// doesn't load it a second time.
// =============================================================================

import { readFileSync } from 'node:fs'
import path from 'node:path'

/** `append` — chat's own rules — followed by the contract, read fresh each turn. */
export function withContract(append: string, root: string): string {
  let contract: string
  try {
    contract = readFileSync(path.join(root, 'CLAUDE.md'), 'utf8').trim()
  } catch {
    return append
  }
  return [
    append,
    '',
    '## The studio contract — CLAUDE.md',
    '',
    'Every agent in this repo works by it. Where it and the chat rules above differ —',
    'git, commit, push, the dev server, which checks to run — the chat rules win.',
    '',
    contract,
  ].join('\n')
}
