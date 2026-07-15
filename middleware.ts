// WS-F · Password gate.
//
// Runs on the Edge runtime for every non-asset request. If the deployment has a
// SITE_PASSWORD, unauthenticated requests are redirected to /unlock. A valid,
// unexpired, HMAC-signed session cookie (set by the /unlock server action) grants
// access to every route for 30 days.
//
// Excluded from the check:
//   - /unlock and its sub-paths (otherwise the gate would lock out its own page)
//   - static assets (_next/static, _next/image, favicon, anything with a file
//     extension) — handled by the `matcher` config below
//   - all requests when no SITE_PASSWORD is configured (local dev / previews)

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { COOKIE_NAME, isGateConfigured, verifySessionToken } from '@/app/unlock/auth'

export async function middleware(request: NextRequest) {
  // Gate disabled when unconfigured, so local dev works without any env setup.
  if (!isGateConfigured()) return NextResponse.next()

  const { pathname, search } = request.nextUrl

  // The unlock page and its own assets must always be reachable.
  if (pathname === '/unlock' || pathname.startsWith('/unlock/')) {
    return NextResponse.next()
  }

  const token = request.cookies.get(COOKIE_NAME)?.value
  if (await verifySessionToken(token)) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = '/unlock'
  url.search = ''
  const next = `${pathname}${search}`
  if (next && next !== '/') url.searchParams.set('next', next)
  return NextResponse.redirect(url)
}

export const config = {
  // Match everything except Next internals, the favicon, and any file with an
  // extension (covers /public static assets). /unlock is handled in-function.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)'],
}
