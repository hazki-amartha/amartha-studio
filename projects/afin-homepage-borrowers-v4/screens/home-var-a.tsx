'use client'

// Home Var A — "Potensi naik limit hingga" card as linear progress bars.
// Everything else (header, Poket widget, Majelis card, recommendations, nav)
// is unchanged from Home. See lib/limit-card-variants.tsx.

import { NavigationBar, OfferCard } from '@/design-system/components'
import { NavIcon } from '@/design-system/assets'
import { Screen } from '@/platform/primitives'
import { LimitCardProgress } from '../lib/limit-card-variants'
import {
  BAND_FILL,
  BrandBand,
  BrandHeader,
  PoketWidget,
  StatCell,
  StatCellDivider,
  StatDivider,
  StatusCard,
  StatusCardHeader,
  StatusRow,
} from '../lib/ui'

export function HomeVarAScreen() {
  return (
    <Screen
      statusBar="none"
      canvas="white"
      chromeClassName={BAND_FILL}
      topBar={<BrandHeader />}
    >
      <BrandBand>
        <PoketWidget balance="Rp0" />
      </BrandBand>

      <LimitCardProgress />

      <StatusCard>
        <StatusCardHeader>
          <div className="flex items-end justify-between gap-8">
            <div className="flex flex-1 flex-col">
              <p className="text-12 font-medium text-default">Misi Majelis ke-1</p>
              <p className="text-14 font-bold text-default">Dapat cair tambahan</p>
            </div>
            <p className="whitespace-nowrap text-14 font-bold text-default">Rp1jt 🎁</p>
          </div>
        </StatusCardHeader>

        <StatusRow label="Kondisi majelis:" />

        <p className="text-12 text-default">
          Ajak semua anggota bayar lancar selama 12 minggu, agar dapat cair tambahan.{' '}
          <span className="font-bold text-primary-500">Lihat tugas</span>
        </p>

        <StatDivider />

        <div className="flex items-center gap-16">
          <StatCell label="Lama pinjaman:" value="1" unit="dari 12 minggu" />
          <StatCellDivider />
          <StatCell label="Anggota bayar lancar:" value="15" unit="orang" />
        </div>

        <p className="text-center text-12 font-bold text-primary-500">Lihat misi majelis lainnya</p>
      </StatusCard>

      <div className="border-t border-default" />

      <p className="text-16 font-bold text-default">Rekomendasi Untuk Anda</p>

      <OfferCard
        product="celengan"
        title="Penempatan dana dari Rp10.000"
        description="Dananya tumbuh dan bisa ditarik kapan pun."
      />
      <OfferCard
        product="amartha-link"
        title="Mulai jualan pulsa, listrik,"
        description="dengan biaya paling murah!"
      />

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
