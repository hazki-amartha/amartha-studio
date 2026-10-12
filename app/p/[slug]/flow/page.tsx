// Flow view route (WS-B). Thin server page that hands the slug to the
// client-side FlowCanvas, which loads the project module from the registry —
// or, for a project that lives in the database, from there (as /p/<slug>).

import { FlowCanvas } from '@/platform/flow'
import { isDbProject } from '@/platform/dbProjects/server'

export const dynamic = 'force-dynamic'

export default async function FlowPage({ params }: { params: { slug: string } }) {
  return (
    <main className="h-full">
      <FlowCanvas slug={params.slug} db={await isDbProject(params.slug)} />
    </main>
  )
}
