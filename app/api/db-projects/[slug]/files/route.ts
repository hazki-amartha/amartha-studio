// DB projects · GET /api/db-projects/<slug>/files — a project's files with when
// each was last saved. What a laptop reads a database project through
// (platform/dbProjects/remote.ts): open to whoever can open the project's link,
// as the compiled build at /api/db-projects/<slug> already is.

import { NextResponse } from 'next/server'
import { KEBAB } from '@/platform/design/server/common'
import { readDbRows } from '@/platform/dbProjects/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  if (!KEBAB.test(params.slug)) return NextResponse.json({ error: 'Bad slug.' }, { status: 400 })
  const rows = await readDbRows(params.slug)
  return NextResponse.json(
    { rows: [...rows].map(([path, r]) => ({ path, content: r.content, at: r.at })) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
