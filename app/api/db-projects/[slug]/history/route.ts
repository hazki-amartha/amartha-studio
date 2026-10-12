// =============================================================================
// DB projects · history (platform/dbProjects/history.ts).
//
//   GET              → HistoryResponse: the project's save points, newest first
//   POST { id }      → RestoreResult: put the project back as it was at save
//                      point `id`. A refusal is a 200 with ok: false, so a
//                      laptop passing the request on gets the reason.
//
// Who may: the same as a draft (./draft) — on the dev server, the designer at
// this laptop, passed on as whoever signed in here; deployed, any editor.
// =============================================================================

import { NextResponse } from 'next/server'
import { isEditor, nameOf, requestUser } from '@/platform/auth/laptop'
import { isLocalRequest } from '@/platform/chat/localRequest'
import { KEBAB } from '@/platform/design/server/common'
import { listHistory, restoreTo } from '@/platform/dbProjects/history'
import type { HistoryResponse, RestoreResult } from '@/platform/dbProjects/protocol'
import { NotSignedIn, SIGN_IN_PATH } from '@/platform/dbProjects/remote'
import { viewerName } from '@/platform/dbProjects/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
// A restore reads the whole project's history.
export const maxDuration = 60

const answer = (body: HistoryResponse | RestoreResult) =>
  NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })

const SIGN_IN_FIRST = `Sign in to the studio on this laptop first — open localhost:4000${SIGN_IN_PATH}, then try again.`

async function allowed(request: Request): Promise<{ ok: boolean; by: string | null }> {
  const dev = process.env.NODE_ENV === 'development'
  const user = dev ? null : await requestUser(request)
  return { ok: dev ? isLocalRequest(request) : isEditor(user), by: user ? nameOf(user) : viewerName(null) }
}

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  if (!KEBAB.test(params.slug)) return answer({ ok: false, reason: 'Bad slug.' })
  if (!(await allowed(request)).ok) return answer({ ok: false, reason: 'Sign in as a studio editor to see the history.' })
  try {
    return answer(await listHistory(params.slug))
  } catch (err) {
    if (err instanceof NotSignedIn) return answer({ ok: false, reason: SIGN_IN_FIRST })
    console.error('[history]', err)
    return answer({ ok: false, reason: 'The history didn’t load — try again.' })
  }
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  if (!KEBAB.test(params.slug)) return answer({ ok: false, reason: 'Bad slug.' })
  const { ok, by } = await allowed(request)
  if (!ok) return answer({ ok: false, reason: 'Sign in as a studio editor to restore a version.' })
  const body = (await request.json().catch(() => null)) as { id?: unknown } | null
  if (typeof body?.id !== 'number') return answer({ ok: false, reason: 'Pick a save to restore.' })
  try {
    return answer(await restoreTo(params.slug, body.id, by))
  } catch (err) {
    if (err instanceof NotSignedIn) return answer({ ok: false, reason: SIGN_IN_FIRST })
    console.error('[history]', err)
    return answer({ ok: false, reason: 'That didn’t work — try again.' })
  }
}
