'use client'

import { Badge, Button, Card, ListRow, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'

export function ConfirmScreen() {
  const flow = useFlow()

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <NavigationHeader title="Confirm Top Up" onBack={flow.back} />
      <div className="flex flex-col gap-12 px-16 pt-16">
        <Card flush>
          <ListRow title="Nominal" trailing="Rp100.000" />
          <ListRow title="Metode" description="Poket balance" trailing="Poket" />
          <ListRow title="Status" trailing={<Badge intent="orange">Pending</Badge>} />
        </Card>
        <Button size="lg" onClick={() => flow.back()}>
          Confirm
        </Button>
      </div>
    </div>
  )
}
