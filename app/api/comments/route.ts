// =============================================================================
// Comments · review feedback pinned to a prototype's screens.
//
//   GET  ?slug=…                     the project's comments, oldest first
//   POST { action: 'create', … }     pin a new one
//   POST { action: 'edit' | 'delete', id, … }   only the browser that wrote it
//   POST { action: 'resolve', id, resolved }    anyone, as in Figma
//
// Open to anyone who can open the studio — stakeholders comment under the name
// they type, with no account. When SITE_PASSWORD is set the middleware gates
// this route like every other page. "Mine" is the browser's random key
// (KEY_HEADER), stored only as a hash: it stops one viewer editing another's
// words by accident, not a determined impersonator.
// =============================================================================

import { randomUUID } from 'node:crypto'
import { configs } from '@/projects/configs'
import { KEY_HEADER, LIMITS, type Comment, type CommentRequest, type CommentsResponse } from '@/platform/comments/protocol'
import {
  countComments,
  deleteComment,
  getComment,
  hashKey,
  isStoreConfigured,
  listComments,
  putComment,
  type StoredComment,
} from '@/platform/comments/server/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/
const ID = /^[0-9a-f-]{36}$/

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store' } })
const refuse = (error: string, status = 400) => json({ error }, status)

const knownSlug = (slug: unknown): slug is string =>
  typeof slug === 'string' && KEBAB.test(slug) && slug in configs

/** The viewer's key, hashed — or null when the browser sent none. */
function viewer(request: Request): string | null {
  const key = request.headers.get(KEY_HEADER)
  return key && key.length >= 16 && key.length <= 128 ? hashKey(key) : null
}

function present(c: StoredComment, me: string | null): Comment {
  const { keyHash, ...rest } = c
  return { ...rest, mine: me !== null && keyHash === me }
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const coord = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100_000 ? Math.round(v) : null)

export async function GET(request: Request): Promise<Response> {
  if (!isStoreConfigured()) return json({ available: false, comments: [] } satisfies CommentsResponse)
  const slug = new URL(request.url).searchParams.get('slug')
  if (!knownSlug(slug)) return refuse('Unknown project', 404)
  const me = viewer(request)
  try {
    const comments = (await listComments(slug)).map((c) => present(c, me))
    return json({ available: true, comments } satisfies CommentsResponse)
  } catch {
    return refuse('Comments are unavailable right now', 503)
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!isStoreConfigured()) return refuse('Comments are not set up here', 404)
  const body = (await request.json().catch(() => null)) as CommentRequest | null
  if (!body || !knownSlug(body.slug)) return refuse('Unknown project', 404)
  const me = viewer(request)
  if (!me) return refuse('Missing commenter key')
  const now = new Date().toISOString()

  try {
    if (body.action === 'create') {
      const x = coord(body.x)
      const y = coord(body.y)
      const words = text(body.body, LIMITS.body)
      const author = text(body.author, LIMITS.author)
      if (typeof body.screenId !== 'string' || !KEBAB.test(body.screenId)) return refuse('Unknown screen')
      if (x === null || y === null) return refuse('Bad position')
      if (!words) return refuse('Write something first')
      if (!author) return refuse('Say who you are first')
      if ((await countComments(body.slug)) >= LIMITS.perProject) return refuse('This project has too many comments')
      const comment: StoredComment = {
        id: randomUUID(),
        screenId: body.screenId,
        x,
        y,
        body: words,
        author,
        createdAt: now,
        resolved: false,
        keyHash: me,
      }
      await putComment(body.slug, comment)
      return json({ comment: present(comment, me) })
    }

    if (typeof body.id !== 'string' || !ID.test(body.id)) return refuse('Unknown comment', 404)
    const found = await getComment(body.slug, body.id)
    if (!found) return refuse('That comment was deleted', 404)

    if (body.action === 'resolve') {
      const next = { ...found, resolved: Boolean(body.resolved) }
      await putComment(body.slug, next)
      return json({ comment: present(next, me) })
    }

    if (found.keyHash !== me) return refuse('Only whoever wrote a comment can change it', 403)

    if (body.action === 'edit') {
      const words = text(body.body, LIMITS.body)
      if (!words) return refuse('Write something first')
      const next = { ...found, body: words, editedAt: now }
      await putComment(body.slug, next)
      return json({ comment: present(next, me) })
    }

    if (body.action === 'delete') {
      await deleteComment(body.slug, body.id)
      return json({ deleted: body.id })
    }

    return refuse('Unknown action')
  } catch {
    return refuse('Comments are unavailable right now', 503)
  }
}
