// =============================================================================
// Design · the write-back route. Chooses a backend and hands the request on.
//
//   dev server                        → `fs`: write the working copy
//   deployment + GitHub App + gate    → `github`: commit to a branch, push
//   any other deployment              → `record`: nothing is written here
//
// The `github` backend is only offered behind a password. The password is
// what stands between the public internet and a commit to this repo; with no
// password there is no backend, whatever else is configured. Either one will
// do (platform/design/server/editGate.ts):
//
//   SITE_PASSWORD         the whole studio is gated; everyone inside may save
//   STUDIO_EDIT_PASSWORD  the studio is open to view; saving needs this one
//
// With sign-in configured (platform/auth), a signed-in editor needs neither:
// the session is the gate, and the push is made in their `display_name`, not
// a name the panel sends. The password stays as a fallback until it is unset.
//
// (Without sign-in, the name the panel asks for is a courtesy check on top —
// see platform/design/server/common.ts.)
// =============================================================================

import { NextResponse } from 'next/server'
import { isGateConfigured } from '@/app/unlock/auth'
import { isAuthConfigured } from '@/platform/auth/env'
import type { StudioUser } from '@/platform/auth/protocol'
import { canEditAs, getStudioUser, isSameOrigin } from '@/platform/auth/server'
import { githubConfig } from '@/platform/design/github'
import type {
  DesignCheckRequest,
  DesignPushRequest,
  DesignRequest,
  DesignResponse,
  DesignStatus,
  DesignUndoRequest,
  DesignUnlockRequest,
} from '@/platform/design/protocol'
import { KEBAB, projectFacts, refuse, whyNot } from '@/platform/design/server/common'
import {
  createEditToken,
  EDIT_COOKIE,
  EDIT_MAX_AGE,
  editCookie,
  isEditGateConfigured,
  passwordMatches,
  verifyEditToken,
} from '@/platform/design/server/editGate'
import { fsApply, fsUndo } from '@/platform/design/server/fsBackend'
import { githubApply, githubCheck, githubPush } from '@/platform/design/server/githubBackend'

function backend(): 'fs' | 'github' | 'record' {
  if (process.env.NODE_ENV === 'development') return 'fs'
  return githubConfig() && (isGateConfigured() || isEditGateConfigured() || isAuthConfigured()) ? 'github' : 'record'
}

/**
 * Whether this request may save, and who is signed in. A signed-in editor
 * always may; otherwise behind the site gate getting in was enough, and
 * failing that the editing password's cookie.
 */
async function access(request: Request): Promise<{ may: boolean; user: StudioUser | null }> {
  const user = await getStudioUser()
  if (canEditAs(user) && isSameOrigin(request)) return { may: true, user }
  if (isGateConfigured()) return { may: true, user }
  return { may: verifyEditToken(editCookie(request)), user }
}

const NOT_AN_EDITOR = 'Your account can’t save from the link yet. Ask the studio owner to set you up as an editor.'

export async function GET(request: Request): Promise<NextResponse> {
  const slug = new URL(request.url).searchParams.get('slug') ?? ''
  const facts = KEBAB.test(slug) ? await projectFacts(slug) : null
  const kind = backend()
  const { may, user } = kind === 'github' ? await access(request) : { may: false, user: null }
  const signedInAs = canEditAs(user) ? user.displayName : undefined
  // Signed in without edit rights, and no password cookie to fall back on.
  const notAnEditor = kind === 'github' && !may && user !== null
  const status: DesignStatus = {
    backend: kind,
    sha: kind === 'github' ? githubConfig()?.sha : undefined,
    owners: facts?.owners ?? [],
    locked:
      kind === 'github' && facts
        ? (whyNot(facts, signedInAs ?? facts.owners[0] ?? 'x') ?? (notAnEditor ? NOT_AN_EDITOR : undefined))
        : undefined,
    needsSignIn: kind === 'github' && !may && !user && isAuthConfigured() ? true : undefined,
    needsPassword: kind === 'github' && !may && !isAuthConfigured() ? true : undefined,
    signedInAs,
  }
  return NextResponse.json(status, { headers: { 'cache-control': 'no-store' } })
}

export async function POST(request: Request): Promise<NextResponse> {
  const kind = backend()
  if (kind === 'record') return new NextResponse(null, { status: 404 })

  let body: DesignRequest | DesignUndoRequest | DesignPushRequest | DesignCheckRequest | DesignUnlockRequest
  try {
    body = (await request.json()) as typeof body
  } catch {
    return refuse('That request could not be read.')
  }
  if (!body.slug || !KEBAB.test(body.slug)) return refuse('That is not a project I recognise.')

  if (kind === 'fs') {
    if ('unlock' in body) return refuse('Nothing to unlock on your own machine.')
    if ('undo' in body) return fsUndo(body)
    if ('push' in body || 'check' in body) return refuse('On your own machine, ask your agent to push.')
    return fsApply(body)
  }

  if ('unlock' in body) return unlock(body)
  const { may, user } = await access(request)
  if (!may) {
    if (user) return refuse(NOT_AN_EDITOR)
    return refuse(isAuthConfigured() ? 'Sign in with your Amartha Google account first.' : 'Enter the editing password first.')
  }
  // Signed in, the account decides whose name the change goes out under.
  if (canEditAs(user)) Object.assign(body, { name: user.displayName })

  const config = githubConfig()!
  if ('push' in body) return githubPush(body, config)
  if ('check' in body) return githubCheck(body, config)
  // Undo on the link is "drop the entry and apply again" — there is no
  // snapshot to restore.
  if ('undo' in body) return refuse('That undo belongs to the dev server.')
  return githubApply(body, config)
}

async function unlock(body: DesignUnlockRequest): Promise<NextResponse> {
  if (!isEditGateConfigured()) return refuse('This link has no editing password.')
  if (!passwordMatches(body.unlock)) {
    // Slows guessing to a crawl without making a typo feel broken.
    await new Promise((r) => setTimeout(r, 750))
    return refuse('That isn’t the editing password.')
  }
  const res = NextResponse.json({ ok: true, unlocked: true } satisfies DesignResponse)
  res.cookies.set(EDIT_COOKIE, createEditToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: EDIT_MAX_AGE,
  })
  return res
}
