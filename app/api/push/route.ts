// =============================================================================
// Push · the top bar's Push button, on the dev server. See
// platform/push/server/local.ts for what counts, what refuses and what lands.
//
//   GET  ?slug=…                  what would go out, and the push in flight
//   POST { slug, unlock }         the editing password (same cookie as chat)
//   POST { slug, push, name }     push it
//
// Dev only: on a deployment the link pushes from Design mode's own panel, and
// this route 404s. Behind the editing password, like chat — the dev server
// listens on every interface, and a push lands in someone's name.
// =============================================================================

import { KEBAB, projectFacts, whyNot } from '@/platform/design/server/common'
import {
  createEditToken,
  EDIT_COOKIE,
  EDIT_MAX_AGE,
  editCookie,
  isEditGateConfigured,
  passwordMatches,
  verifyEditToken,
} from '@/platform/design/server/editGate'
import { check, localStatus, push, reasonOf } from '@/platform/push/server/local'
import type { PushStatus } from '@/platform/push/protocol'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEV = process.env.NODE_ENV === 'development'
const configured = () =>
  Boolean(process.env.STUDIO_GH_APP_ID && (process.env.STUDIO_GH_APP_PRIVATE_KEY || process.env.STUDIO_GH_APP_PRIVATE_KEY_PATH))

// The button polls; GitHub is asked about a push in flight at most this often.
const CHECK_EVERY_MS = 8000
const checked = new Map<string, { at: number; state: PushStatus['change'] }>()

async function changeOf(slug: string): Promise<PushStatus['change']> {
  const hit = checked.get(slug)
  if (hit && Date.now() - hit.at < CHECK_EVERY_MS) return hit.state
  const state = await check(slug).catch(() => hit?.state ?? 'none')
  checked.set(slug, { at: Date.now(), state })
  return state
}

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store' } })

export async function GET(request: Request): Promise<Response> {
  if (!DEV || !isEditGateConfigured()) return json({ available: false } satisfies Partial<PushStatus>)
  const slug = new URL(request.url).searchParams.get('slug') ?? ''
  const facts = KEBAB.test(slug) ? await projectFacts(slug) : null
  if (!facts) return json({ available: false } satisfies Partial<PushStatus>)

  const { files, conflicts } = await localStatus(slug).catch(() => ({ files: [], conflicts: [] }))
  const status: PushStatus = {
    available: true,
    configured: configured(),
    needsPassword: !verifyEditToken(editCookie(request)),
    owners: facts.owners,
    // Owner-agnostic here: the name is checked at Push.
    locked: facts.status === 'live' ? (whyNot(facts, facts.owners[0] ?? 'x') ?? undefined) : undefined,
    files,
    conflicts,
    change: configured() ? await changeOf(slug) : 'none',
  }
  return json(status)
}

export async function POST(request: Request): Promise<Response> {
  if (!DEV) return new Response(null, { status: 404 })
  if (!isEditGateConfigured()) return json({ ok: false, reason: 'Push needs STUDIO_EDIT_PASSWORD in .env.local.' })

  let body: { slug?: string; unlock?: string; push?: boolean; name?: string }
  try {
    body = await request.json()
  } catch {
    return json({ ok: false, reason: 'That request could not be read.' })
  }
  if (!body.slug || !KEBAB.test(body.slug)) return json({ ok: false, reason: 'That is not a project I recognise.' })

  if ('unlock' in body) {
    if (!passwordMatches(body.unlock)) {
      await new Promise((r) => setTimeout(r, 750))
      return json({ ok: false, reason: 'That isn’t the editing password.' })
    }
    return Response.json(
      { ok: true },
      {
        headers: {
          'set-cookie': `${EDIT_COOKIE}=${encodeURIComponent(createEditToken())}; Path=/; Max-Age=${EDIT_MAX_AGE}; HttpOnly; SameSite=Lax`,
        },
      },
    )
  }

  if (!verifyEditToken(editCookie(request))) return json({ ok: false, reason: 'Enter the editing password first.' })
  if (!body.push || !body.name?.trim()) return json({ ok: false, reason: 'Say who is pushing first.' })

  try {
    const result = await push(body.slug, body.name.trim())
    checked.set(body.slug, { at: Date.now(), state: 'waiting' })
    return json({ ok: true, ...result })
  } catch (err) {
    return json({ ok: false, reason: reasonOf(err) })
  }
}
