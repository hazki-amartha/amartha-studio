'use client'

// Home, option 2 — the same argument as `home.tsx`, set inside the rest of the
// real AFin page rather than on a bare canvas. Both are listed so they can be
// compared side by side; neither is the answer yet.
//
// What differs from option 1:
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
  DotsThreeOutline,
  Eye,
  EyeSlash,
  Headset,
  House,
  LightningFill,
  LogoModal,
  Majelis,
  Plus,
  Transfer,
  User,
  Voucher,
  Wallet,
} from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { WEEKLY_BILL, rupiah } from '../lib/data'
import { IconPiggy } from '../lib/icons'
import { outstanding, store, useApp } from '../lib/store'
import { IconTile, Meter, SectionTitle, TaskButton } from '../lib/ui'

export function HomeV2Screen() {
  const flow = useFlow()
  const s = useApp()
  const isNew = s.mitraStage === 'new'

  const goToPayment = () => {
    store.startPayment()
    flow.go('amount')
  }

  // The location check the "Absen" button runs. Deliberately unreliable — the
  // failure path (and the "Hubungi BP" escape after two of them) is the part of
  // attendance worth prototyping; a check that always passes shows nothing.
  const confirmAttendance = () => {
    store.startAttendCheck()
    window.setTimeout(() => {
      if (Math.random() < 0.65) {
        store.attendOk()
      } else {
        const dist = 500 + Math.floor(Math.random() * 600)
        store.attendFail(`Lokasi terlalu jauh (≈${dist}m dari titik kumpulan)`)
      }
    }, 1200)
  }

  return (
    <Screen statusBar="none">
      <BrandBand>
        <PoketWidget />
      </BrandBand>

      <h1 className="text-16 font-bold text-default">Perjalanan pendanaan Ibu</h1>

      <div className="overflow-hidden rounded-12 border border-light bg-neutral-white">
        {/* The limit band. What she has now and what discipline turns it into,
            reading left to right across an arrow — the card's whole premise,
            stated before the mechanics of reaching it. */}
        <div className="flex items-center gap-12 bg-primary-900 p-16 text-neutral-white">
          <div className="min-w-0 flex-1">
            <p className="text-12 text-neutral-200">Limit sekarang</p>
            <p className="mt-4 text-20 font-bold">Rp5jt</p>
          </div>
          <ArrowRight size={20} />
          <div className="min-w-0 flex-1 text-right">
            <p className="text-12 text-neutral-200">
              {isNew ? 'Di akhir tenor dapat naik s/d' : 'Minggu 40 dapat naik s/d'}
            </p>
            <p className="mt-4 text-20 font-bold">Rp6jt – Rp7jt</p>
          </div>
        </div>

        <div className="p-16">
          <div className="flex items-center gap-12">
            <span className="rounded-full bg-primary-500 px-12 py-4 text-10 font-bold uppercase text-neutral-white">
              Goal berikutnya
            </span>
            <span className="flex-1 text-right text-14 text-default">
              {isNew ? 'Di akhir tenor' : '8 minggu lagi'}
            </span>
          </div>

          <GoalRail
            from={isNew ? 'Cair Rp5jt' : 'Cair Rp1jt'}
            to={isNew ? 'Naik limit' : 'Cair Rp2.250jt'}
            progress={isNew ? 0 : 62}
            goal={isNew ? 92 : 78}
          />

          <p className="mb-16 mt-20 text-14 text-neutral-700">
            Tetap lakukan hal berikut untuk mencapai goal:
          </p>

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
                <div className="flex flex-col gap-4">
                  <Task
                    tint="green"
                    icon={<Majelis size={20} />}
                    title="Datang kumpulan"
                    description="Setiap Kamis, jam 11.30"
                    action={<AbsenButton onCheck={confirmAttendance} />}
                  />
                  {s.attendState === 'fail' && s.attendMsg ? (
                    <p className="text-right text-12 text-red-500">{s.attendMsg}</p>
                  ) : null}
                  {s.attendState === 'fail' && s.attendFails >= 2 ? (
                    <button
                      type="button"
                      className="text-right text-12 font-bold text-primary-500 underline"
                    >
                      Lokasi tidak sesuai? Hubungi BP
                    </button>
                  ) : null}
                </div>
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
        <Shortcut icon={<LogoModal size={24} />} tint="blue" label="Modal" />
        <Shortcut icon={<IconPiggy size={24} />} tint="green" label="Celengan" />
        <Shortcut icon={<LightningFill size={24} />} tint="primary" label="PLN" />
        <Shortcut icon={<Wallet size={24} />} tint="primary" label="Isi E-Wallet" />
        <Shortcut icon={<DotsThreeOutline size={24} />} tint="primary" label="Lainnya" />
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

// --- The goal rail ---------------------------------------------------------
// Where she is, where the next disbursement is, and how much of the gap is
// closed. A progress bar that names both ends, which is the only reason it
// beats the plain "week 14 of 48" it replaces.

function GoalRail({
  from,
  to,
  progress,
  goal,
}: {
  from: string
  to: string
  /** How far along the track the fill reaches, 0–100. */
  progress: number
  /** Where the knob marking the goal sits, 0–100. */
  goal: number
}) {
  return (
    <>
      <div className="relative mt-16 flex h-20 items-center">
        <span className="absolute left-0 right-0">
          <Meter percent={progress} />
        </span>
        <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary-500 text-neutral-white">
          <Check size={16} />
        </span>
        <span
          className="absolute h-20 w-20 rounded-full bg-neutral-400"
          // Data-driven: the value IS the geometry, same as Meter's width.
          style={{ left: `${goal}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      <div className="mt-8 flex items-baseline gap-12">
        <span className="flex-1 text-14 text-caption">{from}</span>
        <span className="flex-1 text-right text-14 font-bold text-primary-500">{to}</span>
      </div>
    </>
  )
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
  action: ReactNode
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

function AbsenButton({ onCheck }: { onCheck: () => void }) {
  const s = useApp()

  if (s.attendState === 'checking') {
    return (
      <TaskButton tone="neutral" disabled>
        Mengecek…
      </TaskButton>
    )
  }
  if (s.attendState === 'ok') {
    return (
      <TaskButton tone="green" disabled>
        <Check size={16} /> Hadir
      </TaskButton>
    )
  }
  return (
    <TaskButton tone={s.attendState === 'fail' ? 'red' : 'primary'} onClick={onCheck}>
      {s.attendState === 'fail' ? 'Coba lagi' : 'Absen'}
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
