// =============================================================================
// DB projects · GET /api/db-projects/<slug> — a database project, compiled.
// Proof of concept behind /db/<slug>; see platform/dbProjects/server.ts.
// Gated by the middleware like every other route.
// =============================================================================

import { NextResponse } from 'next/server'
import { buildDbProject, findProjectConfig } from '@/platform/dbProjects/server'
import type { DbProjectResponse } from '@/platform/dbProjects/protocol'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  if (!KEBAB.test(params.slug)) {
    return NextResponse.json({ ok: false, error: 'Bad slug.' } satisfies DbProjectResponse, { status: 400 })
  }
  const build = await buildDbProject(params.slug)
  if ('error' in build) {
    return NextResponse.json({ ok: false, error: build.error } satisfies DbProjectResponse, { status: 404 })
  }
  // A base in the database rides along (platform/dbProjects/load.ts links
  // both); its version joins this one's, so a save to the base shows here too.
  const baseSlug = (await findProjectConfig(params.slug))?.config.extends
  const base = baseSlug && (await findProjectConfig(baseSlug))?.inDb ? await buildDbProject(baseSlug) : null
  const body: DbProjectResponse =
    base && !('error' in base) ? { ok: true, ...build, version: `${build.version}+${base.version}`, base } : { ok: true, ...build }
  return NextResponse.json(body, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
