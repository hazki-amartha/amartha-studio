// =============================================================================
// Share · the prototype's Share control, for signed-in editors. Makes a link
// that opens this one prototype to someone without an Amartha account — view
// only, or view and comment — lists the live ones, and revokes them.
// =============================================================================

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useStudioUser } from '@/platform/auth/session'
import { LinkIcon } from '@/platform/chrome/icons'
import { EXPIRY_CHOICES, type ShareAccess, type ShareLink, type ShareResponse } from './protocol'

const PILL =
  'flex h-40 flex-none items-center gap-8 rounded-full border border-default bg-neutral-white px-16 text-14 font-bold text-default shadow-sm hover:bg-neutral-50 dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50 dark:shadow-none dark:hover:bg-ink-800'
const SMALL =
  'rounded-full border border-default px-12 py-4 text-12 font-bold text-default hover:bg-neutral-50 disabled:opacity-50 dark:border-ink-700 dark:text-neutral-50 dark:hover:bg-ink-800'
const NOTE = 'text-12 text-caption dark:text-neutral-400'

const ACCESS: Record<ShareAccess, string> = { view: 'View only', comment: 'View & comment' }
const expiryLabel = (days: number | null) => (days ? `${days} days` : 'Never')

const urlOf = (link: ShareLink) => `${window.location.origin}/s/${link.token}`

function expiresNote(link: ShareLink): string {
  if (!link.expiresAt) return 'No expiry'
  return `Until ${new Date(link.expiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
}

async function call(init?: { slug: string; body: object }, slug?: string): Promise<ShareResponse> {
  try {
    const res = init
      ? await fetch('/api/share', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ slug: init.slug, ...init.body }),
        })
      : await fetch(`/api/share?slug=${encodeURIComponent(slug ?? '')}`, { cache: 'no-store' })
    return (await res.json()) as ShareResponse
  } catch {
    return { error: 'The studio server did not answer.' }
  }
}

export function ShareButton({ slug }: { slug: string }) {
  const { user } = useStudioUser()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  if (!user || (user.role !== 'editor' && user.role !== 'admin')) return null

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={PILL}>
        <LinkIcon className="size-16" />
        Share
      </button>
      {open ? <SharePanel slug={slug} /> : null}
    </div>
  )
}

function SharePanel({ slug }: { slug: string }) {
  const [links, setLinks] = useState<ShareLink[] | null>(null)
  const [access, setAccess] = useState<ShareAccess>('comment')
  const [days, setDays] = useState<number | null>(EXPIRY_CHOICES[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    void call(undefined, slug).then((r) => (r.error ? setError(r.error) : setLinks(r.links ?? [])))
  }, [slug])

  const copy = useCallback((link: ShareLink) => {
    void navigator.clipboard.writeText(urlOf(link)).then(() => {
      setCopied(link.token)
      window.setTimeout(() => setCopied(null), 1500)
    })
  }, [])

  const create = async () => {
    setBusy(true)
    const r = await call({ slug, body: { action: 'create', access, days } })
    setBusy(false)
    setError(r.error ?? null)
    if (r.link) {
      setLinks((prev) => [r.link!, ...(prev ?? [])])
      copy(r.link)
    }
  }

  const revoke = async (link: ShareLink) => {
    setBusy(true)
    const r = await call({ slug, body: { action: 'revoke', token: link.token } })
    setBusy(false)
    setError(r.error ?? null)
    if (r.links) setLinks(r.links)
  }

  return (
    <div className="absolute right-0 top-48 z-50 flex w-320 flex-col gap-12 rounded-16 border border-default bg-neutral-white p-12 shadow-sm dark:border-ink-700 dark:bg-ink-900">
      <div className="flex flex-col gap-4">
        <span className="text-14 font-bold text-default dark:text-neutral-50">Share this prototype</span>
        <span className={NOTE}>
          For people without an Amartha account. The link opens only this prototype, and nobody can edit it.
        </span>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex gap-4" role="radiogroup" aria-label="Access">
          {(Object.keys(ACCESS) as ShareAccess[]).map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={access === a}
              onClick={() => setAccess(a)}
              className={
                access === a
                  ? 'flex-1 rounded-full bg-ink-900 px-12 py-4 text-12 font-bold text-neutral-white dark:bg-neutral-white dark:text-ink-900'
                  : `flex-1 ${SMALL}`
              }
            >
              {ACCESS[a]}
            </button>
          ))}
        </div>
        <label className="flex items-center justify-between gap-8">
          <span className={NOTE}>Expires</span>
          <select
            value={days ?? ''}
            onChange={(e) => setDays(e.target.value ? Number(e.target.value) : null)}
            className="rounded-8 border border-neutral-200 bg-neutral-white px-8 py-4 text-12 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-white"
          >
            {EXPIRY_CHOICES.map((d) => (
              <option key={d ?? 'never'} value={d ?? ''}>
                {expiryLabel(d)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void create()}
          disabled={busy}
          className="rounded-full bg-primary-500 px-16 py-8 text-14 font-bold text-neutral-white hover:bg-primary-600 disabled:opacity-50"
        >
          Create link and copy
        </button>
        {error ? <span className="text-12 text-red-700">{error}</span> : null}
      </div>

      <div className="flex flex-col gap-8 border-t border-default pt-12 dark:border-ink-700">
        <span className="text-12 font-bold text-default dark:text-neutral-50">Live links</span>
        {links === null ? (
          <span className={NOTE}>Loading…</span>
        ) : links.length === 0 ? (
          <span className={NOTE}>None yet.</span>
        ) : (
          links.map((link) => (
            <div key={link.token} className="flex items-center gap-8">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-12 font-bold text-default dark:text-neutral-50">{ACCESS[link.access]}</span>
                <span className={`truncate ${NOTE}`}>
                  {link.createdBy} · {expiresNote(link)}
                </span>
              </div>
              <button type="button" onClick={() => copy(link)} className={SMALL}>
                {copied === link.token ? 'Copied' : 'Copy'}
              </button>
              <button type="button" onClick={() => void revoke(link)} disabled={busy} className={SMALL}>
                Revoke
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
