// =============================================================================
// DB projects · history — every save of a project, and putting it back.
//
// Server-only. Every save already leaves a row per file in
// studio_project_file_versions (a null content records a deletion), from the
// project's first copy into the database onwards. So:
//
//   list      the rows, newest first, grouped into save points — the files one
//             person saved within a minute of each other count as one save.
//   restore   every file back to its newest row at or before a save point:
//             files changed since are rewritten, files made since are deleted,
//             files deleted since come back. It lands as one more save, so a
//             restore is in the history too — and can itself be restored past.
//             Not re-checked: each version passed the save checks when it was
//             saved, and a restore that couldn't land would leave no way back.
//
// Like every other write, it happens on the deployed studio, which holds the
// database key. A laptop's dev server passes the request on (./remote.ts).
// =============================================================================

import { DRAFT_FILE } from './draftMeta'
import { TRASH_FILE } from './trashMeta'
import type { HistoryResponse, RestoreResult, SavePoint } from './protocol'
import { remote } from './remote'
import { announceSave, createAdminClient, FILES_TABLE, readDbRows, VERSIONS_TABLE } from './server'

type Db = NonNullable<ReturnType<typeof createAdminClient>>
export interface Row {
  id: number
  path: string
  saved_at: string
  saved_by: string | null
}

/** Saves this close together, by the same person, are one save point. */
const SAME_SAVE_MS = 60_000
/** Supabase answers at most this many rows per request. */
const PAGE = 1000

/** Every history row of a project — no content — newest first. */
async function allRows(db: Db, slug: string): Promise<Row[]> {
  const out: Row[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from(VERSIONS_TABLE)
      .select('id, path, saved_at, saved_by')
      .eq('slug', slug)
      .order('id', { ascending: false })
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    out.push(...(data as Row[]))
    if (data.length < PAGE) return out
  }
}

export async function listHistory(slug: string): Promise<HistoryResponse> {
  const db = createAdminClient()
  if (!db) return remote<HistoryResponse>(`/api/db-projects/${encodeURIComponent(slug)}/history`, { write: true })

  return { ok: true, points: savePoints(await allRows(db, slug)) }
}

/** History rows, newest first, as save points. */
export function savePoints(rows: Row[]): SavePoint[] {
  const points: SavePoint[] = []
  for (const row of rows) {
    if (row.path === DRAFT_FILE || row.path === TRASH_FILE) continue
    const last = points[points.length - 1]
    const near = last && last.by === row.saved_by && Date.parse(last.at) - Date.parse(row.saved_at) < SAME_SAVE_MS
    if (near) {
      if (!last.files.includes(row.path)) last.files.push(row.path)
    } else {
      points.push({ id: row.id, at: row.saved_at, by: row.saved_by, files: [row.path] })
    }
  }
  return points
}

/** Each file's newest history row at save point `id` — rows newest first —
 *  and every file the history knows. */
export function rowsAt(rows: Row[], id: number): { at: Map<string, number>; known: Set<string> } {
  const at = new Map<string, number>()
  const known = new Set<string>()
  for (const r of rows) {
    known.add(r.path)
    if (r.id <= id && !at.has(r.path)) at.set(r.path, r.id)
  }
  return { at, known }
}

/** What putting the project back takes: `then` is each known file's content
 *  at the save point (null: it didn't exist), `now` the files as they are. */
export function restorePlan(
  known: Set<string>,
  then: (path: string) => string | null,
  now: Map<string, string>,
): { write: { path: string; content: string }[]; remove: string[] } {
  const write: { path: string; content: string }[] = []
  const remove: string[] = []
  for (const path of known) {
    // A branch's link to its project, and the deleted mark, aren't part of what was saved.
    if (path === DRAFT_FILE || path === TRASH_FILE) continue
    const was = then(path)
    if (was === (now.get(path) ?? null)) continue
    if (was === null) remove.push(path)
    else write.push({ path, content: was })
  }
  return { write, remove }
}

export async function restoreTo(slug: string, id: number, by: string | null): Promise<RestoreResult> {
  const db = createAdminClient()
  if (!db) {
    return remote<RestoreResult>(`/api/db-projects/${encodeURIComponent(slug)}/history`, {
      method: 'POST',
      body: JSON.stringify({ id }),
      write: true,
    })
  }

  const rows = await allRows(db, slug)
  if (!rows.some((r) => r.id === id)) return { ok: false, reason: 'That save isn’t in this project’s history.' }

  const { at, known } = rowsAt(rows, id)
  const ids = [...at.values()]
  const content = new Map<number, string | null>()
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await db.from(VERSIONS_TABLE).select('id, content').in('id', ids.slice(i, i + 200))
    if (error) throw new Error(error.message)
    for (const r of data) content.set(r.id as number, r.content as string | null)
  }

  const now = new Map([...(await readDbRows(slug))].map(([path, r]) => [path, r.content]))
  const { write, remove } = restorePlan(known, (path) => (at.has(path) ? (content.get(at.get(path)!) ?? null) : null), now)
  if (!write.length && !remove.length) return { ok: true, changed: 0 }

  const savedBy = `${by ?? 'Someone'} · restored`
  const stamp = new Date().toISOString()
  if (write.length) {
    const up = await db
      .from(FILES_TABLE)
      .upsert(write.map((f) => ({ slug, path: f.path, content: f.content, updated_at: stamp, updated_by: savedBy })))
    if (up.error) throw new Error(up.error.message)
  }
  if (remove.length) {
    const del = await db.from(FILES_TABLE).delete().eq('slug', slug).in('path', remove)
    if (del.error) throw new Error(del.error.message)
  }
  const ver = await db.from(VERSIONS_TABLE).insert([
    ...write.map((f) => ({ slug, path: f.path, content: f.content, saved_by: savedBy })),
    // A null content in history records the deletion.
    ...remove.map((path) => ({ slug, path, content: null, saved_by: savedBy })),
  ])
  if (ver.error) throw new Error(ver.error.message)
  await announceSave(slug)
  return { ok: true, changed: write.length + remove.length }
}
