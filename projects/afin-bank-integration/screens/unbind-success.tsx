'use client'

import { Button } from '@/design-system/components'
import { CheckCircleFill } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction } from '../lib/ui'
import { store } from '../lib/store'

export function UnbindSuccessScreen() {
  const flow = useFlow()
  return (
    <Screen canvas="white">
      <div className="flex flex-col items-center pt-48 text-center">
        <span className="flex h-96 w-96 items-center justify-center rounded-full bg-green-50 text-green-500">
          <CheckCircleFill size={24} />
        </span>
        <h1 className="mt-24 text-20 font-bold text-default">Rekening sudah diputus</h1>
        <p className="mt-8 text-14 text-caption">
          Rekening tetap aktif di bank. Hubungkan lagi dari beranda kapan pun Anda mau.
        </p>
      </div>
      <BottomAction>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => {
            store.set({ account: 'none' })
            flow.go('home')
          }}
        >
          Ke Beranda
        </Button>
      </BottomAction>
    </Screen>
  )
}
