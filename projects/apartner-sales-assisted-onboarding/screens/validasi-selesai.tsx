'use client'

// Validasi Mitra — the close: what the BM decided, plain, before returning to
// Tugas where the task now reads done (see tugas.tsx, which derives its state
// off the same store).

import { Button, Card, NavigationHeader } from '@/design-system/components'
import { CheckCircleFill, CrossCircleFill } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { SOFT_REJECT_CASE } from '../lib/validasi'
import { finalReason, useValidasi } from '../lib/validasi-store'
import { AppScreen, StickyBar } from '../lib/ui'

export function ValidasiSelesaiScreen() {
  const flow = useFlow()
  const s = useValidasi()
  const c = SOFT_REJECT_CASE
  const approved = s.decision === 'approve'

  return (
    <AppScreen topBar={<NavigationHeader title="Keputusan BM" hideBack />}>
      <div className="flex flex-col items-center gap-8 py-24 text-center">
        <span
          className={`flex h-64 w-64 items-center justify-center rounded-full ${approved ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}
        >
          {approved ? <CheckCircleFill size={24} /> : <CrossCircleFill size={24} />}
        </span>
        <span className="text-18 font-bold text-default">
          {approved ? 'Pengajuan disetujui' : 'Pengajuan ditolak'}
        </span>
        <span className="text-12 text-caption">
          Keputusan untuk {c.name} telah dicatat dan mengesampingkan soft reject sistem.
        </span>
      </div>

      <Card>
        <div className="flex flex-col gap-8">
          <span className="text-14 font-bold text-default">Alasan</span>
          <span className="text-14 text-default">{finalReason(s)}</span>
        </div>
      </Card>

      <StickyBar>
        <Button size="lg" className="w-full" onClick={() => flow.go('tugas')}>
          Kembali ke Tugas
        </Button>
      </StickyBar>
    </AppScreen>
  )
}
