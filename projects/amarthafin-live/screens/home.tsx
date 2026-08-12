'use client'

// Live reference: the current AmarthaFin homepage, rebuilt in FunDS Lite from
// the shipped Figma file (nodes 190:4595 and 203:9950). One page, two shipped
// states — see lib/store.ts. The states differ in exactly two places:
//
//   PPOB section  — a five-shortcut strip, or the expanded AmarthaLink agent
//                   widget (countdown, timed offers, the agent's own menu).
//   Modal section — the limit-usage card when a loan is running, and otherwise
//                   nothing here plus a Modal card in the recommendations.
//
// Everything below those two is identical in both. Static, like every screen in
// this project: it documents production, it isn't a click-through.

import { Button, Card, NavigationBar, OfferCard } from '@/design-system/components'
import { NavIcon, ProductLogo, ServiceIcon, Wordmark } from '@/design-system/assets'
import {
  ArrowRight,
  ChatCircleQuestion,
  ChevronUp,
  Headset,
  LightningFill,
  Voucher,
} from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import {
  BAND_FILL,
  BrandBand,
  BrandHeader,
  Countdown,
  MenuTile,
  PageStrip,
  PoketWidget,
  ProgressBar,
  PromoTile,
  QuickLink,
  SectionTitle,
  Shortcut,
} from '../lib/ui'
import { useHomeState } from '../lib/store'

