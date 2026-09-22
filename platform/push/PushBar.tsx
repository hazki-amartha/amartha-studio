'use client'

// =============================================================================
// Push — the bar at the foot of Edit mode's panel, under whichever tab is
// showing, for sending a project live from this laptop.
//
// It belongs to the project, not to a tab or a selection: whatever made the
// change — chat, the Edit tab, the designer's own agent — it's pushed from
// here. The count is what differs from what's live, read from the working
// copy, so it's right whoever wrote the files. Unsaved Edit-tab edits are
// saved first, so it's one press. Pressing Push opens the details in place:
// the files, and the password and name the first time.
//
// Dev server only (app/api/push). On the deployed link the Edit tab's own
// footer pushes, and this renders nothing.
// =============================================================================

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  applyPending,
  getDesignStoreServerSnapshot,
  getDesignStoreState,
  setDesignerName,
  subscribeDesignStore,
} from '@/platform/design/designStore'
import type { PushResult, PushStatus } from './protocol'

const POLL_MS = 5000
const NAME_KEY = 'db.design.name'
const LIVE_FOR_MS = 8000

const NOTE = 'text-12 text-caption dark:text-neutral-400'
const PRIMARY =
  'rounded-full bg-primary-500 px-16 py-8 text-12 font-bold text-neutral-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-placeholder dark:disabled:bg-ink-800 dark:disabled:text-neutral-600'
const SECONDARY =
  'rounded-full border border-default px-16 py-8 text-12 font-bold text-default hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-placeholder dark:border-ink-700 dark:text-neutral-50 dark:hover:bg-ink-800'

