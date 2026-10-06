'use client'

// Step 6 · Foto tempat usaha — the business-place photo guide (frame 125899).
// Camera + review collapse into the transition to the location form.

import { NavigationHeader } from '@/design-system/components'
import { Storefront } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ModalStepBar, PhotoArt, PhotoGuide } from '../lib/modal'

export function ModalUsahaScreen() {
  const flow = useFlow()
  return (
    <Screen
      canvas="white"
      topBar={<NavigationHeader title="Foto tempat usaha" onBack={flow.back} link="Butuh Bantuan?" onLinkClick={() => {}} />}
    >
      <ModalStepBar step={6} label="Foto tempat usaha" />
      <PhotoGuide
        title="Syarat foto tempat usaha"
        example={<PhotoArt icon={<Storefront size={24} />} tone="orange" />}
        rules={[
          'Foto harus memperlihatkan tempat usaha Anda.',
          'Foto tidak boleh buram atau terhalang benda apa pun.',
          'Jangan mengambil foto terlalu jauh.',
        ]}
        onStart={() => flow.go('modal-usaha-form')}
      />
    </Screen>
  )
}
