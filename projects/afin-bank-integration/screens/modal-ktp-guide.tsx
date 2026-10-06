'use client'

// Step 1 · Data pribadi — the KTP capture guide, Modal framing. Content matches
// the live "Sekarang, foto KTP Anda" page; the camera + review are collapsed
// into the transition for the click-through (guide → data form).

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { KtpArt } from '../lib/ui'
import { ModalStepBar, PhotoGuide } from '../lib/modal'

export function ModalKtpGuideScreen() {
  const flow = useFlow()
  return (
    <Screen
      canvas="white"
      topBar={<NavigationHeader title="Data pribadi" onBack={flow.back} link="Butuh Bantuan?" onLinkClick={() => {}} />}
    >
      <ModalStepBar step={1} label="Foto KTP dan selfie" />
      <PhotoGuide
        title="Sekarang, foto KTP Anda"
        example={<KtpArt />}
        rules={[
          'KTP harus milik Anda sendiri.',
          'Foto dan semua data di KTP harus terbaca jelas (tidak buram, rusak, atau tertutup jari/pantulan cahaya).',
          'Foto KTP langsung dari kamera HP Anda (jangan foto fotokopi atau tangkapan layar).',
        ]}
        onStart={() => flow.go('modal-ktp-form')}
      />
    </Screen>
  )
}
