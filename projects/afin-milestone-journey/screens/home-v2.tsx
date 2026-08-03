'use client'

// Home — the mitra's landing screen, set inside the rest of the real AFin page
// rather than on a bare canvas. (It began as one of two compared options; the
// other was dropped once this one won, so this is now simply Home.)
//
// The shape that won:
//   · the brand band and the Poket wallet above the fold, so the goal card is
//     seen in its actual company rather than at the top of an empty screen;
//   · goal rail and tasks folded into ONE card, so the figures and the habits
//     read as one argument instead of two blocks — with "Lihat semua" in the
//     card's header as the single way into the full 48-week ladder;
//   · the top-up / bill-payment shortcuts below it.
//
// Only "Isi Saldo" navigates — the other shortcuts are drawn, not wired.
//
// A brand-new mitra sees the same card with one task, because she has nothing
// to repay yet: her nearest goal is the first disbursement.

import { useState, type ReactNode } from 'react'
import { NavigationBar } from '@/design-system/components'
import { ServiceIcon, Wordmark } from '@/design-system/assets'
import {
  ArrowRight,
  Bell,
  ChatCircleQuestion,
  Check,
  ChevronRight,
  Clipboard,
  Coins,
  Eye,
  EyeSlash,
  Headset,
  House,
  Majelis,
  Plus,
  Promo,
  QrCode,
  Transfer,
  User,
  Users,
  Wallet,
} from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MEMBERS, WEEKLY_BILL, rupiah } from '../lib/data'
import { IconPiggy } from '../lib/icons'
import { outstanding, store, useApp } from '../lib/store'
import { IconTile, Notice, SectionTitle, TaskButton } from '../lib/ui'

/** How far past due the unpaid week is, in the at-risk state. */
const DAYS_LATE = 3

