'use client'

import { Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { TAG_BG } from '../lib/data'
import { selectedComm, useApp } from '../lib/store'
import { BannerTag } from '../lib/ui'

export function BannerDetailScreen() {
  const flow = useFlow()
  const s = useApp()
  // Falls back to the first comm so the screen still renders when opened
  // directly from the flow view rather than by tapping a Home carousel card.
  const comm = selectedComm(s)

  return (
    <Screen topBar={<NavigationHeader title="Detail" onBack={flow.back} />}>
      <div className={`-mx-16 -mt-16 flex flex-col gap-8 p-16 ${TAG_BG[comm.tag]}`}>
        <BannerTag>{comm.tag}</BannerTag>
        <div>
          <h1 className="text-20 font-bold text-neutral-white">{comm.title}</h1>
          <p className="text-12 text-neutral-white">{comm.sub}</p>
        </div>
      </div>

      <Card className="border-dashed text-center">
        <p className="text-14 font-bold text-default">Halaman tujuan banner</p>
        <p className="mt-8 text-12 text-caption">
          Setiap banner membuka halamannya sendiri. Isi halaman ini menyusul.
        </p>
      </Card>
    </Screen>
  )
}
