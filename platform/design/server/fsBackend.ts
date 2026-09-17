// =============================================================================
// Design · the `fs` backend — the dev server writes the working copy.
//
// What keeps this safe to expose to a panel:
//
//   • Dev server only; the route never calls it in production.
//   • Writes are confined to `projects/<slug>/` (common.ts).
//   • Never guess. The batch's `version` must match the file on disk, and
//     `applyEdits` verifies each edit against the tree and refuses the batch on
//     the first mismatch. A wrong-line write is strictly worse than no write.
//   • Atomic. One refusal means nothing is written at all.
//
// Undo is a snapshot of the file before each write, kept in the OS temp folder
// (so a hot reload of the route does not lose it) and restored only while the
// file is still exactly what that write produced. The client holds an opaque
// token; the content never travels, so undo cannot be used to write arbitrary
// text into a project.
// =============================================================================

import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { NextResponse } from 'next/server'
import { applyEdits } from '../applyEdits'
import type { DesignRequest, DesignResponse, DesignUndoRequest } from '../protocol'
import { versionOf } from '../version'
import { batchFile, checkFile, iconNamesIn, refuse } from './common'

const UNDO_DIR = path.join(os.tmpdir(), 'amartha-studio-design-undo')
const TOKEN = /^[0-9a-f-]{36}$/

const onDisk = (rel: string) => path.join(process.cwd(), rel)

let icons: Promise<Set<string>> | null = null
function iconNames(): Promise<Set<string>> {
  icons ??= fs
    .readFile(onDisk('design-system/icons/index.tsx'), 'utf8')
    .then(iconNamesIn)
    .catch(() => new Set<string>())
  return icons
}

interface Snapshot {
  file: string
  before: string
  /** The version the write produced — the only state this snapshot undoes. */
  after: string
}

async function saveSnapshot(snap: Snapshot): Promise<string | undefined> {
  try {
    await fs.mkdir(UNDO_DIR, { recursive: true })
    const token = randomUUID()
    await fs.writeFile(path.join(UNDO_DIR, `${token}.json`), JSON.stringify(snap), 'utf8')
    return token
  } catch {
    // No temp folder costs undo, not the write.
    return undefined
  }
}

export async function fsUndo(body: DesignUndoRequest): Promise<NextResponse> {
  if (!TOKEN.test(body.undo)) return refuse('That undo could not be found.')
  let snap: Snapshot
  try {
    snap = JSON.parse(await fs.readFile(path.join(UNDO_DIR, `${body.undo}.json`), 'utf8'))
  } catch {
    return refuse('That change can no longer be undone here — the studio server restarted.')
  }

  const file = checkFile(snap.file, body.slug)
  if (!file) return refuse('That undo belongs to another project.')

  let current: string
  try {
    current = await fs.readFile(onDisk(file), 'utf8')
  } catch {
    return refuse('That screen file could not be read.')
  }
  if (versionOf(current) !== snap.after) {
    return refuse('That screen has changed since, so undoing would overwrite newer work.')
  }

  try {
    await fs.writeFile(onDisk(file), snap.before, 'utf8')
  } catch {
    return refuse('That screen file could not be written.')
  }
  await fs.rm(path.join(UNDO_DIR, `${body.undo}.json`), { force: true })
  return NextResponse.json({ ok: true, file, version: versionOf(snap.before) } satisfies DesignResponse)
}

export async function fsApply(body: DesignRequest): Promise<NextResponse> {
  if (!Array.isArray(body.edits) || body.edits.length === 0) return refuse('There was nothing to apply.')
  const target = batchFile(body)
  if ('reason' in target) return refuse(target.reason)
  const { file } = target

  let source: string
  try {
    source = await fs.readFile(onDisk(file), 'utf8')
  } catch {
    return refuse('That screen file could not be read.')
  }

  if (body.version && versionOf(source) !== body.version) {
    return refuse('That screen has changed since it loaded. Refresh the page, then make the change again.')
  }

  const result = applyEdits(source, body.edits, { icons: await iconNames() })
  if (!result.ok) return refuse(result.refused.reason)

  // Nothing changed is a success with no write: rewriting identical bytes would
  // still trigger a fast refresh and flash the screen for no reason.
  if (result.source === source) {
    return NextResponse.json({ ok: true, file, version: versionOf(source) } satisfies DesignResponse)
  }

  try {
    await fs.writeFile(onDisk(file), result.source, 'utf8')
  } catch {
    return refuse('That screen file could not be written.')
  }

  const after = versionOf(result.source)
  const token = await saveSnapshot({ file, before: source, after })
  return NextResponse.json({ ok: true, file, version: after, undo: token } satisfies DesignResponse)
}
