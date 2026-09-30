// =============================================================================
// DB projects · GET /api/db-projects/<slug> — a database project, compiled.
// Proof of concept behind /db/<slug>; see platform/dbProjects/server.ts.
// Gated by the middleware like every other route.
// =============================================================================

import { NextResponse } from 'next/server'
import { buildDbProject } from '@/platform/dbProjects/server'
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
  return NextResponse.json({ ok: true, ...build } satisfies DbProjectResponse, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
