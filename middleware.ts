// WS-F · Password gate, plus the Google session refresh.
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
// can't write cookies. Anonymous viewers — most of the traffic — never cost a
// Supabase round-trip. /assets-app is left to the Assets app, which refreshes
// the same cookie itself: two refreshers racing one refresh token would sign
// the designer out.

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { COOKIE_NAME, isGateConfigured, verifySessionToken } from '@/app/unlock/auth'
import { supabaseEnv } from '@/platform/auth/env'

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

  return refreshSession(request)
}

async function refreshSession(request: NextRequest): Promise<NextResponse> {
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
    return response
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
    await supabase.auth.getUser()
  } catch {
    // Supabase unreachable: serve the page; the session is simply not refreshed.
  }
  return response
}

export const config = {
  // Match everything except Next internals, the favicon, and any file with an
  // extension (covers /public static assets). /unlock is handled in-function.
  // `_vercel` is excluded so the Web Analytics beacon (POST /_vercel/insights/view)
  // is never redirected to the gate — it carries no session cookie of its own.
  matcher: ['/((?!_next/static|_next/image|_vercel|favicon.ico|.*\\.[\\w]+$).*)'],
}
