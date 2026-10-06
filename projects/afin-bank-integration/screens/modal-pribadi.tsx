'use client'

// Step 1 · Data pribadi (last part) — current home address. Closes the personal
// section and returns to the hub.

import { Button, Input, NavigationHeader } from '@/design-system/components'
import { ChevronDown } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, PageTitle } from '../lib/ui'
import { ModalStepBar } from '../lib/modal'
import { useBankState } from '../lib/store'

export function ModalPribadiScreen() {
  const flow = useFlow()
  const { modalFilled } = useBankState()
  const select = <ChevronDown size={16} />
  const v = (value: string) => (modalFilled ? { defaultValue: value } : undefined)
  return (
    <Screen
      canvas="white"
      topBar={<NavigationHeader title="Data pribadi" onBack={flow.back} link="Butuh Bantuan?" onLinkClick={() => {}} />}
    >
      <ModalStepBar step={1} label="Alamat pribadi" />
      <PageTitle title="Di mana Anda tinggal saat ini?" description="Isi alamat tempat Anda tinggal sekarang." />
      <Input label="Alamat lengkap" placeholder="Nama jalan, nomor rumah, blok" {...v('Jl. Melati No. 12')} />
      <Input label="Provinsi" placeholder="Pilih provinsi" readOnly suffix={select} {...v('Jawa Timur')} />
      <Input label="Kota / Kabupaten" placeholder="Pilih kota" readOnly suffix={select} {...v('Kabupaten Malang')} />
      <Input label="Kecamatan" placeholder="Pilih kecamatan" readOnly suffix={select} {...v('Pakisaji')} />
      <Input label="Kelurahan / Desa" placeholder="Pilih kelurahan" readOnly suffix={select} {...v('Karangpandan')} />
      <div className="flex gap-12">
        <Input label="RT" placeholder="000" {...v('003')} />
        <Input label="RW" placeholder="000" {...v('002')} />
        <Input label="Kode pos" placeholder="00000" {...v('65162')} />
      </div>
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('modal-hub')}>
          Simpan
        </Button>
      </BottomAction>
    </Screen>
  )
}
