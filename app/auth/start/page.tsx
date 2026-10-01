'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { ALLOWED_EMAIL_DOMAIN, safeNext, supabaseEnv } from '@/platform/auth/env'
import './auth.css'

const ERRORS: Record<string, string> = {
  domain: `Sign in with your @${ALLOWED_EMAIL_DOMAIN} Google account.`,
  auth: 'Google sign-in didn’t finish. Try again.',
}

/** Off to Google. `pick` shows its account picker, so a designer who just
 *  signed out can choose another account instead of being waved back in. */
function startGoogle(next: string, pick: boolean): Promise<string | null> {
  const env = supabaseEnv()
  if (!env) return Promise.resolve('Sign-in isn’t set up on this deployment.')
  const callback = new URL('/auth/callback', window.location.origin)
  callback.searchParams.set('next', next)
  const queryParams: Record<string, string> = { hd: ALLOWED_EMAIL_DOMAIN }
  if (pick) queryParams.prompt = 'select_account'
  return createBrowserClient(env.url, env.anonKey)
    .auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callback.toString(), queryParams } })
    .then(({ error }) => error?.message ?? null)
}

// The studio's sign-in card, as in Vocus. Google sign-in starts on a click,
// never by itself: Google usually still has the browser signed in, so starting
// straight away would sign a designer who just signed out back in at once.
// The browser client keeps the PKCE verifier in a cookie /auth/callback reads.
export default function AuthStartPage() {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get('error')
    if (reason) setError(ERRORS[reason] ?? ERRORS.auth)
  }, [])

  function signIn() {
    const params = new URLSearchParams(window.location.search)
    const next = safeNext(params.get('next'))
    setBusy(true)
    setError(null)
    // A laptop signs in through the deployed studio (platform/auth/laptop.ts):
    // Supabase only returns to the deployed address, and sends anything else
    // to its Site URL — Vocus.
    const { hostname } = window.location
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      window.location.assign(`/auth/laptop/start?next=${encodeURIComponent(next)}`)
      return
    }
    // After a sign-out or a failed try, offer the account picker.
    const pick = params.has('signed-out') || params.has('error')
    void startGoogle(next, pick).then((failed) => {
      if (failed) {
        setError(failed)
        setBusy(false)
      }
    })
  }

  return (
    <main className="auth-ground flex min-h-screen items-center justify-center px-16 py-48">
      <div className="flex w-full max-w-460 flex-col gap-32 rounded-16 border border-ink-700 bg-ink-900 p-48">
        <div className="flex flex-col gap-8">
          <h1 className="text-20 font-bold text-neutral-50">Sign in</h1>
          <p className="text-14 text-neutral-400">
            Use your Amartha Google account to access Amartha Studio.
          </p>
          {error ? <p className="text-14 text-red-400">{error}</p> : null}
        </div>
        <button
          type="button"
          onClick={signIn}
          disabled={busy}
          className="flex w-full items-center justify-center gap-8 rounded-full bg-neutral-white px-24 py-12 text-14 font-bold text-ink-950 disabled:opacity-60"
        >
          <GoogleMark />
          {busy ? 'Signing in…' : 'Continue with Google'}
        </button>
      </div>
    </main>
  )
}

/** Google's "G" — brand colors, as Google requires on its sign-in buttons. */
function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
