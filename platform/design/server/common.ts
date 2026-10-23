// =============================================================================
// Design · what every backend checks before it writes.
//
// Server-only. The two backends (fsBackend, githubBackend) differ in where a
// file comes from and where it goes; everything about WHICH file a request
// may touch, and whether this person may touch it, is decided here once.
// =============================================================================

import path from 'path'
import { NextResponse } from 'next/server'
import { configs } from '@/projects/configs'
import { factsOf, findText } from '../facts'
import { addressesOf, isNewRef, type DesignRequest, type DesignResponse, type FactsResponse } from '../protocol'

export const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function refuse(reason: string): NextResponse {
  return NextResponse.json({ ok: false, reason } satisfies DesignResponse)
}

/**
 * The repo-relative file an address names, or null if it isn't a `.tsx` file
 * inside `projects/<slug>/`.
 *
 * Checked on the RESOLVED path, so neither `..` nor an absolute-looking name
 * can reach outside the project.
 */
export function projectFile(src: string, slug: string): string | null {
  const rel = src.split(':').slice(0, -2).join(':')
  return checkFile(rel, slug)
}

export function checkFile(rel: string, slug: string): string | null {
  // `.ts` for the data files a LiteralEdit rewrites; every JSX address is
  // stamped from a `.tsx`.
  if (!rel || !/\.tsx?$/.test(rel)) return null
  const root = path.resolve('/repo')
  const abs = path.resolve(root, rel)
  const projectDir = path.join(root, 'projects', slug)
  if (!abs.startsWith(projectDir + path.sep)) return null
  return path.relative(root, abs).split(path.sep).join('/')
}

/**
 * The one file a batch touches, or why it can't be written.
 *
 * Every address in a batch — each edit's own and any anchor it names — must
 * point into the same file: `applyEdits` works on one source string, and a
 * batch spanning two files could half-succeed, which is exactly what
 * atomicity is supposed to rule out. `new:` addresses name elements the batch
 * itself creates; they ride on the file of whatever they were put beside.
 */
export function batchFile(body: DesignRequest): { file: string } | { reason: string } {
  const files = new Set<string>()
  for (const edit of body.edits) {
    for (const src of addressesOf(edit)) {
      if (isNewRef(src)) continue
      const file = projectFile(src, body.slug)
      if (!file) return { reason: 'That change points outside the project, so it was not saved.' }
      files.add(file)
    }
  }
  if (files.size === 0 && body.file) {
    const file = checkFile(body.file, body.slug)
    if (file) files.add(file)
  }
  if (files.size > 1) return { reason: 'Elements can only be moved within the file they are written in.' }
  if (files.size === 0) return { reason: 'There is nowhere on the screen for that to go.' }
  return { file: [...files][0] }
}

/**
 * Answer a facts request — `?facts=<file>` (what a file's JSX can take) or
 * `?find=<text>` (where a piece of text is written) — from wherever this
 * backend keeps the project's files. Null when the request asks for neither.
 */
export async function factsResponse(
  url: URL,
  slug: string,
  files: {
    read: (rel: string) => Promise<string | null>
    all?: () => Promise<Map<string, string>>
  },
): Promise<NextResponse | null> {
  const fact = url.searchParams.get('facts')
  const text = url.searchParams.get('find')
  if (fact === null && text === null) return null
  const nope = (reason: string) => NextResponse.json({ ok: false, reason } satisfies FactsResponse)
  if (fact !== null) {
    const file = checkFile(fact, slug)
    if (!file) return nope('That file isn’t part of this project.')
    const source = await files.read(file).catch(() => null)
    if (source === null) return nope('That file could not be read.')
    const facts = factsOf(source, file)
    if (!facts) return nope('That file could not be parsed.')
    return NextResponse.json(facts satisfies FactsResponse, { headers: { 'cache-control': 'no-store' } })
  }
  if (!files.all) return nope('Text can’t be looked up here.')
  if (!text || text.length > 400) return nope('That text can’t be looked up.')
  const all = await files.all().catch(() => new Map<string, string>())
  const matches = findText(all, text)
  return NextResponse.json({ ok: true, matches } satisfies FactsResponse, { headers: { 'cache-control': 'no-store' } })
}

/** The icon names in the icon module's source. */
export function iconNamesIn(source: string): Set<string> {
  return new Set(Array.from(source.matchAll(/^export function ([A-Z]\w*)\(/gm), (m) => m[1]))
}

export interface ProjectFacts {
  owners: string[]
  status: string
}

/** A git project's owners and status — null for anything else. Git only on
 *  purpose: its callers write to git (the GitHub backend, Push), and a
 *  database project must never reach them. Its own route reads the database
 *  copy (app/api/db-projects/[slug]/design). */
export async function projectFacts(slug: string): Promise<ProjectFacts | null> {
  const load = configs[slug]
  if (!load) return null
  const config = await load()
  return { owners: [config.owner].flat(), status: config.status }
}

const same = (a: string, b: string) => a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase()

/**
 * Why `name` may not write to this project from the link — or null.
 *
 * A courtesy check, not a security boundary (plan § Resolved conflict —
 * identity): the password gate is the boundary, and every write is still a
 * visible commit that CI must pass. What this prevents is the easy mistake —
 * tweaking a colleague's prototype, or production documentation, because the
 * panel was open on it.
 */
export function whyNot(facts: ProjectFacts, name: string | undefined): string | null {
  if (facts.status === 'live') {
    return 'This project documents what is live in production, so it can’t be changed from here.'
  }
  if (!name?.trim()) return 'Say who is editing first.'
  if (!facts.owners.some((o) => same(o, name))) {
    return `This is ${facts.owners.join(' and ')}’s project, so changes here can only be collected.`
  }
  return null
}
