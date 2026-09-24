'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { ALLOWED_EMAIL_DOMAIN, safeNext, supabaseEnv } from '@/platform/auth/env'

const ERRORS: Record<string, string> = {
  domain: `Sign in with your @${ALLOWED_EMAIL_DOMAIN} Google account.`,
  auth: 'Google sign-in didn’t finish. Try again.',
}

// Starts Google sign-in, or says why the last try failed. The browser client
// keeps the PKCE verifier in a cookie that /auth/callback reads.
export default function AuthStartPage() {
  const [message, setMessage] = useState('Redirecting to Google…')
  const [back, setBack] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const next = safeNext(params.get('next'))
    const error = params.get('error')
    if (error) {
      setMessage(ERRORS[error] ?? ERRORS.auth)
      setBack(next)
      return
    }
    const env = supabaseEnv()
    if (!env) {
      setMessage('Sign-in isn’t set up on this deployment.')
      setBack(next)
      return
    }
    const callback = new URL('/auth/callback', window.location.origin)
    callback.searchParams.set('next', next)
    void createBrowserClient(env.url, env.anonKey)
      .auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callback.toString(), queryParams: { hd: ALLOWED_EMAIL_DOMAIN } },
      })
      .then(({ error: oauthError }) => {
        if (oauthError) setMessage(oauthError.message)
      })
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 px-16 text-14 text-caption dark:text-neutral-400">
      <span>{message}</span>
      {back ? (
        <a href={back} className="font-bold text-link">
          Back to the studio
        </a>
      ) : null}
    </main>
  )
}
