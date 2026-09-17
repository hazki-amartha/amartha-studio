// =============================================================================
// Design · the dev-only write-back route.
//
// Receives a BATCH of edits for one screen (platform/design/protocol.ts) and
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
//   • Never guess. `applyEdits` verifies each edit's OLD value against the
//     tree and refuses the batch on the first mismatch. A wrong-line write is
//     strictly worse than no write.
//   • Atomic. One refusal means nothing is written at all.
//
// This replaces `app/api/edit/route.ts`, which searched a project's screen and
// lib files for an element matching a class list. It no longer has to search:
// `src` names the file, so the whole candidate-file machinery is gone.
// =============================================================================

import { promises as fs } from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { applyEdits } from '@/platform/design/applyEdits'
import type { DesignRequest, DesignResponse } from '@/platform/design/protocol'

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/

function refuse(reason: string): NextResponse {
  return NextResponse.json({ ok: false, reason } satisfies DesignResponse)
}

/**
 * The absolute path an edit's `src` names, or null if it escapes the project.
 *
 * `src` is `<file>:<line>:<col>` and `file` is repo-relative POSIX. The check
 * is done on the RESOLVED path, not the string, so neither `..` nor a symlink-
 * shaped name can reach outside `projects/<slug>/`.
 */
function fileOf(src: string, slug: string): string | null {
  const rel = src.split(':').slice(0, -2).join(':')
  if (!rel || !rel.endsWith('.tsx')) return null

  const projectDir = path.join(process.cwd(), 'projects', slug)
  const abs = path.resolve(process.cwd(), rel)
  if (abs !== projectDir && !abs.startsWith(projectDir + path.sep)) return null
  return abs
}

export async function POST(request: Request): Promise<NextResponse> {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse(null, { status: 404 })
  }

  let body: DesignRequest
  try {
    body = (await request.json()) as DesignRequest
  } catch {
    return refuse('That request could not be read.')
  }

  const { slug, edits } = body
  if (!slug || !KEBAB.test(slug)) return refuse('That is not a project I recognise.')
  if (!Array.isArray(edits) || edits.length === 0) return refuse('There was nothing to apply.')

  // Every edit in a batch must name the same file: `applyEdits` works on one
  // source string, and a batch spanning two files could half-succeed, which is
  // exactly what atomicity is supposed to rule out.
  const files = new Set<string>()
  for (const edit of edits) {
    const file = fileOf(edit.src, slug)
    if (!file) return refuse('That change points outside the project, so it was not saved.')
    files.add(file)
  }
  if (files.size > 1) return refuse('That batch spans more than one file.')

  const file = [...files][0]
  let source: string
  try {
    source = await fs.readFile(file, 'utf8')
  } catch {
    return refuse('That screen file could not be read.')
  }

  const result = applyEdits(source, edits)
  if (!result.ok) return refuse(result.refused.reason)

  // Nothing changed is a success with no write: rewriting identical bytes would
  // still trigger a fast refresh and flash the screen for no reason.
  if (result.source === source) {
    return NextResponse.json({ ok: true, file: path.relative(process.cwd(), file) })
  }

  try {
    await fs.writeFile(file, result.source, 'utf8')
  } catch {
    return refuse('That screen file could not be written.')
  }

  return NextResponse.json({
    ok: true,
    file: path.relative(process.cwd(), file),
  } satisfies DesignResponse)
}
