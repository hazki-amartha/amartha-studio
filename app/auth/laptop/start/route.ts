// =============================================================================
// Auth · localhost:4000/auth/laptop/start — sign this laptop in to the studio.
//
// Sends the designer to the deployed studio (/auth/laptop), which signs them in
// with Google and comes back to /auth/laptop/callback with their token. The
// `state` cookie ties the answer to this request, so a link from elsewhere
// can't plant someone else's sign-in on this laptop. Dev server only.
// =============================================================================

import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { safeNext } from '@/platform/auth/env'
import { isLoopbackRequest } from '@/platform/chat/localRequest'
import { STUDIO_URL } from '@/platform/dbProjects/public'

export const dynamic = 'force-dynamic'
const STATE_COOKIE = 'db_laptop_state'

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development' || !isLoopbackRequest(request)) return new NextResponse(null, { status: 404 })
  const url = new URL(request.url)
  const state = randomBytes(18).toString('base64url')
  const to = new URL('/auth/laptop', STUDIO_URL)
  to.searchParams.set('port', url.port || '4000')
  // Back to the same name this page was opened under — the state cookie lives there.
  to.searchParams.set('host', url.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost')
  to.searchParams.set('state', state)
  to.searchParams.set('next', safeNext(url.searchParams.get('next')))
  const res = NextResponse.redirect(to, 303)
  res.cookies.set(STATE_COOKIE, state, { httpOnly: true, sameSite: 'lax', path: '/auth/laptop', maxAge: 600 })
  return res
}
