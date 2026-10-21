// =============================================================================
// The sidebar's screen list as groups — what its sections show, and what a
// drag does to them. Pure: a drag computes the next list here, and the sidebar
// saves it through /api/db-projects/<slug>/design (platform/design/
// arrangeScreens.ts writes it into index.ts).
//
// The list a group flattens back into is always canonical: the unsectioned
// screens first, then each section's screens together — the order the sidebar
// shows, so the stepper arrows walk it the same way.
// =============================================================================

import type { DesignResponse } from '@/platform/design/protocol'
import type { ScreenIndexEntry } from './screenIndex'

export interface Group {
  /** undefined for the screens without a section, always the first group. */
  section?: string
  rows: ScreenIndexEntry[]
}

/** The screens as the sidebar shows them: unsectioned first, then each section
 *  in the order it first appears, then `drafts` — sections made in the sidebar
 *  that no screen has joined yet. */
export function groupsOf(screens: ScreenIndexEntry[], drafts: readonly string[] = []): Group[] {
  const loose: Group = { rows: [] }
  const sections = new Map<string, Group>()
  for (const screen of screens) {
    if (!screen.section) loose.rows.push(screen)
    else if (sections.has(screen.section)) sections.get(screen.section)!.rows.push(screen)
    else sections.set(screen.section, { section: screen.section, rows: [screen] })
  }
  for (const name of drafts) if (!sections.has(name)) sections.set(name, { section: name, rows: [] })
  return [loose, ...sections.values()]
}

export function flatten(groups: Group[]): ScreenIndexEntry[] {
  return groups.flatMap((g) =>
    g.rows.map((s) => (g.section ? { id: s.id, title: s.title, section: g.section } : { id: s.id, title: s.title })),
  )
}

/** Move a screen into a group, before the row at `index` (its length: last). */
export function moveScreen(groups: Group[], id: string, group: number, index: number): Group[] {
  const from = groups.findIndex((g) => g.rows.some((s) => s.id === id))
  if (from < 0 || !groups[group]) return groups
  const fromIndex = groups[from].rows.findIndex((s) => s.id === id)
  const moving = groups[from].rows[fromIndex]
  // `index` counts the screen's own old slot when it moves down its group.
  const at = from === group && fromIndex < index ? index - 1 : index
  const next = groups.map((g) => ({ ...g, rows: g.rows.filter((s) => s.id !== id) }))
  next[group].rows.splice(at, 0, moving)
  return next
}

/** Move the section at group `from` before the group at `to` (its length:
 *  last). The unsectioned group stays first. */
export function moveSection(groups: Group[], from: number, to: number): Group[] {
  if (from < 1) return groups
  const moving = groups[from]
  const rest = groups.filter((_, i) => i !== from)
  const at = Math.max(1, to > from ? to - 1 : to)
  return [...rest.slice(0, at), moving, ...rest.slice(at)]
}

/** Rename a section — or, renamed to nothing, take its screens out of it (to
 *  the end of the unsectioned ones). Renamed onto another section, they join
 *  it. */
export function renameSection(groups: Group[], from: string, to: string): Group[] {
  const name = to.trim()
  const renamed = groups.find((g) => g.section === from)
  if (!renamed || name === from) return groups
  const others = groups.filter((g) => g !== renamed)
  if (!name) return others.map((g, i) => (i === 0 ? { ...g, rows: [...g.rows, ...renamed.rows] } : g))
  const into = others.find((g) => g.section === name)
  if (into) return others.map((g) => (g === into ? { ...g, rows: [...g.rows, ...renamed.rows] } : g))
  return groups.map((g) => (g === renamed ? { ...g, section: name } : g))
}

const slotsOf = (screens: ScreenIndexEntry[]) =>
  screens.map((s) => (s.section ? { id: s.id, section: s.section } : { id: s.id }))

export const sameArrangement = (a: ScreenIndexEntry[], b: ScreenIndexEntry[]) =>
  a.length === b.length && a.every((s, i) => s.id === b[i].id && (s.section ?? '') === (b[i].section ?? ''))

/** Save the new arrangement. Resolves to why it wasn't saved, or null. */
export async function saveArrangement(
  slug: string,
  seen: ScreenIndexEntry[],
  next: ScreenIndexEntry[],
): Promise<string | null> {
  try {
    const res = await fetch(`/api/db-projects/${encodeURIComponent(slug)}/design`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, arrange: { seen: slotsOf(seen), next: slotsOf(next) } }),
    })
    const r = (await res.json()) as DesignResponse
    return r.ok ? null : r.reason
  } catch {
    return 'The studio didn’t answer — try again.'
  }
}
