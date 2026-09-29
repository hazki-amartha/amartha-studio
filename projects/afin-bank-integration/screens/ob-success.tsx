'use client'

import { Button, Card } from '@/design-system/components'
import { CheckCircleFill, Copy } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ACCOUNT_NAME, BottomAction } from '../lib/ui'
import { store } from '../lib/store'

export function ObSuccessScreen() {
  const flow = useFlow()
  return (
    <Screen canvas="white">
      <div className="flex flex-col items-center pt-48 text-center">
        <span className="flex h-96 w-96 items-center justify-center rounded-full bg-green-50 text-green-500">
          <CheckCircleFill size={24} />
        </span>
        <h1 className="mt-24 text-20 font-bold text-default">{ACCOUNT_NAME} sudah aktif!</h1>
        <p className="mt-8 text-14 text-caption">
          Saldo Poket dan rekening kini tampil jadi satu di beranda. Pencairan pinjaman berikutnya masuk ke sini.
        </p>
      </div>
      <Card className="border border-default">
        <p className="text-12 text-caption">Nomor rekening</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-18 font-bold text-default">5010 2233 4455</span>
          <span className="flex items-center gap-4 text-14 font-bold text-link">
            <Copy size={16} /> Salin
          </span>
        </div>
        <p className="mt-4 text-12 text-caption">a.n. Widyasari</p>
      </Card>
      <BottomAction>
        <Button variant="secondary" size="lg" className="flex-1" onClick={() => flow.go('account-detail')}>
          Lihat Detail
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-1"
          onClick={() => {
            store.set({ account: 'active' })
            flow.go('home')
          }}
        >
          Ke Beranda
        </Button>
      </BottomAction>
    </Screen>
  )
}
