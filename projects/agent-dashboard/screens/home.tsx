'use client'

// AmarthaLink — agent dashboard home. Ported from the standalone HTML prototype
// (wagent/agent-dashboard) into FunDS Lite. Sections, top to bottom:
//   1. Sales summary  — period toggle + one of three layouts + QRIS income
//   2. Agen Juara     — tier points + progress to the next tier
//   3. Misi           — point-earning missions (some with progress)
//   4. Promo & Program — sliding banners
//   5. Tambah Penghasilan — extra-earning opportunities
//   6. Pertanyaan Umum — FAQ shortcuts
//   7. Usahamu        — business settings
// The three sales-summary layouts and the QRIS-active condition are driven by
// the desktop state chips (see index.ts); the period toggle is a live control.

import { useState, type ReactNode } from 'react'
import { BottomSheet, Button, Card, NavigationHeader } from '@/design-system/components'
import {
  CalendarDots,
  ChartLineUp,
  ChatCircleQuestion,
  ChevronDown,
  ChevronRight,
  Coins,
  MapPin,
  Medal,
  QrCode,
  RpDoc,
  Users,
  Wallet,
  WarningCircle,
  Withdraw,
} from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { AgenJuaraCard } from '../lib/AgenJuaraCard'
import { DateFilterSheet, filterLabel, type CustomRange } from '../lib/DateFilter'
import { FIGURES } from '../lib/data'
import { store, useFlowState, type Period } from '../lib/store'
import { IconTile, InfoDot, LinkRow, ProgressBar, SectionTitle } from '../lib/ui'

