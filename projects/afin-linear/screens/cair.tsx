'use client'

// Taking the extra disbursement: one confirm, one result.

import { useState } from 'react'
import { Button, Card, ListRow, NavigationHeader } from '@/design-system/components'
import { CheckCircleFill } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BONUS, MAJELIS_NAME, STRETCH, readyMilestone, rupiah, short } from '../lib/data'
import { store } from '../lib/store'

export function CairScreen() {
  const flow = useFlow()
  // Read once: taking it clears the "ready" flag this screen was opened for.
  const [index] = useState(() => readyMilestone(store.get()))
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <Screen topBar={<NavigationHeader title="Cair tambahan" hideBack />}>
        <Card>
          <div className="flex flex-col items-center py-24 text-center">
            <CheckCircleFill size={24} className="text-green-500" />
            <p className="mt-12 text-20 font-bold text-default">{short(BONUS)} masuk ke Poket</p>
            <p className="mt-4 text-14 text-caption">Tambahan ke-{index} dari {MAJELIS_NAME}</p>
          </div>
        </Card>
        <Button size="lg" onClick={() => flow.back()}>
          Kembali ke Beranda
        </Button>
      </Screen>
    )
  }

  if (index === null) {
    return (
      <Screen topBar={<NavigationHeader title="Cair tambahan" onBack={flow.back} />}>
        <Card>
          <p className="text-14 text-caption">Belum ada tambahan yang siap dicairkan.</p>
        </Card>
      </Screen>
    )
  }

  return (
    <Screen topBar={<NavigationHeader title="Cair tambahan" onBack={flow.back} />}>
      <Card>
        <p className="text-12 text-caption">Jumlah dicairkan</p>
        <p className="mt-4 text-20 font-bold text-default">{rupiah(BONUS)}</p>
      </Card>

      <Card flush>
        <ListRow title="Tambahan" trailing={`Ke-${index}`} />
        <ListRow title="Dari" trailing={`${MAJELIS_NAME}, ${STRETCH} minggu lancar`} />
        <ListRow title="Masuk ke" trailing="Poket" />
      </Card>

      <Button
        size="lg"
        onClick={() => {
          store.cairkan(index)
          setDone(true)
        }}
      >
        Cairkan {short(BONUS)}
      </Button>
    </Screen>
  )
}
