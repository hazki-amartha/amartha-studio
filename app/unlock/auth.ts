// WS-F · Password-gate cookie signing.
//
// Edge-safe: uses only Web Crypto (crypto.subtle), TextEncoder, and process.env
// so it can be imported by BOTH the edge middleware and the Node server action.
// Never import next/headers or any Node-only API here.
//
// The session cookie never stores the password. It stores a self-contained,
// HMAC-signed token `<expiryMs>.<hexSignature>` where the signature is keyed on
// SITE_PASSWORD (+ optional SITE_SESSION_SECRET). Verification recomputes the
// HMAC and checks the embedded expiry, so tampering or a changed password
// invalidates every outstanding cookie.

export const COOKIE_NAME = 'db_session'
/** 30 days, in seconds — used for both cookie Max-Age and the signed expiry. */
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

const encoder = new TextEncoder()

/** Signing secret derived from configured env. Null when no password is set. */
function getSecret(): string | null {
  const password = process.env.SITE_PASSWORD
  if (!password) return null
  const extra = process.env.SITE_SESSION_SECRET ?? ''
  return `${password}::${extra}`
}

/** True when the deployment has a password configured (gate is active). */
export function isGateConfigured(): boolean {
  return Boolean(process.env.SITE_PASSWORD)
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let hex = ''
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

async function hmacHex(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return bufferToHex(signature)
}

/** Length-checked, constant-time-ish comparison of two hex strings. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Mint a fresh signed session token valid for COOKIE_MAX_AGE. */
export async function createSessionToken(): Promise<string> {
  const secret = getSecret()
  if (!secret) throw new Error('SITE_PASSWORD is not configured')
  const expiry = String(Date.now() + COOKIE_MAX_AGE * 1000)
  const signature = await hmacHex(expiry, secret)
  return `${expiry}.${signature}`
}

/** Verify a cookie value: signature must match and the token must not be expired. */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const secret = getSecret()
  if (!secret) return false

  const separator = token.indexOf('.')
  if (separator <= 0) return false

  const payload = token.slice(0, separator)
  const signature = token.slice(separator + 1)

  const expiry = Number(payload)
  if (!Number.isFinite(expiry) || Date.now() > expiry) return false

  const expected = await hmacHex(payload, secret)
  return safeEqual(signature, expected)
}
