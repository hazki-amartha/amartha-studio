// =============================================================================
// WS-A · Prototype view — /p/<slug> renders an interactive prototype.
// Server component: resolves the project from the registry (unknown slug →
// friendly 404), reads the optional ?screen=<id> deep link, and hands off to
// the client-side PrototypeView for the responsive framed/full-page rendering.
//
// A project that lives in the database (platform/dbProjects) is served from
// there — checked first, so a project moved out of git keeps its address and a
// new one exists the moment it's created. That check is why this page renders
// per request rather than being prebuilt per registered slug.
// =============================================================================

import Link from 'next/link'
import { configs } from '@/projects/configs'
import { PrototypeView } from '@/platform/frame'
import { DbPrototype } from '@/platform/dbProjects/DbPrototype'
import { findProjectConfig, isDbProject, viewerName } from '@/platform/dbProjects/server'
import { currentDeleter, owns } from '@/platform/dbProjects/trash'
import { daysLeft } from '@/platform/dbProjects/trashMeta'
import { RestoreButton } from '@/platform/projects/ProjectMenu'
import { noteOpened } from '@/platform/dbProjects/opened'
import { getStudioUser } from '@/platform/auth/server'

interface PageProps {
  params: { slug: string }
  searchParams: { screen?: string | string[]; full?: string | string[] }
}

export const dynamic = 'force-dynamic'

function firstValue(v?: string | string[]): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

function NotFound({ slug }: { slug: string }) {
  return (
    <main className="mx-auto flex min-h-full max-w-screen-sm flex-col items-center justify-center gap-16 bg-neutral-50 px-16 text-center dark:bg-ink-950">
      <span className="text-10 font-bold uppercase text-caption dark:text-neutral-400">404 — Prototype not found</span>
      <h1 className="text-24 font-bold text-default dark:text-neutral-50">No project named “{slug}”</h1>
      <p className="text-14 text-caption dark:text-neutral-400">
        This slug isn’t in the registry. Check the link, or head back to the gallery to see what’s
        available.
      </p>
      <Link
        href="/"
        className="rounded-full bg-primary-500 px-20 py-12 text-14 font-bold text-neutral-white"
      >
        Back to gallery
      </Link>
    </main>
  )
}

// A deleted project's link says so, rather than a 404 that looks like a typo —
// and its owner (or an admin) can bring it back from here. A branch that went
// with its project is restored by restoring the project.
async function Deleted({ slug, name, deletedAt, deletedBy, withProject }: {
  slug: string
  name: string
  deletedAt: string
  deletedBy: string | null
  withProject?: string
}) {
  const target = withProject ?? slug
  const owner = (await findProjectConfig(target))?.config
  const who = await currentDeleter()
  const canRestore = Boolean(who && owner && owns(who, owner))
  const left = daysLeft(deletedAt)
  return (
    <main className="mx-auto flex min-h-full max-w-screen-sm flex-col items-center justify-center gap-16 bg-neutral-50 px-16 text-center dark:bg-ink-950">
      <span className="text-10 font-bold uppercase text-caption dark:text-neutral-400">Deleted</span>
      <h1 className="text-24 font-bold text-default dark:text-neutral-50">{name} was deleted</h1>
      <p className="text-14 text-caption dark:text-neutral-400">
        {withProject ? `It went with ${owner?.name ?? withProject}. ` : ''}
        {deletedBy ? `${deletedBy} deleted it` : 'It was deleted'} — it can be restored for{' '}
        {left === 1 ? '1 more day' : `${left} more days`}
        {canRestore ? '.' : ' by its owner or a studio admin.'}
      </p>
      <div className="flex items-start gap-8">
        <Link href="/" className="rounded-full bg-primary-500 px-20 py-12 text-14 font-bold text-neutral-white">
          Back to gallery
        </Link>
        {canRestore ? <RestoreButton slug={target} then={`/p/${slug}`} /> : null}
      </div>
    </main>
  )
}

export default async function PrototypePage({ params, searchParams }: PageProps) {
  const initialScreenId = firstValue(searchParams.screen)
  // ?full=1 — open straight into bare presentation. Presence is enough; only an
  // explicit "0" turns it back off, so ?full also works.
  const initialBare = firstValue(searchParams.full) !== undefined
    && firstValue(searchParams.full) !== '0'

  if (await isDbProject(params.slug)) {
    const deleted = (await findProjectConfig(params.slug))?.config
    if (deleted?.deleted) return <Deleted slug={params.slug} name={deleted.name} {...deleted.deleted} />
    noteOpened(params.slug, true)
    const viewer = viewerName((await getStudioUser())?.displayName)
    return (
      <DbPrototype slug={params.slug} viewer={viewer} initialScreenId={initialScreenId} initialBare={initialBare} />
    )
  }

  const loader = configs[params.slug]
  if (!loader) return <NotFound slug={params.slug} />
  noteOpened(params.slug, false)

  // Only the config crosses the server boundary. The screen list stays on the
  // client (PrototypeView loads it from the same registry entry): its
  // components are lazyScreen() handles, which are not serialisable — and
  // sending them would defeat the point by pulling every screen into the
  // server render of the route.
  const config = await loader()

  return (
    <PrototypeView
      // Remount when the deep-link target changes so the visit stack resets.
      key={initialScreenId ?? 'entry'}
      config={config}
      initialScreenId={initialScreenId}
      initialBare={initialBare}
    />
  )
}
