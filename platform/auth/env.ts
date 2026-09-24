// =============================================================================
// Auth · Google sign-in on the Vocus Supabase project, shared with Amartha Vocus
// and the Assets app (amartha-illustration). One project, one cookie
// (`sb-<ref>-auth-token`, path /), so signing in here also signs you into
// /assets-app, which the studio serves from its own origin — and back.
//
// Unset, sign-in is off and everything behaves as before it existed: viewing
// is open, and saving from the link falls back to the editing password. Local
// dev never needs it (the laptop is the identity — see platform/chat/localRequest.ts).
// =============================================================================

function read(name: string): string {
  return process.env[name]?.trim().replace(/^["']|["']$/g, '') ?? ''
}

export function supabaseEnv(): { url: string; anonKey: string } | null {
  // Spelled out, not read(name): Next inlines NEXT_PUBLIC_* only when the
  // property access is literal.
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
  return url && anonKey ? { url, anonKey } : null
}

export function isAuthConfigured(): boolean {
  return supabaseEnv() !== null
}

export function serviceRoleKey(): string {
  return read('SUPABASE_SERVICE_ROLE_KEY')
}

/** Google's `hd` hint in the browser; the real check is on the server. */
export const ALLOWED_EMAIL_DOMAIN = 'amartha.com'

export function isAllowedEmail(email: string | null | undefined): boolean {
  return Boolean(email?.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`))
}

/** A same-site path to return to after sign-in, never another origin. */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/'
  return next
}
