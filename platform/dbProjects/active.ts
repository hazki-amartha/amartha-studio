// =============================================================================
// DB projects · which open project lives in the database, for the rest of the
// studio in this tab.
//
// /p/<slug> serves a project from the database when it is there and from git
// otherwise, so the URL no longer says which. DbPrototype marks its slug here
// before the prototype renders; Edit mode (designStore) and Chat (useLiveChat)
// read the mark to send their writes to the database instead of to files.
//
// It also publishes the project's screen list for the sidebar: a database
// project's screens are only known once its code has run in the browser.
// =============================================================================

import type { ProjectIndexEntry } from '@/platform/chrome/loadProjectIndex'

let active: string | null = null

export function setActiveDbProject(slug: string | null) {
  active = slug
}

export function isActiveDbProject(slug: string | null | undefined): boolean {
  return Boolean(slug) && active === slug
}

let entry: ProjectIndexEntry | null = null
const listeners = new Set<() => void>()

export function publishDbIndexEntry(next: ProjectIndexEntry | null) {
  entry = next
  listeners.forEach((l) => l())
}

export function subscribeDbIndexEntry(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getDbIndexEntry(): ProjectIndexEntry | null {
  return entry
}
