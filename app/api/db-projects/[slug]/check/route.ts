// =============================================================================
// DB projects · GET /api/db-projects/<slug>/check — would the laptop's copy of
// a database project pass the save checks (platform/dbProjects/checks.ts)?
//
// For the Chat agent, through `npm run check:project` (scripts/check-project.mjs):
// it edits files in projects/<slug>/, and a turn that fails these checks is not
// saved, so it checks before it finishes. Dev server only, this laptop only.
// =============================================================================

import { NextResponse } from 'next/server'
import { isLocalRequest } from '@/platform/chat/localRequest'
import { KEBAB } from '@/platform/design/server/common'
import { diskChanges } from '@/platform/dbProjects/disk'
import { laptopCredentials } from '@/platform/dbProjects/remote'
import { createAdminClient, isDbProject, readDbFiles } from '@/platform/dbProjects/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  if (process.env.NODE_ENV !== 'development' || !isLocalRequest(request)) return new NextResponse(null, { status: 404 })
  if (!KEBAB.test(params.slug)) return NextResponse.json({ error: 'Bad slug.' }, { status: 400 })
  if (!(await isDbProject(params.slug))) return NextResponse.json({ db: false, problems: [] })
  const { changed, problems } = await diskChanges(params.slug, await readDbFiles(params.slug))
  if (changed.length && !createAdminClient() && !laptopCredentials()) {
    problems.unshift(
      'This laptop isn’t signed in to the studio, so nothing here saves. Ask the designer to open http://localhost:4000/auth/laptop/start — one Google sign-in.',
    )
  }
  return NextResponse.json({ db: true, changed: changed.map(([rel]) => rel), problems })
}