export function HomeScreen() {
  const flow = useFlow()
  const { period, layout, qris, sheet, periodSheet } = useFlowState()
  const f = FIGURES[period]
  const openQris = () => store.set({ sheet: true })

  // "Tanggal lain" (custom range) has no bearing on FIGURES lookup — see
  // lib/store.ts — so the picked period/range live here, local to the sheet
  // and the calendar-input label rather than the shared flow state.
  const [dateFilter, setDateFilter] = useState<Period | 'custom'>(period)
  const [customRange, setCustomRange] = useState<CustomRange>(() => {
    const to = new Date()
    const from = new Date(to)
    from.setDate(from.getDate() - 1)
    return { from, to }
  })

  return (
    <Screen topBar={<NavigationHeader title="AmarthaLink" onBack={flow.back} />}>
      {/* ===== 1 · Sales summary ============================================ */}
      <div className="-mx-16 -mt-16 border-b border-default bg-canvas-blue p-16">
        {/* Wrapped in Card (not a raw div) so Inspect snaps the summary to a
            FunDS boundary instead of the whole Screen. flush + inline radius/
            padding keep the tighter tcard look (rounded-8, 4px). */}
        <Card flush style={{ borderRadius: 8, padding: 4 }}>
          {/* period — small calendar input, opens the period-picker sheet */}
          <div className="flex px-4 pt-8">
            <button
              type="button"
              onClick={() => store.set({ periodSheet: true })}
              className="inline-flex items-center gap-4 rounded-8 border border-default bg-neutral-white px-8 py-4 text-12 font-bold text-default"
            >
              <CalendarDots size={16} />
              {filterLabel(dateFilter, customRange)}
              <ChevronDown size={16} className="text-neutral-500" />
            </button>
          </div>

          {/* body — one of three layouts */}
          {layout === 1 ? (
            <Layout1 f={f} qris={qris === 'active'} onQris={openQris} />
          ) : layout === 2 ? (
            <Layout2 f={f} onQris={openQris} />
          ) : (
            <Layout3 f={f} onQris={openQris} />
          )}
        </Card>
      </div>

      {/* ===== 2 · Agen Juara =============================================== */}
      <AgenJuaraCard />

      {/* ===== 3 · Misi ===================================================== */}
      <section>
        <SectionTitle link="Cek riwayat poin">Jalankan misi, tingkatkan poin</SectionTitle>
        <Card flush>
          <MissionRow
            icon={<MapPin size={24} />}
            intent="purple"
            title="Lengkapi informasi lokasi agen"
            points="+50 poin"
            desc="Biar pelanggan gampang nemuin warung kamu"
            chevron
          />
          <MissionRow
            icon={<ChartLineUp size={24} />}
            intent="blue"
            title="Transaksi 100x bulan ini"
            points="+100 poin"
            progress={{ percent: 67, label: '67 dari 100 transaksi' }}
          />
          <MissionRow
            icon={<CalendarDots size={24} />}
            intent="green"
            title="Aktif jualan 20 hari"
            points="+80 poin"
            progress={{ percent: 90, label: '18 dari 20 hari' }}
          />
          <MissionRow
            icon={<Users size={24} />}
            intent="orange"
            title="Ajak 3 agen baru"
            points="+150 poin"
            progress={{ percent: 33, label: '1 dari 3 agen' }}
          />
        </Card>
      </section>

      {/* ===== 4 · Promo & Program ========================================= */}
      <section>
        <div className="-mx-16 flex snap-x snap-mandatory gap-12 overflow-x-auto px-16">
          {qris === 'inactive' ? (
            <Banner
              gradient="linear-gradient(135deg,var(--green-500),var(--green-700))"
              tag="Baru"
              title="Aktifkan terima pembayaran QRIS"
              desc="Pelanggan bisa bayar langsung di warung kamu"
            />
          ) : null}
          <Banner
            gradient="linear-gradient(135deg,var(--primary-500),var(--primary-700))"
            tag="Promo"
            title="Cashback 10% Token PLN"
            desc="Berlaku s/d 31 Juli · tanpa minimum"
          />
          <Banner
            gradient="linear-gradient(135deg,var(--orange-500),var(--orange-700))"
            tag="Program"
            title="Komisi ekstra tiap akhir pekan"
            desc="Sabtu–Minggu, komisi naik 20%"
          />
          <Banner
            gradient="linear-gradient(135deg,var(--blue-500),var(--blue-700))"
            tag="Event"
            title="Undian umrah untuk agen aktif"
            desc="Tiap 100 transaksi = 1 kupon"
          />
        </div>
      </section>

      {/* ===== 5 · Tambah Penghasilan ====================================== */}
      <section>
        <SectionTitle>Tambah Penghasilan</SectionTitle>
        <div className="flex flex-col gap-8">
          {qris === 'inactive' ? (
            <OppCard
              icon={<QrCode size={24} />}
              intent="blue"
              title="Terima pembayaran QRIS"
              desc="Pelanggan bayar pakai QRIS langsung di warung kamu"
            />
          ) : null}
          <OppCard
            icon={<Coins size={24} />}
            intent="green"
            title="Cashback belanja"
            desc="Transaksi Rp500rb minggu ini, dapat cashback Rp25rb"
          />
          <OppCard
            icon={<Users size={24} />}
            intent="purple"
            title="Ajak jadi Agen AmarthaLink"
            desc="Ajak keluarga/kenalan, dapat bonus Rp25rb per agen aktif"
          />
        </div>
      </section>

      {/* ===== 6 · Pertanyaan Umum ========================================= */}
      <section>
        <SectionTitle>Pertanyaan Umum</SectionTitle>
        <div className="grid grid-cols-2 gap-8">
          <FaqCard icon={<WarningCircle size={24} />} intent="red" q="Transaksi gagal tapi saldo terpotong?" />
          <FaqCard icon={<Wallet size={24} />} intent="blue" q="Cara isi saldo?" />
          <FaqCard icon={<Withdraw size={24} />} intent="green" q="Cara tarik komisi?" />
          <FaqCard icon={<Medal size={24} />} intent="purple" q="Cara naik tier?" />
          <button
            type="button"
            className="col-span-2 flex items-center gap-12 rounded-12 border border-primary-200 bg-primary-50 p-12 text-left"
          >
            <span className="flex size-40 shrink-0 items-center justify-center rounded-8 bg-neutral-white text-primary-500">
              <ChatCircleQuestion size={24} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-14 font-bold text-primary-700">Lihat semua pertanyaan</span>
              <span className="mt-2 block text-12 text-primary-600">Pusat Bantuan Agen</span>
            </span>
            <ChevronRight size={20} className="shrink-0 text-primary-500" />
          </button>
        </div>
      </section>

      {/* ===== 7 · Usahamu ================================================= */}
      <section>
        <SectionTitle sub="Atur di sini kapan pun ada yang berubah">Usahamu</SectionTitle>
        <div className="grid grid-cols-3 gap-8">
          <FaqCard icon={<MapPin size={24} />} intent="orange" q="Informasi & Lokasi Usaha" />
          <FaqCard icon={<RpDoc size={24} />} intent="purple" q="Harga Jual Produk" />
          <FaqCard icon={<Users size={24} />} intent="blue" q="Komunitas Agen" />
        </div>
      </section>

      {/* trailing space so the last section clears the device bottom edge */}
      <div className="h-24" aria-hidden />

      {/* ===== QRIS income info sheet ====================================== */}
      <BottomSheet
        open={sheet}
        onClose={() => store.set({ sheet: false })}
        title="Pemasukan dari QRIS"
        slot={
          <div className="flex flex-col gap-8">
            <div className="rounded-8 border border-primary-200 bg-primary-50 p-12">
              <div className="text-12 text-primary-600">Siap ditarik</div>
              <div className="text-20 font-bold text-primary-700">{f.qris}</div>
              <div className="mt-2 text-12 text-primary-600">Dana ini bisa ditarik kapan aja.</div>
            </div>
            <div className="rounded-8 border border-default bg-neutral-50 p-12">
              <div className="text-12 text-caption">Dana diproses</div>
              <div className="text-20 font-bold text-neutral-700">Rp312.000</div>
              <div className="mt-4 text-12 text-disabled">
                Transaksi QRIS akan siap dipakai pukul 17.00 WIB di hari berikutnya.
              </div>
            </div>
          </div>
        }
        primaryAction={<Button onClick={() => store.set({ sheet: false })}>Tutup</Button>}
      />

      {/* ===== Tanggal filter sheet ========================================= */}
      <DateFilterSheet
        open={periodSheet}
        onClose={() => store.set({ periodSheet: false })}
        period={dateFilter}
        customRange={customRange}
        onApply={(next, range) => {
          setDateFilter(next)
          setCustomRange(range)
          // No figures exist for an arbitrary range — "Tanggal lain" borrows
          // the 30-hari bucket (closest order of magnitude) while the input
          // itself still shows the picked dates.
          store.set({ period: next === 'custom' ? 'bulan' : next, periodSheet: false })
        }}
      />
    </Screen>
  )
}

