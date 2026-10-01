// =============================================================================
// Auth · a laptop acting as its signed-in designer.
//
// Database projects are read and saved only by the deployed studio — no laptop
// holds a database key. A designer's laptop (its dev server and live sync)
// works on them AS the designer: they sign in with Google once on the deployed
// studio (/auth/laptop), which hands their laptop a personal token, kept in
// ~/.amartha-studio/ (platform/dbProjects/remote.ts). The laptop sends it as
// `Authorization: Bearer …`; the deployed studio checks it here.
//
// The token names the account and expires; what it may do is looked up fresh
// on every request, from the same role table as a browser session. Taking
// someone's editor role away stops their laptop at once.
//
// Signed with STUDIO_LAPTOP_SECRET, or failing that the studio database's JWT
// secret — which the Supabase integration already put on Vercel, so there is no
// new setting to manage. Neither exists on a laptop, and a laptop never needs
// to verify a token.
// =============================================================================

import { createHmac, timingSafeEqual } from 'node:crypto'
import { isAllowedEmail } from './env'
import type { StudioUser } from './protocol'
import { getStudioUser, roleRow } from './server'

export const LAPTOP_TOKEN_DAYS = 90

function secret(): string | null {
  return process.env.STUDIO_LAPTOP_SECRET?.trim() || process.env.STUDIO_DB_SUPABASE_JWT_SECRET?.trim() || null
}

export function isLaptopSignInConfigured(): boolean {
  return secret() !== null
}

interface Claims {
  uid: string
  email: string
  exp: number
}

const sign = (payload: string, key: string) => createHmac('sha256', `laptop::${key}`).update(payload).digest('base64url')

export function createLaptopToken(uid: string, email: string, now = Date.now()): string {
  const key = secret()
  if (!key) throw new Error('Laptop sign-in is not configured on this deployment.')
  const claims: Claims = { uid, email: email.toLowerCase(), exp: now + LAPTOP_TOKEN_DAYS * 86_400_000 }
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url')
  return `${payload}.${sign(payload, key)}`
}

function verify(token: string, now = Date.now()): Claims | null {
  const key = secret()
  const [payload, signature] = token.split('.')
  if (!key || !payload || !signature) return null
  const expected = Buffer.from(sign(payload, key))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Claims
    if (typeof claims.exp !== 'number' || claims.exp < now) return null
    if (!claims.uid || !isAllowedEmail(claims.email)) return null
    return claims
  } catch {
    return null
  }
}

/** The designer a laptop's request is acting as, or null. */
export async function laptopUser(request: Request): Promise<StudioUser | null> {
  const header = request.headers.get('authorization') ?? ''
  if (!header.startsWith('Bearer ')) return null
  const claims = verify(header.slice(7).trim())
  if (!claims) return null
  const { role, displayName } = await roleRow(claims.uid, claims.email)
  return { email: claims.email, displayName, label: displayName ?? claims.email.split('@')[0], role }
}

/** Who is asking: a browser session, or a laptop's token. */
export async function requestUser(request: Request): Promise<StudioUser | null> {
  return (await getStudioUser()) ?? (await laptopUser(request))
}

/** Any studio editor may work on any database project — not only its owners,
 *  so two designers can share one without touching the owner list. */
export function isEditor(user: StudioUser | null): user is StudioUser {
  return Boolean(user && (user.role === 'editor' || user.role === 'admin'))
}

/** How an editor's saves are signed: their studio name, else their label. */
export function nameOf(user: StudioUser): string {
  return user.displayName ?? user.label
}
