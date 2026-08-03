'use client'

// The parts every screen here shares: the real AFin page around the card, the
// destination line the three options all carry, and the week tile itself — the
// one piece of vocabulary the whole concept rests on.

import { useState, type ReactNode } from 'react'
import { NavigationBar } from '@/design-system/components'
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
  Minus,
  Plus,
  Promo,
  Transfer,
  User,
} from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah, type GroupStatus, type WeekCell } from './data'
import { useApp } from './store'

// --- The majelis -----------------------------------------------------------
// The group has a different owner and a different cadence from her own weeks,
// so it never carries a grade of its own. The good state carries NO numbers
// either: a count appears only where there is something to do about it, which
// is the "fewer numbers" rule applied properly — a figure earns its place by
// being actionable.

const GROUP_COPY: Record<GroupStatus, { badge: string }> = {
  baik: { badge: 'Baik' },
  jaga: { badge: 'Perlu dijaga' },
  lewat: { badge: 'Tidak tercapai' },
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
// Five states carried by fill alone, so the tile needs no sentence: paid, paid
// late, not paid, this week, later. Late and unpaid are two different colours
// rather than two shades of one, because they have two different consequences —
// late trims the four-week increase, unpaid cancels it. The active tile shows
// the two halves of a good week as dots — a half-filled tile says "you paid but
// you missed the majelis".

const TILE_STYLE: Record<WeekCell['status'], string> = {
  done: 'bg-primary-500 text-neutral-white',
  late: 'border border-orange-500 bg-orange-50 text-orange-500',
  missed: 'border border-red-200 bg-red-50 text-red-500',
  active: 'border-2 border-primary-500 bg-neutral-white text-primary-500',
  future: 'border border-default bg-neutral-white text-disabled',
}

const LABEL_STYLE: Record<WeekCell['status'], string> = {
  done: 'text-default',
  late: 'text-orange-500',
  missed: 'text-red-500',
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
        {cell.status === 'done' || cell.status === 'late' ? <Check size={16} /> : null}
        {cell.status === 'missed' ? <Minus size={16} /> : null}
        {cell.status === 'active' ? <HalfDots paid={s.paid} attended={s.attended} /> : null}
      </span>
      <span className={`truncate text-10 ${LABEL_STYLE[cell.status]}`}>Mgg {cell.week}</span>
    </span>
  )
}

/**
 * What the three fills mean, once. The tracker is the only screen that shows
 * all three side by side, and a board of coloured boxes with no key is a puzzle
 * — but it belongs here, next to the styles it explains, so the two can never
 * drift apart.
 */
export function WeekLegend() {
  return (
    <div className="flex items-center gap-16 rounded-12 border border-default bg-neutral-white p-12">
      <LegendItem status="done" label="Dibayar" />
      <LegendItem status="late" label="Telat" />
      <LegendItem status="missed" label="Belum bayar" />
    </div>
  )
}

