'use client'

// "Belum KYC" entry — what to have ready before starting the Modal application
// (reference: Preparing Page). Leads into the majelis page.

import { type ReactNode } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { Bank, Camera, Hourglass, IdentificationCard, Phone } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, PageTitle } from '../lib/ui'

const ITEMS: { icon: ReactNode; label: string }[] = [
  { icon: <IdentificationCard size={24} />, label: 'KTP dan kartu keluarga Anda' },
  { icon: <Bank size={24} />, label: 'Informasi rekening bank Anda' },
  { icon: <Phone size={24} />, label: 'Koneksi internet yang stabil' },
  { icon: <Camera size={24} />, label: 'Tempat terang untuk mengambil foto' },
  { icon: <Hourglass size={24} />, label: '3–5 menit untuk mengisi data' },
]

export function ModalPrepareScreen() {
  const flow = useFlow()
  return (
    <Screen canvas="white" topBar={<NavigationHeader onBack={flow.back} />}>
      <PageTitle title="Perlu Anda siapkan:" />
      <ul className="mt-4 flex flex-col gap-20">
        {ITEMS.map((it, i) => (
          <li key={i} className="flex items-center gap-16 text-14 text-default">
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
              {it.icon}
            </span>
            <span>{it.label}</span>
          </li>
        ))}
      </ul>
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('modal-majelis')}>
          Lanjut
        </Button>
      </BottomAction>
    </Screen>
  )
}
