'use client'

// =============================================================================
// DB projects · the save history, in the Edit panel's project menu
// (./DraftControls.tsx). Every save, newest first; pick one and the project
// goes back to how it was right after it (./history.ts). The restore is a save
// of its own, so nothing is lost — the saves after it stay in the list.
// =============================================================================

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeftIcon } from '@/platform/chrome/icons'
import type { HistoryResponse, RestoreResult, SavePoint } from './protocol'

const PRIMARY =
  'rounded-full bg-primary-500 px-16 py-8 text-12 font-bold text-neutral-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-placeholder dark:disabled:bg-ink-800 dark:disabled:text-neutral-600'
const SECONDARY =
  'rounded-full border border-default px-16 py-8 text-12 font-bold text-default hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-placeholder dark:border-ink-700 dark:text-neutral-50 dark:hover:bg-ink-800'
const NOTE = 'text-12 text-caption dark:text-neutral-400'
const ROW = 'flex w-full flex-col gap-2 rounded-8 px-8 py-8 text-left hover:bg-neutral-50 dark:hover:bg-ink-800'

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const fileName = (path: string) => path.split('/').pop() ?? path

function summary(point: SavePoint): string {
  const names = point.files.map(fileName)
  return names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2} more`
}

export function HistoryList({ slug, onBack }: { slug: string; onBack: () => void }) {
  const [points, setPoints] = useState<SavePoint[] | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [picked, setPicked] = useState<SavePoint | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/db-projects/${encodeURIComponent(slug)}/history`, { cache: 'no-store' })
      const body = (await res.json()) as HistoryResponse
      if (!body.ok) return setProblem(body.reason)
      setPoints(body.points)
      setProblem(null)
    } catch {
      setProblem('The history didn’t load — try again.')
    }
  }, [slug])

  useEffect(() => {
    void load()
  }, [load])

  const restore = async (point: SavePoint) => {
    setBusy(true)
    setProblem(null)
    let result: RestoreResult
    try {
      const res = await fetch(`/api/db-projects/${encodeURIComponent(slug)}/history`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: point.id }),
      })
      result = (await res.json()) as RestoreResult
    } catch {
      result = { ok: false, reason: 'The studio didn’t answer — try again.' }
    }
    setBusy(false)
    setPicked(null)
    if (!result.ok) return setProblem(result.reason)
    setDone(
      result.changed
        ? `Restored to ${when(point.at)} — ${result.changed} file${result.changed === 1 ? '' : 's'} changed.`
        : 'Already as it was then — nothing changed.',
    )
    void load()
  }

  return (
    <div className="flex flex-col gap-4">
      <button type="button" className="flex items-center gap-4 px-8 py-4 text-left" onClick={onBack}>
        <ChevronLeftIcon className="size-16 text-caption dark:text-neutral-400" />
        <span className="text-14 font-bold text-default dark:text-neutral-50">History</span>
      </button>
      <p className={`${NOTE} px-8`}>Every save, newest first. Restoring adds a save — the ones after it stay here.</p>

      {done ? <p className="px-8 text-12 font-bold text-green-700 dark:text-green-400">{done}</p> : null}
      {problem ? <p className="px-8 text-12 text-red-700 dark:text-red-400">{problem}</p> : null}

      {points === null && !problem ? <p className={`${NOTE} px-8 py-8`}>Loading…</p> : null}
      {points?.length === 0 ? <p className={`${NOTE} px-8 py-8`}>No saves yet.</p> : null}

      {points?.length ? (
        <ol className="flex max-h-360 flex-col overflow-y-auto">
          {points.map((point, i) =>
            picked?.id === point.id ? (
              <li key={point.id} className="flex flex-col gap-8 rounded-8 bg-neutral-50 p-8 dark:bg-ink-800">
                <span className="text-12 text-default dark:text-neutral-50">
                  Put the project back to how it was at {when(point.at)}? Everyone on the link sees it at once.
                </span>
                <div className="flex justify-end gap-8">
                  <button type="button" className={SECONDARY} disabled={busy} onClick={() => setPicked(null)}>
                    Cancel
                  </button>
                  <button type="button" className={PRIMARY} disabled={busy} onClick={() => void restore(point)}>
                    {busy ? 'Restoring…' : 'Restore'}
                  </button>
                </div>
              </li>
            ) : (
              <li key={point.id}>
                <button
                  type="button"
                  className={ROW}
                  disabled={i === 0}
                  title={point.files.join('\n')}
                  onClick={() => {
                    setDone(null)
                    setPicked(point)
                  }}
                >
                  <span className="flex w-full items-center justify-between gap-8">
                    <span className="text-14 text-default dark:text-neutral-50">{when(point.at)}</span>
                    {i === 0 ? <span className="text-12 font-bold text-primary-500">Now</span> : null}
                  </span>
                  <span className={`${NOTE} truncate`}>
                    {point.by ?? 'Someone'} · {summary(point)}
                  </span>
                </button>
              </li>
            ),
          )}
        </ol>
      ) : null}
    </div>
  )
}
