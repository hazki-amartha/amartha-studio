'use client'

// Validasi Mitra — step 3 of 4: the BP's field read, condensed onto one page.
//
// The real BP Feedback form the BP fills is five steps on her own app —
// Validasi (selfie), Kondisi usaha, Profil mitra, Verifikasi lingkungan
// (a second selfie + several field questions), Penilaian BP. The BM reading
// it afterward doesn't need to page through all five: she needs the answers.
// So this screen is that whole form collapsed into the handful of facts that
// actually change her decision, grouped the same way the source steps were,
// plus the BP's own note verbatim at the bottom.

import { Card, NavigationHeader, Button } from '@/design-system/components'
import { Camera } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { VALIDASI_STEP_SCREENS, VALIDASI_STEPS } from '../lib/validasi'
import { useOpenCase } from '../lib/validasi-store'
import { AppScreen, SectionTitle, StageBar, StickyBar } from '../lib/ui'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-12">
      <span className="w-160 shrink-0 text-12 text-caption">{label}</span>
      <span className="min-w-0 flex-1 text-right text-12 font-bold text-default">{value}</span>
    </div>
  )
}

/** A drawn stand-in for a photo the prototype doesn't ship a real image for
 *  (§2: tokens only) — same tile as validasi-data.tsx's KTP/rumah/usaha
 *  photos, so a selfie reads as the same kind of thing they are. */
function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-120 flex-col items-center justify-center gap-8 rounded-8 bg-canvas-blue text-primary-500">
      <Camera size={24} />
      <span className="text-12 font-regular text-caption">{label}</span>
    </div>
  )
}

export function ValidasiBpFeedbackScreen() {
  const flow = useFlow()
  const c = useOpenCase()
  const a = c.bpAssessment

  return (
    <AppScreen
      topBar={<NavigationHeader title="BP Feedback" onBack={() => flow.go('validasi-data')} />}
    >
      <StageBar
        current={3}
        labels={VALIDASI_STEPS}
        onStepClick={(step) => flow.go(VALIDASI_STEP_SCREENS[step - 1])}
      />

      {/* Stands in for the form's own selfie-verification step — the BM
          doesn't need the photo, only that the visit actually happened. */}
      <Card>
        <div className="flex flex-col gap-12">
          <SectionTitle>Kunjungan lapangan</SectionTitle>
          <PhotoPlaceholder label={`Selfie BP & ${c.name}`} />
          <Row label="Status" value="Terverifikasi" />
          <Row label="Lokasi" value="Tercatat" />
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-12">
          <SectionTitle>Kondisi usaha &amp; profil mitra</SectionTitle>
          <div className="flex flex-col gap-8">
            <Row label="Usaha berjalan aktif?" value={a.usahaAktif} />
            <Row label="Lama usaha berjalan" value={a.lamaUsaha} />
            <Row label="Status kepemilikan rumah" value={a.statusRumah} />
            <Row label="Lama tinggal di alamat ini" value={a.lamaTinggal} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-12">
          <SectionTitle>Verifikasi lingkungan</SectionTitle>
          <div className="flex flex-col gap-8">
            <Row label="Pengakuan warga / Ketua Majelis" value={a.pengakuanLingkungan} />
            <Row label="Verifikasi domisili" value={a.verifikasiDomisili} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-12">
          <SectionTitle>Penilaian BP</SectionTitle>
          <div className="flex flex-col gap-8">
            <Row label="Kesanggupan pembayaran" value={a.kesanggupanBayar} />
            <Row label="Indikasi buruk" value={a.indikasiBuruk} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-8">
          <span className="text-14 font-bold text-default">Catatan BP</span>
          <span className="text-14 text-default">{a.catatan}</span>
        </div>
      </Card>

      <StickyBar>
        <Button size="lg" className="w-full" onClick={() => flow.go('validasi-keputusan')}>
          Lanjutkan ke Keputusan
        </Button>
      </StickyBar>
    </AppScreen>
  )
}
