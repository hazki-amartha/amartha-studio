'use client'

// Home visit, step 2 of 3 — Tagih. Per the BP APP 2026 Figma it is the same
// page as a majelis Tagih — the payment history, the bill, the janji bayar, and
// "Berapa uang tunai yang dibayar?" — so it IS the same page: `CollectPanel`,
// under the home visit's own top bar and stage bar.

import { useState } from 'react'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { CollectPanel } from '../lib/collect-panel'
import { HomeReschedule, HomeTopBar, homeTaskState } from '../lib/home-visit-ui'
import { DAYS } from '../lib/schedule'
import { openHomeMitra, store, useApp } from '../lib/store'
import { HOME_STAGE_LABELS, StageBar } from '../lib/ui'

export function HomeVisitScreen() {
  const flow = useFlow()
  const s = useApp()
  const mitra = openHomeMitra(s)
  const [rescheduling, setRescheduling] = useState(false)
  const { done, sent } = homeTaskState(s)

  return (
    <Screen className="bg-canvas-blue" topBar={<HomeTopBar onReschedule={() => setRescheduling(true)} />}>
      <CollectPanel
        mitra={mitra}
        header={<StageBar current={2} labels={HOME_STAGE_LABELS} complete={done} />}
        locked={sent}
        janjiDate={DAYS[0].date}
        onSeeAll={() => {
          store.openMitraPage(mitra.id)
          flow.go('loans')
        }}
        onDone={() => flow.go('home-proof')}
        onBack={() => flow.back()}
      />
      <HomeReschedule open={rescheduling} onClose={() => setRescheduling(false)} />
    </Screen>
  )
}
