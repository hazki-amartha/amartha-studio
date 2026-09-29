'use client'

import { Button, Card, NavigationHeader } from '@/design-system/components'
import { WarningCircle } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, RuleList } from '../lib/ui'
import { store } from '../lib/store'

// PRD A "Rejection & Retry": the bank's error code mapped to a plain reason,
// and a retry that restarts from the OTP step.
export function ObRejectedScreen() {
  const flow = useFlow()
  return (
    <Screen topBar={<NavigationHeader title="Status Rekening" onBack={flow.back} />}>
      <div className="flex flex-col items-center pt-16 text-center">
        <span className="flex h-64 w-64 items-center justify-center rounded-full bg-red-50 text-red-500">
          <WarningCircle size={24} />
        </span>
        <h1 className="mt-16 text-20 font-bold text-default">Rekening gagal dibuat</h1>
      </div>
      <Card>
        <p className="text-12 text-caption">Alasan</p>
        <p className="mt-4 text-14 font-bold text-default">Data KTP tidak cocok dengan data Dukcapil</p>
        <p className="mt-4 text-14 text-caption">
          NIK atau nama yang Anda isi berbeda dengan data kependudukan.
        </p>
      </Card>
      <Card>
        <p className="mb-12 text-14 font-bold text-default">Sebelum coba lagi</p>
        <RuleList
          rules={[
            'Cocokkan NIK dan nama dengan KTP asli, huruf per huruf.',
            'Pakai KTP terbaru jika Anda pernah pindah alamat.',
          ]}
        />
      </Card>
      <BottomAction>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => {
            store.set({ account: 'none' })
            flow.go('ob-contact')
          }}
        >
          Coba Lagi
        </Button>
      </BottomAction>
    </Screen>
  )
}
