// =============================================================================
// DB projects · drafts (platform/dbProjects/drafts.ts).
//
//   GET  → DraftsResponse: is <slug> a draft, and its project's drafts the
//          viewer may see (a private one: its designer's and admins').
//   POST { action: 'start', name }  start a draft of <slug>, private
//        { action: 'push' }         merge draft <slug> into its project
//        { action: 'discard' }      delete draft <slug>
//        { action: 'visibility', visibility }  private, or shared with the team
//     → DraftActionResult. A refusal is a 200 with ok: false, so a laptop
//       passing the request on gets the reason, not just a status.
//
// Who may write: the same as a save (./sync) — on the dev server, the designer
// at this laptop, passed on as whoever signed in here; deployed, any editor.
// Push, discard and visibility are then the branch's designer's or an admin's
// (./drafts.ts).
// =============================================================================

import { NextResponse } from 'next/server'
import { isEditor, nameOf } from '@/platform/auth/laptop'
import { isLocalRequest } from '@/platform/chat/localRequest'
import { KEBAB } from '@/platform/design/server/common'
import { viewerOf } from '@/platform/dbProjects/branchAccess'
import type { DraftAction, DraftActionResult } from '@/platform/dbProjects/draftMeta'
import { discardDraft, draftsOf, DraftRefused, pushDraft, setDraftVisibility, startDraft } from '@/platform/dbProjects/drafts'
import { NotSignedIn, SIGN_IN_PATH } from '@/platform/dbProjects/remote'
import { createAdminClient, viewerName } from '@/platform/dbProjects/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
// A push reads the whole project's history and runs every check.
export const maxDuration = 60

const answer = (body: DraftActionResult) => NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  if (!KEBAB.test(params.slug)) return NextResponse.json({ error: 'Bad slug.' }, { status: 400 })
  return NextResponse.json(await draftsOf(params.slug, await viewerOf(request)), { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const dev = process.env.NODE_ENV === 'development'
  // A laptop passes every action on, and the deployed studio decides as the
  // designer signed in here — so here it only matters with a database key.
  const user = dev && !createAdminClient() ? null : await viewerOf(request)
  if (dev ? !isLocalRequest(request) : !isEditor(user)) {
    return answer({ ok: false, reason: 'Sign in as a studio editor to work with branches.' })
  }
  if (!KEBAB.test(params.slug)) return answer({ ok: false, reason: 'Bad slug.' })
  const by = user ? nameOf(user) : viewerName(null)
  const body = (await request.json().catch(() => null)) as DraftAction | null

  try {
    switch (body?.action) {
      case 'start':
        return answer(await startDraft(params.slug, typeof body.name === 'string' ? body.name : '', by, user?.email ?? null))
      case 'push':
        return answer(await pushDraft(params.slug, by, user))
      case 'discard':
        return answer(await discardDraft(params.slug, user))
      case 'visibility':
        if (body.visibility !== 'private' && body.visibility !== 'team') return answer({ ok: false, reason: 'Unknown visibility.' })
        return answer(await setDraftVisibility(params.slug, body.visibility, by, user))
      default:
        return answer({ ok: false, reason: 'Unknown branch action.' })
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