export function HomeV2Screen() {
  const flow = useFlow()
  const s = useApp()
  const isNew = s.mitraStage === 'new'
  // The reward is at risk in two conditions, not one: the deliberate at-risk
  // state, and a short payment that left arrears behind. Both owe money this
  // week, so both get the warning and the red disbursement chip.
  const rewardAtRisk = !isNew && (s.atRisk || (s.billState === 'paid' && outstanding(s) > 0))

  const goToPayment = () => {
    store.startPayment()
    flow.go('amount')
  }

  // How many in her majelis are behind on payments — the "Majelis sehat" task's
  // status line, and the reason its "Ingatkan" CTA exists.
  const tunggakanCount = MEMBERS.filter((m) => !m.bayar).length

  return (
    <Screen
      statusBar="none"
      // The greeting row is chrome: it rides in Screen's pinned slot and stays
      // put while the page scrolls under it. The fill sits on the slot so the
      // purple reaches the very top of the display.
      chromeClassName={BAND_FILL}
      topBar={<BrandHeader />}
    >
      <BrandBand>
        <PoketWidget />
      </BrandBand>

      <div className="overflow-hidden rounded-12 border border-light bg-neutral-white">
        {/* The capital journey. What discipline grows her limit into, and the
            two stops on the way — the near top-up and the far limit rise — on
            one timeline, so short and long term read as one story. */}
        <div className="p-16">
          {/* The card names the nearest goal and hands the whole ladder to one
              link — the header is the way in, so there is no footer bar. */}
          <div className="flex items-center gap-8">
            <p className="min-w-0 flex-1 text-16 font-bold text-default">Gol pinjaman Anda</p>
            <button
              type="button"
              onClick={() => flow.go('progress')}
              className="shrink-0 text-14 font-bold text-primary-500"
            >
              Lihat semua
            </button>
          </div>

          <div className="mt-24">
            <div className="flex items-center">
              <JourneyDot current />
              <span className="mx-4 h-2 flex-1 rounded-full bg-blue-400" />
              <JourneyDot />
              {/* Small dots: the pelunasan and other milestones that fall between
                  the next top-up and the far limit rise. */}
              <span className="mx-4 flex flex-1 items-center gap-4">
                <span className="h-2 flex-1 rounded-full bg-green-400" />
                <span className="h-8 w-8 shrink-0 rounded-full border border-green-400 bg-neutral-white" />
                <span className="h-2 flex-1 rounded-full bg-green-400" />
                <span className="h-8 w-8 shrink-0 rounded-full border border-green-400 bg-neutral-white" />
                <span className="h-2 flex-1 rounded-full bg-green-400" />
              </span>
              <JourneyDot />
            </div>
            <div className="mt-8 flex gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-12 font-bold text-primary-500">Hari ini</p>
              </div>
              <div className="min-w-0 flex-1 text-center">
                <p className="text-12 font-bold text-default">6 Okt &rsquo;26</p>
                <p className="text-10 text-caption">Pencairan</p>
                {/* "s/d" on both chips: the disbursement is a ceiling too, so
                    the near and far figures are hedged the same way. */}
                <span
                  className={`mt-4 inline-block rounded-full px-8 py-2 text-10 font-bold ${
                    rewardAtRisk ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-500'
                  }`}
                >
                  s/d Rp1,25jt
                </span>
              </div>
              <div className="min-w-0 flex-1 text-right">
                <p className="text-12 font-bold text-default">23 Mar &rsquo;27</p>
                {/* "Peluang" and "s/d", not "Naik limit / Rp8jt": the rise is
                    assessed at the end of the tenor and the figure is a ceiling,
                    so stating it flat reads as a promise the product has not
                    made. Hedged here and everywhere else it appears. */}
                <p className="text-10 text-caption">Peluang naik limit</p>
                <span className="mt-4 inline-block rounded-full bg-green-50 px-8 py-2 text-10 font-bold text-green-600">
                  s/d Rp8jt
                </span>
              </div>
            </div>
          </div>

          <div className="-mx-16 mt-16 border-t border-light" />

          {rewardAtRisk ? (
            <div className="mb-16 mt-16">
              <Notice tone="orange">
                Reward Ibu bisa hangus. Bayar tunggakan angsuran agar reward tetap didapat.
              </Notice>
            </div>
          ) : (
            <p className="mb-16 mt-16 text-14 text-neutral-700">
              Lakukan hal-hal berikut untuk mencapai goal:
            </p>
          )}

          <div className="flex flex-col gap-16">
            {isNew ? (
              <Task
                tint="primary"
                icon={<Wallet size={20} />}
                title="Cairkan Rp5jt"
                description="Limit tersedia Rp5jt"
                action={
                  <TaskButton tone="primary" onClick={() => flow.go('disburse-amount')}>
                    Cairkan
                  </TaskButton>
                }
              />
            ) : (
              <>
                <Task
                  tint="blue"
                  icon={<Wallet size={20} />}
                  title="Bayar angsuran"
                  description={<BillLine />}
                  action={<BayarButton onPay={goToPayment} />}
                />
                <Task
                  tint="green"
                  icon={<Majelis size={20} />}
                  title="Datang kumpulan"
                  description="Kamis, 11.30"
                />
                <Task
                  tint="primary"
                  icon={<Users size={20} />}
                  title="Majelis sehat"
                  description={`${tunggakanCount} anggota punya tunggakan`}
                  action={
                    <TaskButton tone="primary" onClick={() => flow.go('majelis')}>
                      Ingatkan
                    </TaskButton>
                  }
                />
              </>
            )}
          </div>
        </div>
      </div>

      <SectionTitle>Top-up dan bayar tagihan</SectionTitle>
      <ShortcutRow />

      <SectionTitle>Rekomendasi untuk Anda</SectionTitle>
      <div className="flex flex-col gap-12">
        <RecCard
          title="Penempatan dana dari Rp10.000"
          titleClassName="text-green-500"
          body="Dananya tumbuh dan bisa ditarik kapan pun."
          brand={
            <span className="flex items-center gap-8 text-green-500">
              <IconPiggy size={20} />
              <span className="text-14 font-bold">Celengan</span>
            </span>
          }
        />
        <RecCard
          title="Mulai jualan pulsa, listrik, dengan biaya paling murah!"
          titleClassName="text-red-400"
          brand={
            <span className="text-16 font-bold">
              <span className="text-primary-500">amartha</span>
              <span className="text-orange-500">link</span>
            </span>
          }
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
            {
              id: 'home',
              label: 'Home',
              icon: <House size={24} />,
              active: true,
            },
            {
              id: 'pinjaman',
              label: 'Pinjaman',
              icon: <Coins size={24} />,
              onClick: () => flow.go('progress'),
            },
            {
              id: 'scan',
              label: 'Scan',
              icon: <QrCode size={24} />,
            },
            {
              id: 'celengan',
              label: 'Celengan',
              icon: <IconPiggy size={24} />,
            },
            {
              id: 'transaksi',
              label: 'Transaksi',
              icon: <Clipboard size={24} />,
            },
          ]}
        />
      </div>
    </Screen>
  )
}