function storedName(): string | null {
  try {
    return window.localStorage.getItem(NAME_KEY)
  } catch {
    return null
  }
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

function usePushStatus(slug: string) {
  const [status, setStatus] = useState<PushStatus | null>(null)
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/push?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
      if (res.ok) setStatus((await res.json()) as PushStatus)
    } catch {
      // The dev server is restarting; the next poll will answer.
    }
  }, [slug])

  useEffect(() => {
    void refresh()
    const tick = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    const id = window.setInterval(tick, POLL_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [refresh])

  return { status, refresh }
}

export function PushBar({ slug }: { slug: string }) {
  const { status, refresh } = usePushStatus(slug)
  const design = useSyncExternalStore(subscribeDesignStore, getDesignStoreState, getDesignStoreServerSnapshot)
  const [open, setOpen] = useState(false)
  const [live, setLive] = useState(false)
  const was = useRef<PushStatus['change']>('none')

  // "Going live…" turning into nothing means it landed: say so for a moment.
  const change = status?.change ?? 'none'
  useEffect(() => {
    if (was.current === 'waiting' && (change === 'landed' || change === 'none')) {
      setLive(true)
      const t = window.setTimeout(() => setLive(false), LIVE_FOR_MS)
      was.current = change
      return () => window.clearTimeout(t)
    }
    was.current = change
  }, [change])

  if (!status?.available) return null

  const unsaved = design.backend === 'fs' ? design.pending.length : 0
  const count = status.files.length + unsaved
  const waiting = change === 'waiting'
  const failed = change === 'failed'

  const line = waiting
    ? 'Going live…'
    : live
      ? 'Live'
      : failed
        ? 'The last push didn’t pass the checks'
        : count > 0
          ? `${plural(count, 'change')} not live`
          : 'Everything is live'
  const lineTone = failed
    ? 'text-red-700 dark:text-red-400'
    : live
      ? 'font-bold text-green-700 dark:text-green-400'
      : 'text-caption dark:text-neutral-400'

  return (
    <div className="flex flex-none flex-col gap-8 border-t border-default pt-12 dark:border-ink-700">
      <div className="flex items-center justify-between gap-8">
        <span className={`truncate text-12 ${lineTone}`}>{line}</span>
        {open ? null : (
          <button
            type="button"
            onClick={() => {
              setOpen(true)
              void refresh()
            }}
            disabled={waiting || (count === 0 && !failed)}
            title="Push — send this project’s changes live"
            className={`${count > 0 ? PRIMARY : SECONDARY} flex-none py-4`}
          >
            Push
          </button>
        )}
      </div>
      {open ? (
        <PushDetails
          slug={slug}
          status={status}
          unsaved={unsaved}
          onPushed={() => void refresh()}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  )
}

function PushDetails({
  slug,
  status,
  unsaved,
  onPushed,
  onClose,
}: {
  slug: string
  status: PushStatus
  unsaved: number
  onPushed: () => void
  onClose: () => void
}) {
  const [name, setName] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  useEffect(() => setName(storedName()), [])

  const owner = Boolean(name && status.owners.some((o) => o.toLocaleLowerCase() === name.toLocaleLowerCase()))
  const needsPassword = status.needsPassword && !unlocked
  const prefix = `projects/${slug}/`
  const waiting = status.change === 'waiting'
  const count = status.files.length + unsaved
  const blocked = !status.configured || Boolean(status.locked) || status.conflicts.length > 0 || waiting

  const push = async () => {
    if (!name) return
    setError(null)
    if (unsaved > 0) {
      setBusy('Saving your edits…')
      const saved = await applyPending()
      if (!saved) {
        setBusy(null)
        return setError('Some edits couldn’t be saved, so nothing was pushed. See the Edit panel.')
      }
      // Give the saved files a beat to land on disk before they're read.
      await new Promise((r) => setTimeout(r, 300))
    }
    setBusy('Checking and pushing…')
    let result: PushResult
    try {
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, push: true, name }),
      })
      result = (await res.json()) as PushResult
    } catch {
      result = { ok: false, reason: 'The studio server did not answer.' }
    }
    setBusy(null)
    if (!result.ok) return setError(result.reason)
    onPushed()
  }

  let body: React.ReactNode
  if (!status.configured) {
    body = <p className={NOTE}>Push needs the studio’s GitHub App set up on this laptop.</p>
  } else if (status.locked) {
    body = <p className={NOTE}>{status.locked}</p>
  } else if (waiting) {
    body = <p className={NOTE}>Pushed. It goes live on its own in a minute or two.</p>
  } else if (count === 0) {
    body = <p className={NOTE}>Nothing to push — this project matches what’s live.</p>
  } else {
    body = (
      <>
        {status.change === 'failed' ? (
          <p className="text-12 text-red-700 dark:text-red-400">
            The last push didn’t pass the checks, so it isn’t live. Fix it and push again.
          </p>
        ) : null}
        <ul className="flex max-h-200 flex-col gap-4 overflow-y-auto">
          {status.files.map((f) => (
            <li key={f.path} className="flex items-center justify-between gap-8 text-12">
              <span className="truncate text-default dark:text-neutral-50">
                {f.path.startsWith(prefix) ? f.path.slice(prefix.length) : f.path}
              </span>
              <span className={`shrink-0 ${status.conflicts.includes(f.path) ? 'text-red-700' : 'text-caption dark:text-neutral-400'}`}>
                {status.conflicts.includes(f.path) ? 'changed since' : f.change}
              </span>
            </li>
          ))}
          {unsaved > 0 ? (
            <li className="text-12 text-caption dark:text-neutral-400">
              + {plural(unsaved, 'unsaved edit')}, saved first
            </li>
          ) : null}
        </ul>
        {status.conflicts.length > 0 ? (
          <p className="text-12 text-red-700 dark:text-red-400">
            Someone changed a file marked “changed since” after this laptop last updated. Ask your agent to bring
            the project up to date, then push again.
          </p>
        ) : null}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {body}
      {error ? <p className="whitespace-pre-line text-12 text-red-700 dark:text-red-400">{error}</p> : null}

      {!blocked && count > 0 ? (
        needsPassword ? (
          <PasswordStep slug={slug} onUnlocked={() => setUnlocked(true)} />
        ) : !owner ? (
          <div className="flex flex-col gap-8">
            <span className="text-12 font-bold text-default dark:text-neutral-50">Who’s pushing?</span>
            {status.owners.map((o) => (
              <button
                key={o}
                type="button"
                className={SECONDARY}
                onClick={() => {
                  setDesignerName(o)
                  setName(o)
                }}
              >
                I’m {o}
              </button>
            ))}
            <span className={NOTE}>Only {status.owners.join(' and ')} can push this project.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <button type="button" className={PRIMARY} disabled={Boolean(busy)} onClick={() => void push()}>
              {busy ?? `Push ${plural(count, 'change')}`}
            </button>
            <p className="text-center text-10 text-placeholder dark:text-neutral-600">
              Pushing as {name}.{' '}
              <button
                type="button"
                className="underline"
                onClick={() => {
                  setDesignerName(null)
                  setName(null)
                }}
              >
                Not you?
              </button>
            </p>
          </div>
        )
      ) : null}

      <button type="button" className={`${NOTE} self-end`} onClick={onClose}>
        {waiting ? 'Close' : 'Cancel'}
      </button>
    </div>
  )
}

function PasswordStep({ slug, onUnlocked }: { slug: string; onUnlocked: () => void }) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value || busy) return
    setBusy(true)
    let reason: string | null = null
    try {
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, unlock: value }),
      })
      const body = (await res.json()) as { ok: boolean; reason?: string }
      reason = body.ok ? null : (body.reason ?? 'That didn’t work.')
    } catch {
      reason = 'The studio server did not answer.'
    }
    setBusy(false)
    setError(reason)
    if (!reason) onUnlocked()
  }
  return (
    <form className="flex flex-col gap-8" onSubmit={(e) => void submit(e)}>
      <span className="text-12 font-bold text-default dark:text-neutral-50">Editing password</span>
      <input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="current-password"
        aria-label="Editing password"
        autoFocus
        className="rounded-8 border border-neutral-200 bg-neutral-white px-8 py-4 text-12 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-white"
      />
      {error ? <span className="text-12 text-red-700">{error}</span> : null}
      <button type="submit" className={SECONDARY} disabled={!value || busy}>
        {busy ? 'Checking…' : 'Continue'}
      </button>
    </form>
  )
}
