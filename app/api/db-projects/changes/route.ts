// DB projects · GET /api/db-projects/changes — every file of every database
// project with when it was last saved. The live sync (scripts/db-live.mjs)
// polls this to see what someone else saved; it then reads just those files.
// It sends back the version it got last time (?since=): while nothing has
// changed since, the answer is that version alone.

import { NextResponse } from 'next/server'
import { requestUser } from '@/platform/auth/laptop'
import { hiddenBranches } from '@/platform/dbProjects/branchAccess'
import { listDbChanges } from '@/platform/dbProjects/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(request: Request) {
  const viewer = await requestUser(request)
  const changes = await listDbChanges(new URL(request.url).searchParams.get('since'), viewer)
  if (!changes.rows) return NextResponse.json(changes, { headers: { 'Cache-Control': 'no-store' } })
  // Without the private branches the asker may not see, so a laptop never
  // gets a copy — and drops one that went private (scripts/db-live.mjs).
  const hidden = await hiddenBranches(viewer)
  return NextResponse.json(
    { ...changes, rows: changes.rows.filter((r) => !hidden.has(r.slug)) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
