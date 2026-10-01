'use client'

// AFin Homepage for Borrowers — Figma "AFin Homepage for Borrowers (Q3 26 Core)",
// node 2523:104631. Header, brand band and Poket widget match the shipped
// homepage (projects/amarthafin-live) per CLAUDE.md's homepage rule; the loan
// status cards below them are unique to this prototype.

import { NavigationBar, OfferCard } from '@/design-system/components'
import { NavIcon } from '@/design-system/assets'
import { Screen } from '@/platform/primitives'
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

export function HomeScreen() {
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

      <StatusCard>
        <StatusCardHeader>
          <p className="text-12 font-medium text-default">Limit saat ini: Rp5.000.000</p>
          <div className="flex items-center gap-8">
            <p className="flex-1 text-14 font-bold text-default">Potensi naik limit hingga</p>
            <p className="whitespace-nowrap text-14 font-bold text-default">Rp6jt-8jt 🎉</p>
          </div>
        </StatusCardHeader>

        <StatusRow label="Kondisi pinjaman:" />

        <p className="text-12 text-default">
          Bagus! Minggu pertama lancar, pertahankan untuk 47 minggu lagi, agar dapat limit baru.{' '}
          <span className="font-bold text-primary-500">Lihat detail</span>
        </p>

        <StatDivider />

        <div className="flex items-center gap-16">
          <StatCell label="Bayar angsuran:" value="1" unit="dari 48 minggu" />
          <StatCellDivider />
          <StatCell label="Hadir kumpulan:" value="1" unit="dari 48 minggu" />
        </div>
      </StatusCard>

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
