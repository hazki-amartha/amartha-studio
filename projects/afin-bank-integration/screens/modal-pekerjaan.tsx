'use client'

// Step 2 · Data bank dan usaha (part 2) — occupation & business. Closes the
// section and returns to the hub.

import { Button, Input, InputNominal, NavigationHeader } from '@/design-system/components'
import { ChevronDown } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { useState } from 'react'
import { BottomAction, PageTitle } from '../lib/ui'
import { ModalStepBar } from '../lib/modal'
import { useBankState } from '../lib/store'

export function ModalPekerjaanScreen() {
  const flow = useFlow()
  const { modalFilled } = useBankState()
  const [income, setIncome] = useState(modalFilled ? '5000000' : '')
  const select = <ChevronDown size={16} />
  const v = (value: string) => (modalFilled ? { defaultValue: value } : undefined)
  return (
    <Screen
      canvas="white"
      topBar={<NavigationHeader title="Data bank dan usaha" onBack={flow.back} link="Butuh Bantuan?" onLinkClick={() => {}} />}
    >
      <ModalStepBar step={2} label="Data pekerjaan" />
      <PageTitle title="Data pekerjaan" description="Ceritakan usaha yang Anda jalankan." />
      <Input label="Sektor pekerjaan" placeholder="Pilih sektor" readOnly suffix={select} {...v('Perdagangan')} />
      <Input label="Bidang usaha" placeholder="Pilih bidang usaha" readOnly suffix={select} {...v('Warung kelontong')} />
      <Input label="Jenis usaha" placeholder="Pilih jenis usaha" readOnly suffix={select} {...v('Mikro')} />
      <Input label="Lama usaha" placeholder="Contoh: 3 tahun" {...v('3 tahun')} />
      <InputNominal label="Pendapatan per bulan" value={income} onValueChange={setIncome} currency="Rp" />
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('modal-hub')}>
          Simpan
        </Button>
      </BottomAction>
    </Screen>
  )
}
