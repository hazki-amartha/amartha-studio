import { NextResponse } from 'next/server'
import { isAllowedEmail, safeNext } from '@/platform/auth/env'
import { createSessionClient } from '@/platform/auth/server'

// Google → Supabase → here with ?code=. Exchanging it sets the session cookie,
// which /assets-app shares (same project, same origin, path /).
export async function GET(request: Request) {
  const url = new URL(request.url)
  const next = safeNext(url.searchParams.get('next'))
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/auth/start?error=${reason}&next=${encodeURIComponent(next)}`, url.origin), 303)

  const code = url.searchParams.get('code')
  const supabase = createSessionClient()
  if (!code || !supabase) return fail('auth')

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) return fail('auth')
  if (!isAllowedEmail(data.user.email)) {
    await supabase.auth.signOut()
    return fail('domain')
  }
  return NextResponse.redirect(new URL(next, url.origin), 303)
}
