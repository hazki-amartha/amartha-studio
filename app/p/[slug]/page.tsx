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
import { isDbProject, viewerName } from '@/platform/dbProjects/server'
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

export default async function PrototypePage({ params, searchParams }: PageProps) {
  const initialScreenId = firstValue(searchParams.screen)
  // ?full=1 — open straight into bare presentation. Presence is enough; only an
  // explicit "0" turns it back off, so ?full also works.
  const initialBare = firstValue(searchParams.full) !== undefined
    && firstValue(searchParams.full) !== '0'

  if (await isDbProject(params.slug)) {
    const viewer = viewerName((await getStudioUser())?.displayName)
    return (
      <DbPrototype slug={params.slug} viewer={viewer} initialScreenId={initialScreenId} initialBare={initialBare} />
    )
  }

  const loader = configs[params.slug]
  if (!loader) return <NotFound slug={params.slug} />

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
