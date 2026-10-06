'use client'

// The live AmarthaFin homepage (projects/amarthafin-live, no-loan state) with
// one thing changed: the wallet slot. Before the account exists it is the
// live Poket widget plus a card for the account's current stage; once the account
// is active the Poket widget gives way to one combined balance.

import { useState } from 'react'
import { Badge, Button, Card, NavigationBar, OfferCard } from '@/design-system/components'
import { NavIcon, ServiceIcon } from '@/design-system/assets'
import {
  ArrowRight,
  Bank,
  ChatCircleQuestion,
  ChevronDown,
  ChevronUp,
  Eye,
  Headset,
  Hourglass,
  Link,
  Plus,
  Star,
  StarFill,
  Transfer,
  WarningCircle,
} from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  ACCOUNT_NAME,
  BAND_FILL,
  BrandBand,
  BrandHeader,
  PoketWidget,
  QuickLink,
  SectionTitle,
  Shortcut,
  WalletAction,
} from '../lib/ui'
import { store, useBankState } from '../lib/store'

export function HomeScreen() {
  const flow = useFlow()
  const { account } = useBankState()
  const openPoket = () => {
    store.set({ poketTier: 'non-premium' })
    flow.go('poket-detail')
  }

  return (
    <Screen statusBar="none" canvas="white" chromeClassName={BAND_FILL} topBar={<BrandHeader />}>
      <BrandBand>
        {account === 'active' ? <UnifiedBalance /> : <PoketWidget balance="Rp160.000" onOpen={openPoket} />}
      </BrandBand>

      {account === 'none' ? <OpenAccountCard /> : null}
      {account === 'none' ? <BindLink /> : null}
      {account === 'in-progress' ? <InProgressCard /> : null}
      {account === 'failed' ? <FailedCard /> : null}

      <ShortcutRow />

      <SectionTitle showArrow={false}>Rekomendasi Untuk Anda</SectionTitle>
      <OfferCard
        product="modal"
        title="Modal usaha hingga Rp30 juta"
        description="Syarat ringan, cair cepat, tidak perlu jaminan."
        onClick={() => flow.go('modal-disbursement')}
      />
      <OfferCard
        product="celengan"
        title="Penempatan dana dari Rp10.000"
        description="Dananya tumbuh dan bisa ditarik kapan pun."
      />

      <div className="flex gap-12">
        <QuickLink icon={<ChatCircleQuestion size={20} />} label="Tanya Jawab" />
        <QuickLink icon={<Headset size={20} />} label="AmarthaCare" />
      </div>

      <div className="pb-16 text-center">
        <p className="text-10 text-caption">Berizin &amp; Diawasi oleh</p>
        <p className="mt-2 text-10 font-bold text-default">Otoritas Jasa Keuangan</p>
      </div>

      <div className="sticky bottom-0 -mx-16 mt-auto">
        <NavigationBar
          items={[
            { id: 'home', label: 'Home', icon: <NavIcon name="home" active />, active: true },
            { id: 'pinjaman', label: 'Pinjaman', icon: <NavIcon name="modal" /> },
            { id: 'scan', label: 'Scan', icon: <NavIcon name="scan" /> },
            { id: 'celengan', label: 'Celengan', icon: <NavIcon name="celengan" /> },
            {
              id: 'transaksi',
              label: 'Transaksi',
              icon: <NavIcon name="transaction" />,
              onClick: () => flow.go('history'),
            },
          ]}
        />
      </div>
    </Screen>
  )
}

