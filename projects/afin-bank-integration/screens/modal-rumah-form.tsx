'use client'

// Step 5 · Foto rumah tinggal — location of the captured house photo. Closes the
// section and returns to the hub.

import { Button, NavigationHeader } from '@/design-system/components'
import { House } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, PageTitle } from '../lib/ui'
import { LocationFields, ModalStepBar, PhotoArt } from '../lib/modal'
import { useBankState } from '../lib/store'

export function ModalRumahFormScreen() {
  const flow = useFlow()
  const { modalFilled } = useBankState()
  return (
    <Screen
      canvas="white"
      topBar={<NavigationHeader title="Foto rumah tinggal" onBack={flow.back} link="Butuh Bantuan?" onLinkClick={() => {}} />}
    >
      <ModalStepBar step={5} label="Lokasi rumah tinggal" />
      <PageTitle title="Lokasi rumah tinggal Anda" />
      <PhotoArt icon={<House size={24} />} tone="orange" />
      <LocationFields filled={modalFilled} />
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('modal-hub')}>
          Simpan
        </Button>
      </BottomAction>
    </Screen>
  )
}
