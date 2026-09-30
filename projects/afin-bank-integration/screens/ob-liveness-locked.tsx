'use client'

import { Button, NavigationHeader } from '@/design-system/components'
import { LockKey } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, journeyTitle } from '../lib/ui'
import { useBankState } from '../lib/store'

// Too many failed attempts. The bank locks the check and hands the user to
// support (Aladin: "verifikasi lanjutan" via CS) — white-labelled as AmarthaCare.
export function ObLivenessLockedScreen() {
  const flow = useFlow()
  const { journey } = useBankState()
  return (
    <Screen canvas="white" topBar={<NavigationHeader title={journeyTitle(journey)} hideBack />}>
      <div className="flex flex-col items-center pt-40 text-center">
        <span className="flex h-64 w-64 items-center justify-center rounded-full bg-orange-50 text-orange-500">
          <LockKey size={24} />
        </span>
        <h1 className="mt-16 text-20 font-bold text-default">Verifikasi wajah dikunci sementara</h1>
        <p className="mt-8 text-14 text-caption">
          Anda sudah 3 kali gagal verifikasi. Demi keamanan, coba lagi dalam 24 jam atau hubungi AmarthaCare
          untuk verifikasi lanjutan.
        </p>
      </div>
      <BottomAction>
        <div className="flex w-full flex-col gap-8">
          <Button variant="primary" size="lg" className="w-full">
            Hubungi AmarthaCare
          </Button>
          <Button variant="ghost" size="lg" className="w-full" onClick={() => flow.go('home')}>
            Kembali ke Beranda
          </Button>
        </div>
      </BottomAction>
    </Screen>
  )
}
