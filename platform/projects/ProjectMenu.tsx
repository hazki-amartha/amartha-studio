'use client'

// =============================================================================
// Deleting a project · the gallery card's ⋯ menu, and Restore under Recently
// deleted (platform/dbProjects/trash.ts does the work). The gallery only
// renders the menu for someone who may delete that card — its owner or a
// studio admin; a project that can't be deleted shows the menu with the reason.
// =============================================================================

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreIcon } from '@/platform/chrome/icons'
import type { DeleteState, TrashAction, TrashResult } from '@/platform/dbProjects/trashMeta'

const NOTE = 'text-12 text-caption dark:text-neutral-400'
const ERROR = 'text-12 text-red-700 dark:text-red-400'
const SECONDARY =
  'rounded-full border border-default px-16 py-8 text-12 font-bold text-default hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-placeholder dark:border-ink-700 dark:text-neutral-50 dark:hover:bg-ink-800'
const DANGER =
  'rounded-full bg-red-500 px-16 py-8 text-12 font-bold text-neutral-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50'

async function act(slug: string, action: TrashAction['action']): Promise<TrashResult> {
  try {
    const res = await fetch(`/api/db-projects/${encodeURIComponent(slug)}/trash`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    return (await res.json()) as TrashResult
  } catch {
    return { ok: false, reason: 'That didn’t work — try again.' }
  }
}

export function ProjectMenu({ slug, name, state }: { slug: string; name: string; state: DeleteState }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      setConfirming(false)
      setError(null)
      return
    }
    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const remove = async () => {
    setBusy(true)
    setError(null)
    const result = await act(slug, 'delete')
    setBusy(false)
    if (!result.ok) return setError(result.reason)
    setOpen(false)
    router.refresh()
  }

  const branches = state.ok && state.branches ? ` and its ${state.branches === 1 ? 'branch' : `${state.branches} branches`}` : ''

  return (
    <div ref={box} className="absolute right-8 top-8 z-10">
      <button
        type="button"
        aria-label={`More for ${name}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex size-32 items-center justify-center rounded-full text-neutral-white opacity-80 hover:bg-ink-900 hover:opacity-100"
      >
        <MoreIcon className="size-16" />
      </button>
      {open ? (
        <div className="absolute right-0 top-full mt-4 flex w-280 flex-col gap-8 rounded-12 border border-default bg-neutral-white p-8 shadow-sm dark:border-ink-700 dark:bg-ink-900">
          {!state.ok ? (
            <p className={`${NOTE} px-8 py-4`}>{state.reason}</p>
          ) : confirming ? (
            <div className="flex flex-col gap-12 p-8">
              <p className="text-14 text-default dark:text-neutral-50">
                Delete {name}
                {branches}?
              </p>
              <p className={NOTE}>It moves to Recently deleted, where it can be restored for 30 days.</p>
              {error ? <p className={ERROR}>{error}</p> : null}
              <div className="flex justify-end gap-8">
                <button type="button" className={SECONDARY} disabled={busy} onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button type="button" className={DANGER} disabled={busy} onClick={() => void remove()}>
                  {busy ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="w-full rounded-8 px-8 py-8 text-left text-14 text-red-700 hover:bg-neutral-50 dark:text-red-400 dark:hover:bg-ink-800"
            >
              Delete project
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}

/** Restore — under Recently deleted, and on a deleted project's own link. */
export function RestoreButton({ slug, then }: { slug: string; then?: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const restore = async () => {
    setBusy(true)
    setError(null)
    const result = await act(slug, 'restore')
    setBusy(false)
    if (!result.ok) return setError(result.reason)
    if (then) router.push(then)
    router.refresh()
  }

  return (
    <span className="flex flex-col items-end gap-4">
      <button type="button" className={SECONDARY} disabled={busy} onClick={() => void restore()}>
        {busy ? 'Restoring…' : 'Restore'}
      </button>
      {error ? <span className={ERROR}>{error}</span> : null}
    </span>
  )
}
