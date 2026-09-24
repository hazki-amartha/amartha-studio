'use client'

// =============================================================================
// Comments · the client store. One module-level store, like the other bridges:
// the canvas button, the pins inside the device and the sidebar list are far
// apart in the tree and all read the same few things —
//
//   • mode    — is Comment on (clicks on the device drop a pin, not tap it)
//   • openId  — which pin's thread is showing; 'draft' for one being written
//   • draft   — where that unposted pin sits
//   • the project's comments, refreshed while the view is open so two
//     reviewers see each other's pins without reloading
//
// Comment and Edit are mutually exclusive: both take over clicks on the device.
// =============================================================================

import { useEffect, useSyncExternalStore } from 'react'
import { setDesignMode } from '@/platform/runtime/designBridge'
import { KEY_HEADER, type Comment, type CommentRequest, type CommentsResponse } from './protocol'

export interface Draft {
  screenId: string
  x: number
  y: number
}

interface State {
  slug: string | null
  available: boolean
  comments: Comment[]
  mode: boolean
  openId: string | null
  draft: Draft | null
  showResolved: boolean
  error: string | null
}

const INITIAL: State = {
  slug: null,
  available: false,
  comments: [],
  mode: false,
  openId: null,
  draft: null,
  showResolved: false,
  error: null,
}

let state: State = INITIAL
const listeners = new Set<() => void>()

function set(next: Partial<State>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useComments(): State {
  return useSyncExternalStore(subscribe, () => state, () => INITIAL)
}

// --- who is commenting --------------------------------------------------------
//
// A name the viewer types once and a random key that marks their comments as
// theirs. Both in localStorage, wrapped: a private window may refuse it, and
// then the viewer is simply asked again next time.

const NAME = 'studio.commenter.name'
const KEY = 'studio.commenter.key'

function read(k: string): string | null {
  try {
    return window.localStorage.getItem(k)
  } catch {
    return null
  }
}

function write(k: string, v: string) {
  try {
    window.localStorage.setItem(k, v)
  } catch {
    // Kept for this page only.
  }
}

let memoKey: string | null = null
function commenterKey(): string {
  memoKey ??= read(KEY)
  if (!memoKey) {
    memoKey = crypto.randomUUID()
    write(KEY, memoKey)
  }
  return memoKey
}

export const getCommenterName = () => read(NAME) ?? ''
export const setCommenterName = (name: string) => write(NAME, name.trim())

// --- mode ---------------------------------------------------------------------

export function setCommentMode(on: boolean) {
  if (on) setDesignMode(false)
  if (state.mode === on) return
  set({ mode: on, openId: on ? state.openId : null, draft: on ? state.draft : null })
}

export function openComment(id: string | null) {
  set({ openId: id, draft: id === 'draft' ? state.draft : null })
}

export function startDraft(draft: Draft) {
  set({ draft, openId: 'draft', error: null })
}

export const setShowResolved = (showResolved: boolean) => set({ showResolved })

// --- data ---------------------------------------------------------------------

const POLL_MS = 15_000

async function load(slug: string) {
  try {
    const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`, {
      headers: { [KEY_HEADER]: commenterKey() },
      cache: 'no-store',
    })
    if (!res.ok) return
    const data = (await res.json()) as CommentsResponse
    if (state.slug !== slug) return
    set({ available: data.available, comments: data.comments })
  } catch {
    // Offline for a moment; the next poll tries again.
  }
}

/** Loads a project's comments and keeps them fresh while mounted. */
export function useCommentsFor(slug: string) {
  useEffect(() => {
    set({ ...INITIAL, slug })
    void load(slug)
    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load(slug)
    }, POLL_MS)
    const onFocus = () => void load(slug)
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(poll)
      window.removeEventListener('focus', onFocus)
      set(INITIAL)
    }
  }, [slug])
}

type Rest<A extends CommentRequest['action']> = Omit<Extract<CommentRequest, { action: A }>, 'action' | 'slug'>

async function send(body: CommentRequest): Promise<{ comment?: Comment; deleted?: string } | null> {
  set({ error: null })
  try {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'content-type': 'application/json', [KEY_HEADER]: commenterKey() },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      set({ error: data.error ?? 'Couldn’t save that — try again.' })
      return null
    }
    return data
  } catch {
    set({ error: 'Couldn’t reach the studio — check your connection.' })
    return null
  }
}

function upsert(comment: Comment) {
  const has = state.comments.some((c) => c.id === comment.id)
  set({ comments: has ? state.comments.map((c) => (c.id === comment.id ? comment : c)) : [...state.comments, comment] })
}

export async function postComment(input: Rest<'create'>): Promise<boolean> {
  if (!state.slug) return false
  const data = await send({ action: 'create', slug: state.slug, ...input })
  if (!data?.comment) return false
  upsert(data.comment)
  set({ draft: null, openId: data.comment.id })
  return true
}

export async function editComment(id: string, body: string): Promise<boolean> {
  if (!state.slug) return false
  const data = await send({ action: 'edit', slug: state.slug, id, body })
  if (data?.comment) upsert(data.comment)
  return Boolean(data?.comment)
}

export async function resolveComment(id: string, resolved: boolean) {
  if (!state.slug) return
  // Optimistic: resolving is a toggle people click and move on from.
  const before = state.comments
  set({ comments: before.map((c) => (c.id === id ? { ...c, resolved } : c)) })
  if (resolved && !state.showResolved && state.openId === id) set({ openId: null })
  const data = await send({ action: 'resolve', slug: state.slug, id, resolved })
  if (data?.comment) upsert(data.comment)
  else set({ comments: before })
}

export async function removeComment(id: string) {
  if (!state.slug) return
  const data = await send({ action: 'delete', slug: state.slug, id })
  if (!data?.deleted) return
  set({ comments: state.comments.filter((c) => c.id !== id), openId: state.openId === id ? null : state.openId })
}

/** Figma-style pin numbers: the order comments were made in, project-wide. */
export function numberOf(comments: Comment[], id: string): number {
  return comments.findIndex((c) => c.id === id) + 1
}
