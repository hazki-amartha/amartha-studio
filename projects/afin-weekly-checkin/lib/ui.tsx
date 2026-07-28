'use client'

// The parts every screen here shares: the real AFin page around the card, the
// destination line the three options all carry, and the week tile itself — the
// one piece of vocabulary the whole concept rests on.

import { useState, type ReactNode } from 'react'
import { NavigationBar } from '@/design-system/components'
import { ProductLogo, ServiceIcon, Wordmark } from '@/design-system/assets'
import {
  ArrowRight,
  Bell,
  ChartLineUp,
  ChatCircleQuestion,
  Check,
  ChevronRight,
  Clipboard,
  Coin,
  Eye,
  EyeSlash,
  Headset,
  House,
  Majelis,
  Medal,
  Minus,
  Plus,
  Transfer,
  User,
  Voucher,
} from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  GROUP_SIZE,
  TOTAL_CHAPTERS,
  TOTAL_WEEKS,
  goodWeeks,
  groupStatus,
  journeyPercent,
  limitOnOffer,
  nextWindow,
  rupiah,
  short,
  weeksToWindow,
  type GroupStatus,
  type WeekCell,
} from './data'
import { store, useApp, type AppState } from './store'

// --- The destination line --------------------------------------------------
// The limit increase, stated once and carrying no mechanics: an icon, an
// amount, a fraction, a bar. It is the reason to bother, held above the row
// that says what to do — so the far reward frames the near one instead of
// competing with it for the same kind of attention.
//
// One number, not two: her own Rp2jt and the majelis's Rp1jt are the same
// currency, so home says "s/d Rp3jt" and the split is a detail-page concern.
// When the group bonus goes out of reach the figure honestly drops to Rp2jt.

export function Destination() {
  const s = useApp()
  const offer = limitOnOffer(s)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-12">
        <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-yellow-50 text-yellow-600">
          <Medal size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-14 font-bold text-default">
            Limit naik {groupStatus(s) === 'lewat' ? '' : 's/d '}
            {short(offer)}
          </p>
          <p className="mt-2 text-12 text-caption">
            {goodWeeks(s)} dari {TOTAL_WEEKS} minggu lancar
          </p>
        </div>
        <span className="shrink-0 text-12 font-bold text-caption">{journeyPercent(s)}%</span>
      </div>
      <Meter percent={journeyPercent(s)} />
    </div>
  )
}

// --- The pot ---------------------------------------------------------------
// What a milestone actually pays. Nobody withdraws monthly in practice, so the
// reward does not hand over cash — it grows what she can take at the next
// window. That also separates earning from borrowing: she banks the reward in a
// calm moment and decides about debt in a different one.

export function windowLine(s: AppState): string {
  const left = weeksToWindow(s)
  if (left === 0) return 'Pencairan dibuka minggu ini'
  return `Bisa dicairkan minggu ${nextWindow(s)} · ${left} minggu lagi`
}

// --- The majelis -----------------------------------------------------------
// A card of its own rather than a lane inside the personal one: the group has a
// different owner and a different cadence, and home is already dense. Three
// lines here, everything real on the detail page behind it.
//
// The good state carries NO numbers. A count appears only in the state where
// there is something to do about it — which is the whole "fewer numbers" rule
// applied properly: a figure earns its place by being actionable.

const GROUP_COPY: Record<GroupStatus, { badge: string; line: string }> = {
  baik: {
    badge: 'Baik',
    line: 'Pertahankan untuk tambahan limit di akhir tenor',
  },
  jaga: {
    badge: 'Perlu dijaga',
    line: '',
  },
  lewat: {
    badge: 'Tidak tercapai',
    line: 'Tambahan limit dari kelompok tidak tercapai tenor ini',
  },
}

