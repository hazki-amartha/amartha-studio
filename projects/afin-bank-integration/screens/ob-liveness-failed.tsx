'use client'

import { Button, NavigationHeader } from '@/design-system/components'
import { WarningCircle } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, RuleList } from '../lib/ui'
import { store } from '../lib/store'

// Failure copy follows Aladin's own FAQ on why face verification fails.
export function ObLivenessFailedScreen() {
  const flow = useFlow()
  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Buka Rekening" onBack={flow.back} />}>
      <div className="flex flex-col items-center pt-24 text-center">
        <span className="flex h-64 w-64 items-center justify-center rounded-full bg-red-50 text-red-500">
          <WarningCircle size={24} />
        </span>
        <h1 className="mt-16 text-20 font-bold text-default">Wajah belum terdeteksi</h1>
        <p className="mt-8 text-14 text-caption">
          Sisa percobaan <span className="font-bold text-default">2 kali</span> lagi. Coba tips ini dulu:
        </p>
      </div>
      <div className="rounded-12 bg-neutral-50 p-16">
        <RuleList
          rules={[
            'Cari tempat yang terang, jangan membelakangi cahaya.',
            'Gunakan latar belakang polos.',
            'Lepas kacamata, topi, atau masker.',
            'Pegang HP sejajar wajah dan jangan bergerak.',
          ]}
        />
      </div>
      <BottomAction>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => {
            store.set({ liveness: 'pass' })
            flow.go('ob-liveness-camera')
          }}
        >
          Coba Lagi
        </Button>
      </BottomAction>
    </Screen>
  )
}
