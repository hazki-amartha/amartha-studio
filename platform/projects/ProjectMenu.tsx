'use client'

// =============================================================================
// The gallery card's ⋯ menu — rename the project, change its owners, delete it
// — and Restore under Recently deleted (platform/dbProjects/details.ts and
// trash.ts do the work). The gallery only renders the menu for someone who may
// manage that card — its owner or a studio admin; a project that can't be
// deleted still offers the rest, with the reason in Delete's place.
// =============================================================================

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreIcon } from '@/platform/chrome/icons'
import { NAME_MAX, type DetailsChange, type DetailsResult } from '@/platform/dbProjects/detailsMeta'
import type { DeleteState, TrashAction, TrashResult } from '@/platform/dbProjects/trashMeta'

const NOTE = 'text-12 text-caption dark:text-neutral-400'
const ERROR = 'text-12 text-red-700 dark:text-red-400'
const SECONDARY =
  'rounded-full border border-default px-16 py-8 text-12 font-bold text-default hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-placeholder dark:border-ink-700 dark:text-neutral-50 dark:hover:bg-ink-800'
const PRIMARY =
  'rounded-full bg-neutral-900 px-16 py-8 text-12 font-bold text-neutral-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-50 dark:text-ink-900 dark:hover:bg-neutral-200'
const ITEM =
  'w-full rounded-8 px-8 py-8 text-left text-14 text-default hover:bg-neutral-50 dark:text-neutral-50 dark:hover:bg-ink-800'
const FIELD =
  'w-full rounded-8 border border-default bg-neutral-white px-12 py-8 text-14 text-default outline-none focus:border-neutral-600 dark:border-ink-700 dark:bg-ink-950 dark:text-neutral-50 dark:focus:border-neutral-500'
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

async function edit(slug: string, change: DetailsChange): Promise<DetailsResult> {
  try {
    const res = await fetch(`/api/db-projects/${encodeURIComponent(slug)}/details`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(change),
    })
    return (await res.json()) as DetailsResult
  } catch {
    return { ok: false, reason: 'That didn’t work — try again.' }
  }
}

const same = (a: string, b: string) => a.toLocaleLowerCase() === b.toLocaleLowerCase()

type View = 'menu' | 'rename' | 'owners' | 'delete'

export function ProjectMenu({
  slug,
  name,
  owners,
  names,
  state,
}: {
  slug: string
  name: string
  /** The project's owners now. */
  owners: string[]
  /** Everyone the studio knows — who the project may be handed to. */
  names: string[]
  state: DeleteState
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('menu')
  const [draftName, setDraftName] = useState(name)
  const [picked, setPicked] = useState(owners)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const box = useRef<HTMLDivElement>(null)

  // Current owners first, then everyone else the studio knows.
  const roster = [...owners, ...names.filter((n) => !owners.some((o) => same(o, n)))]

  // Every opening starts at the list, from the project as it is now.
  const toggleOpen = () => {
    if (!open) {
      setView('menu')
      setDraftName(name)
      setPicked(owners)
      setError(null)
    }
    setOpen(!open)
  }

  useEffect(() => {
    if (!open) return
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

  const save = async (change: DetailsChange) => {
    setBusy(true)
    setError(null)
    const result = await edit(slug, change)
    setBusy(false)
    if (!result.ok) return setError(result.reason)
    setOpen(false)
    router.refresh()
  }

  const toggle = (who: string) =>
    setPicked((p) => (p.some((o) => same(o, who)) ? p.filter((o) => !same(o, who)) : [...p, who]))

  const trimmed = draftName.trim().replace(/\s+/g, ' ')
  const ownersChanged = picked.length !== owners.length || picked.some((p) => !owners.some((o) => same(o, p)))

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
        onClick={toggleOpen}
        className="flex size-32 items-center justify-center rounded-full text-neutral-white opacity-80 hover:bg-ink-900 hover:opacity-100"
      >
        <MoreIcon className="size-16" />
      </button>
      {open ? (
        <div className="absolute right-0 top-full mt-4 flex w-280 flex-col gap-8 rounded-12 border border-default bg-neutral-white p-8 shadow-sm dark:border-ink-700 dark:bg-ink-900">
          {view === 'rename' ? (
            <form
              className="flex flex-col gap-12 p-8"
              onSubmit={(e) => {
                e.preventDefault()
                if (trimmed && trimmed !== name) void save({ name: trimmed })
              }}
            >
              <label className="flex flex-col gap-4">
                <span className="text-12 font-bold text-caption dark:text-neutral-400">Project name</span>
                <input
                  autoFocus
                  value={draftName}
                  maxLength={NAME_MAX}
                  onChange={(e) => setDraftName(e.target.value)}
                  className={FIELD}
                />
              </label>
              <p className={NOTE}>The link stays the same.</p>
              {error ? <p className={ERROR}>{error}</p> : null}
              <div className="flex justify-end gap-8">
                <button type="button" className={SECONDARY} disabled={busy} onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={PRIMARY} disabled={busy || !trimmed || trimmed === name}>
                  {busy ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          ) : view === 'owners' ? (
            <div className="flex flex-col gap-12 p-8">
              <span className="text-12 font-bold text-caption dark:text-neutral-400">Owners</span>
              <div className="flex max-h-240 flex-col gap-4 overflow-y-auto">
                {roster.map((who) => (
                  <label
                    key={who}
                    className="flex cursor-pointer items-center gap-8 rounded-8 px-4 py-4 text-14 text-default hover:bg-neutral-50 dark:text-neutral-50 dark:hover:bg-ink-800"
                  >
                    <input
                      type="checkbox"
                      checked={picked.some((p) => same(p, who))}
                      onChange={() => toggle(who)}
                      className="size-16 accent-blue-500"
                    />
                    {who}
                  </label>
                ))}
              </div>
              <p className={NOTE}>Owners can rename, hand over and delete the project.</p>
              {error ? <p className={ERROR}>{error}</p> : null}
              <div className="flex justify-end gap-8">
                <button type="button" className={SECONDARY} disabled={busy} onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={PRIMARY}
                  disabled={busy || !picked.length || !ownersChanged}
                  onClick={() => void save({ owners: picked })}
                >
                  {busy ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          ) : view === 'delete' && state.ok ? (
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
            <div className="flex flex-col">
              <button type="button" onClick={() => setView('rename')} className={ITEM}>
                Rename
              </button>
              <button type="button" onClick={() => setView('owners')} className={ITEM}>
                Edit owners
              </button>
              <div className="my-4 border-t border-default dark:border-ink-700" />
              {state.ok ? (
                <button
                  type="button"
                  onClick={() => setView('delete')}
                  className="w-full rounded-8 px-8 py-8 text-left text-14 text-red-700 hover:bg-neutral-50 dark:text-red-400 dark:hover:bg-ink-800"
                >
                  Delete project
                </button>
              ) : (
                <p className={`${NOTE} px-8 py-4`}>{state.reason}</p>
              )}
            </div>
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
