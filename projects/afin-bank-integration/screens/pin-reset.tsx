'use client'

// Forgot PIN (PRD F): OTP, then a new PIN. Reached from "Lupa PIN?" on the
// PIN sheet or from the account settings.

import { Button, NavigationHeader } from '@/design-system/components'
import { LockKeyOpen } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, PageTitle, RuleList } from '../lib/ui'

export function PinResetScreen() {
  const flow = useFlow()
  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Atur Ulang PIN" onBack={flow.back} />}>
      <div className="flex justify-center pt-8">
        <span className="flex h-64 w-64 items-center justify-center rounded-full bg-primary-50 text-primary-500">
          <LockKeyOpen size={24} />
        </span>
      </div>
      <PageTitle
        title="Atur ulang PIN rekening"
        description="Untuk keamanan, kami pastikan dulu ini benar Anda."
      />
      <RuleList rules={['Masukkan kode OTP yang dikirim ke nomor HP Anda.', 'Buat PIN baru, 6 angka.']} />
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('pin-reset-otp')}>
          Lanjut
        </Button>
      </BottomAction>
    </Screen>
  )
}
