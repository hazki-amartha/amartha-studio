// =============================================================================
// Lightweight project index for the shell sidebar.
// Loads each registered project module and returns just what the Studio
// explorer needs — no screen components, no heavy gallery entry shape.
// =============================================================================

import type { ProjectConfig, ProjectStatus } from '@/platform/types'
import { registry } from '@/projects/registry'
import { mergeProject } from '@/platform/runtime/resolveProject'

export interface ScreenIndexEntry {
  id: string
  title: string
}

export interface ProjectIndexEntry {
  slug: string
  name: string
  status: ProjectStatus
  createdAt: string
  /** Declared screen order — id + title only, safe to cross the server boundary. */
  screens: ScreenIndexEntry[]
  /** Screens inherited from the base this project `extends`, if any. */
  inherited?: { from: string; screens: ScreenIndexEntry[] }
}

/** Projects that live in the database (platform/dbProjects). Their screens
 *  are only known once the project runs, so the list carries none — the open
 *  one publishes its own (platform/dbProjects/active.ts). */
async function loadDbEntries(): Promise<ProjectIndexEntry[]> {
  try {
    const res = await fetch('/api/db-projects', { cache: 'no-store' })
    if (!res.ok) return []
    const { projects } = (await res.json()) as { projects: ProjectConfig[] }
    return projects.map((c) => ({ slug: c.slug, name: c.name, status: c.status, createdAt: c.createdAt, screens: [] }))
  } catch {
    return []
  }
}

/** Every project — registered in git or living in the database, the database
 *  copy winning when a slug is in both — most-recent-first. */
export async function loadProjectIndex(): Promise<ProjectIndexEntry[]> {
  const [git, db] = await Promise.all([loadGitEntries(), loadDbEntries()])
  const inDb = new Set(db.map((e) => e.slug))
  return [...db, ...git.filter((e) => !inDb.has(e.slug))].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

async function loadGitEntries(): Promise<ProjectIndexEntry[]> {
  const modules = await Promise.all(Object.values(registry).map((load) => load()))
  const bySlug = new Map(modules.map((m) => [m.config.slug, m] as const))
  const brief = (s: { id: string; title: string }) => ({ id: s.id, title: s.title })
  return modules
    .map((mod) => {
      const resolved = mergeProject(mod, mod.config.extends ? bySlug.get(mod.config.extends) : undefined)
      return {
        slug: mod.config.slug,
        name: mod.config.name,
        status: mod.config.status,
        createdAt: mod.config.createdAt,
        screens: resolved.own.map(brief),
        inherited: resolved.base
          ? { from: resolved.base.name, screens: resolved.inherited.map(brief) }
          : undefined,
      }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
