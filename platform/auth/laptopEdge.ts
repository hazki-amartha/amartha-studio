// Auth · a laptop's token, checked at the edge. Middleware lets a request
// without a session through to the API when it carries a laptop's token
// (./laptop.ts) — and it used to take any `Bearer …` on trust, leaving the
// routes to check it. Several read routes never did, so a made-up header read
// every database project. This checks the signature and expiry with Web
// Crypto (node:crypto can't run at the edge); the route still looks up the
// role, which the edge can't reach.
//
// Same format as createLaptopToken: base64url(claims) "." base64url(HMAC-SHA256
// keyed "laptop::" + secret, over the claims part).

import { isAllowedEmail } from './env'

const encoder = new TextEncoder()

function secret(): string | null {
  return process.env.STUDIO_LAPTOP_SECRET?.trim() || process.env.STUDIO_DB_SUPABASE_JWT_SECRET?.trim() || null
}

/** A signed, unexpired laptop token for an Amartha account. */
export async function isLaptopToken(token: string, now = Date.now()): Promise<boolean> {
  const key = secret()
  const [payload, signature, extra] = token.split('.')
  if (!key || !payload || !signature || extra !== undefined) return false
  try {
    const hmac = await crypto.subtle.importKey('raw', encoder.encode(`laptop::${key}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const expected = base64url(new Uint8Array(await crypto.subtle.sign('HMAC', hmac, encoder.encode(payload))))
    if (!same(expected, signature)) return false
    const claims = JSON.parse(new TextDecoder().decode(unbase64url(payload))) as { uid?: unknown; email?: unknown; exp?: unknown }
    return typeof claims.exp === 'number' && claims.exp >= now && Boolean(claims.uid) && typeof claims.email === 'string' && isAllowedEmail(claims.email)
  } catch {
    return false
  }
}

function base64url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function unbase64url(text: string): Uint8Array {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

/** Equal strings, compared in constant time for their length. */
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
