'use client'

import { Button } from '@/design-system/components'
import { CheckCircleFill } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction } from '../lib/ui'
import { useBankState } from '../lib/store'

export function PinDoneScreen() {
  const flow = useFlow()
  const { pinFlow } = useBankState()
  return (
    <Screen canvas="white">
      <div className="flex flex-col items-center pt-48 text-center">
        <span className="flex h-96 w-96 items-center justify-center rounded-full bg-green-50 text-green-500">
          <CheckCircleFill size={24} />
        </span>
        <h1 className="mt-24 text-20 font-bold text-default">
          {pinFlow === 'change' ? 'PIN berhasil diubah' : 'PIN baru sudah aktif'}
        </h1>
        <p className="mt-8 text-14 text-caption">Pakai PIN baru untuk transaksi berikutnya dari rekening Anda.</p>
      </div>
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('balance-detail')}>
          Selesai
        </Button>
      </BottomAction>
    </Screen>
  )
}
