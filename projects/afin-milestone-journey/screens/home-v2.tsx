'use client'

// Home — the mitra's landing screen, set inside the rest of the real AFin page
// rather than on a bare canvas. (It began as one of two compared options; the
// other was dropped once this one won, so this is now simply Home.)
//
// The shape that won:
//   · the brand band and the Poket wallet above the fold, so the goal card is
//     seen in its actual company rather than at the top of an empty screen;
//   · limit, goal rail, tasks and the 48-week link folded into ONE card, so the
//     figures and the habits read as one argument instead of three blocks;
//   · the top-up / bill-payment shortcuts below it.
//
// Only "Isi Saldo" navigates — the other shortcuts are drawn, not wired.
//
// A brand-new mitra sees the same card with one task, because she has nothing
// to repay yet: her nearest goal is the first disbursement.

import { useState, type ReactNode } from 'react'
import { NavigationBar } from '@/design-system/components'
import {
  ArrowRight,
  Bell,
  ChartLineUp,
  ChatCircleQuestion,
  Check,
  ChevronRight,
  Clipboard,
  DeviceMobile,
  DotsThreeOutline,
  Eye,
  EyeSlash,
  Headset,
  House,
  LightningFill,
  Majelis,
  ShareNetwork,
  Plus,
  Transfer,
  User,
  Users,
  Voucher,
  Wallet,
} from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MEMBERS, WEEKLY_BILL, rupiah } from '../lib/data'
import { IconPiggy } from '../lib/icons'
import { outstanding, store, useApp } from '../lib/store'
import { IconTile, Notice, SectionTitle, TaskButton } from '../lib/ui'

export function HomeV2Screen() {
  const flow = useFlow()
  const s = useApp()
  const isNew = s.mitraStage === 'new'

  const goToPayment = () => {
    store.startPayment()
    flow.go('amount')
  }

  // How many in her majelis are behind on payments — the "Majelis sehat" task's
  // status line, and the reason its "Ingatkan" CTA exists.
  const tunggakanCount = MEMBERS.filter((m) => !m.bayar).length

  return (
    <Screen statusBar="none">
      <BrandBand>
        <PoketWidget />
      </BrandBand>

      <h1 className="text-16 font-bold text-default">Perjalanan pendanaan Ibu</h1>

      <div className="overflow-hidden rounded-12 border border-light bg-neutral-white">
        {/* The capital journey. What she has now, what discipline grows it into,
            and the two stops on the way — the near top-up and the far limit
            rise — on one timeline, so short and long term read as one story. */}
        <div className="p-16">
          <div className="flex items-start gap-12">
            <div className="min-w-0 flex-1">
              <p className="text-12 text-caption">Limit sekarang</p>
              <p className="mt-2 text-20 font-bold text-default">Rp5jt</p>
            </div>
            <div className="min-w-0 flex-1 text-right">
              <p className="text-12 text-caption">Bisa naik jadi</p>
              <p className="mt-2 flex items-center justify-end gap-4 text-20 font-bold text-primary-500">
                Rp7–8jt
                <ChartLineUp size={16} />
              </p>
            </div>
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
                <p className="text-12 font-bold text-primary-500">Sekarang</p>
                <p className="text-10 text-caption">Di sini</p>
              </div>
              <div className="min-w-0 flex-1 text-center">
                <p className="text-12 font-bold text-default">6 Okt &rsquo;26</p>
                <p className="text-10 text-caption">{isNew ? 'Pencairan awal' : '10 minggu lagi'}</p>
                <span
                  className={`mt-4 inline-block rounded-full px-8 py-2 text-10 font-bold ${
                    !isNew && s.atRisk ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-500'
                  }`}
                >
                  Cair Rp1,25jt
                </span>
              </div>
              <div className="min-w-0 flex-1 text-right">
                <p className="text-12 font-bold text-default">23 Mar &rsquo;27</p>
                <p className="text-10 text-caption">Naik limit</p>
                <span className="mt-4 inline-block rounded-full bg-green-50 px-8 py-2 text-10 font-bold text-green-600">
                  Rp8jt
                </span>
              </div>
            </div>
          </div>

          {!isNew && s.atRisk ? (
            <div className="mb-16 mt-20">
              <Notice tone="orange">
                Reward Ibu bisa hangus. Bayar angsuran dan hadir kumpulan minggu ini agar reward
                tetap didapat.
              </Notice>
            </div>
          ) : (
            <p className="mb-16 mt-20 text-14 text-neutral-700">
              Tetap lakukan hal berikut untuk mencapai goal:
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

        {/* The way into the full ladder. It is the card's last line rather than a
            card of its own: it is where this card's argument continues. */}
        <button
          type="button"
          onClick={() => flow.go('progress')}
          className="flex w-full items-center justify-center gap-8 bg-primary-50 p-16 text-14 font-bold text-primary-500"
        >
          Lihat perjalanan ibu untuk 48 minggu
          <ArrowRight size={16} />
        </button>
      </div>

      <SectionTitle>Top-up dan bayar tagihan</SectionTitle>
      <div className="flex gap-8">
        <Shortcut icon={<DeviceMobile size={24} />} tint="primary" label="Pulsa" />
        <Shortcut icon={<ShareNetwork size={24} />} tint="primary" label="Paket Data" />
        <Shortcut icon={<LightningFill size={24} />} tint="primary" label="PLN" />
        <Shortcut icon={<Wallet size={24} />} tint="primary" label="Isi E-Wallet" />
        <Shortcut icon={<DotsThreeOutline size={24} />} tint="primary" label="Lainnya" />
      </div>

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
              id: 'progress',
              label: 'Progress',
              icon: <ChartLineUp size={24} />,
              onClick: () => flow.go('progress'),
            },
            {
              id: 'majelis',
              label: 'Majelis',
              icon: <Majelis size={24} />,
              onClick: () => flow.go('majelis'),
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
              onClick: () => flow.go('riwayat'),
            },
          ]}
        />
      </div>
    </Screen>
  )
}

