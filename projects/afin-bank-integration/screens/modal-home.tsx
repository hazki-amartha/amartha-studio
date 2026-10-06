'use client'

// The homepage, driven by the state switcher. Two personas:
//   • Regular User → Hazki's original home, keyed by the bank account status.
//   • Modal (Borrower) → the live chrome with a Modal card that reflects where
//     the loan is in its lifecycle. Most stages are a nudge card; once the loan
//     is disbursed the card becomes a credit-limit summary (reference: image 5).

import { type ReactNode } from 'react'
import { Button, NavigationBar, OfferCard } from '@/design-system/components'
import { NavIcon, ServiceIcon, Wordmark } from '@/design-system/assets'
import { ArrowRight, CheckCircle, Hourglass, Warning } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  BAND_FILL,
  BrandBand,
  BrandHeader,
  PoketWidget,
  SectionTitle,
  Shortcut,
} from '../lib/ui'
import { store, useBankState, type ModalStage } from '../lib/store'
import { HomeScreen, UnifiedBalance } from './home'

type Tone = 'orange' | 'green' | 'neutral'

interface CardSpec {
  title: string
  sub: string
  nudge: string
  tone: Tone
  icon: ReactNode
  route: string
}

// Nudge-card copy for every stage except `dicairkan` (handled separately).
const CARD: Record<Exclude<ModalStage, 'dicairkan'>, CardSpec> = {
  'belum-kyc': {
    title: 'Foto KTP dan selfie',
    sub: 'Langkah 1 dari 6',
    nudge: 'Segera lengkapi biar cepat dapat Modal!',
    tone: 'orange',
    icon: <Warning size={16} />,
    route: 'modal-prepare',
  },
  'kyc-ongoing': {
    title: 'Data penanggung jawab',
    sub: 'Langkah 3 dari 6',
    nudge: 'Segera lengkapi biar cepat dapat Modal!',
    tone: 'orange',
    icon: <Warning size={16} />,
    route: 'modal-hub',
  },
  'kyc-gagal': {
    title: 'Kirim ulang pengajuan Anda',
    sub: 'Ada data yang perlu diperbaiki',
    nudge: 'Segera perbaiki biar cepat dapat Modal!',
    tone: 'orange',
    icon: <Warning size={16} />,
    route: 'modal-verify-failed',
  },
  'kyc-diproses': {
    title: 'Pengajuan Anda sedang diproses',
    sub: 'Data Anda sedang kami periksa',
    nudge: 'Tunggu kabar selanjutnya, ya!',
    tone: 'neutral',
    icon: <Hourglass size={16} />,
    route: 'modal-majelis',
  },
  'kyc-berhasil': {
    title: 'Modal Anda siap dicairkan!',
    sub: 'Rp3.000.000 siap masuk ke rekening Anda',
    nudge: 'Cairkan sekarang untuk terima dana.',
    tone: 'green',
    icon: <CheckCircle size={16} />,
    route: 'modal-disbursement',
  },
}

const NUDGE_TONE: Record<Tone, string> = {
  orange: 'bg-orange-50 text-orange-500',
  green: 'bg-green-50 text-green-500',
  neutral: 'bg-neutral-50 text-caption',
}

