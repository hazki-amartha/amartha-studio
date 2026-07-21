// =============================================================================
// WS-A · Prototype view — /p/<slug> renders an interactive prototype.
// Server component: resolves the project from the registry (unknown slug →
// friendly 404), reads the optional ?screen=<id> deep link, and hands off to
// the client-side PrototypeView for the responsive framed/full-page rendering.
// =============================================================================

import Link from 'next/link'
import { registry } from '@/projects/registry'
import { PrototypeView } from '@/platform/frame'

interface PageProps {
  params: { slug: string }
  searchParams: { screen?: string | string[] }
}

/** Pre-render a static page per registered project. */
export function generateStaticParams() {
  return Object.keys(registry).map((slug) => ({ slug }))
}

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
  const loader = registry[params.slug]
  if (!loader) return <NotFound slug={params.slug} />

  const { config, screens } = await loader()
  const initialScreenId = firstValue(searchParams.screen)

  return (
    <PrototypeView
      // Remount when the deep-link target changes so the visit stack resets.
      key={initialScreenId ?? 'entry'}
      config={config}
      screens={screens}
      initialScreenId={initialScreenId}
    />
  )
}
