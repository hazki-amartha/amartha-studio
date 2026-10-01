// =============================================================================
// Auth · localhost:4000/auth/laptop/callback — the deployed studio's answer.
// Keeps the designer's token in ~/.amartha-studio/ (platform/dbProjects/
// remote.ts), where this dev server, the live sync and every checkout on the
// machine find it, then goes back to where they were. Dev server only.
// =============================================================================

import { NextResponse } from 'next/server'
import { safeNext } from '@/platform/auth/env'
import { isLoopbackRequest } from '@/platform/chat/localRequest'
import { saveLaptopCredentials } from '@/platform/dbProjects/remote'

export const dynamic = 'force-dynamic'
const STATE_COOKIE = 'db_laptop_state'

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development' || !isLoopbackRequest(request)) return new NextResponse(null, { status: 404 })
  const url = new URL(request.url)
  const token = url.searchParams.get('token') ?? ''
  const state = url.searchParams.get('state') ?? ''
  const expected = request.headers.get('cookie')?.match(new RegExp(`${STATE_COOKIE}=([^;]+)`))?.[1]
  if (!token || !state || state !== expected) {
    return new NextResponse('That sign-in didn’t come from this laptop. Start again from the studio.', { status: 400 })
  }
  saveLaptopCredentials(token, url.searchParams.get('name')?.slice(0, 60) || null)
  const res = NextResponse.redirect(new URL(safeNext(url.searchParams.get('next')), url.origin), 303)
  res.cookies.delete({ name: STATE_COOKIE, path: '/auth/laptop' })
  return res
}
