// WS-D · Gallery homepage — the front door.
// Reads projects/configs.ts, renders one folder per platform and one card per
// project, most-recent-first. Status is a chip filter, applied in place.
// Composed strictly from design-system components + tokens (no arbitrary values).

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

// Pipeline order — draft → in review → final → live. Fixed taxonomy: a status
// with nothing in it still shows as a chip, so the shape of the studio reads the
// same on every visit.
const STATUS_ORDER: ProjectStatus[] = ['draft', 'in-review', 'final', 'live']

// Enum value is code-friendly; the display label carries the hyphen/casing.
const PLATFORM_LABEL: Record<Platform, string> = {
  APartner: 'A-Partner',
  AFIN: 'AFIN',
  NGMIS: 'NGMIS',
}

// The folders are the products. Fixed taxonomy, same order every visit.
const PLATFORM_ORDER: Platform[] = ['AFIN', 'APartner', 'NGMIS']

// One hue per product — AFIN purple (the brand), A-Partner blue, NGMIS green —
// carried by both the folder and the card, so a card's colour tells you which
// product it belongs to before you read a word of it. Tab is the lighter tint:
// the fold reads as a flap catching the light.
const PLATFORM_COLOR: Record<
  Platform,
  { tab: string; body: string; card: string }
> = {
  AFIN: {
    tab: 'bg-primary-400',
    body: 'bg-primary-500',
    card: 'from-primary-700 to-primary-900',
  },
  APartner: {
    tab: 'bg-blue-400',
    body: 'bg-blue-500',
    card: 'from-blue-600 to-blue-800',
  },
  NGMIS: {
    tab: 'bg-green-400',
    body: 'bg-green-500',
    card: 'from-green-600 to-green-800',
  },
}

