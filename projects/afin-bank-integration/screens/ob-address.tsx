'use client'

import { useState } from 'react'
import { Button, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, PageTitle, StepHeader } from '../lib/ui'

// PRD 4.3 — mailing address. Moved ahead of the summary so the summary is the
// last look at everything before the akad.
export function ObAddressScreen() {
  const flow = useFlow()
  const [choice, setChoice] = useState<'ktp' | 'lain'>('ktp')
  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Buka Rekening" onBack={flow.back} />}>
      <StepHeader stage={3} />
      <PageTitle title="Alamat surat-menyurat" description="Ke mana kami kirim surat dari bank, jika ada." />
      <SelectableCard
        name="alamat"
        title="Sama dengan alamat KTP"
        description="Jl. TB Simatupang No.18, Cilandak Barat, Jakarta Selatan"
        checked={choice === 'ktp'}
        onChange={() => setChoice('ktp')}
      />
      <SelectableCard
        name="alamat"
        title="Alamat lain"
        description="Alamat tempat tinggal Anda sekarang"
        checked={choice === 'lain'}
        onChange={() => setChoice('lain')}
      />
      {choice === 'lain' ? (
        <>
          <Input label="Alamat lengkap" placeholder="Nama jalan, nomor rumah" />
          <Input label="Kelurahan / Kecamatan" placeholder="Cari kelurahan" />
          <Input label="Kode pos" placeholder="5 digit" inputMode="numeric" />
        </>
      ) : null}
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('ob-summary')}>
          Lanjut
        </Button>
      </BottomAction>
    </Screen>
  )
}
