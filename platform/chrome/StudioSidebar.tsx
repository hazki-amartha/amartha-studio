// =============================================================================
// StudioSidebar — the "file explorer" for the Studio rail section.
// Registered projects grouped by status; each row links to its prototype.
// =============================================================================

'use client'

import Link from 'next/link'
import type { ProjectStatus } from '@/platform/types'
import type { ProjectIndexEntry } from './loadProjectIndex'

const GROUP_ORDER: ProjectStatus[] = ['draft', 'in-review', 'final']
const GROUP_LABEL: Record<ProjectStatus, string> = {
  draft: 'Draft',
  'in-review': 'In review',
  final: 'Final',
}

export function StudioSidebar({
  projects,
  currentSlug,
}: {
  projects: ProjectIndexEntry[]
  currentSlug: string | null
}) {
  return (
    <div className="flex flex-col gap-16">
      <p className="px-12 text-16 font-bold text-default">Studio</p>

      {projects.length === 0 ? (
        <p className="px-12 text-12 text-caption">No projects registered yet.</p>
      ) : (
        GROUP_ORDER.map((status) => {
          const group = projects.filter((p) => p.status === status)
          if (group.length === 0) return null
          return (
            <nav key={status} aria-label={GROUP_LABEL[status]} className="flex flex-col gap-2">
              <p className="px-12 py-4 text-10 font-bold uppercase text-caption">
                {GROUP_LABEL[status]}
              </p>
              {group.map((project) => {
                const isActive = project.slug === currentSlug
                return (
                  <Link
                    key={project.slug}
                    href={`/p/${project.slug}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={
                      isActive
                        ? 'truncate rounded-8 bg-primary-50 px-12 py-8 text-14 font-bold text-link'
                        : 'truncate rounded-8 px-12 py-8 text-14 text-default hover:bg-neutral-50'
                    }
                  >
                    {project.name}
                  </Link>
                )
              })}
            </nav>
          )
        })
      )}
    </div>
  )
}
