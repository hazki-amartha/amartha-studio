// DB projects · GET /api/db-projects/<slug>/files — a project's files with when
// each was last saved. What a laptop reads a database project through
// (platform/dbProjects/remote.ts): open to whoever can open the project's link,
// as the compiled build at /api/db-projects/<slug> already is.

import { NextResponse } from 'next/server'
import { requestUser } from '@/platform/auth/laptop'
import { KEBAB } from '@/platform/design/server/common'
import { maySee, PRIVATE_BRANCH } from '@/platform/dbProjects/branchAccess'
import { readDbRows } from '@/platform/dbProjects/server'
import { TRASH_FILE } from '@/platform/dbProjects/trashMeta'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  if (!KEBAB.test(params.slug)) return NextResponse.json({ error: 'Bad slug.' }, { status: 400 })
  if (!(await maySee(params.slug, await requestUser(request)))) return NextResponse.json({ error: PRIVATE_BRANCH }, { status: 404 })
  const rows = await readDbRows(params.slug)
  // A deleted project is shut until it's restored; the live sync drops it anyway.
  if (rows.has(TRASH_FILE)) return NextResponse.json({ error: 'This project was deleted.' }, { status: 404 })
  return NextResponse.json(
    { rows: [...rows].map(([path, r]) => ({ path, content: r.content, at: r.at })) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
