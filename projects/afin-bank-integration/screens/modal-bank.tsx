'use client'

// Step 2 · Data bank dan usaha (part 1) — the disbursement bank account. Leads
// into the occupation form.

import { Button, Input, NavigationHeader } from '@/design-system/components'
import { ChevronDown } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, PageTitle } from '../lib/ui'
import { ModalStepBar } from '../lib/modal'
import { useBankState } from '../lib/store'

export function ModalBankScreen() {
  const flow = useFlow()
  const { modalFilled } = useBankState()
  const select = <ChevronDown size={16} />
  const v = (value: string) => (modalFilled ? { defaultValue: value } : undefined)
  return (
    <Screen
      canvas="white"
      topBar={<NavigationHeader title="Data bank dan usaha" onBack={flow.back} link="Butuh Bantuan?" onLinkClick={() => {}} />}
    >
      <ModalStepBar step={2} label="Data bank" />
      <PageTitle title="Isi data bank Anda" description="Rekening ini dipakai untuk menerima pencairan Modal." />
      <Input label="Nama bank" placeholder="Pilih bank" readOnly suffix={select} {...v('Bank BRI')} />
      <Input label="Nomor rekening" placeholder="Masukkan nomor rekening" inputMode="numeric" {...v('3721 0102 9981 507')} />
      <Input label="Nama pemilik rekening" defaultValue="Agustin Juliyanto" />
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('modal-pekerjaan')}>
          Lanjut
        </Button>
      </BottomAction>
    </Screen>
  )
}
