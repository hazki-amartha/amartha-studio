// =============================================================================
// DB projects · GET /api/db-projects — every database project's config, for
// the shell's project list (platform/chrome/loadProjectIndex). The gallery
// reads the same list on the server, through listDbConfigs().
// =============================================================================

import { NextResponse } from 'next/server'
import { listDbConfigs } from '@/platform/dbProjects/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET() {
  return NextResponse.json({ projects: await listDbConfigs() }, { headers: { 'Cache-Control': 'no-store' } })
}
