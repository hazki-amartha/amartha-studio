'use client'

// Tagih Pembayaran for one mitra at a majelis visit. The page itself is
// `CollectPanel` (lib/collect-panel.tsx), shared with the home visit's Tagih.

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { CollectPanel } from '../lib/collect-panel'
import { findMitra } from '../lib/data'
import { useApp } from '../lib/store'

export function CollectScreen() {
  const flow = useFlow()
  const s = useApp()
  const mitra = findMitra(s.openMitra)
  return (
    <Screen
      topBar={<NavigationHeader title={mitra.name} onBack={() => flow.back()} />}
      className="bg-canvas-blue"
    >
      <CollectPanel
        mitra={mitra}
        onSeeAll={() => flow.go('loans')}
        onDone={() => flow.go('collection')}
        onBack={() => flow.back()}
      />
    </Screen>
  )
}
