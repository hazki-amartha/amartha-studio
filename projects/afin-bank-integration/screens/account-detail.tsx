'use client'

import { Button, Card, NavigationHeader } from '@/design-system/components'
import { Bank, Copy, ShareNetwork, ShieldCheck } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ACCOUNT_NAME, BottomAction, DataRow } from '../lib/ui'
import { store } from '../lib/store'

export function AccountDetailScreen() {
  const flow = useFlow()
  return (
    <Screen topBar={<NavigationHeader title="Detail Rekening" onBack={flow.back} />}>
      <Card>
        <div className="flex items-center gap-12">
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
            <Bank size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-14 font-bold text-default">{ACCOUNT_NAME}</p>
            <p className="text-12 text-caption">Bank Aladin Syariah</p>
          </div>
        </div>
        <div className="mt-16 border-t border-default pt-12">
          <p className="text-12 text-caption">Saldo rekening</p>
          <p className="mt-4 text-20 font-bold text-default">Rp0</p>
        </div>
      </Card>

      <Card>
        <p className="mb-4 text-16 font-bold text-default">Info rekening</p>
        <DataRow
          label="Nomor rekening"
          value={
            <span className="flex items-center gap-8">
              5010 2233 4455
              <Copy size={16} className="text-link" />
            </span>
          }
        />
        <DataRow label="Nama pemilik" value="Widyasari" />
        <DataRow label="Nama bank" value="Bank Aladin Syariah" />
        <DataRow label="Jenis rekening" value="Tabungan" />
        <DataRow label="Tanggal dibuka" value="29 Sep 2026" />
      </Card>

      <Card>
        <div className="flex gap-12">
          <ShieldCheck size={20} className="shrink-0 text-green-500" />
          <p className="text-12 text-caption">
            Dana Anda dijamin LPS dan disimpan di bank berizin OJK.
          </p>
        </div>
      </Card>

      <BottomAction stacked>
        <Button variant="secondary" size="lg" className="flex-1">
          <ShareNetwork size={16} /> Bagikan
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
