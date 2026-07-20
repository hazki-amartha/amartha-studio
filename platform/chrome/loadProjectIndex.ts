// =============================================================================
// Lightweight project index for the shell sidebar.
// Loads each registered project module and returns just what the Studio
// explorer needs — no screen components, no heavy gallery entry shape.
// =============================================================================

import type { ProjectStatus } from '@/platform/types'
import { registry } from '@/projects/registry'

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
}

/** Every registered project, most-recent-first. */
export async function loadProjectIndex(): Promise<ProjectIndexEntry[]> {
  const modules = await Promise.all(Object.values(registry).map((load) => load()))
  return modules
    .map((mod) => ({
      slug: mod.config.slug,
      name: mod.config.name,
      status: mod.config.status,
      createdAt: mod.config.createdAt,
      screens: mod.screens.map((s) => ({ id: s.id, title: s.title })),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
