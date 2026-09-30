'use client'

import { Button, Card } from '@/design-system/components'
import { CheckCircleFill } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ACCOUNT_NAME, BottomAction, DataRow } from '../lib/ui'

export function PpobSuccessScreen() {
  const flow = useFlow()
  return (
    <Screen canvas="white">
      <div className="flex flex-col items-center pt-48 text-center">
        <span className="flex h-96 w-96 items-center justify-center rounded-full bg-green-50 text-green-500">
          <CheckCircleFill size={24} />
        </span>
        <h1 className="mt-24 text-20 font-bold text-default">Pembayaran berhasil</h1>
        <p className="mt-8 text-14 text-caption">Pulsa sudah masuk ke 0812-3456-7890.</p>
      </div>
      <Card className="border border-default">
        <DataRow label="Total bayar" value="Rp51.500" />
        <DataRow label="Dibayar dengan" value={ACCOUNT_NAME} />
        <DataRow label="Waktu" value="30 Sep 2026, 09:14" />
      </Card>
      <BottomAction>
        <Button variant="secondary" size="lg" className="flex-1" onClick={() => flow.go('history-detail')}>
          Lihat Detail
        </Button>
        <Button variant="primary" size="lg" className="flex-1" onClick={() => flow.go('home')}>
          Ke Beranda
        </Button>
      </BottomAction>
    </Screen>
  )
}
