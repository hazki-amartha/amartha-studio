'use client'

// =============================================================================
// DB projects · drafts in the studio (./drafts.ts). Three pieces, one state:
//
//   DraftSwitcher  the Edit panel's title — "Edit · Live" or "Edit · Draft:
//                  <name>" — opening a list of the project and its drafts,
//                  and "Start a draft". Drafts are editing, so they live in
//                  Edit; the panel is closed for anyone just looking.
//   DraftPushBar   the Edit panel's foot, on a draft: Push to the project
//                  (its changes go live, the draft is deleted) and Discard —
//                  where the Push bar sits for a git project. Every edit to a
//                  database project saves itself, so there's nothing to save
//                  first. A live database project has no bar: every save
//                  there is already live.
//   DraftLabel     beside Flow, on a draft only, no buttons — so whoever
//                  opens a draft's link can tell it isn't the project.
//
// Editing the project directly stays exactly as it was; a draft is only for
// trying something off the link.
// =============================================================================

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react'
import { ChevronRightIcon, PlusIcon } from '@/platform/chrome/icons'
import { isActiveDbProject } from './active'
import type { DraftActionResult, DraftsResponse } from './draftMeta'

const PRIMARY =
  'rounded-full bg-primary-500 px-16 py-8 text-12 font-bold text-neutral-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-placeholder dark:disabled:bg-ink-800 dark:disabled:text-neutral-600'
const SECONDARY =
  'rounded-full border border-default px-16 py-8 text-12 font-bold text-default hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-placeholder dark:border-ink-700 dark:text-neutral-50 dark:hover:bg-ink-800'
const NOTE = 'text-12 text-caption dark:text-neutral-400'
const ROW =
  'flex w-full items-center justify-between gap-8 rounded-8 px-8 py-8 text-left hover:bg-neutral-50 dark:hover:bg-ink-800'
const ERROR = 'flex flex-col gap-4 whitespace-pre-line text-12 text-red-700 dark:text-red-400'

// --- shared state: one fetch per project, read by all three ---------------------

let info: { slug: string; data: DraftsResponse } | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

async function load(slug: string) {
  try {
    const res = await fetch(`/api/db-projects/${encodeURIComponent(slug)}/draft`, { cache: 'no-store' })
    if (!res.ok) return
    info = { slug, data: (await res.json()) as DraftsResponse }
    emit()
  } catch {
    // Stays as it was; the next open asks again.
  }
}

function useDrafts(slug: string, enabled = true): { data: DraftsResponse | null; refresh: () => void } {
  const data = useSyncExternalStore(
    (cb) => (listeners.add(cb), () => void listeners.delete(cb)),
    () => (info?.slug === slug ? info.data : null),
    () => null,
  )
  useEffect(() => {
    if (enabled && info?.slug !== slug) void load(slug)
  }, [slug, enabled])
  return { data, refresh: () => void load(slug) }
}

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

type Refusal = Extract<DraftActionResult, { ok: false }>

function Refused({ outcome }: { outcome: Refusal }) {
  return (
    <div className={ERROR}>
      <p>{outcome.reason}</p>
      {[...(outcome.conflicts ?? []), ...(outcome.problems ?? [])].map((line) => (
        <p key={line} className="font-bold">
          {line}
        </p>
      ))}
    </div>
  )
}

// --- the Edit panel's title -----------------------------------------------------

