'use client'

// Pencairan — the disbursement page, reached from a Ready-for-disbursement calon
// mitra whose majelis is settled (existing, or a new one already formed). The
// content is a placeholder for now; this exists so the flow lands somewhere real.

import { Card, NavigationHeader } from '@/design-system/components'
import { Coins } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { usePipeline } from '../lib/pipeline-store'
import { AppScreen } from '../lib/ui'

export function DisbursementScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]

  return (
    <AppScreen topBar={<NavigationHeader title="Pencairan" onBack={() => flow.back()} />}>
      <Card>
        <div className="flex flex-col items-center gap-8 py-24 text-center">
          <span className="flex h-48 w-48 items-center justify-center rounded-full bg-primary-50 text-primary-500">
            <Coins size={24} />
          </span>
          <span className="text-16 font-bold text-default">Pencairan {lead?.name ?? ''}</span>
          <span className="text-12 text-caption">Halaman pencairan masih placeholder.</span>
        </div>
      </Card>
    </AppScreen>
  )
}