// --- The brand band --------------------------------------------------------
// The purple field the AFin home opens on: the greeting, the two chrome icons,
// and the Poket card half-sitting on it. It is full-bleed rather than a pinned
// top bar because the card overlaps the band's lower edge — pinning it would
// mean pinning the wallet too, and the real app scrolls both away.

function BrandBand({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-16 -mt-48">
      {/* -mt-48 above and pt-48 here: the band starts at the very top of the
          display, behind the status-bar strip the screen asked not to paint,
          and the greeting still sits 16px below the strip. */}
      <div className="bg-gradient-to-br from-primary-400 to-primary-700 px-16 pb-40 pt-48">
        <div className="flex items-center gap-12 pb-16">
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-500 text-neutral-white">
            <User size={20} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-12 text-neutral-white">Hello! 👋</span>
            <span className="truncate text-16 font-bold text-neutral-white underline">
              Ibu Siti
            </span>
          </span>
          <ChromeIcon>
            <Voucher size={20} />
          </ChromeIcon>
          <ChromeIcon badge="8">
            <Bell size={20} />
          </ChromeIcon>
        </div>
      </div>
      {/* Pulled back up over the band by half its own height, so the gradient
          ends across the middle of the wallet rather than under it. */}
      <div className="-mt-40 px-16">{children}</div>
    </div>
  )
}

function ChromeIcon({ badge, children }: { badge?: string; children: ReactNode }) {
  return (
    <span className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-500 text-neutral-white">
      {children}
      {badge ? (
        <span className="absolute -right-4 -top-4 flex h-16 min-w-16 items-center justify-center rounded-full bg-red-500 px-4 text-10 font-bold text-neutral-white">
          {badge}
        </span>
      ) : null}
    </span>
  )
}

// --- Poket -----------------------------------------------------------------
// The wallet, reading the same balance the payment flow spends: a top-up made
// three screens away is visible here on the way back. The eye is local state —
// hiding a balance is not something that should survive navigation.

function PoketWidget() {
  const flow = useFlow()
  const s = useApp()
  const [hidden, setHidden] = useState(true)

  return (
    <div className="flex items-center gap-16 rounded-12 bg-neutral-white p-12">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-8 text-primary-500">
          <Wallet size={20} />
          <span className="text-16 font-bold">Poket</span>
          <ArrowRight size={16} />
        </div>
        <div className="mt-4 flex items-center gap-8">
          <span className="text-20 font-bold text-default">
            {hidden ? 'Rp•••••••' : rupiah(s.poketBalance)}
          </span>
          <button
            type="button"
            aria-label={hidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            onClick={() => setHidden((v) => !v)}
            className="shrink-0 text-primary-500"
          >
            {hidden ? <EyeSlash size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>
      <WalletAction icon={<Plus size={20} />} label="Isi Saldo" onClick={() => flow.go('topup')} />
      <WalletAction icon={<Transfer size={20} />} label="Transfer" />
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
      <span className="flex h-40 w-40 items-center justify-center rounded-12 bg-primary-500 text-neutral-white">
        {icon}
      </span>
      <span className="text-12 text-primary-500">{label}</span>
    </button>
  )
}

// --- Top-up and bill shortcuts ---------------------------------------------
// The PPOB rail. Untinted tiles with a coloured glyph, unlike the IconTile
// avatars on the tasks above — these are a directory, not things to do.

const SHORTCUT_TINT = {
  primary: 'text-primary-500',
  blue: 'text-blue-500',
  green: 'text-green-500',
} as const

function Shortcut({
  icon,
  tint,
  label,
}: {
  icon: ReactNode
  tint: keyof typeof SHORTCUT_TINT
  label: string
}) {
  return (
    <button
      type="button"
      className="flex flex-1 flex-col items-center gap-8 rounded-12 border border-default bg-neutral-white px-4 py-12"
    >
      <span className={SHORTCUT_TINT[tint]}>{icon}</span>
      <span className="w-full truncate text-center text-10 text-default">{label}</span>
    </button>
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
