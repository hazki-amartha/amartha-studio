'use client'

// Example screen. One file per screen. Compose ONLY from design-system
// components and token-locked utility classes — no hex values, no arbitrary
// Tailwind values like p-[13px].

import { Button, Card, ListRow, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'

export function ExampleScreen() {
  const flow = useFlow()

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <NavigationHeader title="Example" onBack={flow.back} />
      <div className="flex flex-col gap-12 px-16 pt-16">
        <Card flush>
          <ListRow title="A list row" description="Supporting text" trailing="Rp0" />
          <ListRow title="Navigates somewhere" chevron onClick={() => flow.go('example')} />
        </Card>
        <Button onClick={() => flow.go('example')}>Primary action</Button>
      </div>
    </div>
  )
}