// --- The brand band --------------------------------------------------------
// The purple field the AFin home opens on, drawn to the shipped page (see
// projects/amarthafin-live/lib/ui.tsx): the greeting row, the frosted chrome
// icons, the sagging lower edge, and the Poket card half-sitting on it. The
// greeting row is pinned — it goes into Screen's chrome slot — while the sag and
// the wallet scroll away under it.

// Horizontal, not diagonal: the band is split across the pinned header and the
// sag below it, and only a left-to-right gradient carries across that seam.
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
      {/* The band's bottom edge is a bezier, not a radius: the production mask
          leaves each side corner already angled downward, which an elliptical
          border-radius cannot do. So the sag is its own 24px strip below the
          flat rectangle, clipped to the mask's path in objectBoundingBox units
          so it stretches to any device width. */}
      <svg aria-hidden className="absolute h-0 w-0">
        <clipPath id="milestone-band-sag" clipPathUnits="objectBoundingBox">
          <path d="M1 0 C1 0 0.8067 1 0.5 1 C0.1933 1 0 0 0 0 Z" />
        </clipPath>
      </svg>
      <div className={`h-16 w-full ${BAND_FILL}`} />
      <div className={`h-24 w-full ${BAND_FILL}`} style={{ clipPath: 'url(#milestone-band-sag)' }} />
      {/* `relative` is load-bearing: a clip-path makes the sag strip its own
          stacking context, which would otherwise paint over this in-flow sibling
          and cut the wallet in half. */}
      <div className="relative -mt-40 px-16">{children}</div>
    </div>
  )
}

// Frosted-glass chrome button, as shipped: a translucent primary-50 wash over a
// backdrop blur so the gradient shows through, rounded by two shadows — a soft
// drop below and an inset purple highlight up and to the left. Neither shadow is
// a token, so they go in a style prop; the colours are still the tokens.
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
        <span className="absolute -right-8 -top-8 flex h-20 min-w-20 items-center justify-center rounded-full bg-red-500 px-4 text-10 font-bold text-neutral-white">
          {badge}
        </span>
      ) : null}
    </span>
  )
}

// --- Poket -----------------------------------------------------------------
// The wallet as shipped — 12px padding, 16px radius, the pale left-to-right wash
// behind it, and the Poket lockup as artwork rather than a mark plus a typed
// word. It reads the same balance the payment flow spends: a top-up made three
// screens away is visible here on the way back. The eye is local state — hiding
// a balance is not something that should survive navigation.

function PoketWidget() {
  const flow = useFlow()
  const s = useApp()
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
            {hidden ? 'Rp•••••••' : rupiah(s.poketBalance)}
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
      <WalletAction icon={<Plus size={16} />} label="Isi Saldo" onClick={() => flow.go('topup')} />
      <WalletAction icon={<Transfer size={16} />} label="Transfer" />
    </div>
  )
}

function WalletAction({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="flex shrink-0 flex-col items-center gap-4">
      <span className="flex h-24 w-24 items-center justify-center rounded-8 bg-primary-500 text-neutral-white">
        {icon}
      </span>
      <span className="text-12 text-primary-500">{label}</span>
    </button>
  )
}