function LegendItem({ status, label }: { status: WeekCell['status']; label: string }) {
  return (
    <span className="flex items-center gap-4">
      <span
        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-4 ${TILE_STYLE[status]}`}
      >
        {status === 'missed' ? <Minus size={16} /> : <Check size={16} />}
      </span>
      <span className="text-12 text-caption">{label}</span>
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

// --- Into the detail page --------------------------------------------------

/**
 * Home's footer. Home quotes ONE benefit — what the next twelve weeks add — so
 * the second benefit and the grades themselves need a door, and this is it. It
 * points at the status page, which is what home anchors on; the weeks
 * themselves are one further tap, from there.
 *
 * Drawn as a quiet row on the card's own white behind a divider, not a tinted
 * bar: the card already has a purple band and a purple track, and a third
 * purple block at the bottom would compete with the one thing on the card that
 * is actually tapped.
 */
export function StatusLink() {
  const flow = useFlow()

  return (
    <button
      type="button"
      onClick={() => flow.go('progress-tier')}
      className="flex w-full items-center justify-center gap-8 border-t border-default p-16 text-14 text-caption"
    >
      Lihat seluruh keuntungan
      <ChevronRight size={16} />
    </button>
  )
}

// --- The page around the card ----------------------------------------------
// The real AFin home, so each option is judged in its actual company rather
// than alone on an empty canvas. Every piece below is copied from
// projects/amarthafin-live/lib/ui.tsx — the shipped page — so the only thing
// this prototype changes about the homepage is the journey card itself. None of
// the surrounding chrome is wired.

export function HomeShell({ children }: { children: ReactNode }) {
  const flow = useFlow()

  return (
    <Screen
      statusBar="none"
      canvas="white"
      // The greeting row is chrome: it rides in Screen's pinned slot and stays
      // put while the page scrolls under it. The fill sits on the slot so the
      // purple reaches the very top of the display.
      chromeClassName={BAND_FILL}
      topBar={<BrandHeader />}
    >
      <BrandBand>
        <PoketWidget />
      </BrandBand>

      <SectionTitle showArrow={false}>Perjalanan pendanaan Ibu</SectionTitle>

      {children}

      <ShortcutRow />

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

      {/* The shipped bottom bar, unchanged. Only Pinjaman is wired — it is the
          slot this journey lives behind; the majelis is reached from its own
          card above. */}
      <div className="sticky bottom-0 -mx-16 mt-auto">
        <NavigationBar
          items={[
            { id: 'home', label: 'Home', icon: <NavIcon name="home" active />, active: true },
            {
              id: 'pinjaman',
              label: 'Pinjaman',
              icon: <NavIcon name="modal" />,
              onClick: () => flow.go('progress-tier'),
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

// The PPOB strip: five bordered shortcuts, padded 16px inside the page padding
// on a fill that is the page's own white.
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

// The band's purple fill. Horizontal rather than diagonal: the band is split
// across two elements — the pinned header and the sag below it — and only a
// left-to-right gradient carries across that seam invisibly.
const BAND_FILL = 'bg-gradient-to-r from-primary-400 to-primary-500'

// The greeting row, handed to Screen as its `topBar` so it stays pinned. It
// carries no fill of its own — Screen paints the whole pinned block, status
// strip included, via `chromeClassName`.
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

// What is left of the band below the pinned header: the last flat 16px, the
// sag, and the wallet sitting across the join.
function BrandBand({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-16 -mt-16">
      {/* The band's bottom edge is a bezier, not a radius: the production mask
          leaves each side corner already angled downward, which an elliptical
          border-radius cannot do (it is tangent-vertical at the sides and
          rounds the corners the real shape keeps sharp). So the sag is its own
          24px strip below the flat rectangle, clipped to the mask's path in
          objectBoundingBox units so it stretches to any device width. */}
      <svg aria-hidden className="absolute h-0 w-0">
        <clipPath id="checkin-band-sag" clipPathUnits="objectBoundingBox">
          <path d="M1 0 C1 0 0.8067 1 0.5 1 C0.1933 1 0 0 0 0 Z" />
        </clipPath>
      </svg>
      <div className={`h-16 w-full ${BAND_FILL}`} />
      <div className={`h-24 w-full ${BAND_FILL}`} style={{ clipPath: 'url(#checkin-band-sag)' }} />
      {/* `relative` is load-bearing: a clip-path makes the sag strip above its
          own stacking context, which would otherwise paint over this in-flow
          sibling and cut the wallet in half. */}
      <div className="relative -mt-40 px-16">{children}</div>
    </div>
  )
}

// Frosted-glass chrome button: a translucent primary-50 wash over a backdrop
// blur so the gradient shows through, rounded by two shadows — a soft drop
// below and an inset purple highlight up and to the left. Neither shadow is a
// token, so they go in a style prop; the colours are still the tokens.
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

export function SectionTitle({
  children,
  showArrow = true,
  onClick,
}: {
  children: ReactNode
  showArrow?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between text-left text-16 font-bold text-default"
    >
      {children}
      {showArrow ? <ArrowRight size={16} className="text-caption" /> : null}
    </button>
  )
}

// The bordered box holds the GLYPH ONLY — the product name sits below it,
// outside the box, and is allowed to wrap onto two lines rather than truncate.
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

function QuickLink({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex flex-1 items-center justify-center gap-8 rounded-full border border-default bg-neutral-white px-12 py-12 text-14 text-default">
      <span className="text-primary-500">{icon}</span>
      {label}
    </span>
  )
}
