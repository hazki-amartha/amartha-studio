'use client'

// Live reference: the current AmarthaFin homepage, rebuilt in FunDS Lite from
// the shipped Figma file (node 190:4595). Static — this is a source-of-truth
// screen, not a click-through, so nothing here navigates anywhere else.

import { Button, Card, NavigationBar } from '@/design-system/components'
import { ProductLogo, ServiceIcon, Wordmark } from '@/design-system/assets'
import {
  ArrowRight,
  ChatCircleQuestion,
  Clipboard,
  Coin,
  Eye,
  HandCoins,
  Headset,
  House,
  Plus,
  ScanFill,
  Transfer,
} from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { BrandBand, OfferCard, ProgressBar, QuickLink, SectionTitle, Shortcut } from '../lib/ui'

export function AmarthaFinHomeScreen() {
  return (
    <Screen statusBar="none" canvas="white">
      <BrandBand>
        <div className="flex items-center gap-16 rounded-16 border border-default bg-gradient-to-r from-neutral-white to-primary-50 p-12">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-4 text-primary-500">
              <Wordmark name="poket" height={20} />
              <ArrowRight size={16} />
            </div>
            <div className="mt-4 flex items-center gap-8">
              <span className="text-16 font-bold text-default">Rp100.000</span>
              <Eye size={16} className="text-default" />
            </div>
          </div>
          <WalletAction icon={<Plus size={16} />} label="Isi Saldo" />
          <WalletAction icon={<Transfer size={16} />} label="Transfer" />
        </div>
      </BrandBand>

      {/* Full-bleed row: Figma pads the PPOB band 16px on its own, inside the
          page padding. The band's white fill is the page's own colour now, so
          only the padding is left to carry. */}
      <div className="-mx-16 flex items-start justify-between p-16">
        <Shortcut icon={<ServiceIcon name="pulsa" size={32} />} label="Pulsa" />
        <Shortcut icon={<ServiceIcon name="paket-data" size={32} />} label="Paket Data" />
        <Shortcut icon={<ServiceIcon name="pln" size={32} />} label="PLN" />
        <Shortcut icon={<ServiceIcon name="e-wallet" size={32} />} label="Isi E-Wallet" />
        <Shortcut icon={<ServiceIcon name="all" size={32} />} label="Lainnya" />
      </div>

      <Card>
        <div className="flex items-center gap-4 text-primary-500">
          <Wordmark name="modal" height={20} />
          <ArrowRight size={16} />
        </div>
        <p className="mt-12 text-12 text-caption">Sisa Limit Modal</p>
        <p className="text-16 font-bold text-default">Rp0</p>
        <p className="mt-4 text-12 text-caption">
          Terpakai (<span className="font-bold text-default">Rp7.000.000</span> /
          Rp7.000.000)
        </p>
        <div className="mt-8">
          <ProgressBar percent={100} />
        </div>
        <div className="mt-12 flex items-center justify-between gap-8">
          <div>
            <p className="text-10 text-caption">Jadwal Pembayaran</p>
            <p className="text-12 font-bold text-default">19 Agu 2024</p>
          </div>
          <Button variant="outline" size="sm">
            Bayar Sekarang
          </Button>
        </div>
      </Card>

      <SectionTitle>Mulai Gunakan AmarthaFin</SectionTitle>

      <OfferCard
        tone="green"
        title="Imbal hasil optimal dan bermakna"
        description="Diversifikasi aset ke usaha mikro terpilih, keuntungan lebih besar."
        logo={<ProductLogo name="ggs" size={24} />}
      />
      <OfferCard
        tone="green"
        title="Penempatan dana dari Rp10.000"
        description="Dananya tumbuh dan bisa ditarik kapan pun."
        logo={<ProductLogo name="celengan" size={24} />}
      />
      <OfferCard
        tone="orange"
        title="Mulai jualan pulsa, listrik, dengan biaya paling murah!"
        description=""
        logo={<ProductLogo name="amartha-link" size={24} />}
      />

      <SectionTitle>Promo menarik untuk Anda</SectionTitle>
      <div className="rounded-16 bg-gradient-to-br from-primary-500 to-primary-700 p-16 text-neutral-white">
        <p className="text-14 font-bold">Isi Poket minimal 100 ribu sebanyak 6 kali</p>
        <p className="mt-4 text-12">Bonus 10 ribu</p>
      </div>

      <div className="flex gap-12">
        <QuickLink icon={<ChatCircleQuestion size={20} />} label="Tanya Jawab" />
        <QuickLink icon={<Headset size={20} />} label="AmarthaCare" />
      </div>

      <div className="pb-16 text-center">
        <p className="text-12 text-caption">Berizin &amp; Diawasi oleh</p>
        <p className="mt-2 text-12 font-bold text-default">Otoritas Jasa Keuangan</p>
      </div>

      <div className="sticky bottom-0 -mx-16 mt-auto">
        <NavigationBar
          items={[
            { id: 'home', label: 'Home', icon: <House size={24} />, active: true },
            { id: 'pinjaman', label: 'Pinjaman', icon: <HandCoins size={24} /> },
            { id: 'scan', label: 'Scan', icon: <ScanFill size={24} /> },
            { id: 'celengan', label: 'Celengan', icon: <Coin size={24} /> },
            { id: 'transaksi', label: 'Transaksi', icon: <Clipboard size={24} /> },
          ]}
        />
      </div>
    </Screen>
  )
}

function WalletAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex shrink-0 flex-col items-center gap-4">
      <span className="flex h-24 w-24 items-center justify-center rounded-8 bg-primary-500 text-neutral-white">
        {icon}
      </span>
      <span className="text-12 text-primary-500">{label}</span>
    </span>
  )
}
