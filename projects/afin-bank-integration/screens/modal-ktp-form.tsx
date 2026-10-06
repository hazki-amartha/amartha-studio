'use client'

// Step 1 · Data pribadi — the KTP data form, prefilled by OCR from the captured
// photo. Mirrors the live "Cek KTP" fields; leads into the selfie.

import { Button, Input, NavigationHeader } from '@/design-system/components'
import { CalendarDots, ChevronDown, IdentificationCard, Warning } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, PageTitle } from '../lib/ui'
import { ModalStepBar, PhotoArt } from '../lib/modal'

export function ModalKtpFormScreen() {
  const flow = useFlow()
  const select = <ChevronDown size={16} />
  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Data pribadi" onBack={flow.back} />}>
      <ModalStepBar step={1} label="Foto KTP dan selfie" />
      <PageTitle title="Cek data KTP" />
      <PhotoArt icon={<IdentificationCard size={24} />} />
      <div className="flex items-center gap-8 rounded-8 border border-blue-400 bg-blue-50 p-12 text-12 text-default">
        <Warning size={16} className="shrink-0 text-blue-500" />
        Pastikan data sesuai dengan KTP.
      </div>
      <Input label="NIK" defaultValue="3171234567890123" />
      <Input label="Nama di KTP" defaultValue="Widyasari" />
      <Input label="Jenis kelamin" defaultValue="Perempuan" readOnly suffix={select} />
      <Input label="Tanggal lahir" defaultValue="12 Des 1990" readOnly suffix={<CalendarDots size={16} />} />
      <Input label="Tempat lahir" defaultValue="Malang" />
      <Input label="Status perkawinan" defaultValue="Kawin" readOnly suffix={select} />
      <Input label="Nama lengkap ibu kandung" placeholder="Tulis nama lengkap ibu kandung" />
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('modal-selfie')}>
          Lanjut
        </Button>
      </BottomAction>
    </Screen>
  )
}
