'use client'

// =============================================================================
// DB projects · drafts in the studio (./drafts.ts) — "branches" on screen.
// Two pieces, one state:
//
//   ProjectSwitcher  the sidebar's project name — "<Project>" or "<Project> ·
//                  Branch: <name>" — and the branch button beside Share,
//                  opening a list of the project and its branches, and
//                  "Start a branch". Each branch row the viewer
//                  may act on carries Push (its changes go live on the
//                  project, the branch is deleted) and a trash button
//                  (Discard, after asking). Every edit to a database project
//                  saves itself, so there's nothing to save first. Hidden
//                  from share-link guests.
//   HistoryButton  the clock beside the right panel's ✕, opening the History
//                  of every save (./HistoryList.tsx).
//
// Editing the project directly stays exactly as it was; a draft is only for
// trying something off the link.
// =============================================================================

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react'
import { BranchIcon, HistoryIcon, PlusIcon, TrashIcon } from '@/platform/chrome/icons'
import { ICON_BUTTON as SIDEBAR_BUTTON } from '@/platform/chrome/sidebarRows'
import { useStudioUser } from '@/platform/auth/session'
import { isActiveDbProject } from './active'
import type { DraftActionResult, DraftsResponse } from './draftMeta'
import { HistoryList } from './HistoryList'

const PRIMARY =
  'rounded-full bg-primary-500 px-16 py-8 text-12 font-bold text-neutral-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-placeholder dark:disabled:bg-ink-800 dark:disabled:text-neutral-600'
const NOTE = 'text-12 text-caption dark:text-neutral-400'
const ROW =
  'flex w-full items-center justify-between gap-8 rounded-8 px-8 py-8 text-left hover:bg-neutral-50 dark:hover:bg-ink-800'
const SMALL_PRIMARY =
  'flex-none rounded-full bg-primary-500 px-12 py-4 text-12 font-bold text-neutral-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-placeholder dark:disabled:bg-ink-800 dark:disabled:text-neutral-600'
const ICON_BUTTON =
  'flex size-24 flex-none items-center justify-center rounded-4 text-caption hover:bg-neutral-200 hover:text-default disabled:cursor-not-allowed dark:text-neutral-400 dark:hover:bg-ink-700 dark:hover:text-neutral-50'
const ERROR = 'flex flex-col gap-4 whitespace-pre-line text-12 text-red-700 dark:text-red-400'

// --- shared state: one fetch per project, read by both ---------------------

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

// --- the menus ----------------------------------------------------------------

/** Open/close for a title menu: closes on a click anywhere outside it. */
function useMenu(onOpen?: () => void) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    onOpen?.()
    const close = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  return { open, setOpen, box }
}

const MENU =
  'absolute top-full z-40 mt-4 flex w-280 flex-col gap-4 rounded-12 border border-default bg-neutral-white p-8 shadow-sm dark:border-ink-700 dark:bg-ink-900'

/** The sidebar's project name, and on a database project the branch button
 *  after it, which opens the project and its branches and starts a new one. A
 *  git project has no branches: just the name. The name takes the room left,
 *  so the button stays put beside Share however long the name is. */
