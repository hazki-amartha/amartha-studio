'use client'

// Validasi Mitra — step 3 of 4: the BM's own visit to the Ketua Majelis —
// the read on this mitra that only the majelis itself can give: whether she's
// known and trusted, how long, and whether she's already proven herself in a
// group loan before.

import { useState } from 'react'
import { Button, Card } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import {
  LAMA_KENAL_OPTIONS,
  MAJELIS_CHECKING_OPTIONS,
  PERNAH_KELOMPOK_OPTIONS,
  RIWAYAT_PINJAMAN_OPTIONS,
  VALIDASI_STEP_SCREENS,
  VALIDASI_STEPS,
} from '../lib/validasi'
import {
  canGoToValidasiStep,
  isVerifikasiKetuaDone,
  useOpenCase,
  useValidasi,
  validasiStore,
} from '../lib/validasi-store'
import { PickSheet } from '../lib/pipeline-ui'
import { ValidasiHeader, PickerField, PhotoCapture } from '../lib/validasi-ui'
import { AppScreen, StageBar, StickyBar } from '../lib/ui'

/** Bigger than the shared SectionTitle (text-14) — matches the Validasi
 *  Mitra screen's own group headings (Rumah / Usaha / Aset / Selfie &
 *  geotag), since this screen's one card is the same kind of top-level
 *  grouping, not a subsection label inside a bigger card. */
function GroupTitle({ children }: { children: string }) {
  return <h2 className="text-16 font-bold text-default">{children}</h2>
}

export function ValidasiVerifikasiKetuaScreen() {
  const flow = useFlow()
  const s = useValidasi()
  const c = useOpenCase()
  const [majelisSheet, setMajelisSheet] = useState(false)
  const [lamaKenalSheet, setLamaKenalSheet] = useState(false)
  const [pernahKelompokSheet, setPernahKelompokSheet] = useState(false)
  const [riwayatPinjamanSheet, setRiwayatPinjamanSheet] = useState(false)
  const pernahKelompok = s.pernahKelompokKM === PERNAH_KELOMPOK_OPTIONS[0]

  return (
    <AppScreen
      topBar={<ValidasiHeader case={c} onBack={() => flow.go('validasi-verifikasi-mitra')} />}
    >
      <StageBar
        current={3}
        labels={VALIDASI_STEPS}
        onStepClick={(step) => flow.go(VALIDASI_STEP_SCREENS[step - 1])}
        canGoTo={(step) => canGoToValidasiStep(s, step)}
      />

      <Card>
        <div className="flex flex-col gap-16">
          <GroupTitle>Kunjungan ke Ketua Majelis</GroupTitle>

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

          {/* Only makes sense once she's said yes — asking "pinjaman yang
              mana?" before that would assume the answer. */}
          {pernahKelompok ? (
            <PickerField
              label="Pinjaman sebelumnya itu di mana?"
              value={s.riwayatPinjamanKM}
              onClick={() => setRiwayatPinjamanSheet(true)}
            />
          ) : null}

          <PhotoCapture
            label="Selfie & geotag BM bersama Ketua Majelis"
            captured={s.selfieKetua}
            onToggle={validasiStore.toggleSelfieKetua}
          />
        </div>
      </Card>

      <StickyBar>
        <Button
          size="lg"
          className="w-full"
          disabled={!isVerifikasiKetuaDone(s)}
          onClick={() => flow.go('validasi-keputusan')}
        >
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
      <PickSheet
        open={riwayatPinjamanSheet}
        title="Pinjaman sebelumnya"
        options={RIWAYAT_PINJAMAN_OPTIONS}
        value={s.riwayatPinjamanKM}
        onClose={() => setRiwayatPinjamanSheet(false)}
        onPick={(v) => {
          validasiStore.setRiwayatPinjamanKM(v)
          setRiwayatPinjamanSheet(false)
        }}
      />
    </AppScreen>
  )
}
