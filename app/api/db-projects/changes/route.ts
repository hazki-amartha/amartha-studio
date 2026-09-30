// DB projects · GET /api/db-projects/changes — every file of every database
// project with when it was last saved. The live sync (scripts/db-live.mjs)
// polls this to see what someone else saved; it then reads just those files.

import { NextResponse } from 'next/server'
import { listDbChanges } from '@/platform/dbProjects/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET() {
  return NextResponse.json({ rows: await listDbChanges() }, { headers: { 'Cache-Control': 'no-store' } })
}
