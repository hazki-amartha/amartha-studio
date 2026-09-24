// =============================================================================
// Share · make, list and revoke a prototype's share links (platform/share).
//
//   GET  ?slug=…                              the live links (signed in)
//   POST { action: 'create', slug, access, days }   any signed-in editor
//   POST { action: 'revoke', slug, token }          any signed-in editor
// =============================================================================

import { canShare, getStudioUser, isSameOrigin } from '@/platform/auth/server'
import { EXPIRY_CHOICES, type ShareRequest, type ShareResponse } from '@/platform/share/protocol'
import { createShare, isShareStoreConfigured, isToken, listShares, revokeShare } from '@/platform/share/server/store'
import { configs } from '@/projects/configs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/
const knownSlug = (slug: unknown): slug is string => typeof slug === 'string' && KEBAB.test(slug) && slug in configs

const json = (body: ShareResponse, status = 200) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store' } })

export async function GET(request: Request): Promise<Response> {
  const slug = new URL(request.url).searchParams.get('slug')
  if (!knownSlug(slug)) return json({ error: 'Unknown project' }, 404)
  if (!(await getStudioUser())) return json({ error: 'Sign in to see share links' }, 401)
  if (!isShareStoreConfigured()) return json({ links: [] })
  try {
    return json({ links: await listShares(slug) })
  } catch {
    return json({ error: 'Share links are unavailable right now' }, 503)
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return json({ error: 'Forbidden' }, 403)
  const user = await getStudioUser()
  if (!canShare(user)) return json({ error: 'Only editors can share prototypes' }, 403)
  if (!isShareStoreConfigured()) return json({ error: 'Sharing is not set up here' }, 404)

  const body = (await request.json().catch(() => null)) as ShareRequest | null
  if (!body || !knownSlug(body.slug)) return json({ error: 'Unknown project' }, 404)

  try {
    if (body.action === 'create') {
      if (body.access !== 'view' && body.access !== 'comment') return json({ error: 'Pick view or comment' }, 400)
      if (!EXPIRY_CHOICES.includes(body.days)) return json({ error: 'Pick an expiry' }, 400)
      return json({ link: await createShare(body.slug, body.access, body.days, user.label) })
    }
    if (body.action === 'revoke') {
      if (!isToken(body.token)) return json({ error: 'Unknown link' }, 404)
      await revokeShare(body.slug, body.token)
      return json({ links: await listShares(body.slug) })
    }
    return json({ error: 'Unknown action' }, 400)
  } catch {
    return json({ error: 'Share links are unavailable right now' }, 503)
  }
}
