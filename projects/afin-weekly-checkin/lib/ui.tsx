'use client'

// The parts every screen here shares: the real AFin page around the card, the
// destination line the three options all carry, and the week tile itself — the
// one piece of vocabulary the whole concept rests on.

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
  Coin,
  DotsThreeOutline,
  Eye,
  EyeSlash,
  Headset,
  House,
  LightningFill,
  LockKey,
  LogoModal,
  Majelis,
  Medal,
  Minus,
  Plus,
  Transfer,
  User,
  Voucher,
  Wallet,
  Withdraw,
} from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  LIMIT_INCREASE,
  TOTAL_WEEKS,
  goodWeeks,
  journeyPercent,
  rupiah,
  short,
  type WeekCell,
} from './data'
import { store, useApp } from './store'

// --- The destination line --------------------------------------------------
// The limit increase, stated once and carrying no mechanics: an icon, an
// amount, a fraction, a bar. It is the reason to bother, held above the row
// that says what to do — so the far reward frames the near one instead of
// competing with it for the same kind of attention.

export function Destination({ compact }: { compact?: boolean }) {
  const s = useApp()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-12">
        <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-yellow-50 text-yellow-600">
          <Medal size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-14 font-bold text-default">Limit naik {short(LIMIT_INCREASE)}</p>
          <p className="mt-2 text-12 text-caption">
            {goodWeeks(s)} dari {TOTAL_WEEKS} minggu lancar
          </p>
        </div>
        {compact ? null : (
          <span className="shrink-0 text-12 font-bold text-caption">{journeyPercent(s)}%</span>
        )}
      </div>
      <Meter percent={journeyPercent(s)} />
    </div>
  )
}

export function Meter({ percent, tone = 'primary' }: { percent: number; tone?: 'primary' | 'yellow' }) {
  return (
    <span className="block h-8 w-full overflow-hidden rounded-full bg-neutral-200">
      <span
        className={`block h-8 rounded-full ${tone === 'yellow' ? 'bg-yellow-500' : 'bg-primary-500'}`}
        // Data-driven: the value IS the geometry.
        style={{ width: `${Math.max(percent, 2)}%` }}
      />
    </span>
  )
}

// --- The week tile ---------------------------------------------------------
// Four states carried by fill alone, so the tile needs no sentence: stamped,
// delayed, this week, later. The active tile shows the two halves of a good
// week as dots — a half-filled tile says "you paid but you missed the majelis".

const TILE_STYLE: Record<WeekCell['status'], string> = {
  done: 'bg-primary-500 text-neutral-white',
  missed: 'border border-orange-200 bg-orange-50 text-orange-500',
  active: 'border-2 border-primary-500 bg-neutral-white text-primary-500',
  future: 'border border-default bg-neutral-white text-disabled',
}

const LABEL_STYLE: Record<WeekCell['status'], string> = {
  done: 'text-default',
  missed: 'text-orange-500',
  active: 'font-bold text-primary-500',
  future: 'text-disabled',
}

export function WeekTile({ cell, size = 'md' }: { cell: WeekCell; size?: 'sm' | 'md' }) {
  const s = useApp()
  const box = size === 'sm' ? 'h-32' : 'h-48'

  return (
    <span className="flex min-w-0 flex-1 flex-col items-center gap-4">
      <span
        className={`flex w-full items-center justify-center rounded-8 ${box} ${TILE_STYLE[cell.status]}`}
      >
        {cell.status === 'done' ? <Check size={16} /> : null}
        {cell.status === 'missed' ? <Minus size={16} /> : null}
        {cell.status === 'active' ? <HalfDots paid={s.paid} attended={s.attended} /> : null}
      </span>
      <span className={`truncate text-10 ${LABEL_STYLE[cell.status]}`}>Mgg {cell.week}</span>
    </span>
  )
}

function HalfDots({ paid, attended }: { paid: boolean; attended: boolean }) {
  return (
    <span className="flex gap-4">
      <Dot on={paid} />
      <Dot on={attended} />
    </span>
  )
}

function Dot({ on }: { on: boolean }) {
  return (
    <span
      className={`h-8 w-8 rounded-full ${on ? 'bg-primary-500' : 'border border-primary-200'}`}
    />
  )
}

// --- The reward at the end of a chapter ------------------------------------
// Deliberately not called a prize. The mid-journey milestones open extra
// capital — an option, not a gift — so they read "terbuka" and wear a key.
// Only the week-48 limit increase gets the medal.

export function RewardTile({
  ready,
  amount,
  size = 'md',
}: {
  ready: boolean
  amount: number
  size?: 'sm' | 'md'
}) {
  const box = size === 'sm' ? 'h-32' : 'h-48'

  return (
    <span className="flex min-w-0 flex-col items-center gap-4">
      <span
        className={`flex w-full items-center justify-center gap-4 rounded-8 px-8 ${box} ${
          ready
            ? 'bg-primary-500 text-neutral-white'
            : 'border border-primary-200 bg-primary-50 text-primary-500'
        }`}
      >
        {ready ? <Withdraw size={16} /> : <LockKey size={16} />}
        <span className="whitespace-nowrap text-12 font-bold">{short(amount)}</span>
      </span>
      <span className={`truncate text-10 ${ready ? 'font-bold text-primary-500' : 'text-caption'}`}>
        {ready ? 'Terbuka' : 'Hadiah'}
      </span>
    </span>
  )
}

// --- The two halves of a good week -----------------------------------------
// The actions themselves, kept to one compact row. Paying and attending are
// what the tiles are made of, so they belong inside the same card — but as two
// short lines, not the three-figure block they replace.

