import { NextResponse } from 'next/server'
import { isAuthConfigured, isSignInRequired } from '@/platform/auth/env'
import type { MeResponse } from '@/platform/auth/protocol'
import { getStudioUser } from '@/platform/auth/server'
import { allShareAccess } from '@/platform/share/server/access'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getStudioUser()
  const body: MeResponse = {
    configured: isAuthConfigured(),
    required: isSignInRequired(),
    user,
    // Signed in, a share link adds nothing.
    shares: user ? {} : await allShareAccess(),
  }
  return NextResponse.json(body, { headers: { 'cache-control': 'no-store' } })
}
