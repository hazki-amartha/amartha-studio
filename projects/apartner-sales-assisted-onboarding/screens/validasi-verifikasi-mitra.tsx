'use client'

// Validasi Mitra — step 2 of 4: the BM's own visit to the mitra herself. She
// re-checks two of the BP's own answers rather than trusting BP Feedback
// alone (each PickerField shows the BP's answer as a hint, so she's
// comparing, not guessing), notes what the mitra owns, and photographs/
// geotags her own visit. Kirim Keputusan (step 4) stays locked until this,
// and step 3, are both whole.

import { useState } from 'react'
import { BottomSheet, Button, Card, NavigationHeader, SelectableCard } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import {
  ASET_OPTIONS,
  STATUS_RUMAH_OPTIONS,
  USAHA_BERJALAN_OPTIONS,
  VALIDASI_STEP_SCREENS,
  VALIDASI_STEPS,
} from '../lib/validasi'
import { useOpenCase, useValidasi, validasiStore } from '../lib/validasi-store'
import { PickSheet } from '../lib/pipeline-ui'
import { PickerField, PhotoCapture } from '../lib/validasi-ui'
import { AppScreen, SectionTitle, StageBar, StickyBar } from '../lib/ui'

export function ValidasiVerifikasiMitraScreen() {
  const flow = useFlow()
  const s = useValidasi()
  const c = useOpenCase()
  const a = c.bpAssessment
  const [statusRumahSheet, setStatusRumahSheet] = useState(false)
  const [usahaSheet, setUsahaSheet] = useState(false)
  const [asetSheet, setAsetSheet] = useState(false)

  return (
    <AppScreen
      topBar={<NavigationHeader title="Validasi ke Mitra" onBack={() => flow.go('validasi-mitra')} />}
    >
      <StageBar
        current={2}
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
          <SectionTitle>Kunjungan ke rumah mitra</SectionTitle>

          <PickerField
            label="Status kepemilikan rumah"
            value={s.statusRumahBM}
            hint={a.statusRumah}
            onClick={() => setStatusRumahSheet(true)}
          />

          <PickerField
            label="Apakah usaha masih berjalan?"
            value={s.usahaBerjalanBM}
            hint={a.usahaAktif}
            onClick={() => setUsahaSheet(true)}
          />

          <PickerField
            label="Aset yang dimiliki mitra"
            value={s.asetBM.join(', ')}
            onClick={() => setAsetSheet(true)}
          />

          <PhotoCapture
            label="Foto rumah mitra"
            captured={s.fotoRumah}
            onToggle={validasiStore.toggleFotoRumah}
          />
          <PhotoCapture
            label="Foto usaha mitra"
            captured={s.fotoUsaha}
            onToggle={validasiStore.toggleFotoUsaha}
          />
          <PhotoCapture
            label="Selfie & geotag BM bersama mitra"
            captured={s.selfieMitra}
            onToggle={validasiStore.toggleSelfieMitra}
          />
        </div>
      </Card>

      <StickyBar>
        <Button size="lg" className="w-full" onClick={() => flow.go('validasi-verifikasi-ketua')}>
          Lanjutkan ke Validasi Ketua Majelis
        </Button>
      </StickyBar>

      <PickSheet
        open={statusRumahSheet}
        title="Status kepemilikan rumah"
        options={STATUS_RUMAH_OPTIONS}
        value={s.statusRumahBM}
        onClose={() => setStatusRumahSheet(false)}
        onPick={(v) => {
          validasiStore.setStatusRumahBM(v)
          setStatusRumahSheet(false)
        }}
      />
      <PickSheet
        open={usahaSheet}
        title="Apakah usaha masih berjalan?"
        options={USAHA_BERJALAN_OPTIONS}
        value={s.usahaBerjalanBM}
        onClose={() => setUsahaSheet(false)}
        onPick={(v) => {
          validasiStore.setUsahaBerjalanBM(v)
          setUsahaSheet(false)
        }}
      />

      {/* Multi-select — stays open across picks (unlike PickSheet's single
          radio) so she can check more than one box before closing it. */}
      <BottomSheet
        open={asetSheet}
        onClose={() => setAsetSheet(false)}
        title="Aset yang dimiliki mitra"
        primaryAction={
          <Button size="lg" className="w-full" onClick={() => setAsetSheet(false)}>
            Simpan
          </Button>
        }
      >
        <div className="flex flex-col gap-8">
          {ASET_OPTIONS.map((o) => (
            <SelectableCard
              key={o}
              name={`aset-${o}`}
              inputType="checkbox"
              title={o}
              checked={s.asetBM.includes(o)}
              onChange={() => validasiStore.toggleAset(o)}
            />
          ))}
        </div>
      </BottomSheet>
    </AppScreen>
  )
}
