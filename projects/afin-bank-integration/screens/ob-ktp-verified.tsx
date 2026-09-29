'use client'

import { Button, Card, NavigationHeader } from '@/design-system/components'
import { ShieldCheckFill } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, DataRow, KtpArt, PageTitle, StepHeader } from '../lib/ui'

// VERIFIED AFin KYC: the KTP and NIK on file are sent to the bank as they are
// (PRD A, "auto-upload KTP + Selfie + auto-fill NIK"), so the user only checks them.
export function ObKtpVerifiedScreen() {
  const flow = useFlow()
  return (
    <Screen topBar={<NavigationHeader title="Buka Rekening" onBack={flow.back} />}>
      <StepHeader stage={2} />
      <PageTitle title="Cek data KTP Anda" description="Kami pakai data yang sudah terverifikasi di AmarthaFin." />
      <Card>
        <div className="mb-12 flex items-center gap-8 rounded-8 bg-green-50 p-8 text-12 font-bold text-green-600">
          <ShieldCheckFill size={16} />
          Sudah terverifikasi
        </div>
        <KtpArt />
        <div className="mt-8">
          <DataRow label="NIK" value="3171234567890123" />
          <DataRow label="Nama di KTP" value="Widyasari" />
          <DataRow label="Tanggal lahir" value="12 Des 1990" />
          <DataRow label="Alamat" value="Jl. TB Simatupang No.18, Cilandak Barat" />
        </div>
      </Card>
      <p className="text-center text-12 text-caption">
        Data tidak sesuai? <span className="font-bold text-link">Hubungi AmarthaCare</span>
      </p>
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('ob-liveness-guide')}>
          Data Sudah Benar
        </Button>
      </BottomAction>
    </Screen>
  )
}
