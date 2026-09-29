'use client'

// Validasi Mitra — step 1 of 4: the underwriting state. A soft reject isn't a
// final no, so this screen says exactly that before anything else: which
// mitra, what the system flagged, and why it's worth the BM's own look.
//
// The full underwriting data and the BP's own field feedback live one tap
// away from here (ListRow, below) rather than as steps of their own — they
// are reference material the BM opens while she's making up her mind, and
// both come straight back to this page. The 4 numbered steps are what she
// actually DOES: this notice, her own visit to the mitra, her visit to the
// Ketua Majelis, then the decision.

import { Card, ListRow, NavigationHeader, Button } from '@/design-system/components'
import { WarningFill } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { VALIDASI_STEP_SCREENS, VALIDASI_STEPS } from '../lib/validasi'
import { useOpenCase } from '../lib/validasi-store'
import { MitraCard } from '../lib/validasi-ui'
import { AppScreen, SectionTitle, StageBar, StickyBar } from '../lib/ui'

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

      <MitraCard case={c} />

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
        </div>
      </Card>

      <SectionTitle>Referensi</SectionTitle>
      <Card flush>
        <ListRow
          title="Data Underwriting"
          description="Data lengkap pengajuan, dari KTP sampai data usaha"
          chevron
          onClick={() => flow.go('validasi-data')}
        />
        <ListRow
          title="BP Feedback"
          description="Ringkasan kunjungan lapangan BP"
          chevron
          onClick={() => flow.go('validasi-bp-feedback')}
        />
      </Card>

      <StickyBar>
        <Button size="lg" className="w-full" onClick={() => flow.go('validasi-verifikasi-mitra')}>
          Lanjutkan ke Validasi Mitra
        </Button>
      </StickyBar>
    </AppScreen>
  )
}
