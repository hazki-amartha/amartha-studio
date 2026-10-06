'use client'

// Step 1 · Data pribadi — the selfie guide. Content from the live "Selfie dulu,
// yuk!" page; camera + review collapse into the transition for the click-through.

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { FaceArt } from '../lib/ui'
import { ModalStepBar, PhotoGuide } from '../lib/modal'

export function ModalSelfieScreen() {
  const flow = useFlow()
  return (
    <Screen
      canvas="white"
      topBar={<NavigationHeader title="Data pribadi" onBack={flow.back} link="Butuh Bantuan?" onLinkClick={() => {}} />}
    >
      <ModalStepBar step={1} label="Foto KTP dan selfie" />
      <PhotoGuide
        title="Selfie dulu, yuk!"
        example={<FaceArt />}
        rules={[
          'Posisikan wajah di dalam batas yang tersedia.',
          'Lepas kacamata, masker, atau penutup wajah lainnya.',
          'Pastikan Anda berada di tempat yang terang.',
        ]}
        onStart={() => flow.go('modal-pribadi')}
      />
    </Screen>
  )
}