export function AmarthaFinHomeScreen() {
  const { modalActive, amarthaLinkActive } = useHomeState()

  return (
    <Screen
      statusBar="none"
      canvas="white"
      // The greeting row is chrome, so it rides in Screen's pinned slot and
      // stays put while the page scrolls under it; the fill is on the slot so
      // the purple reaches the top of the display.
      chromeClassName={BAND_FILL}
      topBar={<BrandHeader />}
    >
      <BrandBand>
        <PoketWidget balance="Rp160.000" />
      </BrandBand>

      {/* --- PPOB section ------------------------------------------------- */}
      {amarthaLinkActive ? <AmarthaLinkWidget /> : <ShortcutRow />}

      {/* --- Modal section ------------------------------------------------- */}
      {modalActive ? <ModalLimitCard /> : null}

      <SectionTitle showArrow={false}>Rekomendasi Untuk Anda</SectionTitle>

      {modalActive ? null : (
        <OfferCard
          product="modal"
          title="Modal usaha hingga Rp30 juta"
          description="Syarat ringan, cair cepat, tidak perlu jaminan."
        />
      )}
      <OfferCard
        product="ggs"
        title="Imbal hasil optimal dan bermakna"
        description="Diversifikasi aset ke usaha mikro terpilih, keuntungan lebih besar."
      />
      <OfferCard
        product="celengan"
        title="Penempatan dana dari Rp10.000"
        description="Dananya tumbuh dan bisa ditarik kapan pun."
      />
      {amarthaLinkActive ? null : (
        <OfferCard
          product="amartha-link"
          title="Mulai jualan pulsa, listrik,"
          description="dengan biaya paling murah!"
        />
      )}

      <SectionTitle>Promo menarik untuk Anda</SectionTitle>

      {/* Banner carousel. The shipped page runs five artwork banners; the peek
          of the next one is what tells the viewer it scrolls, so the second
          card is a deliberate sliver rather than a second full banner. */}
      <div>
        <div className="-mx-16 flex gap-8 overflow-x-auto px-16">
          <div className="w-full shrink-0 rounded-16 bg-gradient-to-br from-primary-500 to-primary-700 p-16 text-neutral-white">
            <p className="text-12">Isi Poket minimal 100 ribu sebanyak 6 kali</p>
            <p className="mt-4 text-24 font-bold">10 ribu</p>
            <p className="mt-4 text-12">Bonus</p>
          </div>
          <div className="w-40 shrink-0 rounded-16 bg-gradient-to-br from-orange-400 to-orange-600" />
        </div>
        <div className="mt-8">
          <PageStrip count={5} active={0} />
        </div>
      </div>

      <div className="flex gap-12">
        <QuickLink icon={<ChatCircleQuestion size={20} />} label="Tanya Jawab" />
        <QuickLink icon={<Headset size={20} />} label="AmarthaCare" />
      </div>

      <p className="text-center text-10 text-caption">
        Terms &amp; Conditions &nbsp;•&nbsp; Privacy Policy
      </p>

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

// The PPOB section for a Mitra with no agency: five bordered shortcuts. Figma
// pads this band 16px on its own, inside the page padding, and its white fill
// is the page's own colour — so only the padding is left to carry.
function ShortcutRow() {
  return (
    <div className="-mx-16 flex items-start justify-between p-16">
      <Shortcut icon={<ServiceIcon name="pulsa" size={32} />} label="Pulsa" />
      <Shortcut icon={<ServiceIcon name="paket-data" size={32} />} label="Paket Data" />
      <Shortcut icon={<ServiceIcon name="pln" size={32} />} label="PLN" />
      <Shortcut icon={<ServiceIcon name="e-wallet" size={32} />} label="Isi E-Wallet" />
      <Shortcut icon={<ServiceIcon name="all" size={32} />} label="Lainnya" />
    </div>
  )
}

// The PPOB section for an active AmarthaLink agent. One card holds two panels:
// the tinted cashback header and the white agent menu below it, which is why
// the border and radius live on the wrapper rather than on either panel.
function AmarthaLinkWidget() {
  return (
    <div className="overflow-hidden rounded-16 border border-default">
      <div className="bg-gradient-to-b from-primary-50 to-neutral-white p-12">
        <div className="flex items-center justify-between gap-8">
          <span className="flex items-center gap-4">
            <ProductLogo name="amartha-link" size={24} />
            <span className="text-16 font-bold text-primary-500">amarthalink</span>
          </span>
          <ChevronUp size={20} className="text-caption" />
        </div>

        <div className="mt-12 flex items-center gap-4">
          <LightningFill size={16} className="text-red-500" />
          <Countdown hours="23" minutes="59" seconds="59" />
        </div>

        <div className="mt-8 flex items-stretch gap-8">
          <PromoTile icon="paket-data" label="Bebas Puas 2rb/hr 1 hari" price="Rp2.098" />
          <PromoTile icon="pulsa" label="Telp 90 menit semua opera..." price="Rp4.610" />
          <PromoTile icon="e-wallet" label="Smartfren 10.000" price="Rp11.150" />
        </div>

        <button
          type="button"
          className="mt-12 flex w-full items-center justify-center gap-8 text-14 font-bold text-primary-500"
        >
          <Voucher size={20} />
          Lihat Promo Lainnya
        </button>
      </div>

      <div className="grid grid-cols-4 gap-8 bg-neutral-white p-12">
        <MenuTile icon="kirim-uang" label="Kirim Uang" badge="Gratis" />
        <MenuTile icon="e-wallet" label="Dana Gopay" />
        <MenuTile icon="pln" label="Listrik" />
        <MenuTile icon="pulsa" label="Pulsa" />
        <MenuTile icon="paket-data" label="Paket Data" />
        <MenuTile icon="pdam" label="PDAM" />
        <MenuTile icon="bpjs" label="BPJS" />
        <MenuTile icon="top-up-game" label="Top Up Game" />
        <MenuTile icon="cicilan-kredit" label="Cicilan Kredit" />
        <MenuTile icon="tarik-tunai" label="Tarik Tunai" />
        <MenuTile icon="laporan-keuangan" label="Laporan Keuangan" />
      </div>
    </div>
  )
}

/** The Modal section when a loan is running: limit used, and the next due date. */
function ModalLimitCard() {
  return (
    <Card>
      <div className="flex items-center gap-4 text-primary-500">
        <Wordmark name="modal" height={20} />
        <ArrowRight size={16} />
      </div>
      <p className="mt-12 text-12 text-caption">Sisa Limit Modal</p>
      <p className="text-16 font-bold text-default">Rp0</p>
      <p className="mt-4 text-14 text-caption">
        Terpakai (<span className="font-bold text-default">Rp7.000.000</span> / Rp7.000.000)
      </p>
      <div className="mt-8">
        <ProgressBar percent={100} />
      </div>
      <div className="mt-12 flex items-center justify-between gap-8">
        <div>
          <p className="text-12 text-caption">Jadwal Pembayaran</p>
          <p className="text-12 font-bold text-default">19 Agu 2024</p>
        </div>
        <Button variant="primary" size="sm">
          Bayar Sekarang
        </Button>
      </div>
    </Card>
  )
}
