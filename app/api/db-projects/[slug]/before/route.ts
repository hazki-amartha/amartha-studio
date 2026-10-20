// DB projects · GET /api/db-projects/<slug>/before?id= — a file as it was
// before one save, for Edit mode's undo on a laptop. Editors only.

import { NextResponse } from 'next/server'
import { isEditor, requestUser } from '@/platform/auth/laptop'
import { maySee, PRIVATE_BRANCH } from '@/platform/dbProjects/branchAccess'
import { isLocalRequest } from '@/platform/chat/localRequest'
import { KEBAB } from '@/platform/design/server/common'
import { contentBefore } from '@/platform/dbProjects/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const dev = process.env.NODE_ENV === 'development'
  const user = dev ? null : await requestUser(request)
  if (!(dev ? isLocalRequest(request) : isEditor(user))) {
    return NextResponse.json({ error: 'Sign in as a studio editor.' }, { status: 401 })
  }
  if (!(await maySee(params.slug, user))) return NextResponse.json({ error: PRIVATE_BRANCH }, { status: 404 })
  const id = Number(new URL(request.url).searchParams.get('id'))
  if (!KEBAB.test(params.slug) || !Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }
  return NextResponse.json({ snap: await contentBefore(params.slug, id) })
}
