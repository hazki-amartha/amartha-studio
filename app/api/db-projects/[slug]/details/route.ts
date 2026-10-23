// =============================================================================
// DB projects · rename a project or change its owners (platform/dbProjects/details.ts).
//
//   POST { name?, owners? }  → DetailsResult. A refusal is a 200 with ok: false,
//     so a laptop passing the request on gets the reason, not just a status.
//
// Who may: the project's owner or a studio admin — decided where the database
// is. On the dev server that's the deployed studio, asked as whoever signed in
// on this laptop; deployed, the session or laptop token making the request.
// =============================================================================

import { NextResponse } from 'next/server'
import { isEditor, nameOf, requestUser } from '@/platform/auth/laptop'
import { isLocalRequest } from '@/platform/chat/localRequest'
import { KEBAB } from '@/platform/design/server/common'
import { editDetails } from '@/platform/dbProjects/details'
import type { DetailsChange, DetailsResult } from '@/platform/dbProjects/detailsMeta'
import { NotSignedIn, SIGN_IN_PATH } from '@/platform/dbProjects/remote'
import { createAdminClient } from '@/platform/dbProjects/server'
import { currentDeleter, type Deleter } from '@/platform/dbProjects/trash'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const answer = (body: DetailsResult) => NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })

function readChange(body: unknown): DetailsChange | null {
  if (!body || typeof body !== 'object') return null
  const { name, owners } = body as Record<string, unknown>
  if (name !== undefined && typeof name !== 'string') return null
  if (owners !== undefined && !(Array.isArray(owners) && owners.every((o) => typeof o === 'string'))) return null
  if (name === undefined && owners === undefined) return null
  return { ...(name !== undefined ? { name } : {}), ...(owners !== undefined ? { owners: owners as string[] } : {}) }
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const dev = process.env.NODE_ENV === 'development'
  if (dev && !isLocalRequest(request)) return answer({ ok: false, reason: 'Sign in as a studio editor first.' })
  if (!KEBAB.test(params.slug)) return answer({ ok: false, reason: 'Bad slug.' })
  const change = readChange(await request.json().catch(() => null))
  if (!change) return answer({ ok: false, reason: 'Nothing to change.' })

  let who: Deleter | null = null
  if (!dev) {
    const user = await requestUser(request)
    who = isEditor(user) ? { name: nameOf(user), admin: user.role === 'admin' } : null
  } else if (createAdminClient()) {
    who = await currentDeleter()
  }

  try {
    return answer(await editDetails(params.slug, change, who))
  } catch (err) {
    if (err instanceof NotSignedIn) {
      return answer({
        ok: false,
        reason: `Sign in to the studio on this laptop first — open localhost:4000${SIGN_IN_PATH}, then try again.`,
      })
    }
    console.error('[details]', err)
    return answer({ ok: false, reason: 'That didn’t work — try again.' })
  }
}
