'use client'

// =============================================================================
// DB projects · the Drafts button beside the Flow button (./drafts.ts).
//
// On a project: how many drafts it has, a link to each, and "Start a draft".
// On a draft: what it's a draft of, Push (its changes go live on the project
// and the draft is deleted) and Discard. Editing the project directly stays
// exactly as it was — a draft is only for trying something off the link.
//
// Hidden on share links: a guest can look, not branch.
// =============================================================================

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useGuestAccess } from '@/platform/auth/session'
import { ChevronRightIcon } from '@/platform/chrome/icons'
import type { DraftActionResult, DraftsResponse } from './draftMeta'

const PILL =
  'flex h-40 items-center gap-8 rounded-full border border-default bg-neutral-white py-4 pl-16 pr-8 text-12 font-bold text-default shadow-sm hover:bg-neutral-50 dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50 dark:shadow-none dark:hover:bg-ink-800'
const PRIMARY =
  'rounded-full bg-primary-500 px-16 py-8 text-12 font-bold text-neutral-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-placeholder dark:disabled:bg-ink-800 dark:disabled:text-neutral-600'
const SECONDARY =
  'rounded-full border border-default px-16 py-8 text-12 font-bold text-default hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-placeholder dark:border-ink-700 dark:text-neutral-50 dark:hover:bg-ink-800'
const NOTE = 'text-12 text-caption dark:text-neutral-400'
const ROW = 'flex flex-col rounded-8 px-8 py-4 hover:bg-neutral-50 dark:hover:bg-ink-800'

async function act(slug: string, body: object): Promise<DraftActionResult> {
  try {
    const res = await fetch(`/api/db-projects/${encodeURIComponent(slug)}/draft`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    return (await res.json()) as DraftActionResult
  } catch {
    return { ok: false, reason: 'The studio didn’t answer — try again.' }
  }
}

export function DraftsMenu({ slug }: { slug: string }) {
  const guest = useGuestAccess(slug)
  const router = useRouter()
  const [info, setInfo] = useState<DraftsResponse | null>(null)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [outcome, setOutcome] = useState<Extract<DraftActionResult, { ok: false }> | null>(null)
  const box = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/db-projects/${encodeURIComponent(slug)}/draft`, { cache: 'no-store' })
      if (res.ok) setInfo((await res.json()) as DraftsResponse)
    } catch {
      // Stays as it was; the next open asks again.
    }
  }, [slug])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!open) return
    void refresh()
    const close = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [open, refresh])

  useEffect(() => {
    if (!open) {
      setConfirmDiscard(false)
      setOutcome(null)
    }
  }, [open])

  if (guest || !info) return null
  const draft = info.draft
  const others = info.drafts.filter((d) => d.slug !== slug)

  const run = async (body: object, then: (next: string) => void) => {
    setBusy(true)
    setOutcome(null)
    const result = await act(slug, body)
    setBusy(false)
    if (result.ok) {
      setOpen(false)
      then(result.slug)
    } else setOutcome(result)
  }

  const start = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    void run({ action: 'start', name }, (next) => {
      setName('')
      router.push(`/p/${next}`)
    })
  }

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={PILL}>
        {draft ? (
          <span>
            <span className="text-primary-500">Draft</span> · {draft.name}
          </span>
        ) : (
          <span>Drafts{info.drafts.length ? ` · ${info.drafts.length}` : ''}</span>
        )}
        <ChevronRightIcon className="size-16 rotate-90 text-caption dark:text-neutral-400" />
      </button>

      {open ? (
        <div className="absolute left-0 top-full mt-8 flex w-320 flex-col gap-12 rounded-12 border border-default bg-neutral-white p-12 shadow-sm dark:border-ink-700 dark:bg-ink-900">
          {draft ? (
            <>
              <div className="flex flex-col gap-4">
                <p className="text-14 font-bold text-default dark:text-neutral-50">{draft.name}</p>
                <p className={NOTE}>
                  A draft of{' '}
                  <a href={`/p/${draft.draftOf}`} className="font-bold text-primary-500 hover:underline">
                    {draft.parentName}
                  </a>
                  {draft.createdBy ? `, started by ${draft.createdBy}` : ''}. Changes here aren’t on the project’s link
                  until you push.
                </p>
              </div>
              {confirmDiscard ? (
                <div className="flex items-center justify-between gap-8">
                  <span className={NOTE}>Delete this draft and its changes?</span>
                  <div className="flex gap-8">
                    <button type="button" className={SECONDARY} disabled={busy} onClick={() => setConfirmDiscard(false)}>
                      Keep
                    </button>
                    <button
                      type="button"
                      className={PRIMARY}
                      disabled={busy}
                      onClick={() => void run({ action: 'discard' }, (next) => router.push(`/p/${next}`))}
                    >
                      Discard
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end gap-8">
                  <button type="button" className={SECONDARY} disabled={busy} onClick={() => setConfirmDiscard(true)}>
                    Discard
                  </button>
                  <button
                    type="button"
                    className={PRIMARY}
                    disabled={busy}
                    onClick={() => void run({ action: 'push' }, (next) => router.push(`/p/${next}`))}
                  >
                    {busy ? 'Pushing…' : `Push to ${draft.parentName}`}
                  </button>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={start} className="flex flex-col gap-8">
              <p className={NOTE}>
                Try a change without it showing on this project’s link. Push the draft when it’s ready.
              </p>
              <div className="flex gap-8">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name the draft"
                  maxLength={40}
                  className="min-w-0 flex-1 rounded-8 border border-default bg-neutral-white px-12 py-8 text-12 text-default placeholder:text-placeholder dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50"
                />
                <button type="submit" className={PRIMARY} disabled={busy || !name.trim()}>
                  {busy ? 'Starting…' : 'Start'}
                </button>
              </div>
            </form>
          )}

          {outcome ? (
            <div className="flex flex-col gap-4 rounded-8 bg-red-50 p-8 text-12 text-red-500">
              <p>{outcome.reason}</p>
              {[...(outcome.conflicts ?? []), ...(outcome.problems ?? [])].map((line) => (
                <p key={line} className="font-bold">
                  {line}
                </p>
              ))}
            </div>
          ) : null}

          {others.length ? (
            <div className="flex flex-col gap-4 border-t border-default pt-8 dark:border-ink-700">
              <p className={`${NOTE} px-8`}>{draft ? 'Other drafts' : 'Drafts'}</p>
              {others.map((d) => (
                <a key={d.slug} href={`/p/${d.slug}`} className={ROW}>
                  <span className="text-14 text-default dark:text-neutral-50">{d.name}</span>
                  {d.createdBy ? <span className={NOTE}>{d.createdBy}</span> : null}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
