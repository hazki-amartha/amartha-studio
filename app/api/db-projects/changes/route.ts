// DB projects · GET /api/db-projects/changes — every file of every database
// project with when it was last saved. The live sync (scripts/db-live.mjs)
// polls this to see what someone else saved; it then reads just those files.

import { NextResponse } from 'next/server'
import { requestUser } from '@/platform/auth/laptop'
import { hiddenBranches } from '@/platform/dbProjects/branchAccess'
import { listDbChanges } from '@/platform/dbProjects/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(request: Request) {
  // Without the private branches the asker may not see, so a laptop never
  // gets a copy — and drops one that went private (scripts/db-live.mjs).
  const [rows, hidden] = await Promise.all([listDbChanges(), hiddenBranches(await requestUser(request))])
  return NextResponse.json({ rows: rows.filter((r) => !hidden.has(r.slug)) }, { headers: { 'Cache-Control': 'no-store' } })
}
