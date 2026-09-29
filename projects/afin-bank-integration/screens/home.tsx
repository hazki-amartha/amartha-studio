'use client'

// The live AmarthaFin homepage (projects/amarthafin-live, no-loan state) with
// one thing changed: the wallet slot. Before the account exists it is the
// live Poket widget plus a card for the account's current stage; once the account
// is active the Poket widget gives way to one combined balance.

import { useState } from 'react'
import { Badge, Button, Card, NavigationBar, OfferCard } from '@/design-system/components'
import { NavIcon } from '@/design-system/assets'
import {
  ArrowRight,
  Bank,
  ChatCircleQuestion,
  ChevronDown,
  ChevronUp,
  Eye,
  Headset,
  Hourglass,
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
  WalletAction,
} from '../lib/ui'
import { useBankState } from '../lib/store'

export function HomeScreen() {
  const { account } = useBankState()

  return (
    <Screen statusBar="none" canvas="white" chromeClassName={BAND_FILL} topBar={<BrandHeader />}>
      <BrandBand>
        {account === 'active' ? <UnifiedBalance /> : <PoketWidget balance="Rp160.000" />}
      </BrandBand>

      {account === 'none' ? <OpenAccountCard /> : null}
      {account === 'in-progress' ? <InProgressCard /> : null}
      {account === 'failed' ? <FailedCard /> : null}

      <SectionTitle showArrow={false}>Rekomendasi Untuk Anda</SectionTitle>
      <OfferCard
        product="modal"
        title="Modal usaha hingga Rp30 juta"
        description="Syarat ringan, cair cepat, tidak perlu jaminan."
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
            { id: 'transaksi', label: 'Transaksi', icon: <NavIcon name="transaction" /> },
          ]}
        />
      </div>
    </Screen>
  )
}

// The wallet once the account is active: one number for Poket + account (PRD
// C: "single/combined balance"), with the split one tap away instead of in a
// tooltip, since the split is the thing a user will want to check.
function UnifiedBalance() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-16 border border-default bg-gradient-to-r from-neutral-white to-primary-50 p-12">
      <div className="flex items-center gap-16">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-4 text-14 font-bold text-primary-500">
            Total Saldo
            <ArrowRight size={16} />
          </div>
          <div className="mt-4 flex items-center gap-8">
            <span className="text-16 font-bold text-default">Rp24.160.000</span>
            <Eye size={16} className="text-default" />
          </div>
        </div>
        <WalletAction icon={<Plus size={16} />} label="Isi Saldo" />
        <WalletAction icon={<Transfer size={16} />} label="Transfer" />
      </div>

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
            <p className="text-16 font-bold">Buka {ACCOUNT_NAME}</p>
            <Badge intent="orange" size="sm">
              Baru
            </Badge>
          </div>
          <p className="mt-4 text-12 text-primary-50">
            Simpan saldo tanpa batas dan terima pencairan langsung. Gratis, cukup 5 menit.
          </p>
        </div>
      </div>
      <div className="mt-16">
        <Button variant="secondary" size="sm" className="w-full" onClick={() => flow.go('ob-intro')}>
          Buka Rekening Sekarang
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
