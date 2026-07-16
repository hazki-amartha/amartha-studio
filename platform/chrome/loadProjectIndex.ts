// =============================================================================
// Lightweight project index for the shell sidebar.
// Loads each registered project module and returns just what the Studio
// explorer needs — no screen components, no heavy gallery entry shape.
// =============================================================================

import type { ProjectStatus } from '@/platform/types'
import { registry } from '@/projects/registry'

export interface ProjectIndexEntry {
  slug: string
  name: string
  status: ProjectStatus
  createdAt: string
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
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
