'use client'

import { Badge, Button, Card, ListRow, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'

export function ConfirmScreen() {
  const flow = useFlow()

  return (
    <Screen topBar={<NavigationHeader title="Confirm Top Up" onBack={flow.back} />}>
      <Card flush>
        <ListRow title="Nominal" trailing="Rp100.000" />
        <ListRow title="Metode" description="Poket balance" trailing="Poket" />
        <ListRow title="Status" trailing={<Badge intent="orange">Pending</Badge>} />
      </Card>
      <Button size="lg" onClick={() => flow.back()}>
        Confirm
      </Button>
    </Screen>
  )
}
