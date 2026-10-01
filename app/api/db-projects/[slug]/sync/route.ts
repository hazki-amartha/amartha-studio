// =============================================================================
// DB projects · POST /api/db-projects/<slug>/sync — saving local edits to a
// database project.
//
//   { changes: [{ path, content, baseAt }], by }
//     → { saved: { [path]: at }, ids, conflicts: [{ path, content, at }], problems }
//
// Two callers. On a laptop, the live sync (scripts/db-live.mjs) posts here to
// its own dev server — this laptop only — which runs the checks and passes the
// save on to the deployed studio as the signed-in designer (./remote.ts). On
// the deployed studio, that is who arrives: any studio editor, by browser
// session or laptop token (platform/auth/laptop.ts), and the save lands.
//
// The same gate as every other save: nothing lands unless the project, with
// these changes, passes the checks (platform/dbProjects/checks.ts) — and a file
// someone else saved since `baseAt` is not overwritten but handed back, with
// its current content, for the sync to merge.
// =============================================================================

import { NextResponse } from 'next/server'
import { isEditor, nameOf, requestUser } from '@/platform/auth/laptop'
import { isLocalRequest } from '@/platform/chat/localRequest'
import { NotSignedIn, SIGN_IN_PATH } from '@/platform/dbProjects/remote'
import { KEBAB } from '@/platform/design/server/common'
import { checkDbProject } from '@/platform/dbProjects/checks'
import { readDbRows, saveIfUnchanged, type GuardedChange } from '@/platform/dbProjects/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface Body {
  changes: GuardedChange[]
  by?: string
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const dev = process.env.NODE_ENV === 'development'
  const user = dev ? null : await requestUser(request)
  if (dev ? !isLocalRequest(request) : !isEditor(user)) {
    return NextResponse.json({ error: 'Sign in as a studio editor.' }, { status: 401 })
  }
  try {
    return await save(request, params.slug, user ? nameOf(user) : null)
  } catch (err) {
    if (err instanceof NotSignedIn) {
      return NextResponse.json({ error: 'sign-in', signIn: SIGN_IN_PATH }, { status: 401 })
    }
    throw err
  }
}

async function save(request: Request, slug: string, signedAs: string | null) {
  if (!KEBAB.test(slug)) return NextResponse.json({ error: 'Bad slug.' }, { status: 400 })
  const body = (await request.json().catch(() => null)) as Body | null
  const changes = (body?.changes ?? []).filter(
    (c) => typeof c.path === 'string' && typeof c.content === 'string' && !c.path.includes('..'),
  )

  const rows = await readDbRows(slug)
  const moved = changes.filter((c) => (rows.get(c.path)?.at ?? null) !== c.baseAt)
  const clear = changes.filter((c) => !moved.includes(c))
  const conflicts = (paths: string[]) =>
    paths.flatMap((p) => {
      const row = rows.get(p)
      return row ? [{ path: p, content: row.content, at: row.at }] : []
    })

  if (!clear.length) {
    return NextResponse.json({ saved: {}, ids: {}, conflicts: conflicts(moved.map((c) => c.path)), problems: [] })
  }

  const current = new Map([...rows].map(([p, r]) => [p, r.content]))
  const after = new Map(current)
  for (const c of clear) after.set(c.path, c.content)
  const problems = await checkDbProject(slug, after, current, clear.map((c) => c.path))
  if (problems.length) {
    return NextResponse.json({ saved: {}, ids: {}, conflicts: conflicts(moved.map((c) => c.path)), problems })
  }

  // Deployed, the account names the save; on a laptop, the sync says who.
  const result = await saveIfUnchanged(slug, clear, signedAs ?? body?.by?.slice(0, 60) ?? null)
  const raced = result.conflicts.length ? await readDbRows(slug) : rows
  return NextResponse.json({
    saved: Object.fromEntries([...result.saved].map(([p, s]) => [p, s.at])),
    ids: Object.fromEntries([...result.saved].map(([p, s]) => [p, s.id])),
    conflicts: [...moved.map((c) => c.path), ...result.conflicts].flatMap((p) => {
      const row = raced.get(p)
      return row ? [{ path: p, content: row.content, at: row.at }] : []
    }),
    problems: [],
  })
}
