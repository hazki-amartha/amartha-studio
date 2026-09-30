'use client'

// PRD B: phone and account number are autofilled from what AmarthaFin already
// knows; the user only checks them and asks for the OTP.

import { Button, Input, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, PageTitle } from '../lib/ui'

export function BindFormScreen() {
  const flow = useFlow()
  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Hubungkan Rekening" onBack={flow.back} />}>
      <PageTitle
        title="Pastikan datanya benar"
        description="Kami isi otomatis dari data AmarthaFin Anda. Harus sama dengan yang terdaftar di bank."
      />
      <Input label="Nomor HP terdaftar di bank" defaultValue="0812-3456-7890" state="valid" />
      <Input
        label="Nomor rekening"
        defaultValue="5010 8877 6655"
        helperText="Cek di aplikasi Bank Aladin Syariah › Profil."
      />
      <p className="text-12 text-caption">
        Dengan melanjutkan, Anda setuju AmarthaFin menampilkan saldo dan riwayat rekening ini, serta memakainya
        untuk transaksi yang Anda setujui dengan PIN.
      </p>
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('bind-otp')}>
          Kirim Kode OTP
        </Button>
      </BottomAction>
    </Screen>
  )
}
