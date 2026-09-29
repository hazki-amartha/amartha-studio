'use client'

import { type ReactNode } from 'react'
import { Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { useBankState } from '../lib/store'
import { BottomAction, DataRow, FaceArt, KtpArt, PageTitle, StepHeader } from '../lib/ui'

// Live Re-KYC "Data pengajuan" summary, extended with the job and address.
export function ObSummaryScreen() {
  const flow = useFlow()
  const { kyc } = useBankState()
  return (
    <Screen topBar={<NavigationHeader title="Buka Rekening" onBack={flow.back} />}>
      <StepHeader stage={3} />
      <PageTitle title="Periksa lagi data Anda" />

      <Section title="KTP Anda" onEdit={kyc === 'basic' ? () => flow.go('ob-ktp-form') : undefined}>
        <KtpArt />
        <div className="mt-8">
          <DataRow label="NIK" value="3171234567890123" />
          <DataRow label="Nama di KTP" value="Widyasari" />
          <DataRow label="Tanggal lahir" value="12 Des 1990" />
          <DataRow label="Nama ibu kandung" value="Siti Jenap" />
        </div>
      </Section>

      <Section title="Foto wajah">
        <div className="w-120">
          <FaceArt />
        </div>
      </Section>

      <Section title="Pekerjaan" onEdit={() => flow.go('ob-occupation')}>
        <DataRow label="Pekerjaan" value="Wiraswasta / Pedagang" />
        <DataRow label="Penghasilan" value="Rp3 – 5 juta" />
        <DataRow label="Sumber dana" value="Hasil usaha" />
        <DataRow label="Tujuan" value="Terima pencairan pinjaman" />
      </Section>

      <Section title="Alamat surat-menyurat" onEdit={() => flow.go('ob-address')}>
        <p className="text-14 text-default">Sama dengan alamat KTP</p>
      </Section>

      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('ob-terms')}>
          Data Sudah Benar
        </Button>
      </BottomAction>
    </Screen>
  )
}

function Section({ title, onEdit, children }: { title: string; onEdit?: () => void; children: ReactNode }) {
  return (
    <Card>
      <div className="mb-12 flex items-center justify-between">
        <p className="text-16 font-bold text-default">{title}</p>
        {onEdit ? (
          <button type="button" onClick={onEdit} className="text-14 font-bold text-link">
            Ubah
          </button>
        ) : null}
      </div>
      {children}
    </Card>
  )
}