export function ProjectSwitcher({ slug, name }: { slug: string; name: string }) {
  const db = isActiveDbProject(slug)
  const { data, refresh } = useDrafts(slug, db)
  const router = useRouter()
  const { open, setOpen, box } = useMenu(() => refresh())
  const [starting, setStarting] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<Refusal | null>(null)
  // A branch row's own work: which one is pushing or discarding, which one is
  // asking before it deletes.
  const [acting, setActing] = useState<{ slug: string; label: string } | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const me = useStudioUser().user?.displayName ?? null

  useEffect(() => {
    if (open) return
    setStarting(false)
    setOutcome(null)
    setConfirming(null)
  }, [open])

  const draft = data?.draft
  // A branch's sidebar names the project it belongs to, then which branch.
  const title = (
    <span className="flex min-w-0 flex-1 items-baseline gap-4 px-8">
      <span className="truncate text-14 font-bold text-default dark:text-neutral-50">{draft?.parentName ?? name}</span>
      {draft ? (
        <span className="truncate text-14 text-caption dark:text-neutral-400">· Branch: {draft.name}</span>
      ) : null}
    </span>
  )
  if (!db || !data) return title

  const project = draft?.draftOf ?? slug
  const go = (to: string) => {
    setOpen(false)
    if (to !== slug) router.push(`/p/${to}`)
  }

  const start = async (e: FormEvent) => {
    e.preventDefault()
    if (!draftName.trim()) return
    setBusy(true)
    setOutcome(null)
    const result = await act(project, { action: 'start', name: draftName })
    setBusy(false)
    if (!result.ok) return setOutcome(result)
    setDraftName('')
    go(result.slug)
  }

  /** Push or discard a branch from its row. Pushing lands on the project;
   *  discarding the branch that's open does too — any other just leaves the list. */
  const run = async (branch: string, action: 'push' | 'discard') => {
    setOutcome(null)
    setActing({ slug: branch, label: action === 'push' ? 'Pushing…' : 'Discarding…' })
    const result = await act(branch, { action })
    setActing(null)
    setConfirming(null)
    if (!result.ok) return setOutcome(result)
    info = null
    if (action === 'push' || branch === slug) go(result.slug)
    else refresh()
  }
  // Today's limits: the branch that's open, and the ones this person started.
  const mayAct = (d: { slug: string; createdBy: string | null }) => d.slug === slug || (me !== null && d.createdBy === me)
  const parentName = draft?.parentName ?? name

  return (
    <>
      {title}
      <div ref={box} className="relative flex-none">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Branches"
          title="Branches — switch between the project and its branches, or start one"
          className={SIDEBAR_BUTTON}
        >
          <BranchIcon className="size-16" />
        </button>

        {open ? (
          <div className={`${MENU} left-0`}>
            <button type="button" className={ROW} onClick={() => go(project)}>
              <span className="flex min-w-0 flex-col">
                <span className="text-14 text-default dark:text-neutral-50">Main</span>
                <span className={`${NOTE} truncate`}>What the project’s link shows</span>
              </span>
              {!draft ? <span className="text-12 font-bold text-primary-500">Here</span> : null}
            </button>
            {data.drafts.map((d) => (
              <div key={d.slug} className={ROW}>
                <button type="button" className="flex min-w-0 flex-1 flex-col text-left" onClick={() => go(d.slug)}>
                  <span className="truncate text-14 text-default dark:text-neutral-50">Branch: {d.name}</span>
                  <span className={`${NOTE} truncate`}>
                    {d.createdBy}
                    {d.slug === slug ? (
                      <span className="font-bold text-primary-500">{d.createdBy ? ' · Here' : 'Here'}</span>
                    ) : null}
                  </span>
                </button>
                {acting?.slug === d.slug ? (
                  <span className={NOTE}>{acting.label}</span>
                ) : confirming === d.slug ? (
                  <span className="flex flex-none items-center gap-8">
                    <span className={NOTE}>Delete?</span>
                    <button type="button" className={`${NOTE} font-bold hover:text-default dark:hover:text-neutral-50`} onClick={() => setConfirming(null)}>
                      Keep
                    </button>
                    <button type="button" className={SMALL_PRIMARY} onClick={() => void run(d.slug, 'discard')}>
                      Delete
                    </button>
                  </span>
                ) : mayAct(d) ? (
                  <span className="flex flex-none items-center gap-4">
                    <button
                      type="button"
                      className={SMALL_PRIMARY}
                      disabled={acting !== null}
                      title={`Push to ${parentName} — its changes go live, and the branch is deleted`}
                      onClick={() => void run(d.slug, 'push')}
                    >
                      Push
                    </button>
                    <button
                      type="button"
                      className={ICON_BUTTON}
                      disabled={acting !== null}
                      aria-label={`Discard the branch ${d.name}`}
                      title="Discard this branch and its changes"
                      onClick={() => setConfirming(d.slug)}
                    >
                      <TrashIcon className="size-16" />
                    </button>
                  </span>
                ) : null}
              </div>
            ))}
            {outcome && !starting ? <div className="px-8"><Refused outcome={outcome} /></div> : null}
            <div className="border-t border-default pt-4 dark:border-ink-700">
              {starting ? (
                <form onSubmit={start} className="flex flex-col gap-8 p-8">
                  <p className={NOTE}>Try a change without it showing on the project’s link. Push the branch when it’s ready.</p>
                  <div className="flex gap-8">
                    <input
                      autoFocus
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      placeholder="Name the branch"
                      maxLength={40}
                      className="min-w-0 flex-1 rounded-8 border border-default bg-neutral-white px-12 py-8 text-12 text-default placeholder:text-placeholder dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50"
                    />
                    <button type="submit" className={PRIMARY} disabled={busy || !draftName.trim()}>
                      {busy ? 'Starting…' : 'Start'}
                    </button>
                  </div>
                  {outcome ? <Refused outcome={outcome} /> : null}
                </form>
              ) : (
                <button type="button" className={`${ROW} justify-start`} onClick={() => setStarting(true)}>
                  <PlusIcon className="size-16 text-caption dark:text-neutral-400" />
                  <span className="text-14 text-default dark:text-neutral-50">Start a branch</span>
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}

/** The right panel's History, beside its ✕. On a database project it opens
 *  the History of every save; a git project has none, so it draws nothing. */
export function HistoryButton({ slug }: { slug: string }) {
  const { open, setOpen, box } = useMenu()
  if (!isActiveDbProject(slug)) return null

  return (
    <div ref={box} className="relative flex-none">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="History"
        title="History — every save of this project"
        className="flex size-32 items-center justify-center rounded-8 text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-500 dark:hover:bg-ink-800 dark:hover:text-neutral-50"
      >
        <HistoryIcon className="size-16" />
      </button>
      {open ? (
        <div className={`${MENU} right-0`}>
          <HistoryList slug={slug} />
        </div>
      ) : null}
    </div>
  )
}
