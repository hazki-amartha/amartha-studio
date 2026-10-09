// =============================================================================
// DB projects · drafts (platform/dbProjects/drafts.ts).
//
//   GET  → DraftsResponse: is <slug> a draft, and its project's drafts.
//   POST { action: 'start', name }  start a draft of <slug>
//        { action: 'push' }         merge draft <slug> into its project
//        { action: 'discard' }      delete draft <slug>
//     → DraftActionResult. A refusal is a 200 with ok: false, so a laptop
//       passing the request on gets the reason, not just a status.
//
// Who may write: the same as a save (./sync) — on the dev server, the designer
// at this laptop, passed on as whoever signed in here; deployed, any editor.
// =============================================================================

import { NextResponse } from 'next/server'
import { isEditor, nameOf, requestUser } from '@/platform/auth/laptop'
import { isLocalRequest } from '@/platform/chat/localRequest'
import { KEBAB } from '@/platform/design/server/common'
import type { DraftAction, DraftActionResult } from '@/platform/dbProjects/draftMeta'
import { discardDraft, draftsOf, DraftRefused, pushDraft, startDraft } from '@/platform/dbProjects/drafts'
import { NotSignedIn, SIGN_IN_PATH } from '@/platform/dbProjects/remote'
import { viewerName } from '@/platform/dbProjects/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
// A push reads the whole project's history and runs every check.
export const maxDuration = 60

const answer = (body: DraftActionResult) => NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  if (!KEBAB.test(params.slug)) return NextResponse.json({ error: 'Bad slug.' }, { status: 400 })
  return NextResponse.json(await draftsOf(params.slug), { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const dev = process.env.NODE_ENV === 'development'
  const user = dev ? null : await requestUser(request)
  if (dev ? !isLocalRequest(request) : !isEditor(user)) {
    return answer({ ok: false, reason: 'Sign in as a studio editor to work with drafts.' })
  }
  if (!KEBAB.test(params.slug)) return answer({ ok: false, reason: 'Bad slug.' })
  const by = user ? nameOf(user) : viewerName(null)
  const body = (await request.json().catch(() => null)) as DraftAction | null

  try {
    switch (body?.action) {
      case 'start':
        return answer(await startDraft(params.slug, typeof body.name === 'string' ? body.name : '', by))
      case 'push':
        return answer(await pushDraft(params.slug, by))
      case 'discard':
        return answer(await discardDraft(params.slug))
      default:
        return answer({ ok: false, reason: 'Unknown draft action.' })
    }
  } catch (err) {
    if (err instanceof NotSignedIn) {
      return answer({
        ok: false,
        reason: `Sign in to the studio on this laptop first — open localhost:4000${SIGN_IN_PATH}, then try again.`,
      })
    }
    if (err instanceof DraftRefused) return answer({ ok: false, reason: err.message })
    console.error('[drafts]', err)
    return answer({ ok: false, reason: 'That didn’t work — try again.' })
  }
}
