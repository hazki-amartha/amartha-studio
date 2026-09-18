// =============================================================================
// Design · the editing password — the gate for saving from the deployed link
// when the studio itself is open to view.
//
// SITE_PASSWORD locks the whole studio, which is the wrong trade when several
// teams read the link every day and only a few people edit from it. So the
// `github` backend accepts either gate:
//
//   SITE_PASSWORD         everyone who got in may save (as before)
//   STUDIO_EDIT_PASSWORD  anyone may look; saving asks for this password once
//                         per browser, and remembers it for 30 days
//
// Same cookie scheme as app/unlock/auth.ts — `<expiryMs>.<hmac>`, keyed on the
// password, so changing the password signs everyone out — with a different
// key, so neither cookie opens the other gate. Node-only: the route runs on
// Node, and nothing at the edge needs this.
// =============================================================================

import { createHash, createHmac, timingSafeEqual } from 'crypto'

export const EDIT_COOKIE = 'db_design_edit'
/** 30 days, in seconds. */
export const EDIT_MAX_AGE = 60 * 60 * 24 * 30

export function isEditGateConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.STUDIO_EDIT_PASSWORD)
}

function secret(): string | null {
  const password = process.env.STUDIO_EDIT_PASSWORD
  if (!password) return null
  return `edit::${password}::${process.env.SITE_SESSION_SECRET ?? ''}`
}

const hmac = (payload: string, key: string) => createHmac('sha256', key).update(payload).digest('hex')

/** Equal-length digests, so the comparison takes the same time whatever was typed. */
function same(a: string, b: string): boolean {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest())
}

export function passwordMatches(input: unknown): boolean {
  const password = process.env.STUDIO_EDIT_PASSWORD
  return Boolean(password) && typeof input === 'string' && same(input, password!)
}

export function createEditToken(now = Date.now()): string {
  const key = secret()
  if (!key) throw new Error('STUDIO_EDIT_PASSWORD is not configured')
  const expiry = String(now + EDIT_MAX_AGE * 1000)
  return `${expiry}.${hmac(expiry, key)}`
}

export function verifyEditToken(token: string | undefined, now = Date.now()): boolean {
  const key = secret()
  if (!key || !token) return false
  const dot = token.indexOf('.')
  if (dot <= 0) return false
  const payload = token.slice(0, dot)
  const expiry = Number(payload)
  if (!Number.isFinite(expiry) || now > expiry) return false
  return same(token.slice(dot + 1), hmac(payload, key))
}

/** The editing cookie on a request, if any. */
export function editCookie(request: Request): string | undefined {
  const header = request.headers.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === EDIT_COOKIE) return decodeURIComponent(rest.join('='))
  }
  return undefined
}
