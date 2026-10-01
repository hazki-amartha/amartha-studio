// =============================================================================
// GET  /api/me              who is signed in, and what this browser may open
// POST /api/me { name }     change the name you go by (platform/auth/profiles.ts)
//
// Signed in by a browser session, or — from a laptop's dev server — by the
// laptop's token. A laptop's own /api/me asks the deployed studio, as the
// designer signed in on it: it holds no session and no database key.
// =============================================================================

import { NextResponse } from 'next/server'
import { isAuthConfigured, isSignInRequired } from '@/platform/auth/env'
import { requestUser } from '@/platform/auth/laptop'
import { renameProfile } from '@/platform/auth/profiles'
import type { MeResponse, RenameRequest, RenameResponse, StudioUser } from '@/platform/auth/protocol'
import { isSameOrigin } from '@/platform/auth/server'
import { isLoopbackRequest } from '@/platform/chat/localRequest'
import { laptopCredentials, NotSignedIn, remote } from '@/platform/dbProjects/remote'
import { allShareAccess } from '@/platform/share/server/access'

export const dynamic = 'force-dynamic'

const NO_STORE = { headers: { 'cache-control': 'no-store' } }

/** On a laptop's dev server, the deployed studio's answer for this laptop. */
const onLaptop = (request: Request) =>
  process.env.NODE_ENV === 'development' && !process.env.STUDIO_DB_SUPABASE_URL && isLoopbackRequest(request) && laptopCredentials()

export async function GET(request: Request) {
  let user: StudioUser | null = await requestUser(request)
  if (!user && onLaptop(request)) {
    user = await remote<MeResponse>('/api/me')
      .then((r) => r.user)
      .catch(() => null)
  }
  const body: MeResponse = {
    configured: isAuthConfigured() || Boolean(user),
    required: isSignInRequired(),
    user,
    // Signed in, a share link adds nothing.
    shares: user ? {} : await allShareAccess(),
  }
  return NextResponse.json(body, NO_STORE)
}

export async function POST(request: Request) {
  const answer = (body: RenameResponse, status = 200) => NextResponse.json(body, { ...NO_STORE, status })
  const body = (await request.json().catch(() => null)) as Partial<RenameRequest> | null
  const wanted = typeof body?.name === 'string' ? body.name : ''

  if (onLaptop(request)) {
    try {
      return answer(await remote<RenameResponse>('/api/me', { method: 'POST', write: true, body: JSON.stringify({ name: wanted }) }))
    } catch (err) {
      const reason = err instanceof NotSignedIn ? 'Sign in on this laptop first.' : 'Your name couldn’t be saved — try again.'
      return answer({ ok: false, reason })
    }
  }

  const user = await requestUser(request)
  // A token is a laptop's own; a cookie has to come from the studio's pages.
  if (!user || (!request.headers.get('authorization') && !isSameOrigin(request))) {
    return answer({ ok: false, reason: 'Sign in with your Amartha Google account first.' }, 401)
  }
  // Viewers have a name too — their comments carry it.
  if (!user.displayName) return answer({ ok: false, reason: 'Your name couldn’t be saved — try again.' })
  return answer(await renameProfile(user.email, user.displayName, wanted))
}
