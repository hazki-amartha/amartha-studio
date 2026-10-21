// =============================================================================
// DB projects · GET /api/db-projects — every database project's config, for
// the shell's project list (platform/chrome/loadProjectIndex). The gallery
// reads the same list on the server, through listDbConfigs().
// =============================================================================

import { NextResponse } from 'next/server'
import { requestUser } from '@/platform/auth/laptop'
import { visibleTo } from '@/platform/dbProjects/draftMeta'
import { createAdminClient, listDbConfigs } from '@/platform/dbProjects/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(request: Request) {
  const projects = await listDbConfigs()
  // Deployed, without the private branches the asker may not see. A laptop's
  // list came from there already, left out for whoever signed in on it.
  const shown = createAdminClient() ? visibleTo(projects, await requestUser(request)) : projects
  return NextResponse.json({ projects: shown }, { headers: { 'Cache-Control': 'no-store' } })
}
