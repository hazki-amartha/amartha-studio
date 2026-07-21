// WS-D · Gallery homepage — the front door.
// Reads projects/registry.ts, renders one card per project, most-recent-first.
// Composed strictly from design-system components + tokens (no arbitrary values).

import Link from 'next/link'
// Import Badge + Card directly (and their CSS) rather than via the barrel:
// the barrel re-exports client-only components (Modal, BottomSheet) that cannot
// load inside this async Server Component.
import '@/design-system/components/styles.css'
import { Badge, type BadgeIntent } from '@/design-system/components/Badge'
import { Card } from '@/design-system/components/Card'
import { PageHeader } from '@/platform/chrome'
import type { Platform, ProjectConfig, ProjectStatus } from '@/platform/types'
import { registry } from '@/projects/registry'

// draft = orange, in-review = blue, final = green (Badge subtle = 500-on-50 rule)
const STATUS_INTENT: Record<ProjectStatus, BadgeIntent> = {
  draft: 'orange',
  'in-review': 'blue',
  final: 'green',
}

const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: 'Draft',
  'in-review': 'In review',
  final: 'Final',
}

// Enum value is code-friendly; the display label carries the hyphen/casing.
const PLATFORM_LABEL: Record<Platform, string> = {
  APartner: 'A-Partner',
  AFIN: 'AFIN',
  NGMIS: 'NGMIS',
}

type GalleryEntry = {
  config: ProjectConfig
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Last-modified date drives display + sort, falling back to createdAt.
function lastModified(config: ProjectConfig): string {
  return config.updatedAt ?? config.createdAt
}

async function loadEntries(): Promise<GalleryEntry[]> {
  const modules = await Promise.all(Object.values(registry).map((load) => load()))
  const entries: GalleryEntry[] = modules.map((mod) => ({ config: mod.config }))
  // Most-recently-modified first.
  return entries.sort((a, b) => lastModified(b.config).localeCompare(lastModified(a.config)))
}

function ProjectCard({ config }: GalleryEntry) {
  const owners = Array.isArray(config.owner) ? config.owner.join(', ') : config.owner
  return (
    <Card flush className="gallery-card flex flex-col dark:border-ink-700 dark:bg-ink-900">
      {/* Dark brand region — eyebrow, title, description, byline. */}
      <div className="flex flex-1 flex-col gap-12 bg-gradient-to-br from-primary-700 to-primary-900 p-16">
        <div className="flex items-start justify-between gap-8">
          {config.platform && (
            <span className="text-12 font-regular text-neutral-400">
              {PLATFORM_LABEL[config.platform]}
            </span>
          )}
          <Badge intent={STATUS_INTENT[config.status]}>{STATUS_LABEL[config.status]}</Badge>
        </div>
        <h2 className="text-20 font-bold text-neutral-white">{config.name}</h2>
        <p className="line-clamp-2 flex-1 text-14 text-neutral-white">{config.description}</p>
        <p className="text-12 text-neutral-400">
          {owners} · {formatDate(lastModified(config))}
        </p>
      </div>
      {/* Footer — actions. */}
      <div className="flex items-center justify-end gap-8 bg-neutral-white p-16 dark:bg-ink-900">
        <Link
          href={`/p/${config.slug}/flow`}
          className="ds-btn ds-btn-outline ds-btn-sm dark:border-ink-700 dark:bg-ink-800 dark:text-neutral-50 dark:shadow-none dark:hover:bg-ink-700"
        >
          Open Flow
        </Link>
        <Link href={`/p/${config.slug}`} className="ds-btn ds-btn-primary ds-btn-sm">
          Open Prototype
        </Link>
      </div>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="gallery-card flex flex-col items-center gap-12 text-center dark:border-ink-700 dark:bg-ink-900">
      <h2 className="text-20 font-bold text-default dark:text-neutral-50">Start your first project</h2>
      <p className="max-w-screen-sm text-14 text-caption dark:text-neutral-400">
        No projects are registered yet. Copy <code className="text-default dark:text-neutral-50">projects/_template/</code>,
        fill in its <code className="text-default dark:text-neutral-50">project.config.ts</code>, then add one line to{' '}
        <code className="text-default dark:text-neutral-50">projects/registry.ts</code>. Your project appears here the
        moment it is registered.
      </p>
      <Link href="/system" className="ds-btn ds-btn-secondary ds-btn-sm">
        Browse the design system
      </Link>
    </Card>
  )
}

export default async function Home() {
  const entries = await loadEntries()

  return (
    <div className="mx-auto flex max-w-screen-lg flex-col gap-24 px-16 py-32">
      <PageHeader title="Prototype Studio" subtitle="Design-system-locked prototyping studio" />

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((e) => (
            <ProjectCard key={e.config.slug} config={e.config} />
          ))}
        </section>
      )}
    </div>
  )
}
