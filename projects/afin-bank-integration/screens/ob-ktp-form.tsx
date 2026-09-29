'use client'

import { Button, Input, NavigationHeader } from '@/design-system/components'
import { CalendarDots, ChevronDown, WarningCircle } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, PageTitle, StepHeader } from '../lib/ui'

// PRD 2.2 — the live Re-KYC "Cek KTP" form, prefilled by OCR from the photo.
export function ObKtpFormScreen() {
  const flow = useFlow()
  const select = <ChevronDown size={16} />
  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Buka Rekening" onBack={flow.back} />}>
      <StepHeader stage={2} />
      <PageTitle title="Cek KTP" />
      <div className="flex items-center gap-8 rounded-8 border border-blue-400 bg-blue-50 p-12 text-12 text-default">
        <WarningCircle size={16} className="shrink-0 text-blue-500" />
        Pastikan data sesuai dengan KTP.
      </div>
      <Input label="NIK" defaultValue="3171234567890123" />
      <Input label="Nama di KTP" defaultValue="Widyasari" />
      <Input label="Jenis kelamin" defaultValue="Perempuan" readOnly suffix={select} />
      <Input label="Tanggal lahir" defaultValue="12 Des 1990" readOnly suffix={<CalendarDots size={16} />} />
      <Input label="Tempat lahir" defaultValue="Jakarta" />
      <Input label="Alamat" defaultValue="Jl. TB Simatupang No.18" />
      <div className="flex gap-12">
        <Input label="RT" defaultValue="002" />
        <Input label="RW" defaultValue="001" />
      </div>
      <Input label="Kelurahan" defaultValue="Cilandak Barat" />
      <Input label="Kecamatan" defaultValue="Cilandak" />
      <Input label="Kota" defaultValue="Kota Jakarta Selatan" />
      <Input label="Provinsi" defaultValue="DKI Jakarta" />
      <Input label="Agama" defaultValue="Islam" readOnly suffix={select} />
      <Input label="Status perkawinan" defaultValue="Kawin" readOnly suffix={select} />
      <Input label="Nama lengkap ibu kandung" placeholder="Tulis nama lengkap ibu kandung" />
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('ob-liveness-guide')}>
          Lanjut
        </Button>
      </BottomAction>
    </Screen>
  )
}
