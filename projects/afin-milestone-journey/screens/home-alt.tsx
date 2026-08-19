'use client'

// Home - alt — same shell as Home (brand band, Poket, PPOB grid, bottom nav);
// only the "Angsuran Anda" card differs. The card has three states —
// AWAL, MENDEKATI PENCAIRAN, MENUNGGAK — picked by their OWN selector
// (`useCardState`, in lib/revolving.ts) rather than derived off the shared
// AppState, so switching it in the states panel can't disturb what
// perjalanan-alt2 or the rest of the shared store still read.
//
// Home (home-v2.tsx) and Perjalanan pendanaan (progress.tsx) are untouched —
// this is a standalone alternative, not a replacement.

import { useState, type ReactNode } from 'react'
import { Badge, BottomSheet, Button, NavigationBar, OfferCard } from '@/design-system/components'
import { NavIcon, ServiceIcon, Wordmark } from '@/design-system/assets'
import {
  ArrowRight,
  Bell,
  ChatCircleQuestion,
  Check,
  ChevronRight,
  Eye,
  EyeSlash,
  Headset,
  Plus,
  Promo,
  Transfer,
  User,
} from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { WEEKLY_BILL, rupiah } from '../lib/data'
import { isSettled, store, useApp } from '../lib/store'
import { AWAL, CARD_STATES, KURANG_BAYAR, LIMIT_TERBUKA, MENDEKATI, MENUNGGAK, PINJAMAN_BARU } from '../lib/revolving'
import { StatusBoxRow, useCardState } from '../lib/revolving-ui'

const POKET_BALANCE = 151000

