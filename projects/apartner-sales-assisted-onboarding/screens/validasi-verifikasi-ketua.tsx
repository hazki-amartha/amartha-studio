'use client'

// Validasi Mitra — step 3 of 4: the BM's own visit to the Ketua Majelis —
// the read on this mitra that only the majelis itself can give: whether she's
// known and trusted, how long, and whether she's already proven herself in a
// group loan before.

import { useState } from 'react'
import { Button, Card, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import {
  LAMA_KENAL_OPTIONS,
  MAJELIS_CHECKING_OPTIONS,
  PERNAH_KELOMPOK_OPTIONS,
  VALIDASI_STEP_SCREENS,
  VALIDASI_STEPS,
} from '../lib/validasi'
import { useOpenCase, useValidasi, validasiStore } from '../lib/validasi-store'
import { PickSheet } from '../lib/pipeline-ui'
import { MitraCard, PickerField, PhotoCapture } from '../lib/validasi-ui'
import { AppScreen, SectionTitle, StageBar, StickyBar } from '../lib/ui'

export function ValidasiVerifikasiKetuaScreen() {
  const flow = useFlow()
  const s = useValidasi()
  const c = useOpenCase()
  const [majelisSheet, setMajelisSheet] = useState(false)
  const [lamaKenalSheet, setLamaKenalSheet] = useState(false)
  const [pernahKelompokSheet, setPernahKelompokSheet] = useState(false)

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

      <MitraCard case={c} />

      <Card>
        <div className="flex flex-col gap-16">
          <SectionTitle>Kunjungan ke Ketua Majelis</SectionTitle>

          <PickerField
            label="Apakah Ketua Majelis mengenal mitra ini dengan baik?"
            value={s.majelisChecking}
            onClick={() => setMajelisSheet(true)}
          />

          <PickerField
            label="Sudah berapa lama Ketua Majelis mengenal mitra ini?"
            value={s.lamaKenalKM}
            onClick={() => setLamaKenalSheet(true)}
          />

          <PickerField
            label="Apakah mitra ini pernah tergabung dalam kelompok pinjaman bersama sebelumnya?"
            value={s.pernahKelompokKM}
            onClick={() => setPernahKelompokSheet(true)}
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
      <PickSheet
        open={lamaKenalSheet}
        title="Lama mengenal mitra"
        options={LAMA_KENAL_OPTIONS}
        value={s.lamaKenalKM}
        onClose={() => setLamaKenalSheet(false)}
        onPick={(v) => {
          validasiStore.setLamaKenalKM(v)
          setLamaKenalSheet(false)
        }}
      />
      <PickSheet
        open={pernahKelompokSheet}
        title="Riwayat kelompok pinjaman"
        options={PERNAH_KELOMPOK_OPTIONS}
        value={s.pernahKelompokKM}
        onClose={() => setPernahKelompokSheet(false)}
        onPick={(v) => {
          validasiStore.setPernahKelompokKM(v)
          setPernahKelompokSheet(false)
        }}
      />
    </AppScreen>
  )
}
