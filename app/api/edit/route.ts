// =============================================================================
// Edit · the dev-only write-back route.
//
// Receives one verified-replace edit (see platform/edit/protocol.ts) and
// applies it to the project's source, or refuses. The contract that keeps this
// safe to expose to a panel:
//
//   • Dev server only. Production builds 404 unconditionally — the deployed
//     studio has no files to edit and must never pretend otherwise.
//   • Writes are confined to `projects/<slug>/` by construction: slug and
//     screen id are validated to kebab-case and joined under the projects dir,
//     so there is no path a request can spell that escapes a project folder.
//   • Never guess. Every edit names its OLD value; the server applies it only
//     when the source contains exactly ONE plausible site. Zero or many → a
//     refusal with a reason, and the panel falls back to the copy-for-agent
//     string. A wrong-line write is strictly worse than no write.
//
// Search order mirrors where screen markup actually lives: the screen file
// itself, then the project's lib/ helpers.
// =============================================================================

import { promises as fs } from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import type { Edit, EditRequest, EditResponse } from '@/platform/edit/protocol'

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/
/** Token classes and prop values only — nothing that could splice syntax. */
const SAFE_VALUE = /^[a-zA-Z0-9-]+$/

function refuse(reason: string): NextResponse {
  return NextResponse.json({ ok: false, reason } satisfies EditResponse)
}

