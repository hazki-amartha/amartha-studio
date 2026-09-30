'use client'

import { useState } from 'react'
import { Button, Card, NavigationHeader, SelectableCard } from '@/design-system/components'
import { ServiceIcon, Wordmark } from '@/design-system/assets'
import { Bank } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ACCOUNT_NAME, BottomAction, DataRow } from '../lib/ui'
import { PinSheet } from '../lib/pin-sheet'

// Paying from the account asks for the account PIN; paying from Poket keeps
// the AmarthaFin PIN it uses today (which PIN guards what is still open, #2).
export function PpobConfirmScreen() {
  const flow = useFlow()
  const [source, setSource] = useState<'rekening' | 'poket'>('rekening')
  const [pin, setPin] = useState(false)

  return (
    <Screen topBar={<NavigationHeader title="Konfirmasi Pembayaran" onBack={flow.back} />}>
      <Card>
        <div className="flex items-center gap-12">
          <ServiceIcon name="pulsa" size={40} />
          <div>
            <p className="text-14 font-bold text-default">Pulsa Telkomsel 50.000</p>
            <p className="text-12 text-caption">0812-3456-7890</p>
          </div>
        </div>
        <div className="mt-8">
          <DataRow label="Harga" value="Rp50.000" />
          <DataRow label="Biaya admin" value="Rp1.500" />
          <DataRow label="Total bayar" value="Rp51.500" />
        </div>
      </Card>

      <p className="text-14 font-bold text-default">Bayar pakai</p>
      <SelectableCard
        name="source"
        title={ACCOUNT_NAME}
        description="Saldo Rp24.000.000"
        prefixIcon={<Bank size={20} className="text-primary-500" />}
        checked={source === 'rekening'}
        onChange={() => setSource('rekening')}
      />
      <SelectableCard
        name="source"
        title="Poket"
        description="Saldo Rp160.000"
        prefixIcon={<Wordmark name="poket" height={16} />}
        checked={source === 'poket'}
        onChange={() => setSource('poket')}
      />

      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => setPin(true)}>
          Bayar Rp51.500
        </Button>
      </BottomAction>
      <PinSheet open={pin} onClose={() => setPin(false)} onSuccess={() => flow.go('ppob-success')} />
    </Screen>
  )
}
