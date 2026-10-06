'use client'

// Step 6 · Foto tempat usaha — location of the captured business photo. The last
// section; returns to the hub, now complete.

import { Button, NavigationHeader } from '@/design-system/components'
import { Storefront } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, PageTitle } from '../lib/ui'
import { LocationFields, ModalStepBar, PhotoArt } from '../lib/modal'
import { useBankState } from '../lib/store'

export function ModalUsahaFormScreen() {
  const flow = useFlow()
  const { modalFilled } = useBankState()
  return (
    <Screen
      canvas="white"
      topBar={<NavigationHeader title="Foto tempat usaha" onBack={flow.back} link="Butuh Bantuan?" onLinkClick={() => {}} />}
    >
      <ModalStepBar step={6} label="Lokasi tempat usaha" />
      <PageTitle title="Foto tempat usaha Anda" />
      <PhotoArt icon={<Storefront size={24} />} tone="orange" />
      <LocationFields filled={modalFilled} />
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('modal-hub')}>
          Simpan
        </Button>
      </BottomAction>
    </Screen>
  )
}
