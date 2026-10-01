// GET /api/names — every name a project may be owned under
// (platform/auth/profiles.ts). Asked by laptops, whose save checks hold a
// database project's owner to it but who can't read the database themselves.
// Members only when the studio is: middleware lets any Bearer header through
// to the route, so the token is checked here.

import { NextResponse } from 'next/server'
import { isSignInRequired } from '@/platform/auth/env'
import { requestUser } from '@/platform/auth/laptop'
import { knownNames } from '@/platform/auth/profiles'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (isSignInRequired() && !(await requestUser(request))) {
    return NextResponse.json({ names: [] }, { status: 401 })
  }
  return NextResponse.json({ names: await knownNames() }, { headers: { 'cache-control': 'no-store' } })
}
