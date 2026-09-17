// =============================================================================
// Design · the dev-only write-back route (the `fs` backend).
//
// Receives a BATCH of edits for one file (platform/design/protocol.ts) and
// applies them to source, or refuses the lot. What keeps this safe to expose to
// a panel:
//
//   • Dev server only. Production 404s unconditionally — a deployed studio has
//     no files to edit and must never pretend otherwise. The deployed path is
//     the `record` backend, and later the `github` one.
//   • Writes are confined to `projects/<slug>/` by construction: every edit
//     names its own file, and a file outside the project's folder is refused
//     before anything is read. `resolve()` + prefix check, so `..` cannot walk
//     out.
//   • Never guess. The batch's `version` must match the file on disk, and
//     `applyEdits` verifies each edit against the tree and refuses the batch on
//     the first mismatch. A wrong-line write is strictly worse than no write.
//   • Atomic. One refusal means nothing is written at all.
//
// Undo is a snapshot of the file before each write, kept in the OS temp folder
// (so a hot reload of this route does not lose it) and restored only while the
// file is still exactly what that write produced. The client holds an opaque
// token; the content never travels, so undo cannot be used to write arbitrary
// text into a project.
// =============================================================================

import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { NextResponse } from 'next/server'
import { applyEdits } from '@/platform/design/applyEdits'
import { addressesOf } from '@/platform/design/protocol'
import type {
  DesignRequest,
  DesignResponse,
  DesignUndoRequest,
} from '@/platform/design/protocol'
import { versionOf } from '@/platform/design/version'

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/
const UNDO_DIR = path.join(os.tmpdir(), 'amartha-studio-design-undo')
const TOKEN = /^[0-9a-f-]{36}$/

function refuse(reason: string): NextResponse {
  return NextResponse.json({ ok: false, reason } satisfies DesignResponse)
}

/**
 * The absolute path an address names, or null if it escapes the project.
 *
 * `src` is `<file>:<line>:<col>` and `file` is repo-relative POSIX. The check
 * is done on the RESOLVED path, not the string, so neither `..` nor a symlink-
 * shaped name can reach outside `projects/<slug>/`.
 */
function fileOf(src: string, slug: string): string | null {
  const rel = src.split(':').slice(0, -2).join(':')
  if (!rel || !rel.endsWith('.tsx')) return null
  return insideProject(path.resolve(process.cwd(), rel), slug)
}

function insideProject(abs: string, slug: string): string | null {
  const projectDir = path.join(process.cwd(), 'projects', slug)
  if (abs !== projectDir && !abs.startsWith(projectDir + path.sep)) return null
  return abs
}

const relative = (abs: string) => path.relative(process.cwd(), abs).split(path.sep).join('/')

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

async function undo(body: DesignUndoRequest): Promise<NextResponse> {
  if (!TOKEN.test(body.undo)) return refuse('That undo could not be found.')
  let snap: Snapshot
  try {
    snap = JSON.parse(await fs.readFile(path.join(UNDO_DIR, `${body.undo}.json`), 'utf8'))
  } catch {
    return refuse('That change can no longer be undone here — the studio server restarted.')
  }

  const file = insideProject(snap.file, body.slug)
  if (!file) return refuse('That undo belongs to another project.')

  let current: string
  try {
    current = await fs.readFile(file, 'utf8')
  } catch {
    return refuse('That screen file could not be read.')
  }
  if (versionOf(current) !== snap.after) {
    return refuse('That screen has changed since, so undoing would overwrite newer work.')
  }

  try {
    await fs.writeFile(file, snap.before, 'utf8')
  } catch {
    return refuse('That screen file could not be written.')
  }
  await fs.rm(path.join(UNDO_DIR, `${body.undo}.json`), { force: true })
  return NextResponse.json({
    ok: true,
    file: relative(file),
    version: versionOf(snap.before),
  } satisfies DesignResponse)
}

export async function POST(request: Request): Promise<NextResponse> {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse(null, { status: 404 })
  }

  let body: DesignRequest | DesignUndoRequest
  try {
    body = (await request.json()) as DesignRequest | DesignUndoRequest
  } catch {
    return refuse('That request could not be read.')
  }

  if (!body.slug || !KEBAB.test(body.slug)) return refuse('That is not a project I recognise.')
  if ('undo' in body) return undo(body)

  const { slug, edits, version } = body
  if (!Array.isArray(edits) || edits.length === 0) return refuse('There was nothing to apply.')

  // Every address in a batch — each edit's own and any anchor it names — must
  // point into the same file: `applyEdits` works on one source string, and a
  // batch spanning two files could half-succeed, which is exactly what
  // atomicity is supposed to rule out.
  const files = new Set<string>()
  for (const edit of edits) {
    for (const src of addressesOf(edit)) {
      const file = fileOf(src, slug)
      if (!file) return refuse('That change points outside the project, so it was not saved.')
      files.add(file)
    }
  }
  if (files.size > 1) return refuse('Elements can only be moved within the file they are written in.')

  const file = [...files][0]
  let source: string
  try {
    source = await fs.readFile(file, 'utf8')
  } catch {
    return refuse('That screen file could not be read.')
  }

  if (version && versionOf(source) !== version) {
    return refuse('That screen has changed since it loaded. Refresh the page, then make the change again.')
  }

  const result = applyEdits(source, edits)
  if (!result.ok) return refuse(result.refused.reason)

  // Nothing changed is a success with no write: rewriting identical bytes would
  // still trigger a fast refresh and flash the screen for no reason.
  if (result.source === source) {
    return NextResponse.json({ ok: true, file: relative(file), version: versionOf(source) })
  }

  try {
    await fs.writeFile(file, result.source, 'utf8')
  } catch {
    return refuse('That screen file could not be written.')
  }

  const after = versionOf(result.source)
  const token = await saveSnapshot({ file, before: source, after })
  return NextResponse.json({
    ok: true,
    file: relative(file),
    version: after,
    undo: token,
  } satisfies DesignResponse)
}