export function ModalHomeScreen() {
  const flow = useFlow()
  const { persona, modalStage, account } = useBankState()

  // Regular user → Hazki's original home, untouched.
  if (persona === 'regular') return <HomeScreen />

  const disbursed = modalStage === 'dicairkan'
  // Modal active (approved onwards) ⇒ the Rekening Amartha is open, so the wallet
  // shows the active account instead of the plain Poket widget.
  const rekeningAktif = account === 'active'

  return (
    <Screen statusBar="none" canvas="white" chromeClassName={BAND_FILL} topBar={<BrandHeader />}>
      <BrandBand>
        {rekeningAktif ? (
          <UnifiedBalance />
        ) : (
          <PoketWidget
            balance="Rp0"
            onOpen={() => {
              store.set({ poketTier: 'non-premium' })
              flow.go('poket-detail')
            }}
          />
        )}
      </BrandBand>

      <ShortcutRow />

      {disbursed ? <DisbursedCard onOpen={() => flow.go('modal-disbursement')} /> : <NudgeCard stage={modalStage} />}

      <SectionTitle showArrow={false}>Rekomendasi untuk Anda</SectionTitle>
      <OfferCard
        product="celengan"
        title="Simpan uangnya, berlipat untungnya!"
        description="Investasi minim resiko dengan banyak keuntungan."
      />
      <OfferCard
        product="amartha-link"
        title="Mulai jadi Agen"
        description="Bantu mitra bayar tagihan, dapatkan keuntungan."
      />

      <div className="sticky bottom-0 -mx-16 mt-auto">
        <NavigationBar
          items={[
            { id: 'home', label: 'Home', icon: <NavIcon name="home" active />, active: true },
            {
              id: 'pinjaman',
              label: 'Pinjaman',
              icon: <NavIcon name="modal" />,
              onClick: () => flow.go(disbursed ? 'modal-disbursement' : CARD[modalStage].route),
            },
            { id: 'scan', label: 'Scan', icon: <NavIcon name="scan" /> },
            { id: 'celengan', label: 'Celengan', icon: <NavIcon name="celengan" /> },
            { id: 'transaksi', label: 'Transaksi', icon: <NavIcon name="transaction" /> },
          ]}
        />
      </div>
    </Screen>
  )
}

function NudgeCard({ stage }: { stage: Exclude<ModalStage, 'dicairkan'> }) {
  const flow = useFlow()
  const spec = CARD[stage]
  return (
    <button
      type="button"
      onClick={() => flow.go(spec.route)}
      className="flex w-full flex-col gap-12 rounded-16 border border-default bg-neutral-white p-16 text-left"
    >
      <div className="flex items-center justify-between">
        <Wordmark name="modal" height={20} />
        <ArrowRight size={20} className="text-caption" />
      </div>
      <div>
        <p className="text-16 font-bold text-default">{spec.title}</p>
        <p className="mt-2 text-14 text-caption">{spec.sub}</p>
      </div>
      <div className={`flex items-center gap-8 rounded-8 px-12 py-8 text-12 ${NUDGE_TONE[spec.tone]}`}>
        <span className="shrink-0">{spec.icon}</span>
        <span className="font-bold">{spec.nudge}</span>
      </div>
    </button>
  )
}

// Disbursed loan: the credit-limit summary card (reference: image 5).
function DisbursedCard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="rounded-16 border border-default bg-neutral-white">
      <button type="button" onClick={onOpen} className="flex w-full items-center justify-between p-16">
        <Wordmark name="modal" height={20} />
        <ArrowRight size={20} className="text-caption" />
      </button>
      <div className="border-t border-default p-16">
        <p className="text-14 text-caption">Batas pinjaman</p>
        <p className="text-20 font-bold text-default">Rp6.000.000</p>
        <p className="mt-2 text-12 text-caption">
          Terpakai (<span className="font-bold text-default">Rp1.000.000</span> / Rp7.000.000)
        </p>
        <div className="mt-8 h-4 w-full overflow-hidden rounded-full bg-neutral-200">
          <span className="block h-full rounded-full bg-blue-500" style={{ width: '14%' }} />
        </div>
        <div className="mt-16 flex items-end justify-between">
          <div>
            <p className="text-12 text-caption">Bayar sebelum</p>
            <p className="text-14 font-bold text-default">19 Agu 2024</p>
          </div>
          <Button variant="outline" size="sm" onClick={onOpen}>
            Bayar Sekarang
          </Button>
        </div>
      </div>
    </div>
  )
}

// The live PPOB shortcut row (amarthafin-live, no-agency state).
function ShortcutRow() {
  return (
    <div className="-mx-16 flex items-start justify-between p-16">
      <Shortcut icon={<ServiceIcon name="pulsa" size={32} />} label="Pulsa" />
      <Shortcut icon={<ServiceIcon name="paket-data" size={32} />} label="Paket Data" />
      <Shortcut icon={<ServiceIcon name="pln" size={32} />} label="PLN" />
      <Shortcut icon={<ServiceIcon name="e-wallet" size={32} />} label="Isi E-Wallet" />
      <Shortcut icon={<ServiceIcon name="all" size={32} />} label="Semua" />
    </div>
  )
}