export function TaskRow({
  icon,
  label,
  done,
  cta,
  onClick,
}: {
  icon: ReactNode
  label: string
  done: boolean
  cta: string
  onClick: () => void
}) {
  return (
    <div className="flex items-center gap-12">
      <span
        className={`flex h-32 w-32 shrink-0 items-center justify-center rounded-full ${
          done ? 'bg-green-50 text-green-500' : 'bg-primary-50 text-primary-500'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate text-14 text-default">{label}</span>
      {done ? (
        <span className="flex shrink-0 items-center gap-4 text-12 font-bold text-green-500">
          <Check size={16} /> Selesai
        </span>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="shrink-0 rounded-full bg-primary-500 px-16 py-4 text-12 font-bold text-neutral-white"
        >
          {cta}
        </button>
      )}
    </div>
  )
}

/**
 * The pair of tasks, wired so the week stamps itself once both land — no claim
 * tap. When that stamp closes a chapter the caller is sent to the celebration,
 * which is the only place the destination is allowed to get loud.
 */
export function WeekTasks() {
  const flow = useFlow()
  const s = useApp()

  const settle = (half: 'pay' | 'attend') => {
    if (half === 'pay') store.pay()
    else store.attend()

    const next = store.get()
    if (next.paid && next.attended) {
      const closed = store.stampWeek()
      if (closed) flow.go('milestone')
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <TaskRow
        icon={<Coin size={16} />}
        label={`Bayar angsuran ${rupiah(112_000)}`}
        done={s.paid}
        cta="Bayar"
        onClick={() => settle('pay')}
      />
      <TaskRow
        icon={<Majelis size={16} />}
        label="Datang kumpulan Kamis"
        done={s.attended}
        cta="Absen"
        onClick={() => settle('attend')}
      />
    </div>
  )
}

/** The way into the full 48 weeks. Always the card's last line. */
export function LadderLink() {
  const flow = useFlow()

  return (
    <button
      type="button"
      onClick={() => flow.go('progress')}
      className="flex w-full items-center justify-center gap-8 bg-primary-50 p-12 text-12 font-bold text-primary-500"
    >
      Lihat semua {TOTAL_WEEKS} minggu
      <ArrowRight size={16} />
    </button>
  )
}

// --- The page around the card ----------------------------------------------
// Borrowed wholesale from the real AFin home so each option is judged in its
// actual company rather than alone on an empty canvas. None of it is wired.

export function HomeShell({ children }: { children: ReactNode }) {
  const flow = useFlow()

  return (
    <Screen statusBar="none">
      <BrandBand>
        <PoketWidget />
      </BrandBand>

      <h1 className="text-16 font-bold text-default">Perjalanan pendanaan Ibu</h1>

      {children}

      <SectionTitle>Top-up dan bayar tagihan</SectionTitle>
      <div className="flex gap-8">
        <Shortcut icon={<LogoModal size={24} />} tint="blue" label="Modal" />
        <Shortcut icon={<Coin size={24} />} tint="green" label="Celengan" />
        <Shortcut icon={<LightningFill size={24} />} tint="primary" label="PLN" />
        <Shortcut icon={<Wallet size={24} />} tint="primary" label="Isi E-Wallet" />
        <Shortcut icon={<DotsThreeOutline size={24} />} tint="primary" label="Lainnya" />
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
            {
              id: 'progress',
              label: 'Progress',
              icon: <ChartLineUp size={24} />,
              onClick: () => flow.go('progress'),
            },
            { id: 'majelis', label: 'Majelis', icon: <Majelis size={24} /> },
            { id: 'celengan', label: 'Celengan', icon: <Coin size={24} /> },
            { id: 'transaksi', label: 'Transaksi', icon: <Clipboard size={24} /> },
          ]}
        />
      </div>
    </Screen>
  )
}

function BrandBand({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-16 -mt-48">
      <div className="bg-gradient-to-br from-primary-400 to-primary-700 px-16 pb-40 pt-48">
        <div className="flex items-center gap-12 pb-16">
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-500 text-neutral-white">
            <User size={20} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-12 text-neutral-white">Hello! 👋</span>
            <span className="truncate text-16 font-bold text-neutral-white">Ibu Siti</span>
          </span>
          <ChromeIcon>
            <Voucher size={20} />
          </ChromeIcon>
          <ChromeIcon badge="8">
            <Bell size={20} />
          </ChromeIcon>
        </div>
      </div>
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

function PoketWidget() {
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
            {hidden ? 'Rp•••••••' : rupiah(151_000)}
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
      <WalletAction icon={<Plus size={20} />} label="Isi Saldo" />
      <WalletAction icon={<Transfer size={20} />} label="Transfer" />
    </div>
  )
}

function WalletAction({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex shrink-0 flex-col items-center gap-4">
      <span className="flex h-40 w-40 items-center justify-center rounded-12 bg-primary-500 text-neutral-white">
        {icon}
      </span>
      <span className="text-12 text-primary-500">{label}</span>
    </span>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-14 font-bold text-default">{children}</h2>
}

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
    <span className="flex flex-1 flex-col items-center gap-8 rounded-12 border border-default bg-neutral-white px-4 py-12">
      <span className={SHORTCUT_TINT[tint]}>{icon}</span>
      <span className="w-full truncate text-center text-10 text-default">{label}</span>
    </span>
  )
}

function QuickLink({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex flex-1 items-center justify-center gap-8 rounded-full border border-default bg-neutral-white px-12 py-12 text-14 text-default">
      <span className="text-primary-500">{icon}</span>
      {label}
      <ChevronRight size={16} />
    </span>
  )
}
