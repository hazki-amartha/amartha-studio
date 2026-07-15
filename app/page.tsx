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
import type { ProjectConfig, ProjectStatus, ScreenDef } from '@/platform/types'
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

type GalleryEntry = {
  config: ProjectConfig
  entry?: ScreenDef
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function loadEntries(): Promise<GalleryEntry[]> {
  const modules = await Promise.all(Object.values(registry).map((load) => load()))
  const entries: GalleryEntry[] = modules.map((mod) => ({
    config: mod.config,
    entry: mod.screens.find((s) => s.entry) ?? mod.screens[0],
  }))
  // Most-recent-first by createdAt.
  return entries.sort((a, b) => b.config.createdAt.localeCompare(a.config.createdAt))
}

// Styled placeholder mini-preview (v1 fallback per PLAN §7.3 WS-D task 2).
// A real scaled screen render needs the WS-A runtime (unmerged), so we render an
// on-system stand-in that echoes the entry screen title. Decorative only.
function MiniPreview({ title }: { title: string }) {
  return (
    <div
      aria-hidden
      className="flex flex-col gap-8 rounded-8 border border-default bg-neutral-50 p-12"
    >
      <div className="flex items-center gap-8">
        <span className="size-8 rounded-full bg-primary-500" />
        <span className="text-12 font-bold text-default">{title}</span>
      </div>
      <div className="flex flex-col gap-8">
        <div className="h-32 rounded-8 border border-default bg-neutral-white" />
        <div className="flex flex-col gap-4 rounded-8 border border-default bg-neutral-white p-8">
          <div className="h-8 w-24 rounded-4 bg-neutral-200" />
          <div className="h-8 w-16 rounded-4 bg-neutral-200" />
        </div>
        <div className="h-24 rounded-full bg-primary-200" />
      </div>
    </div>
  )
}

function ProjectCard({ config, entry }: GalleryEntry) {
  return (
    <Card flush className="flex flex-col overflow-hidden">
      <div className="bg-neutral-50 p-16">
        <MiniPreview title={entry?.title ?? config.name} />
      </div>
      <div className="flex flex-1 flex-col gap-8 p-16">
        <div className="flex items-start justify-between gap-8">
          <h2 className="text-18 font-bold text-default">{config.name}</h2>
          <Badge intent={STATUS_INTENT[config.status]}>{STATUS_LABEL[config.status]}</Badge>
        </div>
        <p className="text-12 text-caption">
          {config.owner} · {formatDate(config.createdAt)}
        </p>
        <p className="flex-1 text-14 text-default">{config.description}</p>
        <div className="mt-8 flex items-center gap-8">
          <Link href={`/p/${config.slug}`} className="ds-btn ds-btn-primary ds-btn-sm">
            Open prototype
          </Link>
          <Link href={`/p/${config.slug}/flow`} className="ds-btn ds-btn-outline ds-btn-sm">
            Flow view
          </Link>
        </div>
      </div>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="flex flex-col items-center gap-12 text-center">
      <h2 className="text-20 font-bold text-default">Start your first project</h2>
      <p className="max-w-screen-sm text-14 text-caption">
        No projects are registered yet. Copy <code className="text-default">projects/_template/</code>,
        fill in its <code className="text-default">project.config.ts</code>, then add one line to{' '}
        <code className="text-default">projects/registry.ts</code>. Your project appears here the
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
    <main className="mx-auto flex max-w-screen-lg flex-col gap-24 px-16 pt-32">
      <header className="flex items-center justify-between gap-16">
        <div className="flex flex-col gap-4">
          <h1 className="text-24 font-bold text-default">Drafting Board</h1>
          <p className="text-14 text-caption">Design-system-locked prototyping studio</p>
        </div>
        <Link href="/system" className="ds-btn ds-btn-outline ds-btn-sm">
          Design system
        </Link>
      </header>

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((e) => (
            <ProjectCard key={e.config.slug} config={e.config} entry={e.entry} />
          ))}
        </section>
      )}
    </main>
  )
}
