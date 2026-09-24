// Share · what the share-link cookies in this request open.

import { cookies } from 'next/headers'
import { shareCookie, type ShareAccess } from '../protocol'
import { getShare } from './store'

const PREFIX = shareCookie('')

/** The access a share link gives this browser to `slug`, or null. */
export async function shareAccess(slug: string): Promise<ShareAccess | null> {
  const token = cookies().get(shareCookie(slug))?.value
  if (!token) return null
  const link = await getShare(token)
  return link && link.slug === slug ? link.access : null
}

/** Every prototype this browser holds a live link to. */
export async function allShareAccess(): Promise<Record<string, ShareAccess>> {
  const out: Record<string, ShareAccess> = {}
  for (const c of cookies().getAll()) {
    if (!c.name.startsWith(PREFIX)) continue
    const link = await getShare(c.value)
    if (link && shareCookie(link.slug) === c.name) out[link.slug] = link.access
  }
  return out
}
