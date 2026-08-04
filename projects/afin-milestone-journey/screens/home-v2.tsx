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
import { NavigationBar, OfferCard } from '@/design-system/components'
import { NavIcon, ServiceIcon, Wordmark } from '@/design-system/assets'
import {
  ArrowRight,
  Bell,
  ChatCircleQuestion,
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
import { claimableOf, rupiah } from '../lib/data'
import { outstanding, store, tunggakan, useApp } from '../lib/store'
import { BayarButton, BillLine, PayoutTile, Task, billStatus } from '../lib/tasks'
import { Notice, SectionTitle, TaskButton } from '../lib/ui'

/**
 * The rail's two moods. Normally blue — a neutral "here is your stretch".
 * Orange when the reward is at risk, borrowing the warning notice's own tone
 * (`bg-orange-50 text-orange-700`) so the rail reads as the same alarm rather
 * than a second one. Solid 500 for the marks, 700 for the label, because a
 * 500-weight orange is legible as a dot but thin as text.
 */
const RAIL = {
  blue: { ring: 'border-blue-500', fill: 'bg-blue-500', ink: 'text-blue-500' },
  orange: { ring: 'border-orange-500', fill: 'bg-orange-500', ink: 'text-orange-700' },
} as const

type RailTone = keyof typeof RAIL

export function HomeV2Screen() {
  const flow = useFlow()
  const s = useApp()
  const isNew = s.mitraStage === 'new'
  // The reward is at risk in two conditions, not one: the deliberate at-risk
  // state, and a short payment that left arrears behind. Both owe money this
  // week, so both get the warning and the red disbursement chip.
  const rewardAtRisk = !isNew && (s.atRisk || (s.billState === 'paid' && outstanding(s) > 0))
  // The rail and the warning notice below it share one condition, so they share
  // one colour.
  const railTone: RailTone = rewardAtRisk ? 'orange' : 'blue'

  const goToPayment = () => {
    store.startPayment()
    flow.go('amount')
  }

  // How many in her majelis are behind on payments — the majelis row's status
  // line, the mark it carries, and the reason its "Ingatkan" CTA exists.
  const tunggakanCount = tunggakan(s)

  // Read off the ladder rather than held here: whatever the journey page says
  // is hers to take is exactly what home offers, figure included.
  const claimable = claimableOf(s.journeyPhase)

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
              link — the header is the way in, so there is no footer bar.

              A brand-new mitra gets neither. She has no goal yet and no journey
              to look at, so the card is titled for what she DOES have — a
              pinjaman, waiting to be drawn — and "Lihat semua" would open a
              ladder with nothing on it. */}
          <div className="flex items-center gap-8">
            <p className="min-w-0 flex-1 text-16 font-bold text-default">
              {isNew ? 'Pinjaman Anda' : 'Gol pinjaman Anda'}
            </p>
            {isNew ? null : (
              <button
                type="button"
                onClick={() => flow.go('progress')}
                className="shrink-0 text-14 font-bold text-primary-500"
              >
                Lihat semua
              </button>
            )}
          </div>

          {isNew ? null : (
          <div className="mt-24">
            {/* Colour runs from today only as far as the next goal, and
                everything past it is grey. The rail is one claim — "this is the
                stretch you are on" — and colouring the far half too made three
                stops compete when only one is hers to work on. Blue rather than
                brand purple keeps the card's only purple on things she can
                press: "Lihat semua", and the buttons on the rows below.

                When the reward is at risk the whole stretch turns the warning's
                own orange, so the rail and the notice below it are visibly
                about the same thing rather than two unrelated alarms. */}
            <div className="flex items-center">
              <JourneyDot current tone={railTone} />
              <span className={`mx-4 h-2 flex-1 rounded-full ${RAIL[railTone].fill}`} />
              <JourneyDot next tone={railTone} />
              {/* Small dots: the pelunasan and other milestones that fall between
                  the next top-up and the far limit rise. */}
              <span className="mx-4 flex flex-1 items-center gap-4">
                <span className="h-2 flex-1 rounded-full bg-neutral-200" />
                <span className="h-8 w-8 shrink-0 rounded-full border border-neutral-400 bg-neutral-white" />
                <span className="h-2 flex-1 rounded-full bg-neutral-200" />
                <span className="h-8 w-8 shrink-0 rounded-full border border-neutral-400 bg-neutral-white" />
                <span className="h-2 flex-1 rounded-full bg-neutral-200" />
              </span>
              <JourneyDot />
            </div>
            <div className="mt-8 flex gap-4">
              <div className="min-w-0 flex-1">
                {/* Follows its own marker on the rail above it. */}
                <p className={`text-12 font-bold ${RAIL[railTone].ink}`}>Hari ini</p>
              </div>
              {/* Label and figure sit at the date's size, not a step under it:
                  the date alone says nothing useful, and the two lines that
                  give it meaning were the ones being whispered. */}
              <div className="min-w-0 flex-1 text-center">
                <p className="text-12 font-bold text-default">6 Okt &rsquo;26</p>
                <p className="text-12 text-caption">Pencairan</p>
                {/* Both chips green, and "s/d" on both: they are the same kind
                    of thing — money this stretch could be worth — so they are
                    hedged the same way and tinted the same way.

                    Green even when the reward is at risk. The figure has not
                    changed and is still what she stands to get; reddening it
                    said the money had been lost, when the whole point of the
                    warning is that it is still there to save. The rail and the
                    notice carry the alarm. */}
                <span className="mt-4 inline-block rounded-full bg-green-50 px-8 py-2 text-12 font-bold text-green-600">
                  s/d Rp1,25jt
                </span>
              </div>
              <div className="min-w-0 flex-1 text-right">
                <p className="text-12 font-bold text-default">23 Mar &rsquo;27</p>
                {/* The hedge now rides on the chip alone — "s/d Rp8jt", not
                    "Rp8jt". The rise is assessed at the end of the tenor and
                    the figure is a ceiling, so stating it flat would read as a
                    promise the product has not made. */}
                <p className="text-12 text-caption">Naik limit</p>
                <span className="mt-4 inline-block rounded-full bg-green-50 px-8 py-2 text-12 font-bold text-green-600">
                  s/d Rp8jt
                </span>
              </div>
            </div>
          </div>
          )}

          {/* The intro line belongs to a list of habits. A new mitra has one
              row and it is not a habit, so it would be introducing nothing. */}
          {isNew ? null : rewardAtRisk ? (
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

          <div className={`flex flex-col gap-16 ${isNew ? 'mt-24' : ''}`}>
            {isNew ? (
              // Her whole card: the money is already hers to take, so the row
              // states the figure the way the payout band does rather than
              // burying it in a caption.
              <Task
                status="todo"
                title="Dana siap dicairkan"
                description={<span className="text-18 font-bold text-green-600">Rp5jt</span>}
                action={
                  <TaskButton tone="primary" onClick={() => flow.go('disburse-amount')}>
                    Cairkan
                  </TaskButton>
                }
              />
            ) : (
              <>
                {/* Settled ticks the box; behind on the week raises the alarm.
                    A part-payment does neither — it is still simply to do, so it
                    keeps the empty circle and says how much is left. */}
                <Task
                  status={billStatus(s)}
                  title="Bayar angsuran"
                  description={<BillLine />}
                  action={<BayarButton onPay={goToPayment} />}
                />
                <Task
                  status={s.hadirKumpulan ? 'done' : s.atRisk ? 'alert' : 'todo'}
                  title="Datang kumpulan"
                  description="Kamis, 11.30"
                />
                {/* Named for the state it should be in rather than the one it is
                    in: the row reads "Majelis lancar bayar" either way, and the
                    mark beside it says whether that is true this week. */}
                <Task
                  status={tunggakanCount === 0 ? 'done' : 'alert'}
                  title="Majelis lancar bayar"
                  description={
                    tunggakanCount === 0
                      ? 'Semua anggota lancar bayar'
                      : `${tunggakanCount} anggota punya tunggakan`
                  }
                  action={
                    tunggakanCount === 0 ? undefined : (
                      <TaskButton tone="primary" onClick={() => flow.go('majelis')}>
                        Ingatkan
                      </TaskButton>
                    )
                  }
                />
              </>
            )}
          </div>

        </div>

        {/* Money already on the table. A full-width rule closes the habit rows
            off, and below it the payout sits in a tinted box of its own, inset
            from the card's edge — not the same kind of thing as the rows above
            it, which are habits to keep in order to earn the next goal. This is
            a goal already earned and waiting to be taken. No avatar tile, so it
            reads as a payout rather than a fourth task, and a solid button
            rather than the outline the tasks carry.

            Absent unless a rung has been reached and left undrawn, so a mitra
            with nothing open never sees an empty promise. */}
        {!isNew && claimable?.amount ? (
          <>
            {/* `border-default`, not the `border-light` used elsewhere in this
                card: it is the only rule left on the card now, so it carries
                the whole separation between habits and payout on its own. */}
            <div className="border-t border-default" />
            <div className="p-12">
              <PayoutTile
                amount={claimable.amount}
                onCairkan={() => flow.go('disburse-amount')}
              />
            </div>
          </>
        ) : null}
      </div>

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
              onClick: () => flow.go('progress'),
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
      <WalletAction icon={<Plus size={16} />} label="Isi Saldo" onClick={() => {
          store.goTopUp('home')
          flow.go('topup')
        }} />
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

// The cross-sell tile that used to live here is now the shared `OfferCard` in
// @/design-system/components, carrying the real product lockups.

// --- The capital-journey timeline ------------------------------------------
// A node on the horizontal journey line: the filled target ring marks where she
// is now, hollow rings the stops still ahead.

function JourneyDot({
  current,
  next,
  tone = 'blue',
}: {
  current?: boolean
  next?: boolean
  /** Only read by the two coloured nodes — the far one is grey in every mood. */
  tone?: RailTone
}) {
  const t = RAIL[tone]
  if (current) {
    return (
      <span
        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 ${t.ring}`}
      >
        <span className={`h-8 w-8 rounded-full ${t.fill}`} />
      </span>
    )
  }
  // The goal she is walking toward: the rail's colour like today's marker,
  // empty because she has not arrived, and a size larger than the far node so
  // the rail has an obvious destination rather than two identical rings.
  if (next) {
    return <span className={`h-24 w-24 shrink-0 rounded-full border-2 bg-neutral-white ${t.ring}`} />
  }
  return <span className="h-20 w-20 shrink-0 rounded-full border-2 border-neutral-200 bg-neutral-white" />
}

// --- Tasks -----------------------------------------------------------------


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