// Studio-internal work carries no platform — it gets the neutral ramp rather
// than borrowing a product's colour.
const NO_PLATFORM_CARD = 'from-neutral-700 to-neutral-900'

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
  const fill = config.platform ? PLATFORM_COLOR[config.platform].card : NO_PLATFORM_CARD
  return (
    <Card flush className="gallery-card flex flex-col dark:border-ink-700 dark:bg-ink-900">
      {/* Dark product region — eyebrow, title, description, byline. */}
      <div className={`flex flex-1 flex-col gap-12 bg-gradient-to-br ${fill} p-16`}>
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

// Opening a folder goes *into* it — ?platform=… is a place, and that page drops
// the sibling folders and offers a breadcrumb back. Folders are the products;
// status is the chip row (below), which filters wherever you happen to be.
function PlatformFolder({ platform, count }: { platform: Platform; count: number }) {
  const fill = PLATFORM_COLOR[platform]
  return (
    <Link href={`/?platform=${platform}`} className="group flex flex-col rounded-12">
      {/* The tab — a short flap that makes the block below read as a folder. */}
      <span className={`h-8 w-40 rounded-t-4 ${fill.tab}`} />
      <span
        className={`flex flex-col gap-4 rounded-12 rounded-tl-none p-12 group-hover:opacity-90 ${fill.body}`}
      >
        <span className="text-12 font-regular text-neutral-white opacity-90">
          {count === 1 ? '1 prototype' : `${count} prototypes`}
        </span>
        <span className="text-16 font-bold text-neutral-white">{PLATFORM_LABEL[platform]}</span>
      </span>
    </Link>
  )
}

// Status is a filter, not a destination: the chips toggle the grid in place and
// keep whatever folder you are standing in. Pill shape, per the button rule.
function StatusChips({
  platform,
  active,
  counts,
}: {
  platform: Platform | null
  active: ProjectStatus | null
  counts: Record<ProjectStatus, number>
}) {
  const href = (status: ProjectStatus | null) => {
    const params = [
      platform ? `platform=${platform}` : null,
      status ? `status=${status}` : null,
    ].filter(Boolean)
    return params.length === 0 ? '/' : `/?${params.join('&')}`
  }
  const chip = (selected: boolean) =>
    selected
      ? 'rounded-full border border-primary-500 bg-primary-500 px-12 py-4 text-12 font-bold text-neutral-white'
      : 'rounded-full border border-default bg-neutral-white px-12 py-4 text-12 font-regular text-caption hover:border-primary-500 hover:text-link dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-400 dark:hover:text-neutral-50'

  return (
    <div className="flex flex-wrap items-center gap-8">
      <Link href={href(null)} className={chip(active === null)}>
        All
      </Link>
      {STATUS_ORDER.map((status) => (
        <Link key={status} href={href(status)} className={chip(active === status)}>
          {STATUS_LABEL[status]} · {counts[status]}
        </Link>
      ))}
    </div>
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

function isPlatform(value: string | undefined): value is Platform {
  return value !== undefined && (PLATFORM_ORDER as string[]).includes(value)
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function Home({
  searchParams,
}: {
  searchParams?: { status?: string | string[]; platform?: string | string[] }
}) {
  const entries = await loadEntries()

  const rawStatus = first(searchParams?.status)
  const rawPlatform = first(searchParams?.platform)
  const status = isStatus(rawStatus) ? rawStatus : null
  const platform = isPlatform(rawPlatform) ? rawPlatform : null

  // The chips count within the folder you are standing in, so a chip never
  // promises rows the grid below it cannot show.
  const inFolder = platform ? entries.filter((e) => e.config.platform === platform) : entries
  const statusCounts = Object.fromEntries(
    STATUS_ORDER.map((s) => [s, inFolder.filter((e) => e.config.status === s).length]),
  ) as Record<ProjectStatus, number>
  const shown = status ? inFolder.filter((e) => e.config.status === status) : inFolder

  const grid =
    shown.length === 0 ? (
      <p className="text-14 text-caption dark:text-neutral-400">
        {status ? `Nothing in ${STATUS_LABEL[status].toLowerCase()} here yet.` : 'Nothing here yet.'}
      </p>
    ) : (
      <section className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((e) => (
          <ProjectCard key={e.config.slug} config={e.config} />
        ))}
      </section>
    )

  // Inside a folder the page IS that product: the sibling folders go away and a
  // breadcrumb is the way back out — the mental model is a place you entered.
  // The status chips come with you, because a filter is not a place.
  if (platform) {
    return (
      <div className="mx-auto flex max-w-screen-lg flex-col gap-24 px-16 py-32">
        <div className="flex flex-col gap-8">
          {/* Back out of the folder. The shell's own breadcrumb is the only
              breadcrumb — this is a plain back affordance, not a second one. */}
          {/* Hover underlines rather than darkens: a hover colour would need a
              light and a dark value, and the two rules land at equal weight —
              whichever Tailwind emits last wins, which in dark mode meant black
              text on a black canvas. Underline needs no second colour. */}
          <Link
            href="/"
            className="flex w-fit items-center gap-4 text-14 text-caption hover:underline dark:text-neutral-400"
          >
            <ChevronLeftIcon className="size-16 shrink-0" />
            Back
          </Link>
          <PageHeader
            title={PLATFORM_LABEL[platform]}
            subtitle={shown.length === 1 ? '1 prototype' : `${shown.length} prototypes`}
          />
        </div>

        <StatusChips platform={platform} active={status} counts={statusCounts} />
        {grid}
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
          <section className="grid grid-cols-2 gap-16 sm:grid-cols-3">
            {PLATFORM_ORDER.map((p) => (
              <PlatformFolder
                key={p}
                platform={p}
                count={entries.filter((e) => e.config.platform === p).length}
              />
            ))}
          </section>

          <div className="flex flex-col gap-12">
            <h2 className="text-16 font-bold text-default dark:text-neutral-50">All prototypes</h2>
            <StatusChips platform={null} active={status} counts={statusCounts} />
          </div>

          {grid}
        </>
      )}
    </div>
  )
}
