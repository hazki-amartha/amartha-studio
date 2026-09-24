// =============================================================================
// Comments · the store. One Redis hash per project, `studio:comments:<slug>`,
// field = comment id, value = the stored record as JSON.
//
// Talks to Upstash over its REST API with plain fetch, so the studio takes no
// new dependency for three commands. The env names are the ones the Vercel
// Marketplace integration injects; the UPSTASH_* pair is what Upstash's own
// dashboard hands out, accepted too.
// =============================================================================

import { createHash } from 'node:crypto'
import type { Comment } from '../protocol'

/** What is kept — the viewer-facing Comment minus `mine`, plus whose it is. */
export interface StoredComment extends Omit<Comment, 'mine'> {
  /** sha256 of the author's browser key. The key itself is never stored. */
  keyHash: string
}

function config(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? { url, token } : null
}

export const isStoreConfigured = () => config() !== null

export async function redis<T>(...command: (string | number)[]): Promise<T> {
  const c = config()
  if (!c) throw new Error('Comment store is not configured')
  const res = await fetch(c.url, {
    method: 'POST',
    headers: { authorization: `Bearer ${c.token}`, 'content-type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
  })
  const json = (await res.json()) as { result?: T; error?: string }
  if (!res.ok || json.error) throw new Error(json.error ?? `Redis ${res.status}`)
  return json.result as T
}

const keyOf = (slug: string) => `studio:comments:${slug}`

export const hashKey = (key: string) => createHash('sha256').update(key).digest('hex')

export async function listComments(slug: string): Promise<StoredComment[]> {
  // HGETALL over REST answers a flat [field, value, field, value, …] array.
  const flat = await redis<string[]>('HGETALL', keyOf(slug))
  const out: StoredComment[] = []
  for (let i = 1; i < flat.length; i += 2) {
    try {
      out.push(JSON.parse(flat[i]) as StoredComment)
    } catch {
      // A record that doesn't parse is skipped, not fatal to the whole list.
    }
  }
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function countComments(slug: string): Promise<number> {
  return redis<number>('HLEN', keyOf(slug))
}

export async function getComment(slug: string, id: string): Promise<StoredComment | null> {
  const raw = await redis<string | null>('HGET', keyOf(slug), id)
  return raw ? (JSON.parse(raw) as StoredComment) : null
}

export async function putComment(slug: string, comment: StoredComment): Promise<void> {
  await redis('HSET', keyOf(slug), comment.id, JSON.stringify(comment))
}

export async function deleteComment(slug: string, id: string): Promise<void> {
  await redis('HDEL', keyOf(slug), id)
}
