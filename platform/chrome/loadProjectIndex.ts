// =============================================================================
// Lightweight project index for the shell sidebar.
// Loads each registered project module and returns just what the Studio
// explorer needs — no screen components, no heavy gallery entry shape.
// =============================================================================

import type { ProjectStatus } from '@/platform/types'
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

/** Every registered project, most-recent-first. */
export async function loadProjectIndex(): Promise<ProjectIndexEntry[]> {
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
