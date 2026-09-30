// =============================================================================
// DB projects · Edit mode's write-back for /db/<slug> — /api/design's twin.
//
//   GET                  what the panel may do here (a DesignStatus)
//   POST { edits, … }    apply a batch to one file, in the database
//   POST { undo }        put that file back as it was before one batch
//   POST { unlock }      the editing password, as on /api/design
//
// To the panel this is the `fs` backend: a save is written at once and undo is
// by token. The difference is where: the file is a row in studio_project_files,
// so the save reaches every open copy of /db/<slug> — on the laptop and on the
// deployed link — within seconds, with no commit and no push. The same code
// runs in both places.
//
// Who may save: on the dev server, the designer at this laptop (as Chat). On a
// deployment, a signed-in editor who owns the project, or anyone past the site
// gate or the editing password — the same gates as /api/design's `github`
// backend.
// =============================================================================

import { NextResponse } from 'next/server'
import * as iconModule from '@/design-system/icons'
import { isGateConfigured } from '@/app/unlock/auth'
import { isAuthConfigured } from '@/platform/auth/env'
import type { StudioUser } from '@/platform/auth/protocol'
import { canEditAs, getStudioUser, isSameOrigin } from '@/platform/auth/server'
import { isLocalRequest } from '@/platform/chat/localRequest'
import { applyEdits } from '@/platform/design/applyEdits'
import type {
  DesignRequest,
  DesignResponse,
  DesignStatus,
  DesignUndoRequest,
  DesignUnlockRequest,
} from '@/platform/design/protocol'
import { batchFile, KEBAB, projectFacts, refuse, whyNot } from '@/platform/design/server/common'
import {
  createEditToken,
  EDIT_COOKIE,
  EDIT_MAX_AGE,
  editCookie,
  isEditGateConfigured,
  passwordMatches,
  verifyEditToken,
} from '@/platform/design/server/editGate'
import { versionOf } from '@/platform/design/version'
import { contentBefore, isDbProject, readDbFile, saveDbFiles } from '@/platform/dbProjects/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const DEV = process.env.NODE_ENV === 'development'
const ICONS = new Set(Object.keys(iconModule).filter((name) => /^[A-Z]/.test(name)))

interface Params {
  params: { slug: string }
}

async function access(request: Request): Promise<{ may: boolean; user: StudioUser | null }> {
  if (DEV) return { may: isLocalRequest(request) || verifyEditToken(editCookie(request)), user: null }
  const user = await getStudioUser()
  if (canEditAs(user) && isSameOrigin(request)) return { may: true, user }
  if (isGateConfigured()) return { may: true, user }
  return { may: verifyEditToken(editCookie(request)), user }
}

/** Why this person may not write this project — or null. Only a signed-in
 *  editor has a name to check against the owners; past a password, the
 *  password is the boundary, as on the `github` backend. */
async function locked(slug: string, user: StudioUser | null): Promise<string | undefined> {
  const facts = await projectFacts(slug)
  if (!facts) return undefined
  if (facts.status === 'live') return whyNot(facts, 'x') ?? undefined
  return canEditAs(user) ? (whyNot(facts, user.displayName) ?? undefined) : undefined
}

export async function GET(request: Request, { params }: Params): Promise<NextResponse> {
  const { slug } = params
  if (!KEBAB.test(slug) || !(await isDbProject(slug))) {
    return NextResponse.json({ backend: 'record', owners: [] } satisfies DesignStatus)
  }
  const { may, user } = await access(request)
  const facts = await projectFacts(slug)
  const status: DesignStatus = {
    backend: 'fs',
    owners: facts?.owners ?? [],
    locked: await locked(slug, user),
    needsSignIn: !may && !user && isAuthConfigured() ? true : undefined,
    needsPassword: !may && !isAuthConfigured() ? true : undefined,
    signedInAs: canEditAs(user) ? user.displayName : undefined,
  }
  return NextResponse.json(status, { headers: { 'cache-control': 'no-store' } })
}

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  const { slug } = params
  let body: DesignRequest | DesignUndoRequest | DesignUnlockRequest
  try {
    body = (await request.json()) as typeof body
  } catch {
    return refuse('That request could not be read.')
  }
  if (!KEBAB.test(slug) || body.slug !== slug) return refuse('That is not a project I recognise.')
  if ('unlock' in body) return unlock(body)

  const { may, user } = await access(request)
  if (!may) {
    if (user) return refuse('Your account can’t save from the link yet. Ask the studio owner to set you up as an editor.')
    return refuse(isAuthConfigured() ? 'Sign in with your Amartha Google account first.' : 'Enter the editing password first.')
  }
  const why = await locked(slug, user)
  if (why) return refuse(why)
  const by = canEditAs(user) ? user.displayName : null

  try {
    if ('undo' in body) return await undo(slug, body.undo, by)
    return await apply(slug, body, by)
  } catch (err) {
    return refuse(err instanceof Error ? `The database didn’t take that: ${err.message}` : 'The database didn’t answer.')
  }
}

async function apply(slug: string, body: DesignRequest, by: string | null): Promise<NextResponse> {
  if (!Array.isArray(body.edits) || body.edits.length === 0) return refuse('There was nothing to apply.')
  const target = batchFile(body)
  if ('reason' in target) return refuse(target.reason)
  const { file } = target
  const path = file.slice(`projects/${slug}/`.length)

  const source = await readDbFile(slug, path)
  if (source === null) return refuse('That screen file isn’t in the database.')
  if (body.version && versionOf(source) !== body.version) {
    return refuse('That screen has changed since it loaded. Wait a moment for it to update, then make the change again.')
  }

  const result = applyEdits(source, body.edits, { icons: ICONS })
  if (!result.ok) return refuse(result.refused.reason)
  if (result.source === source) {
    return NextResponse.json({ ok: true, file, version: versionOf(source) } satisfies DesignResponse)
  }

  const ids = await saveDbFiles(slug, [{ path, content: result.source }], by)
  const id = ids.get(path)
  return NextResponse.json({
    ok: true,
    file,
    version: versionOf(result.source),
    undo: id === undefined ? undefined : String(id),
  } satisfies DesignResponse)
}

async function undo(slug: string, token: string, by: string | null): Promise<NextResponse> {
  const id = Number(token)
  if (!Number.isSafeInteger(id) || id <= 0) return refuse('That undo could not be found.')
  const snap = await contentBefore(slug, id)
  if (!snap || snap.after === null || snap.before === null) return refuse('That change can no longer be undone.')

  const current = await readDbFile(slug, snap.path)
  if (current === null || versionOf(current) !== versionOf(snap.after)) {
    return refuse('That screen has changed since, so undoing would overwrite newer work.')
  }
  await saveDbFiles(slug, [{ path: snap.path, content: snap.before }], by)
  return NextResponse.json({
    ok: true,
    file: `projects/${slug}/${snap.path}`,
    version: versionOf(snap.before),
  } satisfies DesignResponse)
}

async function unlock(body: DesignUnlockRequest): Promise<NextResponse> {
  if (!isEditGateConfigured()) return refuse('This link has no editing password.')
  if (!passwordMatches(body.unlock)) {
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
