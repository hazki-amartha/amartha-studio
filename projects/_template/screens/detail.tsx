'use client'

// Second screen — demonstrates flow.back() and a status Badge.
// Delete or rename these template screens; add one file per real screen.

import { Badge, Button, Card, ListRow, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'

export function DetailScreen() {
  const flow = useFlow()

  return (
    <Screen topBar={<NavigationHeader title="Detail" onBack={flow.back} />}>
      <Card flush>
        <ListRow title="Amount" trailing="Rp0" />
        {/* Badge status colors follow the 500-on-50-tint rule automatically */}
        <ListRow title="Status" trailing={<Badge intent="orange">Pending</Badge>} />
      </Card>
      <Button size="lg" onClick={() => flow.back()}>
        Done
      </Button>
    </Screen>
  )
}
