'use client'

// "KYC gagal" — verification failed; the mitra must fix the flagged data and
// resubmit (reference: Success Verification / failure). Leads back into the hub.

import { Button, NavigationHeader } from '@/design-system/components'
import { IdentificationCard, Warning } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, PageTitle } from '../lib/ui'

export function ModalVerifyFailedScreen() {
  const flow = useFlow()
  return (
    <Screen canvas="white" topBar={<NavigationHeader onBack={flow.back} />}>
      <div className="flex h-160 items-center justify-center rounded-16 bg-primary-50">
        <span className="relative text-primary-500">
          <IdentificationCard size={24} />
          <Warning size={16} className="absolute -right-8 -top-8 rounded-full bg-neutral-white text-red-500" />
        </span>
      </div>
      <PageTitle title="Data belum berhasil diverifikasi" />
      <div>
        <p className="text-14 text-default">Verifikasi gagal karena:</p>
        <ul className="mt-8 flex flex-col gap-8">
          {['NIK beda dengan KTP asli', 'Nama beda dengan KTP asli'].map((r) => (
            <li key={r} className="flex items-start gap-8 text-14 text-default">
              <span className="mt-8 h-4 w-4 shrink-0 rounded-full bg-red-500" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-8 bg-orange-50 px-12 py-8 text-12 text-orange-500">
        Kesempatan memperbaiki data: <span className="font-bold">2 kali</span>
      </div>
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('modal-hub')}>
          Perbaiki Data
        </Button>
      </BottomAction>
    </Screen>
  )
}
