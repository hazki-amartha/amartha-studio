'use client'

// Validasi Mitra — step 3 of 4: the BM's own visit to the Ketua Majelis —
// the one read on this mitra that only the majelis itself can give.

import { useState } from 'react'
import { Button, Card, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { MAJELIS_CHECKING_OPTIONS, VALIDASI_STEP_SCREENS, VALIDASI_STEPS } from '../lib/validasi'
import { useOpenCase, useValidasi, validasiStore } from '../lib/validasi-store'
import { PickSheet } from '../lib/pipeline-ui'
import { PickerField, PhotoCapture } from '../lib/validasi-ui'
import { AppScreen, SectionTitle, StageBar, StickyBar } from '../lib/ui'

export function ValidasiVerifikasiKetuaScreen() {
  const flow = useFlow()
  const s = useValidasi()
  const c = useOpenCase()
  const [majelisSheet, setMajelisSheet] = useState(false)

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title="Validasi ke Ketua Majelis"
          onBack={() => flow.go('validasi-verifikasi-mitra')}
        />
      }
    >
      <StageBar
        current={3}
        labels={VALIDASI_STEPS}
        onStepClick={(step) => flow.go(VALIDASI_STEP_SCREENS[step - 1])}
      />

      <Card>
        <div className="flex flex-col gap-4">
          <span className="text-16 font-bold text-default">{c.name}</span>
          <span className="text-12 text-caption">
            {c.majelisName} · {c.product} · {c.amount}
          </span>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-16">
          <SectionTitle>Kunjungan ke Ketua Majelis</SectionTitle>

          <PickerField
            label="Apakah Ketua Majelis mengenal mitra ini dengan baik?"
            value={s.majelisChecking}
            onClick={() => setMajelisSheet(true)}
          />

          <PhotoCapture
            label="Selfie & geotag BM bersama Ketua Majelis"
            captured={s.selfieKetua}
            onToggle={validasiStore.toggleSelfieKetua}
          />
        </div>
      </Card>

      <StickyBar>
        <Button size="lg" className="w-full" onClick={() => flow.go('validasi-keputusan')}>
          Lanjutkan ke Keputusan
        </Button>
      </StickyBar>

      <PickSheet
        open={majelisSheet}
        title="Pengecekan Ketua Majelis"
        options={MAJELIS_CHECKING_OPTIONS}
        value={s.majelisChecking}
        onClose={() => setMajelisSheet(false)}
        onPick={(v) => {
          validasiStore.setMajelisChecking(v)
          setMajelisSheet(false)
        }}
      />
    </AppScreen>
  )
}
