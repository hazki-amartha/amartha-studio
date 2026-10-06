'use client'

// "Pengajuan berhasil dikirim!" — submission success (reference: image 10).
// "Oke" lands on the home in the submitted (diproses) state.

import { Button, NavigationHeader } from '@/design-system/components'
import { CheckCircleFill, IdentificationCard } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction } from '../lib/ui'
import { store } from '../lib/store'

export function ModalSentScreen() {
  const flow = useFlow()
  return (
    <Screen canvas="white" topBar={<NavigationHeader hideBack link="Butuh Bantuan?" onLinkClick={() => {}} />}>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-160 w-full items-center justify-center rounded-16 bg-blue-50">
          <span className="relative text-primary-500">
            <IdentificationCard size={24} />
            <CheckCircleFill size={16} className="absolute -right-8 -top-8 rounded-full bg-neutral-white text-green-500" />
          </span>
        </div>
        <h1 className="mt-24 text-20 font-bold text-default">Pengajuan berhasil dikirim!</h1>
        <p className="mt-8 text-14 text-caption">
          Pengajuan akan diproses setelah penanggung jawab melengkapi data dalam 3 hari.
        </p>
      </div>
      <BottomAction>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => {
            store.set({ persona: 'borrower', modalStage: 'kyc-diproses', account: 'none' })
            flow.go('modal-home')
          }}
        >
          Oke
        </Button>
      </BottomAction>
    </Screen>
  )
}
