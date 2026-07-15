'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_MAX_AGE, COOKIE_NAME, createSessionToken } from './auth'

export interface UnlockState {
  error?: string
}

/** Only allow same-origin, single-slash relative redirects. */
function safeNext(value: FormDataEntryValue | null): string {
  if (typeof value !== 'string') return '/'
  if (!value.startsWith('/')) return '/'
  // Reject protocol-relative (//host) and backslash tricks (/\host).
  if (value.startsWith('//') || value.startsWith('/\\')) return '/'
  return value
}

export async function unlock(
  _prevState: UnlockState,
  formData: FormData,
): Promise<UnlockState> {
  const expected = process.env.SITE_PASSWORD
  if (!expected) {
    return { error: 'The password gate is not configured on this deployment.' }
  }

  const password = formData.get('password')
  if (typeof password !== 'string' || password.length === 0) {
    return { error: 'Please enter the password.' }
  }
  if (password !== expected) {
    return { error: 'Incorrect password. Please try again.' }
  }

  const token = await createSessionToken()
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })

  // redirect() throws to interrupt the action — must stay outside try/catch.
  redirect(safeNext(formData.get('next')))
}
