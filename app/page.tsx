// WS-D · Gallery homepage — the front door.
// Reads projects/configs.ts, renders one folder per business unit and one card
// per project, most-recent-first. Platform and status are chip filters, applied
// in place. Composed strictly from design-system components + tokens (no
// arbitrary values).

import Link from 'next/link'
// Import Badge + Card directly (and their CSS) rather than via the barrel:
// the barrel re-exports client-only components (Modal, BottomSheet) that cannot
// load inside this async Server Component.
import '@/design-system/components/styles.css'
import { Badge, type BadgeIntent } from '@/design-system/components/Badge'
import { Card } from '@/design-system/components/Card'
import { PageHeader } from '@/platform/chrome'
import { ChevronLeftIcon } from '@/platform/chrome/icons'
import type { BusinessUnit, Platform, ProjectConfig, ProjectStatus } from '@/platform/types'
import { configs as projectConfigs } from '@/projects/configs'

// draft = blue, in-review = green, final = green (Badge subtle = 500-on-50 rule).
// live = primary purple: it is not another shade of "done", it is the shipped
// product, so it reads in the brand colour rather than on the draft→final ramp.
const STATUS_INTENT: Record<ProjectStatus, BadgeIntent> = {
  draft: 'blue',
  'in-review': 'green',
  final: 'green',
  live: 'primary',
}

const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: 'Draft',
  'in-review': 'In review',
  final: 'Final',
  live: 'Live',
}

// Pipeline order — draft → in review → final → live. Order is fixed; which of
// them get drawn is not (see `visible` below).
const STATUS_ORDER: ProjectStatus[] = ['draft', 'in-review', 'final', 'live']

// Enum value is code-friendly; the display label carries the hyphen/casing.
const PLATFORM_LABEL: Record<Platform, string> = {
  APartner: 'A-Partner',
  AFIN: 'AFIN',
  NGMIS: 'NGMIS',
}

// Platform is a filter now, not a folder — display order only.
const PLATFORM_ORDER: Platform[] = ['AFIN', 'APartner', 'NGMIS']

const BU_LABEL: Record<BusinessUnit, string> = {
  Lending: 'Lending',
  Funding: 'Funding',
  Core: 'Core',
  Payments: 'Payments',
}

// The folders are the business units. Fixed taxonomy, same order every visit —
// an empty BU still shows a folder, so the org's shape reads the same each time.
const BU_ORDER: BusinessUnit[] = ['Lending', 'Funding', 'Core', 'Payments']

// One hue per business unit — Lending purple (the brand, and the bulk of the
// work), Funding blue, Core orange, Payments green — carried by both the folder
// and the card, so a card's colour tells you which BU it belongs to before you
// read a word of it. Tab is the lighter tint: the fold reads as a flap catching
// the light.
const BU_COLOR: Record<BusinessUnit, { tab: string; body: string; card: string }> = {
  Lending: {
    tab: 'bg-primary-400',
    body: 'bg-primary-500',
    card: 'from-primary-700 to-primary-900',
  },
  Funding: {
    tab: 'bg-blue-400',
    body: 'bg-blue-500',
    card: 'from-blue-600 to-blue-800',
  },
  Core: {
    tab: 'bg-orange-400',
    body: 'bg-orange-500',
    card: 'from-orange-600 to-orange-800',
  },
  Payments: {
    tab: 'bg-green-400',
    body: 'bg-green-500',
    card: 'from-green-600 to-green-800',
  },
}

// Studio-internal work carries no business unit — it gets the neutral ramp
// rather than borrowing a BU's colour.
const NO_BU_CARD = 'from-neutral-700 to-neutral-900'

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

