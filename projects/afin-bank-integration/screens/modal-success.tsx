'use client'

// The end of the Modal onboarding. Two states on the switcher:
//   • Terkirim  — application submitted, under review (account not yet opened).
//   • Disetujui — approved: Modal is active AND the white-labelled Rekening
//     Amartha opens with it (the key logic). "Lihat Beranda" then shows the
//     regular home, where that account is live.

import { Button, NavigationHeader } from '@/design-system/components'
import { Bank, CheckCircleFill, HandCoins, Hourglass } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction } from '../lib/ui'
import { store, useBankState } from '../lib/store'

export function ModalSuccessScreen() {
  const flow = useFlow()
  const { account } = useBankState()
  const approved = account === 'active'

  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Pengajuan Modal" hideBack />}>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span
          className={`flex h-80 w-80 items-center justify-center rounded-full ${
            approved ? 'bg-primary-50 text-primary-500' : 'bg-orange-50 text-orange-500'
          }`}
        >
          {approved ? <HandCoins size={24} /> : <Hourglass size={24} />}
        </span>
        <h1 className="mt-16 text-20 font-bold text-default">
          {approved ? 'Selamat, Modal Anda aktif!' : 'Pengajuan Modal terkirim'}
        </h1>
        <p className="mt-8 text-14 text-caption">
          {approved
            ? 'Pengajuan disetujui. Rekening Amartha Anda otomatis dibuka untuk menerima pencairan.'
            : 'Tim Amartha akan meninjau data Anda. Kami kabari lewat notifikasi, paling lambat 2 hari kerja.'}
        </p>

        {approved ? (
          <div className="mt-24 w-full rounded-12 border border-default p-16 text-left">
            <div className="flex items-center gap-12">
              <CheckCircleFill size={20} className="shrink-0 text-green-500" />
              <span className="flex-1 text-14 text-default">Modal Usaha aktif</span>
            </div>
            <div className="mt-12 flex items-center gap-12">
              <span className="text-primary-500"><Bank size={20} /></span>
              <span className="flex-1 text-14 text-default">Rekening Amartha dibuka</span>
              <CheckCircleFill size={20} className="shrink-0 text-green-500" />
            </div>
          </div>
        ) : null}
      </div>

      <BottomAction>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => {
            // Approved → land on the regular home, where the opened account shows.
            if (approved) store.set({ persona: 'regular' })
            flow.go('modal-home')
          }}
        >
          {approved ? 'Lihat Beranda' : 'Kembali ke Beranda'}
        </Button>
      </BottomAction>
    </Screen>
  )
}
