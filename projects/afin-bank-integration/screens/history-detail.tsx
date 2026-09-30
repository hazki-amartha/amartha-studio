'use client'

import { Badge, Button, Card, NavigationHeader } from '@/design-system/components'
import { Copy, ShareNetwork } from '@/design-system/icons'
import { ServiceIcon } from '@/design-system/assets'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ACCOUNT_NAME, BottomAction, DataRow } from '../lib/ui'

export function HistoryDetailScreen() {
  const flow = useFlow()
  return (
    <Screen topBar={<NavigationHeader title="Detail Transaksi" onBack={flow.back} />}>
      <Card>
        <div className="flex flex-col items-center py-8 text-center">
          <ServiceIcon name="pulsa" size={40} />
          <p className="mt-8 text-14 text-caption">Pulsa Telkomsel 50.000</p>
          <p className="mt-4 text-24 font-bold text-default">-Rp51.500</p>
          <div className="mt-8">
            <Badge intent="green" size="sm">
              Berhasil
            </Badge>
          </div>
        </div>
      </Card>
      <Card>
        <DataRow label="Nomor HP" value="0812-3456-7890" />
        <DataRow label="Waktu" value="30 Sep 2026, 09:14" />
        <DataRow label="Dibayar dengan" value={ACCOUNT_NAME} />
        <DataRow label="Harga" value="Rp50.000" />
        <DataRow label="Biaya admin" value="Rp1.500" />
        <DataRow
          label="ID transaksi"
          value={
            <span className="flex items-center gap-4">
              TRX2609300914 <Copy size={16} className="text-link" />
            </span>
          }
        />
      </Card>
      <BottomAction>
        <Button variant="secondary" size="lg" className="w-full">
          <ShareNetwork size={16} /> Bagikan Bukti
        </Button>
      </BottomAction>
    </Screen>
  )
}
