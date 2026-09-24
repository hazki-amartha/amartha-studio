// =============================================================================
// Auth · the signed-in user, in the browser. One fetch of /api/me per page
// load, shared by every caller (the rail's account button, the comment
// composer). Sign-in leaves the page for Google and comes back to it.
// =============================================================================

'use client'

import { useSyncExternalStore } from 'react'
import type { MeResponse } from './protocol'

type State = MeResponse & { loaded: boolean }

let state: State = { loaded: false, configured: false, required: false, user: null, shares: {} }
let started = false
const listeners = new Set<() => void>()

function set(next: State) {
  state = next
  listeners.forEach((l) => l())
}

async function load() {
  try {
    const res = await fetch('/api/me', { cache: 'no-store' })
    if (res.ok) return set({ ...((await res.json()) as MeResponse), loaded: true })
  } catch {
    // No answer: treat as signed out.
  }
  set({ ...state, loaded: true })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!started) {
    started = true
    void load()
  }
  return () => listeners.delete(listener)
}

const SERVER: State = { loaded: false, configured: false, required: false, user: null, shares: {} }

export function useStudioUser(): State {
  return useSyncExternalStore(subscribe, () => state, () => SERVER)
}

/**
 * Opened through a share link and not signed in: the link's access to this
 * prototype. Null for everyone else — a signed-in person, or, while the
 * studio is still open to view, a visitor who came by the plain URL.
 */
export function useGuestAccess(slug: string | null | undefined): 'view' | 'comment' | null {
  const { loaded, user, shares } = useStudioUser()
  if (!loaded || user || !slug) return null
  return shares[slug] ?? null
}

/** Off to Google, back to this page. */
export function signIn() {
  const next = `${window.location.pathname}${window.location.search}${window.location.hash}`
  window.location.assign(`/auth/start?next=${encodeURIComponent(next)}`)
}

/** Signs out of the studio and of /assets-app, which shares the cookie. */
export async function signOut() {
  try {
    await fetch('/auth/sign-out', { method: 'POST' })
  } finally {
    window.location.reload()
  }
}
