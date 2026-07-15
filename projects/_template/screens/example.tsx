'use client'

// Entry screen. One file per screen. Compose ONLY from @/design-system/components
// and token-locked utility classes — no hex values, no arbitrary Tailwind values
// like p-[13px]. Read design-system/guidelines/ before building.
//
// NOTE: once platform/primitives lands (WS-A), wrap screen content in the
// <Screen> primitive per the authoring contract in PLAN.md §5. Until then,
// mirror sample-topup: a flex column on bg-neutral-50 with 16px page padding.

import { Button, Card, ListRow, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'

export function ExampleScreen() {
  const flow = useFlow() // navigation: flow.go(id), flow.back(), flow.current

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <NavigationHeader title="Example" hideBack />
      {/* px-16 = 16px page padding, gap-12 = 12px section gap (layout tokens) */}
      <div className="flex flex-col gap-12 px-16 pt-16">
        <Card flush>
          <ListRow title="A list row" description="Supporting text" trailing="Rp0" />
          <ListRow title="Open detail" chevron onClick={() => flow.go('detail')} />
        </Card>
        <Button size="lg" onClick={() => flow.go('detail')}>
          Continue
        </Button>
      </div>
    </div>
  )
}
