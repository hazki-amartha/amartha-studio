// WS-D · Gallery homepage — the front door.
// Reads projects/configs.ts, renders one folder per status and one card per
// project, most-recent-first. Composed strictly from design-system components +
// tokens (no arbitrary values).

import Link from 'next/link'
// Import Badge + Card directly (and their CSS) rather than via the barrel:
// the barrel re-exports client-only components (Modal, BottomSheet) that cannot
// load inside this async Server Component.
import '@/design-system/components/styles.css'
import { Badge, type BadgeIntent } from '@/design-system/components/Badge'
import { Card } from '@/design-system/components/Card'
import { PageHeader } from '@/platform/chrome'
import { ChevronLeftIcon } from '@/platform/chrome/icons'
import type { Platform, ProjectConfig, ProjectStatus } from '@/platform/types'
import { configs as projectConfigs } from '@/projects/configs'

// draft = orange, in-review = blue, final = green (Badge subtle = 500-on-50 rule).
// live = primary: it is not another shade of "done", it is the shipped product,
// so it reads in the brand colour rather than on the draft→final ramp.
const STATUS_INTENT: Record<ProjectStatus, BadgeIntent> = {
  draft: 'orange',
  'in-review': 'blue',
  final: 'green',
  live: 'primary',
}

const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: 'Draft',
  'in-review': 'In review',
  final: 'Final',
  live: 'Live',
}

// The four folders, in pipeline order — draft → in review → final → live. Fixed
// taxonomy: a status with nothing in it still shows, so the shape of the studio
// reads the same on every visit.
const STATUS_ORDER: ProjectStatus[] = ['draft', 'in-review', 'final', 'live']

// Folder fills reuse each status's own hue (same mapping as the card badges), so
// a folder and the badges inside it are obviously the same thing. Tab is the 400
// tint, body the 500 — the fold reads as a lighter flap catching the light.
const STATUS_FOLDER: Record<ProjectStatus, { tab: string; body: string }> = {
  draft: { tab: 'bg-orange-400', body: 'bg-orange-500' },
  'in-review': { tab: 'bg-blue-400', body: 'bg-blue-500' },
  final: { tab: 'bg-green-400', body: 'bg-green-500' },
  live: { tab: 'bg-primary-400', body: 'bg-primary-500' },
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
  // config() only — the gallery draws cards, so pulling each project's screens
  // in here would put the whole studio's screen code on the front door.
  const configs = await Promise.all(Object.values(projectConfigs).map((load) => load()))
  const entries: GalleryEntry[] = configs.map((config) => ({ config }))
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

// Opening a folder goes *into* it — ?status=… is a place, and that page drops
// the sibling folders and offers a breadcrumb back. Folders are not filter
// chips; you are either at the top level or inside one.
function StatusFolder({ status, count }: { status: ProjectStatus; count: number }) {
  const fill = STATUS_FOLDER[status]
  return (
    <Link href={`/?status=${status}`} className="group flex flex-col rounded-12">
      {/* The tab — a short flap that makes the block below read as a folder. */}
      <span className={`h-8 w-40 rounded-t-4 ${fill.tab}`} />
      <span
        className={`flex flex-col gap-4 rounded-12 rounded-tl-none p-12 group-hover:opacity-90 ${fill.body}`}
      >
        <span className="text-12 font-regular text-neutral-white opacity-90">
          {count === 1 ? '1 prototype' : `${count} prototypes`}
        </span>
        <span className="text-16 font-bold text-neutral-white">{STATUS_LABEL[status]}</span>
      </span>
    </Link>
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

function isStatus(value: string | undefined): value is ProjectStatus {
  return value !== undefined && (STATUS_ORDER as string[]).includes(value)
}

export default async function Home({
  searchParams,
}: {
  searchParams?: { status?: string | string[] }
}) {
  const entries = await loadEntries()

  const raw = Array.isArray(searchParams?.status) ? searchParams?.status[0] : searchParams?.status
  const filter = isStatus(raw) ? raw : null

  const counts = STATUS_ORDER.map((status) => ({
    status,
    count: entries.filter((e) => e.config.status === status).length,
  }))
  const shown = filter ? entries.filter((e) => e.config.status === filter) : entries

  // Inside a folder the page IS that folder: the sibling folders go away and a
  // breadcrumb is the way back out — the mental model is a place you entered,
  // not a filter chip you toggled.
  if (filter) {
    return (
      <div className="mx-auto flex max-w-screen-lg flex-col gap-24 px-16 py-32">
        <div className="flex flex-col gap-8">
          {/* Back out of the folder. The shell's own breadcrumb is the only
              breadcrumb — this is a plain back affordance, not a second one. */}
          <Link
            href="/"
            className="flex w-fit items-center gap-4 text-14 text-caption hover:text-default dark:text-neutral-400 dark:hover:text-neutral-50"
          >
            <ChevronLeftIcon className="size-16 shrink-0" />
            Back
          </Link>
          <PageHeader
            title={STATUS_LABEL[filter]}
            subtitle={shown.length === 1 ? '1 prototype' : `${shown.length} prototypes`}
          />
        </div>

        {shown.length === 0 ? (
          <p className="text-14 text-caption dark:text-neutral-400">
            Nothing in {STATUS_LABEL[filter].toLowerCase()} yet.
          </p>
        ) : (
          <section className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((e) => (
              <ProjectCard key={e.config.slug} config={e.config} />
            ))}
          </section>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-screen-lg flex-col gap-24 px-16 py-32">
      <PageHeader title="Prototype Studio" />

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-16 sm:grid-cols-4">
            {counts.map(({ status, count }) => (
              <StatusFolder key={status} status={status} count={count} />
            ))}
          </section>

          <h2 className="text-16 font-bold text-default dark:text-neutral-50">All prototypes</h2>

          <section className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((e) => (
              <ProjectCard key={e.config.slug} config={e.config} />
            ))}
          </section>
        </>
      )}
    </div>
  )
}
