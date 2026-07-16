'use client'

import { Badge, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BANNERS } from '../lib/data'
import { useApp } from '../lib/store'

export function BannerDetailScreen() {
  const flow = useFlow()
  const s = useApp()
  // Falls back to the first banner so the screen still renders when opened
  // directly from the flow view rather than by tapping a Home carousel card.
  const banner = s.selBanner ?? BANNERS[0]

  return (
    <Screen topBar={<NavigationHeader title="Detail" onBack={flow.back} />}>
      <div className={`-mx-16 -mt-16 flex flex-col gap-8 p-16 ${banner.bg}`}>
        <Badge intent="neutral" variant="inverted" className="self-start">
          {banner.tag}
        </Badge>
        <div>
          <h1 className="text-20 font-bold text-neutral-white">{banner.title}</h1>
          <p className="text-12 text-neutral-white">{banner.sub}</p>
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
