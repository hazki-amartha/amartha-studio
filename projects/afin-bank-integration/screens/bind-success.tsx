'use client'

import { Button, Card } from '@/design-system/components'
import { CheckCircleFill } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, DataRow } from '../lib/ui'
import { store } from '../lib/store'

export function BindSuccessScreen() {
  const flow = useFlow()
  return (
    <Screen canvas="white">
      <div className="flex flex-col items-center pt-48 text-center">
        <span className="flex h-96 w-96 items-center justify-center rounded-full bg-green-50 text-green-500">
          <CheckCircleFill size={24} />
        </span>
        <h1 className="mt-24 text-20 font-bold text-default">Rekening berhasil terhubung</h1>
        <p className="mt-8 text-14 text-caption">
          Saldo rekening kini tampil bersama Poket di beranda, dan pencairan pinjaman berikutnya masuk ke sini.
        </p>
      </div>
      <Card className="border border-default">
        <DataRow label="Nomor rekening" value="5010 8877 6655" />
        <DataRow label="Nama pemilik" value="Widyasari" />
        <DataRow label="Bank" value="Bank Aladin Syariah" />
      </Card>
      <BottomAction>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => {
            store.set({ account: 'active', status: 'active' })
            flow.go('home')
          }}
        >
          Ke Beranda
        </Button>
      </BottomAction>
    </Screen>
  )
}
