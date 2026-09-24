// =============================================================================
// Auth · who is signed in, on the server.
//
// Roles are Vocus's `user_roles` table with two studio columns beside Vocus's
// own `role` (supabase/migrations/20260924_studio_roles.sql):
//
//   studio_role   viewer (default) · editor · admin
//   display_name  the name projects are owned under — must equal `owner` in
//                 project.config, the same strings scripts/check-flows.mjs holds
//                 to its OWNERS list
//
// No row, or no Supabase at all, is a viewer.
// =============================================================================

import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { isAllowedEmail, serviceRoleKey, supabaseEnv } from './env'
import type { StudioRole, StudioUser } from './protocol'

const ROLES: StudioRole[] = ['viewer', 'editor', 'admin']

/** The session client for route handlers. Null when sign-in isn't configured. */
export function createSessionClient() {
  const env = supabaseEnv()
  if (!env) return null
  const store = cookies()
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return store.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options))
        } catch {
          // Read-only outside a route handler; middleware refreshes instead.
        }
      },
    },
  })
}

/** Bypasses RLS. Server only, and only to read the caller's own role row. */
function createAdminClient() {
  const env = supabaseEnv()
  const key = serviceRoleKey()
  if (!env || !key) return null
  return createSupabaseClient(env.url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function roleRow(
  userId: string,
  email: string,
): Promise<{ role: StudioRole; displayName: string | null }> {
  const viewer = { role: 'viewer' as const, displayName: null }
  const admin = createAdminClient()
  if (!admin) return viewer
  const { data, error } = await admin
    .from('user_roles')
    .select('studio_role, display_name')
    .or(`email.eq.${email.toLowerCase()},user_id.eq.${userId}`)
    .limit(1)
    .maybeSingle()
  if (error) {
    // Before the migration runs the columns don't exist: everyone is a viewer.
    console.error('[auth] role lookup failed:', error.message)
    return viewer
  }
  const role = ROLES.includes(data?.studio_role) ? (data!.studio_role as StudioRole) : 'viewer'
  const displayName = typeof data?.display_name === 'string' && data.display_name.trim() ? data.display_name.trim() : null
  return { role, displayName }
}

/** The signed-in @amartha.com user, or null. Never throws. */
export async function getStudioUser(): Promise<StudioUser | null> {
  const supabase = createSessionClient()
  if (!supabase) return null
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.email || !isAllowedEmail(user.email)) return null
    const { role, displayName } = await roleRow(user.id, user.email)
    const google = user.user_metadata?.full_name ?? user.user_metadata?.name
    return {
      email: user.email,
      displayName,
      label: displayName ?? (typeof google === 'string' && google ? google : user.email.split('@')[0]),
      role,
    }
  } catch (error) {
    console.error('[auth] session lookup failed:', error)
    return null
  }
}

/** A signed-in editor or admin with a display name — someone who can own a project. */
export function canEditAs(user: StudioUser | null): user is StudioUser & { displayName: string } {
  return Boolean(user && user.displayName && (user.role === 'editor' || user.role === 'admin'))
}

/**
 * A cookie-authenticated write must come from the studio's own pages. The
 * Supabase cookie is SameSite=Lax, which already stops a cross-site POST from
 * carrying it; this is the second lock, as for the editing password.
 */
export function isSameOrigin(request: Request): boolean {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false
  const origin = request.headers.get('origin')
  if (origin === null) return true
  try {
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
    return host !== null && new URL(origin).host.toLowerCase() === host.toLowerCase()
  } catch {
    return false
  }
}
