// =============================================================================
// Chat · the studio's Figma login (OAuth), for the Figma tools in ./figma.ts.
//
// The owner signs in once at /api/chat/figma/connect; the studio keeps the
// login in Redis and refreshes it itself, so nothing needs rotating by hand.
// Figma access tokens last 90 days; the refresh token is reusable, and each
// refresh replaces the access token, so the newest one is always the one kept.
//
// It reads Figma as whoever approved it — the owner's account: any file it can
// open, nothing else. Needs FIGMA_CLIENT_ID and FIGMA_CLIENT_SECRET from a
// Figma OAuth app whose redirect URL is <studio>/api/chat/figma/callback.
// Docs: https://developers.figma.com/docs/rest-api/oauth-apps/
// =============================================================================

import { randomBytes } from 'node:crypto'
import { redis } from '@/platform/comments/server/store'

const AUTHORIZE = 'https://www.figma.com/oauth'
const TOKEN = 'https://api.figma.com/v1/oauth/token'
const REFRESH = 'https://api.figma.com/v1/oauth/refresh'
const SCOPE = 'file_content:read'

const LOGIN = 'studio:chat:figma'
const stateKey = (state: string) => `studio:chat:figma:state:${state}`
// Refresh this long before Figma's expiry, so a turn never meets a dead token.
const EARLY_MS = 7 * 24 * 3600_000

interface Login {
  access: string
  refresh: string
  expiresAt: number
}

export class FigmaNotConnected extends Error {
  constructor() {
    super('Figma isn’t connected to the studio yet — the owner signs in once at /api/chat/figma/connect.')
  }
}

const env = (name: string) => process.env[name]?.trim().replace(/^["']|["']$/g, '') || null

export const figmaAuthConfigured = () => Boolean(env('FIGMA_CLIENT_ID') && env('FIGMA_CLIENT_SECRET'))

const callbackUrl = (request: Request) => new URL('/api/chat/figma/callback', request.url).toString()

/** Where to send the owner to approve the studio, with a one-time state. */
export async function authorizeUrl(request: Request): Promise<string> {
  const state = randomBytes(24).toString('hex')
  await redis('SET', stateKey(state), '1', 'EX', 600)
  const url = new URL(AUTHORIZE)
  url.searchParams.set('client_id', env('FIGMA_CLIENT_ID') ?? '')
  url.searchParams.set('redirect_uri', callbackUrl(request))
  url.searchParams.set('scope', SCOPE)
  url.searchParams.set('state', state)
  url.searchParams.set('response_type', 'code')
  return url.toString()
}

async function post(endpoint: string, body: Record<string, string>) {
  const basic = Buffer.from(`${env('FIGMA_CLIENT_ID')}:${env('FIGMA_CLIENT_SECRET')}`).toString('base64')
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { authorization: `Basic ${basic}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Figma sign-in answered ${res.status}.`)
  return (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number }
}

/** Back from Figma: check the state, trade the code for a login, keep it. */
export async function finishLogin(request: Request, code: string, state: string): Promise<void> {
  const known = await redis<string | null>('GETDEL', stateKey(state))
  if (!known) throw new Error('That sign-in link expired — start again.')
  const t = await post(TOKEN, { redirect_uri: callbackUrl(request), code, grant_type: 'authorization_code' })
  if (!t.refresh_token) throw new Error('Figma didn’t return a refresh token.')
  await save({ access: t.access_token, refresh: t.refresh_token, expiresAt: Date.now() + t.expires_in * 1000 })
}

const save = (login: Login) => redis('SET', LOGIN, JSON.stringify(login))

async function load(): Promise<Login | null> {
  const raw = await redis<string | null>('GET', LOGIN)
  return raw ? (JSON.parse(raw) as Login) : null
}

async function refresh(login: Login): Promise<string> {
  const t = await post(REFRESH, { refresh_token: login.refresh }).catch(() => null)
  if (!t) throw new FigmaNotConnected()
  await save({ access: t.access_token, refresh: t.refresh_token ?? login.refresh, expiresAt: Date.now() + t.expires_in * 1000 })
  return t.access_token
}

/** A live access token. `stale`: Figma just refused the current one. */
export async function figmaAccessToken(stale = false): Promise<string> {
  const login = await load()
  if (!login) throw new FigmaNotConnected()
  if (stale || login.expiresAt - EARLY_MS < Date.now()) return refresh(login)
  return login.access
}
