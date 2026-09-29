// =============================================================================
// /db/<slug> — a prototype whose source lives in the database (proof of
// concept; platform/dbProjects). Same view as /p/<slug>, same deep links
// (?screen=<id>, ?full=1), but no registry entry and no deploy: a save shows
// up on every open copy of this link within seconds.
// =============================================================================

import { DbPrototype } from '@/platform/dbProjects/DbPrototype'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { slug: string }
  searchParams: { screen?: string | string[]; full?: string | string[] }
}

function firstValue(v?: string | string[]): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export default function DbPrototypePage({ params, searchParams }: PageProps) {
  const full = firstValue(searchParams.full)
  return (
    <DbPrototype
      slug={params.slug}
      initialScreenId={firstValue(searchParams.screen)}
      initialBare={full !== undefined && full !== '0'}
    />
  )
}
