'use client'

// For users who already bank with Aladin: link the existing account instead of
// opening a second one (PRD B). The one place the bank is named — an existing
// customer has to recognise which account we mean.

import { Button, NavigationHeader } from '@/design-system/components'
import { ArrowsLeftRight, Bank, Link, ShieldCheck, Wallet } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, PageTitle } from '../lib/ui'
import { store } from '../lib/store'

const POINTS = [
  { icon: <Wallet size={20} />, title: 'Saldo tampil di AmarthaFin', body: 'Saldo rekening dan Poket dijumlah jadi satu di beranda.' },
  { icon: <ArrowsLeftRight size={20} />, title: 'Bayar langsung dari rekening', body: 'Pulsa, tagihan, dan cicilan tanpa pindah aplikasi.' },
  { icon: <ShieldCheck size={20} />, title: 'Data tetap aman', body: 'Nomor rekening dan saldo Anda tidak berubah.' },
]

export function BindIntroScreen() {
  const flow = useFlow()
  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Hubungkan Rekening" onBack={flow.back} />}>
      <div className="flex h-120 items-center justify-center gap-12 rounded-16 bg-gradient-to-br from-primary-50 to-primary-200 text-primary-500">
        <Bank size={24} />
        <Link size={20} />
        <Wallet size={24} />
      </div>
      <PageTitle
        title="Hubungkan rekening Bank Aladin Syariah Anda"
        description="Sudah punya rekening di Bank Aladin Syariah? Hubungkan ke AmarthaFin, tidak perlu buka rekening baru."
      />
      <div className="flex flex-col gap-12">
        {POINTS.map((p) => (
          <div key={p.title} className="flex gap-12">
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
              {p.icon}
            </span>
            <div>
              <p className="text-14 font-bold text-default">{p.title}</p>
              <p className="text-12 text-caption">{p.body}</p>
            </div>
          </div>
        ))}
      </div>
      <BottomAction>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => {
            store.set({ journey: 'bind' })
            flow.go('bind-form')
          }}
        >
          Hubungkan Rekening
        </Button>
      </BottomAction>
    </Screen>
  )
}
