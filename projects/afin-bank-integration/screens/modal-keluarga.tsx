'use client'

// Step 4 · Data keluarga — the Kartu Keluarga photo guide. Camera + review
// collapse into the transition to the family-data form.

import { NavigationHeader } from '@/design-system/components'
import { FileDoc } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ModalStepBar, PhotoArt, PhotoGuide } from '../lib/modal'

export function ModalKeluargaScreen() {
  const flow = useFlow()
  return (
    <Screen
      canvas="white"
      topBar={<NavigationHeader title="Data keluarga" onBack={flow.back} link="Butuh Bantuan?" onLinkClick={() => {}} />}
    >
      <ModalStepBar step={4} label="Kartu Keluarga" />
      <PhotoGuide
        title="Foto Kartu Keluarga Anda"
        example={<PhotoArt icon={<FileDoc size={24} />} tone="green" />}
        rules={[
          'Semua data di Kartu Keluarga harus terbaca jelas.',
          'Foto tidak boleh buram, rusak, atau terpotong.',
          'Foto langsung dari kamera HP (bukan fotokopi atau tangkapan layar).',
        ]}
        onStart={() => flow.go('modal-keluarga-form')}
      />
    </Screen>
  )
}
