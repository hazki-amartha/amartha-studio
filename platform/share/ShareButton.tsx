// =============================================================================
// Share · the prototype's Share control, for signed-in editors. Copies the
// studio link for teammates, and makes a link that opens this one prototype to
// someone without an Amartha account — view only, or view and comment — lists
// the live ones, and revokes them. While a prototype runs it also copies the
// studio link to the page showing now (?screen=<id>) — the project's own link
// is already the address bar.
// =============================================================================

'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useStudioUser } from '@/platform/auth/session'
import { getScreenBridge, subscribeScreenBridge } from '@/platform/runtime/bridge'
import { ChevronDownIcon, LinkIcon, ShareIcon } from '@/platform/chrome/icons'
import { toolButtonClass } from '@/platform/chrome/TopBar'
import { EXPIRY_CHOICES, type ShareAccess, type ShareLink, type ShareResponse } from './protocol'

const PILL =
  'flex h-40 flex-none items-center gap-8 rounded-full border border-default bg-neutral-white px-16 text-14 font-bold text-default shadow-sm hover:bg-neutral-50 dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50 dark:shadow-none dark:hover:bg-ink-800'
// The top bar's own button (chrome/TopBar's ToolButton), as just its icon.
const ICON =
  'flex size-32 flex-none items-center justify-center rounded-8 border border-default bg-neutral-white text-default hover:bg-neutral-50 dark:border-ink-800 dark:bg-ink-900 dark:text-neutral-50 dark:hover:bg-ink-800'
const BLOCK =
  'flex w-full items-center justify-center gap-8 rounded-full border border-default px-20 py-12 text-14 font-bold text-default'
const SMALL =
  'rounded-full border border-default px-12 py-4 text-12 font-bold text-default hover:bg-neutral-50 disabled:opacity-50 dark:border-ink-700 dark:text-neutral-50 dark:hover:bg-ink-800'
const NOTE = 'text-12 text-caption dark:text-neutral-400'

const ACCESS: Record<ShareAccess, string> = { view: 'View only', comment: 'View & comment' }
const expiryLabel = (days: number | null) => (days ? `${days} days` : 'Never')

/** A native select in the top bar's face, with its own chevron — the browser's
 *  sits flush against the edge and ignores the dark theme. */
function Select({ value, onChange, children }: { value: string | number; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <span className="relative flex-none">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-32 cursor-pointer appearance-none rounded-8 border border-default bg-neutral-white pl-12 pr-32 text-12 font-bold text-default hover:bg-neutral-50 dark:border-ink-800 dark:bg-ink-900 dark:text-neutral-50 dark:hover:bg-ink-800"
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-12 top-1/2 size-12 -translate-y-1/2 text-caption dark:text-neutral-400" />
    </span>
  )
}

const urlOf = (link: ShareLink) => `${window.location.origin}/s/${link.token}`

function getServerSnapshot() {
  return null
}

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

/** `icon`: an icon button for the top bar, beside Comment, its panel opening
 *  below it over the page.
 *  `block`: a full-width button whose panel opens in place below it — for the
 *  phone's prototype-controls dialog, where a floating panel has no room. */
export function ShareButton({ slug, icon, block }: { slug: string; icon?: boolean; block?: boolean }) {
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

  if (icon) {
    return (
      <div ref={ref} className="relative flex-none">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Share"
          title="Share — a link to this page, for teammates or anyone"
          className={ICON}
        >
          <ShareIcon className="size-16" />
        </button>
        {open ? <SharePanel slug={slug} /> : null}
      </div>
    )
  }

  return (
    <div ref={ref} className={block ? 'flex flex-col gap-8' : 'relative'}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={block ? BLOCK : PILL}
      >
        <LinkIcon className="size-16" />
        Share
      </button>
      {open ? <SharePanel slug={slug} inline={block} /> : null}
    </div>
  )
}

/** Floating, it hangs from the button's right edge: the button sits at the top
 *  bar's end, so the panel runs left over the page instead of off the screen. */
function SharePanel({ slug, inline }: { slug: string; inline?: boolean }) {
  // The page showing now, if this prototype is running (not on the flow view).
  const bridge = useSyncExternalStore(subscribeScreenBridge, getScreenBridge, getServerSnapshot)
  const page = bridge?.slug === slug ? bridge : null
  const [links, setLinks] = useState<ShareLink[] | null>(null)
  const [access, setAccess] = useState<ShareAccess>('comment')
  const [days, setDays] = useState<number | null>(EXPIRY_CHOICES[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    void call(undefined, slug).then((r) => (r.error ? setError(r.error) : setLinks(r.links ?? [])))
  }, [slug])

  const copyText = useCallback((text: string, id: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(id)
      window.setTimeout(() => setCopied(null), 1500)
    })
  }, [])
  const copy = (link: ShareLink) => copyText(urlOf(link), link.token)

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
    <div
      className={`flex flex-col gap-12 rounded-16 border border-default bg-neutral-white p-12 dark:border-ink-700 dark:bg-ink-900 ${
        inline ? 'w-full' : 'absolute right-0 top-full z-50 mt-8 w-320 shadow-sm'
      }`}
    >
      <span className="text-14 font-bold text-default dark:text-neutral-50">Share this prototype</span>

      {page ? (
        <button
          type="button"
          onClick={() =>
            copyText(`${window.location.origin}/p/${slug}?screen=${encodeURIComponent(page.current)}`, 'page')
          }
          title={`Copies a link that opens on ${page.title}`}
          className={`${toolButtonClass()} justify-center`}
        >
          {copied === 'page' ? 'Copied' : 'Share link to this page'}
        </button>
      ) : null}

      <div className="flex flex-col gap-8 border-t border-default pt-12 dark:border-ink-700">
        <div className="flex flex-col gap-4">
          <span className="text-12 font-bold text-default dark:text-neutral-50">Without an account</span>
          <span className={NOTE}>The link opens only this prototype, and nobody can edit it.</span>
        </div>
        <label className="flex items-center justify-between gap-8">
          <span className={NOTE}>Access</span>
          <Select value={access} onChange={(v) => setAccess(v as ShareAccess)}>
            {(Object.keys(ACCESS) as ShareAccess[]).map((a) => (
              <option key={a} value={a}>
                {ACCESS[a]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex items-center justify-between gap-8">
          <span className={NOTE}>Expires</span>
          <Select value={days ?? ''} onChange={(v) => setDays(v ? Number(v) : null)}>
            {EXPIRY_CHOICES.map((d) => (
              <option key={d ?? 'never'} value={d ?? ''}>
                {expiryLabel(d)}
              </option>
            ))}
          </Select>
        </label>
        <button
          type="button"
          onClick={() => void create()}
          disabled={busy}
          className={`${toolButtonClass(true)} justify-center`}
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
