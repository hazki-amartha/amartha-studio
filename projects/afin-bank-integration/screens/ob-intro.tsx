'use client'

import { Button, Card } from '@/design-system/components'
import { Bank, CoinTwoHands, IdentificationCard, LightbulbFilament, ShieldCheck, Wallet } from '@/design-system/icons'
import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ACCOUNT_NAME, BottomAction, PageTitle, STAGES } from '../lib/ui'
import { useBankState } from '../lib/store'

const BENEFITS = [
  { icon: <Wallet size={20} />, title: 'Simpan saldo tanpa batas', body: 'Tidak ada batas Rp20 juta seperti Poket.' },
  { icon: <CoinTwoHands size={20} />, title: 'Pencairan pasti masuk', body: 'Pinjaman dicairkan langsung ke rekening ini.' },
  { icon: <ShieldCheck size={20} />, title: 'Aman & dijamin LPS', body: 'Rekening bank resmi, diawasi OJK.' },
]

export function ObIntroScreen() {
  const flow = useFlow()
  const { kyc } = useBankState()

  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Buka Rekening" onBack={flow.back} />}>
      <div className="flex h-120 items-center justify-center rounded-16 bg-gradient-to-br from-primary-50 to-primary-200 text-primary-500">
        <Bank size={24} />
      </div>
      <PageTitle
        title={`${ACCOUNT_NAME}, langsung dari AmarthaFin`}
        description="Semua transaksi tetap di aplikasi ini, tanpa perlu pindah ke aplikasi bank."
      />

      <div className="flex flex-col gap-12">
        {BENEFITS.map((b) => (
          <div key={b.title} className="flex gap-12">
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
              {b.icon}
            </span>
            <div>
              <p className="text-14 font-bold text-default">{b.title}</p>
              <p className="text-12 text-caption">{b.body}</p>
            </div>
          </div>
        ))}
      </div>

      <Card className="border border-default">
        <p className="text-14 font-bold text-default">4 langkah, sekitar 5 menit</p>
        <ol className="mt-8 flex flex-col gap-8">
          {STAGES.map((s, i) => (
            <li key={s} className="flex items-center gap-8 text-14 text-default">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-500 text-10 font-bold text-neutral-white">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </Card>

      <div className="flex items-start gap-8 rounded-12 bg-blue-50 p-12 text-12 text-default">
        {kyc === 'verified' ? (
          <>
            <IdentificationCard size={20} className="shrink-0 text-blue-500" />
            Data KTP dan foto Anda di AmarthaFin sudah terverifikasi, jadi tidak perlu difoto ulang.
          </>
        ) : (
          <>
            <LightbulbFilament size={20} className="shrink-0 text-blue-500" />
            Siapkan KTP asli dan cari tempat yang terang untuk foto KTP dan verifikasi wajah.
          </>
        )}
      </div>

      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('ob-contact')}>
          Mulai Buka Rekening
        </Button>
      </BottomAction>
    </Screen>
  )
}
