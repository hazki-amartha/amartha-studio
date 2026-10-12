// =============================================================================
// DB projects · which project the designer last opened on this laptop.
//
// Claude Code in the terminal can't see the browser. A designer looking at a
// draft who says "make the button bigger" means the draft — but without this
// the agent edits the project itself, and that goes live on the project's
// link, the one thing a draft exists to avoid. So the dev server notes every
// prototype opened in .studio-open.json (git-ignored), and CLAUDE.md §3b has
// the agent read it before editing a database project.
//
// Dev server only: a deployment has no terminal agent to tell.
// =============================================================================

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { DRAFT_FILE, parseDraftMeta } from './draftMeta'

export const OPEN_FILE = '.studio-open.json'

export function noteOpened(slug: string, db: boolean): void {
  if (process.env.NODE_ENV !== 'development') return
  const root = process.cwd()
  const folder = db ? `projects/_db/${slug}` : `projects/${slug}`
  const draftFile = path.join(root, folder, DRAFT_FILE)
  const draft = db && existsSync(draftFile) ? parseDraftMeta(readFileSync(draftFile, 'utf8')) : null
  const note = {
    slug,
    folder,
    database: db,
    draftOf: draft ? draft.draftOf : null,
    draftOfFolder: draft ? `projects/_db/${draft.draftOf}` : null,
    openedAt: new Date().toISOString(),
  }
  try {
    writeFileSync(path.join(root, OPEN_FILE), `${JSON.stringify(note, null, 2)}\n`)
  } catch {
    // Only a hint for the agent; the page must not fail over it.
  }
}
