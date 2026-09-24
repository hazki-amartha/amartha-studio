// =============================================================================
// Share · the store, beside comments in the same Upstash Redis:
//   studio:share:<token>    the link, JSON — what /s/<token> and every gate reads
//   studio:shares:<slug>    hash token → link, for the Share panel's list
// Revoking deletes both, so a revoked link is simply unknown.
// =============================================================================

import { randomBytes } from 'node:crypto'
import { isStoreConfigured, redis } from '@/platform/comments/server/store'
import type { ShareAccess, ShareLink } from '../protocol'

export { isStoreConfigured as isShareStoreConfigured }

const TOKEN = /^[A-Za-z0-9_-]{20,64}$/
const linkKey = (token: string) => `studio:share:${token}`
const listKey = (slug: string) => `studio:shares:${slug}`

export const isToken = (token: unknown): token is string => typeof token === 'string' && TOKEN.test(token)

function live(link: ShareLink | null): ShareLink | null {
  if (!link) return null
  if (link.expiresAt && Date.parse(link.expiresAt) <= Date.now()) return null
  return link
}

/** The link a token opens, or null when it's unknown, revoked or expired. */
export async function getShare(token: string): Promise<ShareLink | null> {
  if (!isToken(token) || !isStoreConfigured()) return null
  try {
    const raw = await redis<string | null>('GET', linkKey(token))
    return live(raw ? (JSON.parse(raw) as ShareLink) : null)
  } catch {
    return null
  }
}

export async function listShares(slug: string): Promise<ShareLink[]> {
  const flat = await redis<string[]>('HGETALL', listKey(slug))
  const out: ShareLink[] = []
  for (let i = 1; i < flat.length; i += 2) {
    try {
      const link = live(JSON.parse(flat[i]) as ShareLink)
      if (link) out.push(link)
    } catch {
      // Skip a record that doesn't parse.
    }
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createShare(
  slug: string,
  access: ShareAccess,
  days: number | null,
  createdBy: string,
): Promise<ShareLink> {
  const now = new Date()
  const link: ShareLink = {
    token: randomBytes(24).toString('base64url'),
    slug,
    access,
    createdBy,
    createdAt: now.toISOString(),
    expiresAt: days ? new Date(now.getTime() + days * 86_400_000).toISOString() : null,
  }
  const value = JSON.stringify(link)
  if (days) await redis('SET', linkKey(link.token), value, 'EX', days * 86_400)
  else await redis('SET', linkKey(link.token), value)
  await redis('HSET', listKey(slug), link.token, value)
  return link
}

export async function revokeShare(slug: string, token: string): Promise<void> {
  await redis('DEL', linkKey(token))
  await redis('HDEL', listKey(slug), token)
}
