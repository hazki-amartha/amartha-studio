'use client'

// Validasi Mitra — step 1: the underwriting state. A soft reject isn't a final
// no, so this screen says exactly that before anything else: which mitra,
// what the system flagged, and why it's worth the BM's own look. Only after
// reading this does "Lihat Data Underwriting" make sense as the next step.

import { Badge, Button, Card, NavigationHeader } from '@/design-system/components'
import { WarningFill } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { SOFT_REJECT_CASE } from '../lib/validasi'
import { AppScreen, StickyBar } from '../lib/ui'

export function ValidasiMitraScreen() {
  const flow = useFlow()
  const c = SOFT_REJECT_CASE

  return (
    <AppScreen topBar={<NavigationHeader title="Validasi Mitra" onBack={() => flow.go('tugas')} />}>
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
          <div className="flex items-start gap-8">
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <WarningFill size={20} />
            </span>
            <div className="flex flex-col gap-2">
              <span className="text-14 font-bold text-default">Status underwriting: Soft Reject</span>
              <span className="text-12 text-caption">
                Sistem underwriting menahan pengajuan {c.name} secara otomatis — belum ditolak final.
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-r-8 border-l-2 border-orange-500 bg-orange-50 p-8">
            <span className="text-12 font-bold text-orange-500">Alasan sistem</span>
            <span className="text-12 text-default">{c.reason}</span>
          </div>

          <span className="text-12 text-caption">
            Sebagai BM, Anda bisa meninjau data lengkap pengajuannya dan memutuskan sendiri
            berdasarkan kondisi lapangan yang Anda ketahui.
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
