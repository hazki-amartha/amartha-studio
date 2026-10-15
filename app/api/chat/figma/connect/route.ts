// Chat · connect the studio to Figma — the owner opens this once, approves the
// studio in Figma, and lands on ../callback. See platform/chat/server/figmaAuth.ts.

import { NextResponse } from 'next/server'
import { isOwner } from '@/platform/chat/server/cloud'
import { authorizeUrl, figmaAuthConfigured } from '@/platform/chat/server/figmaAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  if (!figmaAuthConfigured() || !(await isOwner())) return new Response(null, { status: 404 })
  return NextResponse.redirect(await authorizeUrl(request), 303)
}
