'use client'

import { Button, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, KtpArt, PageTitle } from '../lib/ui'

// Live Re-KYC "Gunakan foto ini?" page.
export function ObKtpReviewScreen() {
  const flow = useFlow()
  return (
    <Screen canvas="white" topBar={<NavigationHeader title="" onBack={flow.back} />}>
      <div className="-mx-16 -mt-16 bg-neutral-900 px-16 py-24">
        <KtpArt />
      </div>
      <PageTitle title="Gunakan foto ini?" description="Pastikan lagi foto KTP Anda sudah memenuhi ketentuan:" />
      <ul className="list-disc pl-20 text-14 text-default">
        <li>KTP berada di dalam batas yang tersedia.</li>
        <li>Foto dan semua data KTP terbaca jelas (tidak buram, rusak, atau tertutup jari/pantulan cahaya).</li>
      </ul>
      <BottomAction>
        <Button variant="outline" size="lg" className="flex-1" onClick={flow.back}>
          Foto Ulang
        </Button>
        <Button variant="primary" size="lg" className="flex-1" onClick={() => flow.go('ob-ktp-form')}>
          Gunakan Foto
        </Button>
      </BottomAction>
    </Screen>
  )
}
