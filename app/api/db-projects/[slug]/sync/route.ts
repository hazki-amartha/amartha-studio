// =============================================================================
// DB projects · POST /api/db-projects/<slug>/sync — the laptop's live sync
// (scripts/db-live.mjs) saving local edits to a database project.
//
//   { changes: [{ path, content, baseAt }], by }
//     → { saved: { [path]: at }, conflicts: [{ path, content, at }], problems }
//
// The same gate as every other save: nothing lands unless the project, with
// these changes, passes the checks (platform/dbProjects/checks.ts) — and a file
// someone else saved since `baseAt` is not overwritten but handed back, with
// its current content, for the sync to merge. Dev server only, this laptop only.
// =============================================================================

import { NextResponse } from 'next/server'
import { isLocalRequest } from '@/platform/chat/localRequest'
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
  if (process.env.NODE_ENV !== 'development' || !isLocalRequest(request)) return new NextResponse(null, { status: 404 })
  if (!KEBAB.test(params.slug)) return NextResponse.json({ error: 'Bad slug.' }, { status: 400 })
  const { slug } = params
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

  if (!clear.length) return NextResponse.json({ saved: {}, conflicts: conflicts(moved.map((c) => c.path)), problems: [] })

  const current = new Map([...rows].map(([p, r]) => [p, r.content]))
  const after = new Map(current)
  for (const c of clear) after.set(c.path, c.content)
  const problems = await checkDbProject(slug, after, current, clear.map((c) => c.path))
  if (problems.length) return NextResponse.json({ saved: {}, conflicts: conflicts(moved.map((c) => c.path)), problems })

  const result = await saveIfUnchanged(slug, clear, body?.by?.slice(0, 60) ?? null)
  const raced = result.conflicts.length ? await readDbRows(slug) : rows
  return NextResponse.json({
    saved: Object.fromEntries([...result.saved].map(([p, s]) => [p, s.at])),
    conflicts: [...moved.map((c) => c.path), ...result.conflicts].flatMap((p) => {
      const row = raced.get(p)
      return row ? [{ path: p, content: row.content, at: row.at }] : []
    }),
    problems: [],
  })
}
