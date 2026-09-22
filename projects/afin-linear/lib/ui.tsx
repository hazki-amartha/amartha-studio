'use client'

// Shared pieces: the card chrome both home cards use, and the real AFin home
// around them — copied from projects/afin-weekly-checkin/lib/ui.tsx, itself a
// copy of projects/amarthafin-live/lib/ui.tsx. The chrome is not wired.

import { useState, type ReactNode } from 'react'
import { NavigationBar } from '@/design-system/components'
import { NavIcon, ServiceIcon, Wordmark } from '@/design-system/assets'
import {
  ArrowRight,
  Bell,
  ChatCircleQuestion,
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
import { rupiah } from './data'

// --- Card pieces -------------------------------------------------------------

export function Stat({
  icon,
  label,
  value,
  warn = false,
}: {
  icon: ReactNode
  label: string
  value: number
  warn?: boolean
}) {
  return (
    <div className="rounded-12 bg-neutral-50 p-12">
      <span className="flex items-center gap-4 text-12 text-caption">
        {icon}
        {label}
      </span>
      <p className="mt-4 text-12 text-caption">
        <span className={`text-16 font-bold ${warn ? 'text-orange-500' : 'text-default'}`}>
          {value}
        </span>{' '}
        /48 minggu
      </p>
    </div>
  )
}

// --- The page around the cards ----------------------------------------------

export function HomeShell({ children }: { children: ReactNode }) {
  const flow = useFlow()

  return (
    <Screen statusBar="none" canvas="white" chromeClassName={BAND_FILL} topBar={<BrandHeader />}>
      <BrandBand>
        <PoketWidget />
      </BrandBand>

      <p className="text-16 font-bold text-default">Keuntungan Ibu</p>

      {children}

      <ShortcutRow />

      <div className="flex gap-12">
        <QuickLink icon={<ChatCircleQuestion size={20} />} label="Tanya Jawab" />
        <QuickLink icon={<Headset size={20} />} label="AmarthaCare" primary />
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
            {
              id: 'pinjaman',
              label: 'Pinjaman',
              icon: <NavIcon name="modal" />,
              onClick: () => flow.go('riwayat'),
            },
            { id: 'scan', label: 'Scan', icon: <NavIcon name="scan" /> },
            { id: 'celengan', label: 'Celengan', icon: <NavIcon name="celengan" /> },
            { id: 'transaksi', label: 'Transaksi', icon: <NavIcon name="transaction" /> },
          ]}
        />
      </div>
    </Screen>
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

const BAND_FILL = 'bg-gradient-to-r from-primary-400 to-primary-500'

function BrandHeader() {
  return (
    <div className="flex items-center gap-12 px-16 pb-16 pt-16">
      <ChromeIcon>
        <User size={20} />
      </ChromeIcon>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-12 text-neutral-white">Hello</span>
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
      {/* The sag is a bezier clip, not a radius — see amarthafin-live. */}
      <svg aria-hidden className="absolute h-0 w-0">
        <clipPath id="linear-band-sag" clipPathUnits="objectBoundingBox">
          <path d="M1 0 C1 0 0.8067 1 0.5 1 C0.1933 1 0 0 0 0 Z" />
        </clipPath>
      </svg>
      <div className={`h-16 w-full ${BAND_FILL}`} />
      <div className={`h-24 w-full ${BAND_FILL}`} style={{ clipPath: 'url(#linear-band-sag)' }} />
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
        <span className="absolute -right-8 -top-8 flex h-20 min-w-20 items-center justify-center rounded-full bg-red-500 px-4 text-10 font-bold text-neutral-white">
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
            {hidden ? 'Rp•••••••' : rupiah(151_000)}
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
    <span className="flex shrink-0 flex-col items-center gap-4">
      <span className="flex h-24 w-24 items-center justify-center rounded-8 bg-primary-500 text-neutral-white">
        {icon}
      </span>
      <span className="text-12 text-primary-500">{label}</span>
    </span>
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

function QuickLink({ icon, label, primary }: { icon: ReactNode; label: string; primary?: boolean }) {
  if (primary) {
    return (
      <span className="flex flex-1 items-center justify-center gap-8 rounded-full bg-primary-500 px-12 py-12 text-14 font-bold text-neutral-white">
        {icon}
        {label}
      </span>
    )
  }
  return (
    <span className="flex flex-1 items-center justify-center gap-8 rounded-full border border-default bg-neutral-white px-12 py-12 text-14 text-default">
      <span className="text-primary-500">{icon}</span>
      {label}
    </span>
  )
}