// ---------------------------------------------------------------------------
// Sales-summary layouts
// ---------------------------------------------------------------------------

type F = (typeof FIGURES)[Period]

function Split({
  left,
  leftSub,
  right,
  rightSub,
  rightInfo,
  onRightInfo,
}: {
  left: string
  leftSub: string
  right: string
  rightSub: string
  rightInfo?: boolean
  onRightInfo?: () => void
}) {
  return (
    <div className="flex items-center rounded-8 bg-neutral-50">
      <div className="flex flex-1 flex-col gap-2 p-8">
        <b className="text-14 font-bold text-default">{left}</b>
        <span className="text-12 text-caption">{leftSub}</span>
      </div>
      <span className="h-40 border-l border-neutral-200" />
      <div className="flex flex-1 flex-col gap-2 p-8">
        <b className="text-14 font-bold text-default">{right}</b>
        <span className="flex items-center gap-4 text-12 text-caption">
          {rightSub}
          {rightInfo ? <InfoDot label="Info QRIS" onClick={onRightInfo} /> : null}
        </span>
      </div>
    </div>
  )
}

function Layout1({ f, qris, onQris }: { f: F; qris: boolean; onQris: () => void }) {
  return (
    <>
      <div className="flex flex-col gap-8 px-8 py-16">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-12 text-caption">Omzet</span>
            <b className="text-14 font-bold text-default">{f.omzet}</b>
          </div>
          <div className="mt-8 border-t border-default" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-12 text-caption">Keuntungan</span>
          <span className="text-24 font-bold text-default">{f.untung}</span>
        </div>
        <Split
          left={f.jual}
          leftSub="Dari penjualan"
          right={f.reward}
          rightSub="Dari cashback & rewards"
        />
        <LinkRow>Laporan Keuangan Selengkapnya</LinkRow>
      </div>

      {qris ? (
        <>
          <div className="h-8 bg-neutral-50" />
          <div className="flex flex-col gap-8 p-16">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <span className="text-12 text-caption">Pemasukan dari QRIS</span>
                <InfoDot label="Info pemasukan QRIS" onClick={onQris} />
              </div>
              <div className="text-16 font-bold text-default">{f.qris}</div>
            </div>
            <LinkRow>Lihat Poket Merchant</LinkRow>
          </div>
        </>
      ) : null}
    </>
  )
}

function Layout2({ f, onQris }: { f: F; onQris: () => void }) {
  return (
    <div className="flex flex-col gap-8 px-8 py-16">
      <div className="flex flex-col gap-2">
        <span className="text-12 text-caption">Pemasukan</span>
        <span className="text-24 font-bold text-default">{f.pemasukan}</span>
      </div>
      <Split left={f.omzet} leftSub="Poket Premium" right={f.qris} rightSub="QRIS" rightInfo onRightInfo={onQris} />
      <div className="border-t border-default" />
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <span className="text-12 text-caption">Total Keuntungan</span>
          <InfoDot label="Info total keuntungan" onClick={onQris} />
        </div>
        <span className="text-20 font-bold text-default">{f.untungTotal}</span>
      </div>
      <div className="border-t border-default" />
      <LinkRow>Laporan Keuangan Selengkapnya</LinkRow>
    </div>
  )
}

