'use client'

// Second screen — demonstrates flow.back() and a status Badge.
// Delete or rename these template screens; add one file per real screen.

import { Badge, Button, Card, ListRow, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'

export function DetailScreen() {
  const flow = useFlow()

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <NavigationHeader title="Detail" onBack={flow.back} />
      <div className="flex flex-col gap-12 px-16 pt-16">
        <Card flush>
          <ListRow title="Amount" trailing="Rp0" />
          {/* Badge status colors follow the 500-on-50-tint rule automatically */}
          <ListRow title="Status" trailing={<Badge intent="orange">Pending</Badge>} />
        </Card>
        <Button size="lg" onClick={() => flow.back()}>
          Done
        </Button>
      </div>
    </div>
  )
}