/** The files an element on this screen can be authored in. */
async function candidateFiles(slug: string, screenId: string): Promise<string[]> {
  const projectDir = path.join(process.cwd(), 'projects', slug)
  const files = [path.join(projectDir, 'screens', `${screenId}.tsx`)]
  try {
    const lib = path.join(projectDir, 'lib')
    for (const entry of await fs.readdir(lib)) {
      if (entry.endsWith('.tsx') || entry.endsWith('.ts')) files.push(path.join(lib, entry))
    }
  } catch {
    // No lib/ — the screen file alone is the search space.
  }
  const existing: string[] = []
  for (const file of files) {
    try {
      await fs.access(file)
      existing.push(file)
    } catch {
      // Skip missing files; the screen file itself missing surfaces as 0 matches.
    }
  }
  return existing
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Word boundary inside a className string: whitespace, quotes, or an edge. */
const clsRe = (cls: string) => new RegExp(`(^|[\\s'"\`])${escapeRe(cls)}(?=$|[\\s'"\`])`)

/** Every className attribute span in a source file, with its offset. */
function classNameSpans(source: string): { start: number; text: string }[] {
  const re = /className\s*=\s*(?:"[^"]*"|'[^']*'|\{\s*`(?:[^`\\]|\\.)*`\s*\}|\{\s*"[^"]*"\s*\}|\{\s*'[^']*'\s*\})/g
  const spans: { start: number; text: string }[] = []
  for (const m of source.matchAll(re)) spans.push({ start: m.index ?? 0, text: m[0] })
  return spans
}

interface Match {
  file: string
  /** Where the element starts in its file — the window text tie-breaking reads. */
  at: number
  apply: (source: string) => string
}

/**
 * Tie-break several structural matches by the element's rendered text: keep
 * matches whose following source window contains it (whitespace-insensitive,
 * since JSX splits text across lines freely). Used ONLY to narrow — if the
 * text filters everything out (dynamic content, say), the original ambiguity
 * stands and the caller refuses, which can never write a wrong line.
 */
function narrowByText<M extends { file: string; at: number }>(
  matches: M[],
  files: Map<string, string>,
  text: string | undefined,
): M[] {
  if (matches.length <= 1 || !text) return matches
  const needle = text.replace(/\s+/g, '').slice(0, 60)
  if (needle.length < 3) return matches
  const narrowed = matches.filter((m) => {
    const source = files.get(m.file) ?? ''
    const window = source.slice(m.at, m.at + 600).replace(/\s+/g, '')
    return window.includes(needle)
  })
  return narrowed.length > 0 ? narrowed : matches
}

function findClassEdits(
  files: Map<string, string>,
  find: string[],
  oldClass: string,
  newClass: string,
): Match[] {
  const matches: Match[] = []
  for (const [file, source] of files) {
    for (const span of classNameSpans(source)) {
      const hasAll = find.every((cls) => clsRe(cls).test(span.text))
      if (!hasAll || !clsRe(oldClass).test(span.text)) continue
      matches.push({
        file,
        at: span.start,
        apply: (src) => {
          const updated = span.text.replace(clsRe(oldClass), `$1${newClass}`)
          return src.slice(0, span.start) + updated + src.slice(span.start + span.text.length)
        },
      })
    }
  }
  return matches
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0
  let i = haystack.indexOf(needle)
  while (i !== -1) {
    count += 1
    i = haystack.indexOf(needle, i + needle.length)
  }
  return count
}

async function applyEdit(slug: string, screenId: string, edit: Edit): Promise<EditResponse> {
  const filePaths = await candidateFiles(slug, screenId)
  if (filePaths.length === 0) return { ok: false, reason: 'Screen file not found.' }

  const files = new Map<string, string>()
  for (const file of filePaths) files.set(file, await fs.readFile(file, 'utf8'))

  if (edit.kind === 'class') {
    if (!SAFE_VALUE.test(edit.newClass) || !SAFE_VALUE.test(edit.oldClass)) {
      return { ok: false, reason: 'Not a token class.' }
    }
    const matches = narrowByText(
      findClassEdits(files, edit.find, edit.oldClass, edit.newClass),
      files,
      edit.text,
    )
    if (matches.length === 0) {
      return { ok: false, reason: 'No element in the source matches these classes.' }
    }
    if (matches.length > 1) {
      return {
        ok: false,
        reason: `${matches.length} places match these classes — ambiguous, not applying.`,
      }
    }
    const { file, apply } = matches[0]
    await fs.writeFile(file, apply(files.get(file) ?? ''), 'utf8')
    return { ok: true, file: path.relative(process.cwd(), file) }
  }

  if (edit.kind === 'text') {
    const old = edit.old
    if (old.trim().length < 2) return { ok: false, reason: 'Text too short to match safely.' }
    if (/[<>{}]/.test(edit.next)) {
      return { ok: false, reason: 'New text contains characters that would break the code.' }
    }
    const hits = Array.from(files.entries())
      .map(([file, source]) => ({ file, count: countOccurrences(source, old) }))
      .filter((h) => h.count > 0)
    const total = hits.reduce((sum, h) => sum + h.count, 0)
    if (total === 0) {
      return {
        ok: false,
        reason: 'This text isn’t written directly in the source — it may be dynamic.',
      }
    }
    if (total > 1) {
      return { ok: false, reason: `This text appears ${total} times — ambiguous, not applying.` }
    }
    const { file } = hits[0]
    const source = files.get(file) ?? ''
    await fs.writeFile(file, source.replace(old, edit.next), 'utf8')
    return { ok: true, file: path.relative(process.cwd(), file) }
  }

  // kind === 'prop'
  if (
    !SAFE_VALUE.test(edit.component) ||
    !SAFE_VALUE.test(edit.prop) ||
    !SAFE_VALUE.test(edit.old) ||
    !SAFE_VALUE.test(edit.next)
  ) {
    return { ok: false, reason: 'Not a component prop.' }
  }

  // Written props first: `prop="old"` inside an opening tag of this component.
  const written: { file: string; at: number; tag: string }[] = []
  const tagRe = new RegExp(`<${escapeRe(edit.component)}\\b[^>]*`, 'g')
  const propRe = new RegExp(`\\b${escapeRe(edit.prop)}\\s*=\\s*"${escapeRe(edit.old)}"`)
  const bare: { file: string; at: number }[] = []

  for (const [file, source] of files) {
    for (const m of source.matchAll(tagRe)) {
      if (propRe.test(m[0])) written.push({ file, at: m.index ?? 0, tag: m[0] })
      else if (!new RegExp(`\\b${escapeRe(edit.prop)}\\s*=`).test(m[0])) {
        bare.push({ file, at: m.index ?? 0 })
      }
    }
  }

  const writtenNarrowed = narrowByText(written, files, edit.text)
  if (writtenNarrowed.length === 1) {
    const { file, at, tag } = writtenNarrowed[0]
    const source = files.get(file) ?? ''
    const updatedTag = tag.replace(propRe, `${edit.prop}="${edit.next}"`)
    await fs.writeFile(
      file,
      source.slice(0, at) + updatedTag + source.slice(at + tag.length),
      'utf8',
    )
    return { ok: true, file: path.relative(process.cwd(), file) }
  }
  if (writtenNarrowed.length > 1) {
    return {
      ok: false,
      reason: `${writtenNarrowed.length} ${edit.component}s carry ${edit.prop}="${edit.old}" — ambiguous.`,
    }
  }

  // Not written anywhere → the value is the default; introduce the prop, but
  // only when exactly one tag could be the one on screen.
  const bareNarrowed = narrowByText(bare, files, edit.text)
  if (bareNarrowed.length === 1) {
    const { file, at } = bareNarrowed[0]
    const source = files.get(file) ?? ''
    const insertAt = at + `<${edit.component}`.length
    const next =
      source.slice(0, insertAt) + ` ${edit.prop}="${edit.next}"` + source.slice(insertAt)
    await fs.writeFile(file, next, 'utf8')
    return { ok: true, file: path.relative(process.cwd(), file) }
  }
  return {
    ok: false,
    reason:
      bareNarrowed.length === 0
        ? `No ${edit.component} found in this screen's source.`
        : `${bareNarrowed.length} ${edit.component}s could be this one — ambiguous, not applying.`,
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  // The deployed studio is a finished build with no source behind it. 404, not
  // an error payload — outside dev this route does not exist.
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse(null, { status: 404 })
  }

  let body: EditRequest
  try {
    body = (await request.json()) as EditRequest
  } catch {
    return refuse('Malformed request.')
  }

  const { slug, screenId, edit } = body ?? {}
  if (!slug || !screenId || !KEBAB.test(slug) || !KEBAB.test(screenId) || !edit) {
    return refuse('Malformed request.')
  }

  try {
    return NextResponse.json(await applyEdit(slug, screenId, edit))
  } catch {
    return refuse('The edit could not be written.')
  }
}