// The wallet once the account is active: one number for Poket + account (PRD
// C: "single/combined balance"), with the split one tap away instead of in a
// tooltip, since the split is the thing a user will want to check.
export function UnifiedBalance() {
  const flow = useFlow()
  const { status, persona } = useBankState()
  const [open, setOpen] = useState(false)
  // Premium Poket: a Modal borrower holds a Mitra Amartha account; a regular
  // user who opened a Rekening holds a single Premium Plus wallet.
  const openPoket = () => {
    store.set({ poketTier: persona === 'borrower' ? 'premium-mitra' : 'premium-non-mitra' })
    flow.go('poket-detail')
  }
  return (
    <div className="rounded-16 border border-default bg-gradient-to-r from-neutral-white to-primary-50 p-12">
      <div className="flex items-center gap-16">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={openPoket}
            className="flex items-center gap-4 text-14 font-bold text-primary-500"
          >
            Total Saldo
            <ArrowRight size={16} />
          </button>
          <div className="mt-4 flex items-center gap-8">
            <span className="text-16 font-bold text-default">Rp24.160.000</span>
            <Eye size={16} className="text-default" />
          </div>
        </div>
        <WalletAction icon={<Plus size={16} />} label="Isi Saldo" onClick={() => flow.go('topup')} />
        <WalletAction icon={<Transfer size={16} />} label="Transfer" />
      </div>

      {status !== 'active' ? (
        <button
          type="button"
          onClick={() => flow.go('balance-detail')}
          className={`mt-8 flex w-full items-center gap-8 rounded-8 px-8 py-4 text-left text-12 text-default ${
            status === 'dormant' ? 'bg-orange-50' : 'bg-red-50'
          }`}
        >
          <WarningCircle size={16} className={status === 'dormant' ? 'text-orange-500' : 'text-red-500'} />
          <span className="flex-1">
            {status === 'dormant' ? 'Rekening tidak aktif. Isi saldo untuk mengaktifkan.' : 'Rekening dibekukan sementara.'}
          </span>
          <ArrowRight size={16} />
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-8 flex items-center gap-4 text-12 text-caption"
      >
        Gabungan {ACCOUNT_NAME} &amp; Poket
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open ? (
        <div className="mt-8 flex flex-col gap-4 border-t border-default pt-8 text-12">
          <div className="flex justify-between">
            <span className="text-caption">{ACCOUNT_NAME}</span>
            <span className="font-bold text-default">Rp24.000.000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-caption">Poket</span>
            <span className="font-bold text-default">Rp160.000</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function OpenAccountCard() {
  const flow = useFlow()
  return (
    <div className="relative overflow-hidden rounded-16 bg-gradient-to-br from-primary-400 to-primary-700 p-16 text-neutral-white">
      <StarFill size={24} className="absolute -right-4 -top-4 text-orange-400" />
      <StarFill size={16} className="absolute right-32 top-12 text-yellow-300" />
      <Star size={20} className="absolute bottom-48 right-12 text-primary-200" />
      <div className="flex gap-12">
        <span className="flex h-48 w-48 shrink-0 items-center justify-center rounded-full bg-neutral-white text-primary-500">
          <Bank size={24} />
        </span>
        <div className="min-w-0 flex-1 pr-24">
          <div className="flex items-center gap-8">
            <p className="text-16 font-bold">Upgrade Poket Premium Plus</p>
            <Badge intent="orange" size="sm">
              Baru
            </Badge>
          </div>
          <p className="mt-4 text-12 text-primary-50">
            Nikmati semua fitur Poket: simpan saldo tanpa batas dan terima pencairan langsung. Gratis, cukup 5 menit.
          </p>
        </div>
      </div>
      <div className="mt-16">
        <Button variant="secondary" size="sm" className="w-full" onClick={() => flow.go('ob-intro')}>
          Upgrade Sekarang
        </Button>
      </div>
    </div>
  )
}

function InProgressCard() {
  return (
    <Card>
      <div className="flex gap-12">
        <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
          <Hourglass size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-8">
            <p className="text-14 font-bold text-default">Rekening sedang dibuat</p>
            <Badge intent="orange" size="sm">
              Diproses
            </Badge>
          </div>
          <p className="mt-4 text-12 text-caption">
            Kami kabari lewat notifikasi begitu rekening Anda siap, paling lambat 1 hari kerja.
          </p>
        </div>
      </div>
    </Card>
  )
}

function FailedCard() {
  const flow = useFlow()
  return (
    <Card>
      <div className="flex gap-12">
        <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
          <WarningCircle size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-8">
            <p className="text-14 font-bold text-default">Rekening gagal dibuat</p>
            <Badge intent="red" size="sm">
              Gagal
            </Badge>
          </div>
          <p className="mt-4 text-12 text-caption">Data KTP tidak cocok dengan data Dukcapil.</p>
        </div>
      </div>
      <div className="mt-12">
        <Button variant="outline" size="sm" className="w-full" onClick={() => flow.go('ob-rejected')}>
          Lihat Detail
        </Button>
      </div>
    </Card>
  )
}

// The live PPOB shortcut row (amarthafin-live, no-agency state). Pulsa leads
// into the one payment this prototype uses to show the account PIN.
function ShortcutRow() {
  const flow = useFlow()
  return (
    <div className="-mx-16 flex items-start justify-between p-16">
      <button type="button" className="flex flex-1" onClick={() => flow.go('ppob-pulsa')}>
        <Shortcut icon={<ServiceIcon name="pulsa" size={32} />} label="Pulsa" />
      </button>
      <Shortcut icon={<ServiceIcon name="paket-data" size={32} />} label="Paket Data" />
      <Shortcut icon={<ServiceIcon name="pln" size={32} />} label="PLN" />
      <Shortcut icon={<ServiceIcon name="e-wallet" size={32} />} label="Isi E-Wallet" />
      <Shortcut icon={<ServiceIcon name="all" size={32} />} label="Lainnya" />
    </div>
  )
}

// Existing Aladin customers link instead of opening a second account (PRD B).
function BindLink() {
  const flow = useFlow()
  return (
    <button
      type="button"
      onClick={() => flow.go('bind-intro')}
      className="-mt-4 flex items-center justify-center gap-8 text-12 text-caption"
    >
      <Link size={16} className="text-link" />
      Sudah punya rekening Bank Aladin Syariah?
      <span className="font-bold text-link">Hubungkan</span>
    </button>
  )
}
