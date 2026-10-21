import { NextResponse } from 'next/server'
import { shareCookie } from '@/platform/share/protocol'
import { getShare } from '@/platform/share/server/store'

// The prototype's own deep links, carried through the redirect: /s/<token>
// ?screen=<id> opens on that screen, so one link can point at any page.
const CARRIED = ['screen', 'full']

// A share link: remember it for this prototype, then open the prototype. The
// cookie holds the token, not the access, so revoking the link ends it here too.
export async function GET(request: Request, { params }: { params: { token: string } }) {
  const from = new URL(request.url)
  const origin = from.origin
  const link = await getShare(params.token)
  if (!link) return NextResponse.redirect(new URL('/share-ended', origin), 303)

  const to = new URL(`/p/${link.slug}`, origin)
  for (const key of CARRIED) {
    const value = from.searchParams.get(key)
    if (value !== null) to.searchParams.set(key, value)
  }
  const res = NextResponse.redirect(to, 303)
  const maxAge = link.expiresAt
    ? Math.max(60, Math.floor((Date.parse(link.expiresAt) - Date.now()) / 1000))
    : 60 * 60 * 24 * 400
  res.cookies.set(shareCookie(link.slug), link.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
  return res
}
