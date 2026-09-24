// Share · the one lookup middleware needs, Edge-safe: plain fetch to Upstash's
// REST API (the server store uses node:crypto and can't run at the edge).

import { shareCookie } from './protocol'

export async function edgeShareOpens(cookieValue: string | undefined, slug: string): Promise<boolean> {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  if (!cookieValue || !/^[A-Za-z0-9_-]{20,64}$/.test(cookieValue) || !url || !token) return false
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(['GET', `studio:share:${cookieValue}`]),
      cache: 'no-store',
    })
    const { result } = (await res.json()) as { result?: string | null }
    if (!result) return false
    const link = JSON.parse(result) as { slug: string; expiresAt: string | null }
    if (link.expiresAt && Date.parse(link.expiresAt) <= Date.now()) return false
    return link.slug === slug
  } catch {
    return false
  }
}

export { shareCookie }
