'use client'

// Survey started (self-service) — the confirmation after the BP invites a calon
// mitra to fill her survey in herself on AFin. It states what happens next: she
// sits on the Leads list under "Survey ongoing", submits the AFin form in her own
// time, and the BP can take the application over if she stalls. A click-through
// end state, not an integration — the invite doesn't leave the prototype.

import { Button, Card, NavigationHeader } from '@/design-system/components'
import { CheckCircle, DeviceMobile } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { majelisLine } from '../lib/pipeline'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { AppScreen, StickyBar } from '../lib/ui'

export function SurveyStartedScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Survey dimulai" onBack={() => flow.go('sales')} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  return (
    <AppScreen topBar={<NavigationHeader title="Survey dimulai" onBack={() => flow.go('sales')} />}>
      <Card>
        <div className="flex flex-col items-center gap-12 py-16 text-center">
          <span className="flex h-48 w-48 items-center justify-center rounded-full bg-green-50 text-green-500">
            <CheckCircle size={24} />
          </span>
          <div className="flex flex-col gap-4">
            <span className="text-18 font-bold text-default">Undangan terkirim</span>
            <span className="text-14 text-caption">
              {lead.name} diundang mengisi survey self-service di aplikasi AFin untuk{' '}
              {majelisLine(lead)}.
            </span>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-8 rounded-12 border border-blue-200 bg-blue-50 px-12 py-12">
        <div className="flex items-start gap-8">
          <span className="shrink-0 text-blue-500">
            <DeviceMobile size={20} />
          </span>
          <span className="text-12 text-blue-600">
            {lead.name} ada di daftar Leads pada kolom <span className="font-bold">Survey ongoing</span>.
            Ia menyelesaikan formulir AFin sendiri; kamu bisa memantau atau mengambil alih kapan saja.
          </span>
        </div>
      </div>

      <StickyBar>
        <Button size="lg" className="w-full" onClick={() => flow.go('sales')}>
          Kembali ke Sales
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          onClick={() => {
            pipelineStore.takeoverAssisted(lead.id)
            flow.go('application')
          }}
        >
          Ambil alih jadi assisted
        </Button>
      </StickyBar>
    </AppScreen>
  )
}
