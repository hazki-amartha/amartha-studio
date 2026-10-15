// Chat · a pasted Figma link's frame name, for its chip in the composer.
// Only where the studio has a Figma login (the deployed chat's owner); anywhere
// else the chip keeps the name the link itself spells.

import { isOwner } from '@/platform/chat/server/cloud'
import { figmaNodeName } from '@/platform/chat/server/figma'
import { figmaAuthConfigured } from '@/platform/chat/server/figmaAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  if (!figmaAuthConfigured() || !(await isOwner())) return new Response(null, { status: 404 })
  const link = new URL(request.url).searchParams.get('url') ?? ''
  const name = await figmaNodeName(link).catch(() => null)
  return Response.json({ name }, { headers: { 'cache-control': 'no-store' } })
}
