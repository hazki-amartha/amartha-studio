// =============================================================================
// Design · the write-back route. Chooses a backend and hands the request on.
//
//   dev server                        → `fs`: write the working copy
//   deployment + GitHub App + gate    → `github`: commit to a branch, push
//   any other deployment              → `record`: nothing is written here
//
// The `github` backend is only offered behind the password gate. The gate is
// what stands between the public internet and a commit to this repo; with no
// gate there is no backend, whatever else is configured. (The name the panel
// asks for is a courtesy check on top — see platform/design/server/common.ts.)
// =============================================================================

import { NextResponse } from 'next/server'
import { isGateConfigured } from '@/app/unlock/auth'
import { githubConfig } from '@/platform/design/github'
import type {
  DesignPushRequest,
  DesignRequest,
  DesignStatus,
  DesignUndoRequest,
} from '@/platform/design/protocol'
import { KEBAB, projectFacts, refuse, whyNot } from '@/platform/design/server/common'
import { fsApply, fsUndo } from '@/platform/design/server/fsBackend'
import { githubApply, githubPush } from '@/platform/design/server/githubBackend'

function backend(): 'fs' | 'github' | 'record' {
  if (process.env.NODE_ENV === 'development') return 'fs'
  return githubConfig() && isGateConfigured() ? 'github' : 'record'
}

export async function GET(request: Request): Promise<NextResponse> {
  const slug = new URL(request.url).searchParams.get('slug') ?? ''
  const facts = KEBAB.test(slug) ? await projectFacts(slug) : null
  const kind = backend()
  const status: DesignStatus = {
    backend: kind,
    sha: kind === 'github' ? githubConfig()?.sha : undefined,
    owners: facts?.owners ?? [],
    locked:
      kind === 'github' && facts
        ? (whyNot(facts, facts.owners[0] ?? 'x') ?? undefined)
        : undefined,
  }
  return NextResponse.json(status, { headers: { 'cache-control': 'no-store' } })
}

export async function POST(request: Request): Promise<NextResponse> {
  const kind = backend()
  if (kind === 'record') return new NextResponse(null, { status: 404 })

  let body: DesignRequest | DesignUndoRequest | DesignPushRequest
  try {
    body = (await request.json()) as DesignRequest | DesignUndoRequest | DesignPushRequest
  } catch {
    return refuse('That request could not be read.')
  }
  if (!body.slug || !KEBAB.test(body.slug)) return refuse('That is not a project I recognise.')

  if (kind === 'fs') {
    if ('undo' in body) return fsUndo(body)
    if ('push' in body) return refuse('On your own machine, ask your agent to push.')
    return fsApply(body)
  }

  const config = githubConfig()!
  if ('push' in body) return githubPush(body, config)
  // Undo on the link is "drop the entry and apply again" — there is no
  // snapshot to restore.
  if ('undo' in body) return refuse('That undo belongs to the dev server.')
  return githubApply(body, config)
}
