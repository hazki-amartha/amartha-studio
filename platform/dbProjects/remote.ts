// =============================================================================
// DB projects · a laptop's way to the database: through the deployed studio.
//
// A laptop holds no database key. When the studio database isn't configured
// here (no STUDIO_DB_SUPABASE_* — every laptop), ./server.ts reads and saves
// through the deployed studio's API instead, as the designer who signed in on
// this laptop. Their token lives in ~/.amartha-studio/credentials.json, written
// by /auth/laptop/callback — outside the repo, so it can't be committed, and
// shared by every checkout on the machine.
//
// Reading works without signing in (the same as opening a link); saving needs
// it. NotSignedIn is what every save path turns into "sign in on this laptop".
// =============================================================================

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { STUDIO_URL } from './public'

const DIR = path.join(homedir(), '.amartha-studio')
const FILE = path.join(DIR, 'credentials.json')

export interface LaptopCredentials {
  token: string
  /** The name they sign in as — shown in "Also here". */
  name: string | null
  studio: string
  savedAt: string
}

/** Where a laptop that isn't signed in is sent. */
export const SIGN_IN_PATH = '/auth/laptop/start'

export class NotSignedIn extends Error {
  constructor() {
    super('This laptop isn’t signed in to the studio yet.')
  }
}

let cached: { mtime: number; creds: LaptopCredentials | null } | null = null

export function laptopCredentials(): LaptopCredentials | null {
  try {
    if (!existsSync(FILE)) return null
    const mtime = statSync(FILE).mtimeMs
    if (cached?.mtime === mtime) return cached.creds
    const creds = JSON.parse(readFileSync(FILE, 'utf8')) as LaptopCredentials
    cached = { mtime, creds: creds.token && creds.studio === STUDIO_URL ? creds : null }
    return cached.creds
  } catch {
    return null
  }
}

export function saveLaptopCredentials(token: string, name: string | null) {
  mkdirSync(DIR, { recursive: true, mode: 0o700 })
  const creds: LaptopCredentials = { token, name, studio: STUDIO_URL, savedAt: new Date().toISOString() }
  writeFileSync(FILE, JSON.stringify(creds, null, 2), { mode: 0o600 })
  cached = null
}

/** A call to the deployed studio, as this laptop's designer when signed in. */
export async function remote<T>(pathname: string, init: RequestInit & { write?: boolean } = {}): Promise<T> {
  const creds = laptopCredentials()
  if (init.write && !creds) throw new NotSignedIn()
  const headers = new Headers(init.headers)
  if (creds) headers.set('authorization', `Bearer ${creds.token}`)
  if (init.body) headers.set('content-type', 'application/json')
  const res = await fetch(`${STUDIO_URL}${pathname}`, { ...init, headers, cache: 'no-store' })
  if (res.status === 401 || res.status === 403) throw new NotSignedIn()
  if (!res.ok) throw new Error(`The studio answered ${res.status} for ${pathname}.`)
  return (await res.json()) as T
}