export function HomeAltScreen() {
  const flow = useFlow()
  const s = useApp()
  const { state: cardState, kelompokLancar, remaining } = useCardState()
  const [infoOpen, setInfoOpen] = useState(false)

  const goToPayment = () => {
    store.startPayment()
    flow.go('amount')
  }

  return (
    <Screen statusBar="none" chromeClassName={BAND_FILL} topBar={<BrandHeader />}>
      <BrandBand>
        <PoketWidget />
      </BrandBand>

      <div className="overflow-hidden rounded-16 border border-default bg-neutral-white p-16">
        {s.mitraStage === 'new' ? (
          <PinjamanBaru />
        ) : (
          <>
            <div className="flex items-center gap-8">
              <p className="min-w-0 flex-1 text-16 font-bold text-default">Angsuran Anda</p>
              <button
                type="button"
                onClick={() => flow.go('perjalanan-alt2')}
                className="shrink-0 text-14 font-bold text-primary-500"
              >
                Lihat semua
              </button>
            </div>

            {cardState === 'limit-terbuka' ? (
              <div className="mt-16">
                <LimitTerbukaContent onPay={goToPayment} />
              </div>
            ) : cardState === 'menunggak' ? (
              <div className="mt-16">
                <MenunggakContent onPay={goToPayment} />
              </div>
            ) : cardState === 'kurang-bayar' ? (
              <div className="mt-16">
                <KurangBayarContent onPay={goToPayment} />
              </div>
            ) : (
              <>
                <div className="mt-16">
                  <Hero
                    state={cardState}
                    kelompokLancar={kelompokLancar}
                    remaining={remaining}
                    onInfo={() => setInfoOpen(true)}
                  />
                </div>

                <div className="mt-16">
                  <StatusBoxRow
                    left={{
                      tone: 'lancar',
                      cta: { label: 'Lihat riwayat', onClick: () => flow.go('riwayat') },
                    }}
                    right={
                      cardState === 'mendekati' && !kelompokLancar
                        ? {
                            tone: 'kuning',
                            reason: `${MENDEKATI.groupUnpaid} anggota belum bayar`,
                            cta: { label: 'Cek kelompok', onClick: () => flow.go('majelis-alt') },
                          }
                        : {
                            tone: 'lancar',
                            cta: { label: 'Cek kelompok', onClick: () => flow.go('majelis-alt') },
                          }
                    }
                  />
                </div>

                {/* Kotak syarat — only 2b (mendekati, kelompok belum lancar). 2a
                    carries the same condition behind the "i" icon instead, so
                    the two never both show it. */}
                {cardState === 'mendekati' && !kelompokLancar ? (
                  <div className="mt-12 rounded-12 bg-neutral-50 p-12">
                    <p className="text-14 text-caption">
                      <span className="font-bold text-default">Kelompok Ibu belum lancar.</span>{' '}
                      Pastikan pembayaran angsuran kelompok lancar untuk mencairkan pinjaman
                      berikutnya.
                    </p>
                  </div>
                ) : null}

                {/* Cash handed to the field officer settles the bill, but the
                    kumpulan absence still counts against the limit rise — a
                    separate axis from the payment this card's action row is
                    about, so it gets its own card rather than a second row
                    inside "Perlu dilakukan". */}
                {s.billState === 'titip' ? (
                  <div className="mt-12 rounded-12 bg-neutral-50 p-12">
                    <p className="text-14 text-caption">
                      <span className="font-bold text-default">Ibu tidak datang ke kumpulan.</span>{' '}
                      Angsuran Ibu sudah lunas. Tapi kenaikan limit juga dihitung dari kehadiran
                      Ibu di kumpulan.
                    </p>
                  </div>
                ) : null}

                <div className="mt-16 border-t border-light pt-16">
                  <p className="text-14 font-regular text-caption">Perlu dilakukan minggu ini:</p>

                  <div className="mt-12 flex items-center gap-12">
                    <div className="min-w-0 flex-1">
                      <p className="text-14 font-bold text-default">Bayar angsuran {rupiah(WEEKLY_BILL)}</p>
                      <p className="mt-2 text-12 text-caption">
                        {s.billState === 'titip'
                          ? 'Sudah titip bayar ke petugas Amartha. 13 Agustus.'
                          : 'Saat kumpulan Kamis 13 Agustus, 11.30'}
                      </p>
                    </div>
                    {isSettled(s) || s.billState === 'titip' ? (
                      <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-green-500 text-neutral-white">
                        <Check size={16} />
                      </span>
                    ) : s.billState === 'pending' ? (
                      <Button variant="outline" size="sm" onClick={() => flow.go('pending')}>
                        Cek status
                      </Button>
                    ) : (
                      <Button variant="primary" size="sm" onClick={goToPayment}>
                        Bayar
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <BottomSheet
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="Syarat pencairan"
        description="Pencairan ini bisa Ibu ambil kalau angsuran dan kelompok sama-sama lancar."
      />

      <SectionTitle>Top-up dan bayar tagihan</SectionTitle>
      <ShortcutRow />

      <SectionTitle>Rekomendasi untuk Anda</SectionTitle>
      <div className="flex flex-col gap-12">
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
      </div>

      <div className="flex gap-12">
        <QuickLink icon={<ChatCircleQuestion size={20} />} label="Tanya Jawab" />
        <QuickLink icon={<Headset size={20} />} label="AmarthaCare" />
      </div>

      <div className="pb-16 text-center">
        <p className="text-12 text-primary-700">Terms &amp; Conditions • Privacy Policy</p>
        <p className="mt-16 text-12 text-caption">Berizin &amp; Diawasi oleh</p>
        <p className="mt-2 text-12 font-bold text-default">Otoritas Jasa Keuangan</p>
      </div>

      <div className="sticky bottom-0 -mx-16 mt-auto">
        <NavigationBar
          items={[
            { id: 'home', label: 'Home', icon: <NavIcon name="home" active />, active: true },
            {
              id: 'pinjaman',
              label: 'Pinjaman',
              icon: <NavIcon name="modal" />,
              onClick: () => flow.go('perjalanan-alt2'),
            },
            { id: 'scan', label: 'Scan', icon: <NavIcon name="scan" /> },
            { id: 'celengan', label: 'Celengan', icon: <NavIcon name="celengan" /> },
            { id: 'transaksi', label: 'Transaksi', icon: <NavIcon name="transaction" /> },
          ]}
        />
      </div>
    </Screen>
  )

  // --- PinjamanBaru — replaces the whole "Angsuran Anda" card for a
  // mitra who's approved but never disbursed: there is no journey yet, only a
  // plafon waiting to be drawn. The label is a verb ("Ibu bisa cairkan
  // hingga"), not a noun sitting over the figure — a noun there read as
  // ownership, as if the money had already landed. ---------------------------
  function PinjamanBaru() {
    return (
      <>
        <Badge intent="green" variant="subtle" leadingIcon={<Check size={16} />}>
          Pinjaman Ibu disetujui
        </Badge>
        <p className="mt-12 text-14 text-default">Ibu bisa cairkan hingga</p>
        <p className="mt-4 text-24 font-bold text-default">{rupiah(PINJAMAN_BARU.plafon)}</p>
        <p className="mt-4 text-14 text-default">Bisa cairkan semua atau sebagian dulu.</p>
        <div className="mt-16">
          <Button
            variant="primary"
            onClick={() => {
              store.startDisburse(PINJAMAN_BARU.plafon)
              flow.go('cairkan-alt')
            }}
            className="w-full"
          >
            Cairkan pinjaman
          </Button>
        </div>
      </>
    )
  }

  // --- Hero — AWAL and MENDEKATI PENCAIRAN share this shape; MENUNGGAK
  // has its own opening instead (see MenunggakContent below). ---------------
  function Hero({
    state,
    kelompokLancar,
    remaining,
    onInfo,
  }: {
    state: 'awal' | 'mendekati'
    kelompokLancar: boolean
    remaining: number
    onInfo: () => void
  }) {
    return (
      <>
        {state === 'awal' ? (
          <>
            <p className="text-24 font-bold text-default">Sudah lancar {AWAL.streak} kali</p>
            <p className="mt-4 text-12 text-caption">
              Kalau lancar terus sampai {AWAL.milestoneDate}, yang sudah Ibu bayar bisa dipinjam
              lagi — tanpa menunggu lunas.
            </p>
          </>
        ) : (
          <p className="text-24 font-bold text-default">{remaining} kali bayar lagi</p>
        )}
        {state === 'mendekati' ? (
          <p className="mt-4 text-12 text-caption">
            Yang sudah Ibu bayar bisa dipinjam lagi —{' '}
            <span className="font-bold text-primary-500">{rupiah(MENDEKATI.amount)}</span>, mulai{' '}
            <span className="font-bold text-primary-500">{MENDEKATI.milestoneDate}</span>.
            {/* Only 2a carries this — 2b already shows the condition as the
                kotak syarat below the status boxes, so the two never both
                appear. */}
            {kelompokLancar ? (
              <button
                type="button"
                onClick={onInfo}
                aria-label="Penjelasan syarat pencairan"
                className="ml-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-default align-middle text-10 font-bold text-caption"
              >
                i
              </button>
            ) : null}
          </p>
        ) : null}
      </>
    )
  }

  // --- LimitTerbukaContent — milestone reached, disbursement unclaimed.
  function LimitTerbukaContent({ onPay }: { onPay: () => void }) {
    const [blockDismissed, setBlockDismissed] = useState(false)
    return (
      <>
        <p className="text-12 text-caption">Angsuran Ibu</p>
        <p className="mt-4 text-24 font-bold text-default">
          Sudah lancar {LIMIT_TERBUKA.paidWeeks} kali
        </p>
        <p className="mt-4 text-12 text-caption">
          {LIMIT_TERBUKA.paidWeeks} dari {LIMIT_TERBUKA.totalWeeks} minggu bayar tepat waktu.
        </p>

        {!blockDismissed ? (
          <div className="mt-16 rounded-16 border border-primary-200 bg-primary-50 p-16">
            <Badge intent="green" variant="subtle" leadingIcon={<Check size={16} />}>
              Yang dinantikan sudah tiba
            </Badge>
            <p className="mt-8 text-14 text-caption">Ibu sudah bisa cairkan pinjaman lagi hingga</p>
            <p className="mt-2 text-20 font-bold text-default">{rupiah(LIMIT_TERBUKA.amount)}</p>
            <div className="mt-12">
              <Button
                variant="outline"
                size="sm"
                onClick={() => flow.go('milestone-12-alt')}
                className="w-full"
              >
                Cairkan pinjaman
              </Button>
            </div>
            <button
              type="button"
              onClick={() => setBlockDismissed(true)}
              className="mt-8 w-full text-center text-12 text-primary-500 underline"
            >
              Belum perlu? Bisa digabung ke pencairan berikutnya.
            </button>
          </div>
        ) : null}

        <div className="mt-16">
          <StatusBoxRow
            left={{
              tone: 'lancar',
              cta: { label: 'Lihat riwayat', onClick: () => flow.go('riwayat') },
            }}
            right={{
              tone: 'lancar',
              cta: { label: 'Cek kelompok', onClick: () => flow.go('majelis-alt') },
            }}
          />
        </div>

        <div className="mt-16 border-t border-light pt-16">
          <p className="text-14 font-regular text-caption">Perlu dilakukan minggu ini:</p>
          <div className="mt-12 flex items-center gap-12">
            <div className="min-w-0 flex-1">
              <p className="text-14 font-bold text-default">Bayar angsuran {rupiah(WEEKLY_BILL)}</p>
              <p className="mt-2 text-12 text-caption">Saat kumpulan Kamis, 20 Agustus.</p>
            </div>
            <Button variant="primary" size="sm" onClick={onPay}>
              Bayar
            </Button>
          </div>
        </div>
      </>
    )
  }

  // --- KurangBayarContent — partial payment this week; the gap is still due
  // before kumpulan. Not menunggak (that is post-due-date). Replaces the
  // Hero, the status boxes, and the Perlu-dilakukan section. ----------------
  function KurangBayarContent({ onPay }: { onPay: () => void }) {
    return (
      <>
        <p className="text-12 text-caption">Angsuran minggu ini</p>
        <p className="mt-4 text-24 font-bold text-default">
          Tinggal {rupiah(KURANG_BAYAR.remaining)} lagi
        </p>
        <p className="mt-4 text-12 text-caption">
          Ibu sudah bayar {rupiah(KURANG_BAYAR.paid)} dari {rupiah(WEEKLY_BILL)}. Ibu bisa cairkan{' '}
          <span className="font-bold text-default">{rupiah(KURANG_BAYAR.amount)}</span> mulai{' '}
          <span className="font-bold text-default">{KURANG_BAYAR.milestoneDate}</span> kalau
          angsuran minggu ini lunas.
        </p>

        <div className="mt-16">
          <StatusBoxRow
            left={{
              tone: 'kuning',
              value: 'Belum lunas',
              cta: { label: 'Lihat riwayat', onClick: () => flow.go('riwayat') },
            }}
            right={{
              tone: 'lancar',
              cta: { label: 'Cek kelompok', onClick: () => flow.go('majelis-alt') },
            }}
          />
        </div>

        <div className="mt-16 border-t border-light pt-16">
          <p className="text-14 font-regular text-caption">Perlu dilakukan minggu ini:</p>
          <div className="mt-12 flex items-center gap-12">
            <div className="min-w-0 flex-1">
              <p className="text-14 font-bold text-default">
                Bayar sisa {rupiah(KURANG_BAYAR.remaining)}
              </p>
              <p className="mt-2 text-12 text-caption">Sebelum kumpulan Kamis, 20 Agustus.</p>
            </div>
            <Button variant="primary" size="sm" onClick={onPay}>
              Bayar
            </Button>
          </div>
        </div>
      </>
    )
  }

  // --- MenunggakContent — replaces the hero, the status boxes and the
  // "Perlu dilakukan" section outright for State 3. Never states the
  // pencairan figure (copy rule) — only what's already banked and what's
  // overdue. -------------------------------------------------------------
  function MenunggakContent({ onPay }: { onPay: () => void }) {
    const { paidWeeks } = CARD_STATES.menunggak
    return (
      <>
        <p className="text-24 font-bold text-default">
          {paidWeeks} minggu sudah dibayar tepat waktu
        </p>
        <p className="mt-4 text-12 text-caption">
          Catatan ini tidak hilang. Minggu-minggu yang sudah lancar tetap dihitung.
        </p>

        <div className="mt-16 border-t border-light pt-16">
          <p className="text-12 font-bold text-red-600">Lewat tempo {MENUNGGAK.daysLate} hari</p>
          <p className="mt-4 text-20 font-bold text-default">{rupiah(WEEKLY_BILL)}</p>
          <p className="mt-2 text-12 text-caption">
            Tidak harus penuh — bisa mulai dari {rupiah(MENUNGGAK.minPartial)}.
          </p>
          <div className="mt-12">
            <Button variant="primary" onClick={onPay} className="w-full">
              Bayar
            </Button>
          </div>
          <p className="mt-8 text-12 text-caption">
            Kalau perlu, bicarakan dengan petugas saat kumpulan Kamis, 11.30.
          </p>
        </div>
      </>
    )
  }
}

// --- Shell — same shape as the shipped AFin home (see home-v2.tsx). --------

const BAND_FILL = 'bg-gradient-to-r from-primary-400 to-primary-500'

function BrandHeader() {
  return (
    <div className="flex items-center gap-12 px-16 pb-16 pt-16">
      <ChromeIcon>
        <User size={20} />
      </ChromeIcon>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-12 text-neutral-white">Hello! 👋</span>
        <span className="truncate text-14 font-bold text-neutral-white underline">Ibu Siti</span>
      </span>
      <ChromeIcon badge="8">
        <Promo size={20} />
      </ChromeIcon>
      <ChromeIcon badge="8">
        <Bell size={20} />
      </ChromeIcon>
    </div>
  )
}

function BrandBand({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-16 -mt-16">
      <svg aria-hidden className="absolute h-0 w-0">
        <clipPath id="milestone-alt-band-sag" clipPathUnits="objectBoundingBox">
          <path d="M1 0 C1 0 0.8067 1 0.5 1 C0.1933 1 0 0 0 0 Z" />
        </clipPath>
      </svg>
      <div className={`h-16 w-full ${BAND_FILL}`} />
      <div
        className={`h-24 w-full ${BAND_FILL}`}
        style={{ clipPath: 'url(#milestone-alt-band-sag)' }}
      />
      <div className="relative -mt-40 px-16">{children}</div>
    </div>
  )
}

function ChromeIcon({ badge, children }: { badge?: string; children: ReactNode }) {
  return (
    <span
      className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-2 border-neutral-white/60 bg-primary-50/25 text-neutral-white backdrop-blur-lg"
      style={{
        boxShadow: '0 4px 4px rgba(0, 0, 0, 0.1), inset -4px 6px 4px rgba(115, 44, 124, 0.32)',
      }}
    >
      {children}
      {badge ? (
        <span className="absolute -right-8 -top-8 flex h-20 min-w-20 items-center justify-center rounded-full bg-red-500 px-4 text-12 font-bold text-neutral-white">
          {badge}
        </span>
      ) : null}
    </span>
  )
}

function PoketWidget() {
  const [hidden, setHidden] = useState(true)
  return (
    <div className="flex items-center gap-16 rounded-16 border border-default bg-gradient-to-r from-neutral-white to-primary-50 p-12">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-4 text-primary-500">
          <Wordmark name="poket" height={20} />
          <ArrowRight size={16} />
        </div>
        <div className="mt-4 flex items-center gap-8">
          <span className="text-16 font-bold text-default">
            {hidden ? 'Rp•••••••' : rupiah(POKET_BALANCE)}
          </span>
          <button
            type="button"
            aria-label={hidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            onClick={() => setHidden((v) => !v)}
            className="shrink-0 text-default"
          >
            {hidden ? <EyeSlash size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <WalletAction icon={<Plus size={16} />} label="Isi Saldo" />
      <WalletAction icon={<Transfer size={16} />} label="Transfer" />
    </div>
  )
}

function WalletAction({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button type="button" className="flex shrink-0 flex-col items-center gap-4">
      <span className="flex h-24 w-24 items-center justify-center rounded-8 bg-primary-500 text-neutral-white">
        {icon}
      </span>
      <span className="text-12 text-primary-500">{label}</span>
    </button>
  )
}

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

function Shortcut({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex flex-1 flex-col items-center gap-4">
      <span className="flex h-48 w-48 items-center justify-center rounded-16 border border-default bg-neutral-white">
        {icon}
      </span>
      <span className="w-full text-center text-12 text-default">{label}</span>
    </span>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-16 font-bold text-default">{children}</h2>
}

function QuickLink({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex flex-1 items-center justify-center gap-8 rounded-full border border-default bg-neutral-white px-12 py-12 text-14 text-default"
    >
      <span className="text-primary-500">{icon}</span>
      {label}
      <ChevronRight size={16} />
    </button>
  )
}