// The whole card is the link — it opens the prototype. Flow view stays
// reachable via the prototype/flow switch inside the project view.
//
// Two bands. The coloured one carries what the prototype IS: where it sits
// (business unit left, platform right — quiet uppercase labels, not tags, so
// they read as a location line rather than as things to press on a card that is
// itself one big button), then the name and the caption. The dark band under it
// carries the bookkeeping — who and when, and the status badge. Splitting them
// means the eye can skip the footer entirely when scanning the grid for a
// prototype, and go straight to it when scanning for what changed recently.
function ProjectCard({ config }: GalleryEntry) {
  const owners = Array.isArray(config.owner) ? config.owner.join(', ') : config.owner
  const fill = config.businessUnit ? BU_COLOR[config.businessUnit].card : NO_BU_CARD
  return (
    <Link href={`/p/${config.slug}`} className="group flex rounded-16">
      <Card flush className="gallery-card flex flex-1 flex-col group-hover:opacity-90 dark:border-ink-700 dark:bg-ink-900">
        <div className={`flex flex-1 flex-col gap-12 bg-gradient-to-br ${fill} p-16`}>
          {/* When only one of the two is set the other still renders, empty:
              with two children, justify-between keeps the platform hard right
              whether or not a BU precedes it. Studio-internal work has neither,
              and drops the row rather than leaving a gap where it was. */}
          {(config.businessUnit || config.platform) && (
            <div className="flex items-start justify-between gap-8">
              <span className="text-12 font-regular uppercase text-neutral-400">
                {config.businessUnit ? BU_LABEL[config.businessUnit] : ''}
              </span>
              <span className="text-12 font-regular uppercase text-neutral-400">
                {config.platform ? PLATFORM_LABEL[config.platform] : ''}
              </span>
            </div>
          )}
          <h2 className="text-20 font-bold text-neutral-white">{config.name}</h2>
          <p className="line-clamp-3 flex-1 text-14 text-neutral-white">{config.description}</p>
        </div>
        {/* Footer band. ink-900 is the studio's own chrome surface, so the
            bookkeeping reads as the studio talking, not as part of the product
            colour above it — and it stays put when the theme flips. */}
        <div className="flex items-center justify-between gap-8 bg-ink-900 px-16 py-12">
          <p className="truncate text-12 text-neutral-400">
            {owners} · {formatDate(lastModified(config))}
          </p>
          <Badge className="shrink-0" intent={STATUS_INTENT[config.status]}>
            {STATUS_LABEL[config.status]}
          </Badge>
        </div>
      </Card>
    </Link>
  )
}

// Opening a folder goes *into* it — ?bu=… is a place, and that page drops the
// sibling folders and offers a breadcrumb back. Folders are the business units;
// platform and status are the chip rows (below), which filter wherever you
// happen to be.
function BusinessUnitFolder({ bu, count }: { bu: BusinessUnit; count: number }) {
  const fill = BU_COLOR[bu]
  return (
    <Link href={`/?bu=${bu}`} className="group flex flex-col rounded-12">
      {/* The tab — a short flap that makes the block below read as a folder. */}
      <span className={`h-8 w-40 rounded-t-4 ${fill.tab}`} />
      <span
        className={`flex flex-col gap-4 rounded-12 rounded-tl-none p-12 group-hover:opacity-90 ${fill.body}`}
      >
        <span className="text-12 font-regular text-neutral-white opacity-90">
          {count === 1 ? '1 prototype' : `${count} prototypes`}
        </span>
        <span className="text-16 font-bold text-neutral-white">{BU_LABEL[bu]}</span>
      </span>
    </Link>
  )
}

const chipClass = (selected: boolean) =>
  selected
    ? 'rounded-full border border-primary-500 bg-primary-500 px-12 py-4 text-12 font-bold text-neutral-white'
    : 'rounded-full border border-default bg-neutral-white px-12 py-4 text-12 font-regular text-caption hover:border-primary-500 hover:text-link dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-400 dark:hover:text-neutral-50'

// A chip is only drawn when it would return something. Platform is the reason:
// most business units ship one or two products, so a fixed row would offer
// A-Partner inside Payments and land you on an empty grid. Counting first and
// hiding the zeroes means a chip row describes the folder you are actually in
// rather than the studio in the abstract — and it saves teaching each BU which
// platforms it owns. The active chip survives at zero, otherwise selecting one
// would erase the control you selected it with.
function visible<T extends string>(
  order: T[],
  counts: Record<T, number>,
  active: T | null,
): T[] {
  return order.filter((value) => counts[value] > 0 || value === active)
}

