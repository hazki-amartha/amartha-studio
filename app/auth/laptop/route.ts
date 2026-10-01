// =============================================================================
// Auth · /auth/laptop — the deployed studio handing a designer's laptop their
// sign-in (platform/auth/laptop.ts).
//
//   laptop  localhost:4000/auth/laptop/start ─┐
//   here    /auth/laptop?port&state&next      │  Google sign-in if needed
//   laptop  localhost:<port>/auth/laptop/callback?token&state&next
//
// Only a studio editor gets a token, and it only ever goes back to this
// laptop's own address (localhost) — never another host.
// =============================================================================

import { NextResponse } from 'next/server'
import { createLaptopToken, isLaptopSignInConfigured } from '@/platform/auth/laptop'
import { isAllowedEmail, safeNext } from '@/platform/auth/env'
import { profileName } from '@/platform/auth/profiles'
import { createSessionClient, roleRow } from '@/platform/auth/server'

export const dynamic = 'force-dynamic'

function page(message: string, status = 400) {
  const html = `<!doctype html><meta charset="utf-8"><title>Amartha Studio</title><body style="font-family:system-ui;background:#0f0f12;color:#e8e8ea;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><p style="max-width:28rem;text-align:center;line-height:1.5">${message}</p></body>`
  return new NextResponse(html, { status, headers: { 'content-type': 'text/html; charset=utf-8' } })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const port = url.searchParams.get('port') ?? ''
  const state = url.searchParams.get('state') ?? ''
  const next = safeNext(url.searchParams.get('next'))
  if (!/^\d{4,5}$/.test(port) || Number(port) < 1024 || !/^[\w-]{16,64}$/.test(state)) {
    return page('That sign-in link isn’t right. Start again from the studio on your laptop.')
  }
  if (!isLaptopSignInConfigured()) return page('Laptop sign-in isn’t set up on this deployment.', 503)

  const supabase = createSessionClient()
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } }
  const user = data.user
  if (!user?.email || !isAllowedEmail(user.email)) {
    const back = `/auth/laptop?${url.searchParams.toString()}`
    return NextResponse.redirect(new URL(`/auth/start?next=${encodeURIComponent(back)}`, url.origin), 303)
  }
  const { role, displayName } = await roleRow(user.id, user.email)
  if (role !== 'editor' && role !== 'admin') {
    return page(`${user.email} isn’t a studio editor yet, so this laptop can’t save to shared projects. Ask the studio owner to add you.`, 403)
  }

  const host = url.searchParams.get('host') === '127.0.0.1' ? '127.0.0.1' : 'localhost'
  const back = new URL(`http://${host}:${port}/auth/laptop/callback`)
  back.searchParams.set('token', createLaptopToken(user.id, user.email))
  back.searchParams.set('state', state)
  back.searchParams.set('next', next)
  const google = user.user_metadata?.full_name ?? user.user_metadata?.name
  back.searchParams.set('name', await profileName(user.email, displayName, typeof google === 'string' ? google : null))
  return NextResponse.redirect(back, 303)
}