function Layout3({ f, onQris }: { f: F; onQris: () => void }) {
  return (
    <div className="flex flex-col gap-8 px-8 py-16">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <span className="text-12 text-caption">Total Keuntungan</span>
          <InfoDot label="Info total keuntungan" onClick={onQris} />
        </div>
        <span className="text-20 font-bold text-default">{f.untungTotal}</span>
      </div>
      <div className="border-t border-default" />
      <div className="flex flex-col gap-2">
        <span className="text-12 text-caption">Pemasukan</span>
        <span className="text-24 font-bold text-default">{f.pemasukan}</span>
      </div>
      <Split left={f.omzet} leftSub="Poket Premium" right={f.qris} rightSub="QRIS" rightInfo onRightInfo={onQris} />
      <div className="border-t border-default" />
      <LinkRow>Laporan Keuangan Selengkapnya</LinkRow>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Row / card helpers
// ---------------------------------------------------------------------------

type Intent = 'purple' | 'blue' | 'green' | 'orange' | 'red'

function MissionRow({
  icon,
  intent,
  title,
  points,
  desc,
  progress,
  chevron,
}: {
  icon: ReactNode
  intent: Intent
  title: string
  points: string
  desc?: string
  progress?: { percent: number; label: string }
  chevron?: boolean
}) {
  return (
    <div className="flex items-center gap-12 border-t border-default p-12 first:border-t-0">
      <IconTile intent={intent}>{icon}</IconTile>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-8">
          <span className="text-14 font-bold text-default">{title}</span>
          <span className="whitespace-nowrap text-12 font-bold text-primary-600">{points}</span>
        </div>
        {desc ? <div className="mt-2 text-12 text-caption">{desc}</div> : null}
        {progress ? (
          <>
            <ProgressBar percent={progress.percent} className="mt-8" />
            <div className="mt-4 text-12 text-caption">{progress.label}</div>
          </>
        ) : null}
      </div>
      {chevron ? <ChevronRight size={20} className="shrink-0 text-neutral-400" /> : null}
    </div>
  )
}

function OppCard({
  icon,
  intent,
  title,
  desc,
}: {
  icon: ReactNode
  intent: Intent
  title: string
  desc: string
}) {
  return (
    <button type="button" className="w-full text-left">
      <Card className="flex items-center gap-12">
        <IconTile intent={intent} size="lg">
          {icon}
        </IconTile>
        <div className="min-w-0 flex-1">
          <div className="text-14 font-bold text-default">{title}</div>
          <div className="mt-2 text-12 text-caption">{desc}</div>
        </div>
        <ChevronRight size={20} className="shrink-0 text-neutral-400" />
      </Card>
    </button>
  )
}

function FaqCard({ icon, intent, q }: { icon: ReactNode; intent: Intent; q: string }) {
  return (
    <button type="button" className="text-left">
      <Card className="flex h-full flex-col items-start gap-12">
        <IconTile intent={intent} size="sm">
          {icon}
        </IconTile>
        <span className="text-12 font-bold text-default">{q}</span>
      </Card>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Promo banner
// ---------------------------------------------------------------------------

// `gradient` is a CSS gradient built from token CSS vars (e.g.
// `linear-gradient(135deg,var(--primary-500),var(--primary-700))`), applied
// inline so it wins over Card's own background. Rendered as a real <Card> so
// each banner is its own Inspect boundary instead of snapping to the page.
function Banner({
  gradient,
  tag,
  title,
  desc,
}: {
  gradient: string
  tag: string
  title: string
  desc: string
}) {
  return (
    <Card
      flush
      role="button"
      tabIndex={0}
      className="flex w-full shrink-0 snap-center flex-col justify-between gap-12 text-left text-neutral-white"
      style={{ borderRadius: 12, border: 'none', padding: 16, background: gradient }}
    >
      <span className="self-start rounded-full bg-neutral-white/20 px-8 py-2 text-10 font-bold uppercase">
        {tag}
      </span>
      <span>
        <span className="block text-16 font-bold">{title}</span>
        <span className="mt-2 block text-12">{desc}</span>
      </span>
    </Card>
  )
}
