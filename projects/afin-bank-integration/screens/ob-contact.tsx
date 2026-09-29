'use client'

import { Button, Input, NavigationHeader } from '@/design-system/components'
import { LockKey } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, PageTitle, StepHeader } from '../lib/ui'

// PRD 1.1 — confirm the default e-mail and phone. The phone is the AFin login
// number and receives the OTP, so it is shown but not editable here.
export function ObContactScreen() {
  const flow = useFlow()
  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Buka Rekening" onBack={flow.back} />}>
      <StepHeader stage={1} />
      <PageTitle
        title="Pastikan nomor HP dan email Anda benar"
        description="Kami pakai untuk kode OTP dan pemberitahuan transaksi rekening."
      />
      <Input
        label="Nomor HP"
        defaultValue="0812-3456-7890"
        readOnly
        suffix={<LockKey size={16} />}
        helperText="Sesuai nomor akun AmarthaFin Anda"
      />
      <Input label="Email" type="email" defaultValue="widyasari@gmail.com" />
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('ob-otp')}>
          Kirim Kode OTP
        </Button>
      </BottomAction>
    </Screen>
  )
}
