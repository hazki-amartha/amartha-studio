import { NextResponse } from 'next/server'
import { isAuthConfigured } from '@/platform/auth/env'
import type { MeResponse } from '@/platform/auth/protocol'
import { getStudioUser } from '@/platform/auth/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const body: MeResponse = { configured: isAuthConfigured(), user: await getStudioUser() }
  return NextResponse.json(body, { headers: { 'cache-control': 'no-store' } })
}