// --- Top-up and bill shortcuts ---------------------------------------------
// The PPOB rail, drawn as shipped: the bordered 48px box holds the GLYPH ONLY,
// with the product name below it, outside the box, free to wrap onto two lines
// rather than truncate.

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

// --- Recommendation card ---------------------------------------------------
// A cross-sell tile: coloured headline, an optional line of body copy, a brand
// lockup at the foot, and an arrow that signals "there's more here". Drawn, not
// wired — like the shortcut rail above it.

function RecCard({
  title,
  titleClassName,
  body,
  brand,
}: {
  title: string
  titleClassName: string
  body?: string
  brand: ReactNode
}) {
  return (
    <button
      type="button"
      className="flex w-full items-start gap-12 rounded-12 border border-default bg-neutral-white p-16 text-left"
    >
      <div className="flex flex-1 flex-col gap-8">
        <p className={`text-16 font-bold ${titleClassName}`}>{title}</p>
        {body ? <p className="text-14 text-default">{body}</p> : null}
        <div className="mt-4">{brand}</div>
      </div>
      <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-neutral-50 text-default">
        <ArrowRight size={16} />
      </span>
    </button>
  )
}

// --- The capital-journey timeline ------------------------------------------
// A node on the horizontal journey line: the filled target ring marks where she
// is now, hollow rings the stops still ahead.

function JourneyDot({ current }: { current?: boolean }) {
  if (current) {
    return (
      <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-primary-500">
        <span className="h-8 w-8 rounded-full bg-primary-500" />
      </span>
    )
  }
  return <span className="h-20 w-20 shrink-0 rounded-full border-2 border-neutral-200 bg-neutral-white" />
}

// --- Tasks -----------------------------------------------------------------

function Task({
  tint,
  icon,
  title,
  description,
  action,
}: {
  tint: 'primary' | 'blue' | 'green'
  icon: ReactNode
  title: string
  description: ReactNode
  /** The trailing control. Omit for an informational row with no action. */
  action?: ReactNode
}) {
  return (
    <div className="flex items-center gap-12">
      <IconTile tint={tint} round>
        {icon}
      </IconTile>
      <div className="min-w-0 flex-1">
        <p className="text-14 font-bold text-default">{title}</p>
        <div className="mt-4 text-12 text-neutral-700">{description}</div>
      </div>
      {action}
    </div>
  )
}

/** What is owed, stated three ways: due, settled, or short. */
function BillLine() {
  const s = useApp()
  if (s.billState === 'paid' && s.paidAmount >= WEEKLY_BILL) {
    return <span className="text-disabled line-through">{rupiah(WEEKLY_BILL)}</span>
  }
  if (s.billState === 'paid') {
    return <span className="text-red-500">{rupiah(outstanding(s))} (sisa tunggakan)</span>
  }
  // Unpaid and behind: the amount alone doesn't say the week has already
  // slipped, which is the reason the reward is on the line.
  if (s.atRisk) {
    return (
      <span className="flex flex-wrap items-center gap-8">
        {rupiah(WEEKLY_BILL)}
        <span className="rounded-full bg-red-50 px-8 py-2 text-10 font-bold text-red-600">
          Telat {DAYS_LATE} hari
        </span>
      </span>
    )
  }
  return <>{rupiah(WEEKLY_BILL)}</>
}

function BayarButton({ onPay }: { onPay: () => void }) {
  const flow = useFlow()
  const s = useApp()

  if (s.billState === 'pending') {
    return (
      <TaskButton tone="orange" onClick={() => flow.go('pending')}>
        Cek status
      </TaskButton>
    )
  }
  if (s.billState === 'paid' && s.paidAmount >= WEEKLY_BILL) {
    return (
      <TaskButton tone="green" disabled>
        <Check size={16} /> Lunas
      </TaskButton>
    )
  }
  if (s.billState === 'paid') {
    return (
      <TaskButton tone="primary" onClick={onPay}>
        Bayar sisa
      </TaskButton>
    )
  }
  return (
    <TaskButton tone="primary" onClick={onPay}>
      Bayar
    </TaskButton>
  )
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