// Platform and status are filters, not destinations: the chips toggle the grid
// in place and keep whatever folder you are standing in. Two rows, one per axis,
// each labelled — a merged row would hide that they combine rather than replace
// each other. Pill shape, per the button rule.
function FilterChips({
  bu,
  platform,
  status,
  platformCounts,
  statusCounts,
}: {
  bu: BusinessUnit | null
  platform: Platform | null
  status: ProjectStatus | null
  platformCounts: Record<Platform, number>
  statusCounts: Record<ProjectStatus, number>
}) {
  const href = (next: { platform?: Platform | null; status?: ProjectStatus | null }) => {
    const nextPlatform = next.platform !== undefined ? next.platform : platform
    const nextStatus = next.status !== undefined ? next.status : status
    const params = [
      bu ? `bu=${bu}` : null,
      nextPlatform ? `platform=${nextPlatform}` : null,
      nextStatus ? `status=${nextStatus}` : null,
    ].filter(Boolean)
    return params.length === 0 ? '/' : `/?${params.join('&')}`
  }

  const platforms = visible(PLATFORM_ORDER, platformCounts, platform)
  const statuses = visible(STATUS_ORDER, statusCounts, status)

  return (
    <div className="flex flex-col gap-16">
      {/* A single remaining option is not a choice — the row goes away with it. */}
      {platforms.length > 1 && (
        <div className="flex flex-col gap-8">
          <p className="text-10 font-bold uppercase text-caption dark:text-neutral-400">Platform</p>
          <div className="flex flex-wrap items-center gap-8">
            <Link href={href({ platform: null })} className={chipClass(platform === null)}>
              All
            </Link>
            {platforms.map((p) => (
              <Link key={p} href={href({ platform: p })} className={chipClass(platform === p)}>
                {PLATFORM_LABEL[p]} · {platformCounts[p]}
              </Link>
            ))}
          </div>
        </div>
      )}
      {statuses.length > 1 && (
        <div className="flex flex-col gap-8">
          <p className="text-10 font-bold uppercase text-caption dark:text-neutral-400">Status</p>
          <div className="flex flex-wrap items-center gap-8">
            <Link href={href({ status: null })} className={chipClass(status === null)}>
              All
            </Link>
            {statuses.map((s) => (
              <Link key={s} href={href({ status: s })} className={chipClass(status === s)}>
                {STATUS_LABEL[s]} · {statusCounts[s]}
              </Link>
            ))}
          </div>
        </div>
      )}
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

function isBusinessUnit(value: string | undefined): value is BusinessUnit {
  return value !== undefined && (BU_ORDER as string[]).includes(value)
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function Home({
  searchParams,
}: {
  searchParams?: {
    status?: string | string[]
    platform?: string | string[]
    bu?: string | string[]
  }
}) {
  const entries = await loadEntries()

  const rawStatus = first(searchParams?.status)
  const rawPlatform = first(searchParams?.platform)
  const rawBu = first(searchParams?.bu)
  const status = isStatus(rawStatus) ? rawStatus : null
  const platform = isPlatform(rawPlatform) ? rawPlatform : null
  const bu = isBusinessUnit(rawBu) ? rawBu : null

  // The chips count within the folder you are standing in, so a chip never
  // promises rows the grid below it cannot show. Each axis counts against the
  // *other* axis's active filter, so the two rows stay honest when combined.
  const inFolder = bu ? entries.filter((e) => e.config.businessUnit === bu) : entries
  const platformCounts = Object.fromEntries(
    PLATFORM_ORDER.map((p) => [
      p,
      inFolder.filter((e) => e.config.platform === p && (!status || e.config.status === status))
        .length,
    ]),
  ) as Record<Platform, number>
  const statusCounts = Object.fromEntries(
    STATUS_ORDER.map((s) => [
      s,
      inFolder.filter((e) => e.config.status === s && (!platform || e.config.platform === platform))
        .length,
    ]),
  ) as Record<ProjectStatus, number>
  const shown = inFolder.filter(
    (e) =>
      (!platform || e.config.platform === platform) && (!status || e.config.status === status),
  )

  const grid =
    shown.length === 0 ? (
      <p className="text-14 text-caption dark:text-neutral-400">Nothing matches that filter yet.</p>
    ) : (
      <section className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((e) => (
          <ProjectCard key={e.config.slug} config={e.config} />
        ))}
      </section>
    )

  const chips = (
    <FilterChips
      bu={bu}
      platform={platform}
      status={status}
      platformCounts={platformCounts}
      statusCounts={statusCounts}
    />
  )

  // Inside a folder the page IS that business unit: the sibling folders go away
  // and a breadcrumb is the way back out — the mental model is a place you
  // entered. The chips come with you, because a filter is not a place.
  if (bu) {
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
            title={BU_LABEL[bu]}
            subtitle={shown.length === 1 ? '1 prototype' : `${shown.length} prototypes`}
          />
        </div>

        {chips}
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
          <section className="grid grid-cols-2 gap-16 sm:grid-cols-4">
            {BU_ORDER.map((b) => (
              <BusinessUnitFolder
                key={b}
                bu={b}
                count={entries.filter((e) => e.config.businessUnit === b).length}
              />
            ))}
          </section>

          <div className="flex flex-col gap-12">
            <h2 className="text-16 font-bold text-default dark:text-neutral-50">All prototypes</h2>
            {chips}
          </div>

          {grid}
        </>
      )}
    </div>
  )
}
