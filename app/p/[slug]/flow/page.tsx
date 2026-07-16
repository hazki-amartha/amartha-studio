// Flow view route (WS-B). Thin server page that hands the slug to the
// client-side FlowCanvas, which loads the project module from the registry.

import { FlowCanvas } from '@/platform/flow'

export default function FlowPage({ params }: { params: { slug: string } }) {
  return (
    <main className="h-full">
      <FlowCanvas slug={params.slug} />
    </main>
  )
}
