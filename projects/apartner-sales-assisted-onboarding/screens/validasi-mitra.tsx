'use client'

// Validasi Mitra — step 1 of 4: the underwriting state. A soft reject isn't a
// final no, so this screen says exactly that before anything else: which
// mitra, what the system flagged, and why it's worth the BM's own look. Only
// after reading this does "Lihat Data Underwriting" make sense as the next
// step. The BP's own field read gets its own step (3) rather than a line
// here — see validasi-bp-feedback.tsx.

import { Badge, Button, Card, NavigationHeader } from '@/design-system/components'
import { WarningFill } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { VALIDASI_STEP_SCREENS, VALIDASI_STEPS } from '../lib/validasi'
import { useOpenCase } from '../lib/validasi-store'
import { AppScreen, StageBar, StickyBar } from '../lib/ui'

export function ValidasiMitraScreen() {
  const flow = useFlow()
  const c = useOpenCase()

  return (
    <AppScreen topBar={<NavigationHeader title="Validasi Mitra" onBack={() => flow.go('tugas')} />}>
      <StageBar
        current={1}
        labels={VALIDASI_STEPS}
        onStepClick={(step) => flow.go(VALIDASI_STEP_SCREENS[step - 1])}
      />

      <Card>
        <div className="flex flex-col gap-4">
          <span className="text-16 font-bold text-default">{c.name}</span>
          <span className="text-12 text-caption">
            {c.majelisName} · {c.product} · {c.amount}
          </span>
          <span className="flex pt-4">
            <Badge intent="orange">Soft Reject</Badge>
          </span>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-12">
          <div className="flex items-center gap-8">
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <WarningFill size={20} />
            </span>
            <span className="text-14 font-bold text-default">Status underwriting: Soft Reject</span>
          </div>

          <div className="flex flex-col gap-4 rounded-r-8 border-l-2 border-orange-500 bg-orange-50 p-8">
            <span className="text-12 font-bold text-orange-500">Alasan sistem</span>
            <span className="text-12 text-default">{c.reason}</span>
          </div>

          <span className="text-12 text-caption">
            Sebagai BM, Anda bisa meninjau data lengkap pengajuannya dan membantu memberi
            keputusan berdasarkan kondisi lapangan yang Anda selidiki.
          </span>
        </div>
      </Card>

      <StickyBar>
        <Button size="lg" className="w-full" onClick={() => flow.go('validasi-data')}>
          Lihat Data Underwriting
        </Button>
      </StickyBar>
    </AppScreen>
  )
}
