'use client'

// Poket transfer: pick a destination, recipient, and amount, then confirm.
// Submit shows a success sheet — nothing leaves the prototype.

import { type ReactNode, useState } from 'react'
import { BottomSheet, Button, Input, InputNominal, NavigationHeader } from '@/design-system/components'
import { Bank, CheckCircleFill, ChevronDown, Profile } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction } from '../lib/ui'

type Dest = 'sesama' | 'bank'

export function PoketTransferScreen() {
  const flow = useFlow()
  const [dest, setDest] = useState<Dest>('sesama')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [done, setDone] = useState(false)
  const ready = recipient.length > 0 && amount.length > 0

  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Transfer" onBack={flow.back} />}>
      <div className="flex gap-8">
        <DestTab icon={<Profile size={20} />} label="Sesama AmarthaFin" active={dest === 'sesama'} onClick={() => setDest('sesama')} />
        <DestTab icon={<Bank size={20} />} label="Bank lain" active={dest === 'bank'} onClick={() => setDest('bank')} />
      </div>

      {dest === 'bank' ? (
        <Input label="Bank tujuan" placeholder="Pilih bank" readOnly suffix={<ChevronDown size={16} />} />
      ) : null}
      <Input
        label={dest === 'sesama' ? 'Nomor HP penerima' : 'Nomor rekening'}
        placeholder={dest === 'sesama' ? 'Contoh: 0812 3456 7890' : 'Masukkan nomor rekening'}
        inputMode="numeric"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <InputNominal label="Nominal transfer" value={amount} onValueChange={setAmount} currency="Rp" />
      <Input label="Catatan (opsional)" placeholder="Contoh: bayar arisan" />

      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" disabled={!ready} onClick={() => setDone(true)}>
          Lanjutkan
        </Button>
      </BottomAction>

      <BottomSheet
        open={done}
        onClose={() => flow.back()}
        slotPosition="above"
        slot={
          <div className="flex justify-center py-8">
            <CheckCircleFill size={24} className="text-green-500" />
          </div>
        }
        title="Transfer berhasil"
        description="Dana sudah dikirim ke rekening tujuan."
        primaryAction={
          <Button variant="primary" size="lg" onClick={() => flow.back()}>
            Selesai
          </Button>
        }
      />
    </Screen>
  )
}

function DestTab({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-8 rounded-12 border px-12 py-12 text-12 font-bold ${
        active ? 'border-primary-500 bg-primary-50 text-primary-500' : 'border-default text-default'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
