// Flow view route (WS-B). Thin server page that hands the slug to the
// client-side FlowCanvas, which loads the project module from the registry —
// or, for a project that lives in the database, from there (as /p/<slug>).
// Share sits at the top bar's end here too, as on the prototype.

import { FlowCanvas } from '@/platform/flow'
import { getStudioUser } from '@/platform/auth/server'
import { maySee } from '@/platform/dbProjects/branchAccess'
import { PrivateBranch } from '@/platform/dbProjects/PrivateBranch'
import { isDbProject } from '@/platform/dbProjects/server'
import { TopBarContent } from '@/platform/chrome/ShellPortal'
import { ShareButton } from '@/platform/share/ShareButton'

export const dynamic = 'force-dynamic'

export default async function FlowPage({ params }: { params: { slug: string } }) {
  const db = await isDbProject(params.slug)
  if (db && !(await maySee(params.slug, await getStudioUser(), { shared: true }))) return <PrivateBranch />
  return (
    <main className="h-full">
      <TopBarContent>
        <ShareButton slug={params.slug} icon />
      </TopBarContent>
      <FlowCanvas slug={params.slug} db={db} />
    </main>
  )
}
