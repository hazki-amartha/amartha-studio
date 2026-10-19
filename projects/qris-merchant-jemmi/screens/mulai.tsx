'use client'

// Placeholder entry — replace it with the flow's first screen.
import { Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'

export function MulaiScreen() {
  const flow = useFlow()
  return (
    <Screen topBar={<NavigationHeader title="QRIS Bisnis" hideBack />}>
      <Card>
        <p className="text-14 text-default">Project lokal ini siap diisi. Kirim prompt pertama di Chat.</p>
      </Card>
      <Button size="lg" variant="secondary" onClick={() => flow.go('home')}>
        Buka Homepage AmarthaFin
      </Button>
    </Screen>
  )
}