export function MajelisCard() {
  const flow = useFlow()
  const s = useApp()
  const status = groupStatus(s)
  const copy = GROUP_COPY[status]

  return (
    <button
      type="button"
      onClick={() => flow.go('majelis')}
      className="flex w-full items-center gap-12 rounded-16 border border-default bg-neutral-white p-12 text-left"
    >
      <span
        className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-full ${
          status === 'lewat' ? 'bg-neutral-50 text-neutral-500' : 'bg-primary-50 text-primary-500'
        }`}
      >
        <Majelis size={24} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-8">
          <span className="truncate text-14 font-bold text-default">Kelompok Melati</span>
          <GroupBadge status={status} />
        </span>
        <span className="mt-2 block text-12 text-caption">
          {status === 'jaga'
            ? `${GROUP_SIZE - s.groupShort} dari ${GROUP_SIZE} sudah bayar minggu ini`
            : copy.line}
        </span>
      </span>
      <ChevronRight size={20} className="shrink-0 text-neutral-500" />
    </button>
  )
}

export function GroupBadge({ status }: { status: GroupStatus }) {
  const tone =
    status === 'baik'
      ? 'bg-green-50 text-green-500'
      : status === 'jaga'
        ? 'bg-orange-50 text-orange-500'
        : 'bg-neutral-200 text-neutral-700'

  return (
    <span className={`shrink-0 rounded-full px-8 py-2 text-10 font-bold ${tone}`}>
      {GROUP_COPY[status].badge}
    </span>
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

// --- The two halves of a good week -----------------------------------------
// The actions themselves, kept to one compact row. Paying and attending are
// what the tiles are made of, so they belong inside the same card — but as two
// short lines, not the three-figure block they replace.

export function TaskRow({
  icon,
  label,
  done,
  cta,
  hint,
  onClick,
}: {
  icon: ReactNode
  label: string
  done: boolean
  /** The button, for the half the mitra actually performs in the app. */
  cta?: string
  /** Shown instead of a button for the half that records itself. */
  hint?: string
  onClick?: () => void
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
      ) : cta && onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="shrink-0 rounded-full bg-primary-500 px-16 py-4 text-12 font-bold text-neutral-white"
        >
          {cta}
        </button>
      ) : (
        <span className="shrink-0 text-12 text-caption">{hint}</span>
      )}
    </div>
  )
}

/**
 * What a week is made of, stated outright — because the tile fills itself and
 * nothing else on the card would ever say how.
 *
 * There is no Absen button: attendance is recorded for her at the majelis, so
 * the only thing to tap here is the instalment. The week stamps once both
 * halves are in, and if that stamp closes a chapter we go straight to the
 * celebration — the one place the destination is allowed to get loud.
 */
export function WeekTasks() {
  const flow = useFlow()
  const s = useApp()

  const stamp = () => {
    const next = store.get()
    if (next.paid && next.attended) {
      const closed = store.stampWeek()
      if (closed) flow.go('milestone')
    }
  }

  const pay = () => {
    store.pay()
    stamp()
    // Attendance arrives from the majelis a moment later, on its own.
    window.setTimeout(() => {
      store.attend()
      stamp()
    }, 1400)
  }

  return (
    <div className="flex flex-col gap-12">
      <p className="text-12 text-caption">
        Minggu ini terisi sendiri kalau Ibu melakukan 2 hal:
      </p>
      <TaskRow
        icon={<Coin size={16} />}
        label={`Bayar angsuran ${rupiah(112_000)}`}
        done={s.paid}
        cta="Bayar"
        onClick={pay}
      />
      <TaskRow
        icon={<Majelis size={16} />}
        label="Datang kumpulan Kamis"
        done={s.attended}
        hint="Dicatat otomatis"
      />
    </div>
  )
}

// --- Into the detail page --------------------------------------------------
// Two ladders, and a card must never point at the wrong one. A and B count in
// weeks, so they go to the weeks page and say so; C counts in rewards and goes
// to the rewards page. Mixing the two units is the one thing the detail pages
// exist to avoid.

export type Ladder = 'weeks' | 'rewards'

export function LadderLink({ ladder }: { ladder: Ladder }) {
  const flow = useFlow()

  return (
    <button
      type="button"
      onClick={() => flow.go(ladder === 'weeks' ? 'progress-weeks' : 'progress-rewards')}
      className="flex w-full items-center justify-center gap-8 bg-primary-50 p-12 text-12 font-bold text-primary-500"
    >
      {ladder === 'weeks'
        ? `Lihat semua ${TOTAL_WEEKS} minggu`
        : `Lihat ${TOTAL_CHAPTERS} hadiah Ibu`}
      <ArrowRight size={16} />
    </button>
  )
}

// --- The page around the card ----------------------------------------------
// Borrowed wholesale from the real AFin home so each option is judged in its
// actual company rather than alone on an empty canvas. None of it is wired.

export function HomeShell({ ladder, children }: { ladder: Ladder; children: ReactNode }) {
  const flow = useFlow()
  const progressId = ladder === 'weeks' ? 'progress-weeks' : 'progress-rewards'

  return (
    <Screen statusBar="none">
      <BrandBand>
        <PoketWidget />
      </BrandBand>

      <h1 className="text-16 font-bold text-default">Perjalanan pendanaan Ibu</h1>

      {children}

      <SectionTitle>Top-up dan bayar tagihan</SectionTitle>
      {/* Every tile prints its own label underneath, so the two Amartha
          products use the MARK, never the lockup — otherwise Modal and
          Celengan would show their names twice. */}
      <div className="flex gap-8">
        <Shortcut icon={<ProductLogo name="modal" size={32} />} label="Modal" />
        <Shortcut icon={<ProductLogo name="celengan" size={32} />} label="Celengan" />
        <Shortcut icon={<ServiceIcon name="pln" size={32} />} label="PLN" />
        <Shortcut icon={<ServiceIcon name="e-wallet" size={32} />} label="Isi E-Wallet" />
        <Shortcut icon={<ServiceIcon name="all" size={32} />} label="Lainnya" />
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
              onClick: () => flow.go(progressId),
            },
            {
              id: 'majelis',
              label: 'Majelis',
              icon: <Majelis size={24} />,
              onClick: () => flow.go('majelis'),
            },
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

// The wallet, drawn to the Figma: 12px padding, 16px radius, and the pale
// left-to-right wash behind it.
//
// The name is the Poket lockup, not a mark plus a typed word — the artwork
// already sets "Poket", so a text label beside it would draw the name twice in
// two different typefaces.

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

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-14 font-bold text-default">{children}</h2>
}

function Shortcut({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex flex-1 flex-col items-center gap-4 rounded-16 border border-default bg-neutral-white px-4 py-12">
      {icon}
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
