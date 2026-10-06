'use client'

// Step 5 · Foto rumah tinggal — the house photo guide (frame 127647). Camera +
// review collapse into the transition to the location form.

import { NavigationHeader } from '@/design-system/components'
import { House } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ModalStepBar, PhotoArt, PhotoGuide } from '../lib/modal'

export function ModalRumahScreen() {
  const flow = useFlow()
  return (
    <Screen
      canvas="white"
      topBar={<NavigationHeader title="Foto rumah tinggal" onBack={flow.back} link="Butuh Bantuan?" onLinkClick={() => {}} />}
    >
      <ModalStepBar step={5} label="Foto rumah tinggal" />
      <PhotoGuide
        title="Syarat foto rumah tinggal"
        example={<PhotoArt icon={<House size={24} />} tone="orange" />}
        rules={[
          'Tampak depan rumah harus terlihat semua, dari lantai hingga atap.',
          'Foto tidak boleh buram atau terhalang benda apa pun.',
          'Jangan mengambil foto terlalu jauh.',
        ]}
        onStart={() => flow.go('modal-rumah-form')}
      />
    </Screen>
  )
}
