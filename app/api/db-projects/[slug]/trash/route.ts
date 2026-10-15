// =============================================================================
// DB projects · delete or restore a project (platform/dbProjects/trash.ts).
//
//   POST { action: 'delete' }   hide it under Recently deleted, with its branches
//        { action: 'restore' }  bring it (and them) back
//     → TrashResult. A refusal is a 200 with ok: false, so a laptop passing the
//       request on gets the reason, not just a status.
//
// Who may: the project's owner or a studio admin — decided where the database
// is. On the dev server that's the deployed studio, asked as whoever signed in
// on this laptop; deployed, the session or laptop token making the request.
// =============================================================================

import { NextResponse } from 'next/server'
import { isEditor, nameOf, requestUser } from '@/platform/auth/laptop'
import { isLocalRequest } from '@/platform/chat/localRequest'
import { KEBAB } from '@/platform/design/server/common'
import { NotSignedIn, SIGN_IN_PATH } from '@/platform/dbProjects/remote'
import { createAdminClient } from '@/platform/dbProjects/server'
import { currentDeleter, trash, type Deleter } from '@/platform/dbProjects/trash'
import type { TrashAction, TrashResult } from '@/platform/dbProjects/trashMeta'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const answer = (body: TrashResult) => NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const dev = process.env.NODE_ENV === 'development'
  if (dev && !isLocalRequest(request)) return answer({ ok: false, reason: 'Sign in as a studio editor first.' })
  if (!KEBAB.test(params.slug)) return answer({ ok: false, reason: 'Bad slug.' })
  const body = (await request.json().catch(() => null)) as TrashAction | null
  if (body?.action !== 'delete' && body?.action !== 'restore') return answer({ ok: false, reason: 'Unknown action.' })

  let who: Deleter | null = null
  if (!dev) {
    const user = await requestUser(request)
    who = isEditor(user) ? { name: nameOf(user), admin: user.role === 'admin' } : null
  } else if (createAdminClient()) {
    who = await currentDeleter()
  }

  try {
    return answer(await trash(params.slug, body.action, who))
  } catch (err) {
    if (err instanceof NotSignedIn) {
      return answer({
        ok: false,
        reason: `Sign in to the studio on this laptop first — open localhost:4000${SIGN_IN_PATH}, then try again.`,
      })
    }
    console.error('[trash]', err)
    return answer({ ok: false, reason: 'That didn’t work — try again.' })
  }
}
