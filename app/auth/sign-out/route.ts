import { NextResponse } from 'next/server'
import { createSessionClient, isSameOrigin } from '@/platform/auth/server'

// Signs out of the studio and, sharing the cookie, of /assets-app too.
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 })
  await createSessionClient()?.auth.signOut()
  return NextResponse.json({ ok: true })
}
