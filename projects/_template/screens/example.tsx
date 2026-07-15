'use client'

// Entry screen. One file per screen. Compose ONLY from @/design-system/components
// and token-locked utility classes — no hex values, no arbitrary Tailwind values
// like p-[13px]. Read design-system/guidelines/ before building.
//
// Wrap screen content in the <Screen> primitive per the authoring contract in
// PLAN.md §5: pass the top bar via topBar, and Screen applies the neutral-50
// canvas, 16px page padding, and 12px section gap for you.

import { Button, Card, ListRow, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'

export function ExampleScreen() {
  const flow = useFlow() // navigation: flow.go(id), flow.back(), flow.current

  return (
    <Screen topBar={<NavigationHeader title="Example" hideBack />}>
      <Card flush>
        <ListRow title="A list row" description="Supporting text" trailing="Rp0" />
        <ListRow title="Open detail" chevron onClick={() => flow.go('detail')} />
      </Card>
      <Button size="lg" onClick={() => flow.go('detail')}>
        Continue
      </Button>
    </Screen>
  )
}
