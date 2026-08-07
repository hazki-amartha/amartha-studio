'use client'

import { Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'

export function HomeScreen() {
  return (
    <Screen topBar={<NavigationHeader title="Hello World" hideBack />}>
      <div className="flex flex-1 flex-col items-center justify-center gap-16 text-center">
        <Card className="flex w-full flex-col items-center gap-8 py-32">
          <span className="text-24 font-bold text-default">Hello World</span>
          <p className="text-14 text-caption">Built with the Amartha Studio design system.</p>
        </Card>
      </div>
    </Screen>
  )
}
