'use client'

// Step 4 · Data keluarga — family data read from the Kartu Keluarga. Closes the
// section and returns to the hub.

import { Button, Input, NavigationHeader } from '@/design-system/components'
import { FileDoc } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, PageTitle } from '../lib/ui'
import { ModalStepBar, PhotoArt } from '../lib/modal'

export function ModalKeluargaFormScreen() {
  const flow = useFlow()
  return (
    <Screen
      canvas="white"
      topBar={<NavigationHeader title="Data keluarga" onBack={flow.back} link="Butuh Bantuan?" onLinkClick={() => {}} />}
    >
      <ModalStepBar step={4} label="Data keluarga" />
      <PageTitle title="Cek data keluarga" description="Pastikan data sesuai dengan Kartu Keluarga." />
      <PhotoArt icon={<FileDoc size={24} />} tone="green" />
      <Input label="Nomor Kartu Keluarga" defaultValue="3507120812990002" />
      <Input label="Nama kepala keluarga" defaultValue="Sutrisno" />
      <Input label="Jumlah anggota keluarga" defaultValue="4" inputMode="numeric" />
      <Input label="Nama pasangan" defaultValue="Widyasari" />
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('modal-hub')}>
          Simpan
        </Button>
      </BottomAction>
    </Screen>
  )
}