/** The panel title. A git project has no drafts, so it stays plain "Edit". */
export function DraftSwitcher({ slug }: { slug: string }) {
  const db = isActiveDbProject(slug)
  const { data, refresh } = useDrafts(slug, db)
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [starting, setStarting] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<Refusal | null>(null)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      setStarting(false)
      setOutcome(null)
      return
    }
    refresh()
    const close = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const title = <span className="text-14 font-bold text-default dark:text-neutral-50">Edit</span>
  if (!db || !data) return title

  const draft = data.draft
  const project = draft?.draftOf ?? slug
  const go = (to: string) => {
    setOpen(false)
    if (to !== slug) router.push(`/p/${to}`)
  }

  const start = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setOutcome(null)
    const result = await act(project, { action: 'start', name })
    setBusy(false)
    if (!result.ok) return setOutcome(result)
    setName('')
    go(result.slug)
  }

  return (
    <div ref={box} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="-ml-8 flex min-w-0 items-center gap-4 rounded-8 px-8 py-4 hover:bg-neutral-50 dark:hover:bg-ink-800"
      >
        {title}
        <span className="truncate text-14 text-caption dark:text-neutral-400">
          · {draft ? `Draft: ${draft.name}` : 'Live'}
        </span>
        <ChevronRightIcon className="size-16 flex-none rotate-90 text-caption dark:text-neutral-400" />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-40 mt-4 flex w-280 flex-col gap-4 rounded-12 border border-default bg-neutral-white p-8 shadow-sm dark:border-ink-700 dark:bg-ink-900">
          <button type="button" className={ROW} onClick={() => go(project)}>
            <span className="flex min-w-0 flex-col">
              <span className="text-14 text-default dark:text-neutral-50">Live</span>
              <span className={`${NOTE} truncate`}>{draft ? draft.parentName : 'What the project’s link shows'}</span>
            </span>
            {!draft ? <span className="text-12 font-bold text-primary-500">Here</span> : null}
          </button>
          {data.drafts.map((d) => (
            <button key={d.slug} type="button" className={ROW} onClick={() => go(d.slug)}>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-14 text-default dark:text-neutral-50">Draft: {d.name}</span>
                {d.createdBy ? <span className={NOTE}>{d.createdBy}</span> : null}
              </span>
              {d.slug === slug ? <span className="text-12 font-bold text-primary-500">Here</span> : null}
            </button>
          ))}
          <div className="border-t border-default pt-4 dark:border-ink-700">
            {starting ? (
              <form onSubmit={start} className="flex flex-col gap-8 p-8">
                <p className={NOTE}>Try a change without it showing on the project’s link. Push the draft when it’s ready.</p>
                <div className="flex gap-8">
                  <input
                    autoFocus
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
                {outcome ? <Refused outcome={outcome} /> : null}
              </form>
            ) : (
              <button type="button" className={`${ROW} justify-start`} onClick={() => setStarting(true)}>
                <PlusIcon className="size-16 text-caption dark:text-neutral-400" />
                <span className="text-14 text-default dark:text-neutral-50">Start a draft</span>
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

// --- the Edit panel's foot --------------------------------------------------------

export function DraftPushBar({ slug }: { slug: string }) {
  const { data } = useDrafts(slug, isActiveDbProject(slug))
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [outcome, setOutcome] = useState<Refusal | null>(null)

  const draft = data?.draft
  if (!draft) return null

  const run = async (body: { action: 'push' | 'discard' }) => {
    setOutcome(null)
    setBusy(body.action === 'push' ? 'Pushing…' : 'Discarding…')
    const result = await act(slug, body)
    setBusy(null)
    if (!result.ok) return setOutcome(result)
    info = null
    router.push(`/p/${result.slug}`)
  }

  return (
    <div className="flex flex-none flex-col gap-8 border-t border-default pt-12 dark:border-ink-700">
      {outcome ? <Refused outcome={outcome} /> : null}
      {confirmDiscard ? (
        <div className="flex items-center justify-between gap-8">
          <span className={NOTE}>Delete this draft and its changes?</span>
          <div className="flex flex-none gap-8">
            <button type="button" className={SECONDARY} disabled={Boolean(busy)} onClick={() => setConfirmDiscard(false)}>
              Keep
            </button>
            <button type="button" className={PRIMARY} disabled={Boolean(busy)} onClick={() => void run({ action: 'discard' })}>
              {busy ?? 'Discard'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-8">
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => setConfirmDiscard(true)}
            className="text-12 font-bold text-caption hover:text-default disabled:cursor-not-allowed dark:text-neutral-400 dark:hover:text-neutral-50"
          >
            Discard
          </button>
          <button type="button" className={`${PRIMARY} truncate`} disabled={Boolean(busy)} onClick={() => void run({ action: 'push' })}>
            {busy ?? `Push to ${draft.parentName}`}
          </button>
        </div>
      )}
    </div>
  )
}

// --- beside Flow ---------------------------------------------------------------------

export function DraftLabel({ slug }: { slug: string }) {
  const { data } = useDrafts(slug)
  const draft = data?.draft
  if (!draft) return null
  return (
    <span
      title={`A draft of ${draft.parentName} — not on the project’s link until it’s pushed.`}
      className="flex h-40 items-center rounded-full border border-default bg-neutral-white px-16 text-12 font-bold text-default shadow-sm dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50 dark:shadow-none"
    >
      <span className="text-primary-500">Draft</span>&nbsp;· {draft.name}
      <span className="font-regular text-caption dark:text-neutral-400">&nbsp;of {draft.parentName}</span>
    </span>
  )
}
