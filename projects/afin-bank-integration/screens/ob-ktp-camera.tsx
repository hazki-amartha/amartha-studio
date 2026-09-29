'use client'

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { CameraShutter, KtpArt } from '../lib/ui'

export function ObKtpCameraScreen() {
  const flow = useFlow()
  return (
    <Screen
      statusBar="none"
      chromeClassName="bg-neutral-900"
      topBar={<NavigationHeader variant="dark" title="" onBack={flow.back} />}
    >
      <div className="-mx-16 -mt-16 flex flex-1 flex-col bg-neutral-900 px-16">
        <p className="pt-24 text-center text-14 text-neutral-white">Posisikan KTP dalam batas yang tersedia.</p>
        <div className="mt-40 rounded-16 border-2 border-neutral-white p-4">
          <KtpArt />
        </div>
        <div className="mt-auto">
          <CameraShutter onShoot={() => flow.go('ob-ktp-review')} />
        </div>
      </div>
    </Screen>
  )
}
