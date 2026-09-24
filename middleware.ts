// WS-F · Password gate, the Google session, and — once switched on — sign-in
// for the whole studio.
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
//
// Sign-in (platform/auth): when Supabase is configured and the request carries
// a session cookie, the session is refreshed here, since server components
// can't write cookies. Anonymous viewers never cost a Supabase round-trip.
// /assets-app is left to the Assets app, which refreshes the same cookie
// itself: two refreshers racing one refresh token would sign the designer out.
//
// STUDIO_REQUIRE_SIGN_IN=1 makes the studio members-only, as in Vocus. Without
// a session, the only ways in are a share link's prototype (platform/share:
// /p/<slug>, its flow view, and comments, which check the link themselves) and
// the pages that get you signed in. Pages redirect to Google; APIs answer 401.

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { COOKIE_NAME, isGateConfigured, verifySessionToken } from '@/app/unlock/auth'
import { isAllowedEmail, isSignInRequired, supabaseEnv } from '@/platform/auth/env'
import { edgeShareOpens, shareCookie } from '@/platform/share/edge'

/** Reachable without signing in, even when sign-in is required. */
const OPEN = [/^\/auth\//, /^\/s\//, /^\/share-ended$/, /^\/api\/me$/, /^\/api\/comments$/, /^\/unlock(\/|$)/, /^\/assets-app(\/|$)/]
const PROTOTYPE = /^\/p\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/flow)?\/?$/

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Gate disabled when unconfigured, so local dev works without any env setup.
  if (isGateConfigured() && pathname !== '/unlock' && !pathname.startsWith('/unlock/')) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!(await verifySessionToken(token))) {
      const url = request.nextUrl.clone()
      url.pathname = '/unlock'
      url.search = ''
      const next = `${pathname}${search}`
      if (next && next !== '/') url.searchParams.set('next', next)
      return NextResponse.redirect(url)
    }
  }

  const { response, signedIn } = await session(request)
  if (!isSignInRequired() || signedIn || OPEN.some((re) => re.test(pathname))) return response

  const shared = pathname.match(PROTOTYPE)?.[1]
  if (shared && (await edgeShareOpens(request.cookies.get(shareCookie(shared))?.value, shared))) return response

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Sign in with your Amartha Google account.' }, { status: 401 })
  }
  const url = request.nextUrl.clone()
  url.pathname = '/auth/start'
  url.search = ''
  url.searchParams.set('next', `${pathname}${search}`)
  return NextResponse.redirect(url)
}

/** Refreshes the session cookie and says whether it is an Amartha account. */
async function session(request: NextRequest): Promise<{ response: NextResponse; signedIn: boolean }> {
  let response = NextResponse.next({ request })
  const env = supabaseEnv()
  const { pathname } = request.nextUrl
  if (
    !env ||
    pathname === '/assets-app' ||
    pathname.startsWith('/assets-app/') ||
    pathname.startsWith('/auth/') ||
    !request.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
  ) {
    return { response, signedIn: false }
  }
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  try {
    // Verifies the JWT (locally, with asymmetric signing keys) and refreshes
    // an expired one.
    const { data } = await supabase.auth.getClaims()
    return { response, signedIn: isAllowedEmail(data?.claims?.email as string | undefined) }
  } catch {
    // Supabase unreachable: serve open pages; gated ones ask to sign in.
    return { response, signedIn: false }
  }
}

export const config = {
  // Match everything except Next internals, the favicon, and any file with an
  // extension (covers /public static assets). /unlock is handled in-function.
  // `_vercel` is excluded so the Web Analytics beacon (POST /_vercel/insights/view)
  // is never redirected to the gate — it carries no session cookie of its own.
  matcher: ['/((?!_next/static|_next/image|_vercel|favicon.ico|.*\\.[\\w]+$).*)'],
}
