'use client'

// Option B — the tier.
//
// A is anchored on a rupiah figure ("Naik limit hingga Rp8jt"), and that
// headline can only stay honest by hedging: `s/d` while the majelis bonus is
// still live, silently dropping when the group falls out. The hedge is the
// tell — the number is the sum of two requirements that land at different
// times, so it cannot be stated once and left alone.
//
// B changes the anchor to a STATUS. "Mitra Juara" is not the sum of anything,
// so it never needs correcting; the amounts move down into the tier's benefits,
// where a range is normal and nothing is promised as a figure. Three
// consequences the screen is built around:
//
//   · The destination is a name, and the 48 weeks are the path to it.
//   · The majelis does not gate the tier — she earns it with her own weeks.
//     The group makes the LIMIT benefit bigger, said as a note on that one
//     line, so a mitra with a perfect record is never told she failed because
//     of her neighbours.
//   · Arriving is not the end. A limit rise happens once; a standing is kept.
//     When she opens the next tenor already Juara the same card reads as
//     maintenance — the `juara-maintained` state shows it.
//
// And the thing that separates it from A in SHAPE, not just in anchor: home
// carries no board. A puts the four-week chapter on the homepage; B states the
// standing, what it is worth, and the single thing owed this week, and sends
// the whole 48-week ladder — with the rupiah increments on it — one tap away.
// If the status is a strong enough anchor, the streak does not need to be on
// home to work; that is precisely what this option is for finding out.

import type { ReactNode } from 'react'
import {
  TIER_BENEFITS,
  TIER_GOAL,
  TOTAL_WEEKS,
  goodWeeks,
  isJuara,
  journeyPercent,
  rupiah,
} from '../lib/data'
import { store, useApp } from '../lib/store'
import { HomeShell, LadderLink, MajelisCard } from '../lib/ui'
import { useFlow } from '@/platform/runtime'
import { CalendarDots, Check, Medal, TrendUp, Withdraw } from '@/design-system/icons'

const BENEFIT_ICONS = [
  <TrendUp key="limit" size={20} />,
  <Withdraw key="pencairan" size={20} />,
  <CalendarDots key="tenor" size={20} />,
]

export function HomeBScreen() {
  const s = useApp()
  const juara = isJuara(s)

  return (
    <HomeShell>
      <div className="overflow-hidden rounded-20 border border-default bg-neutral-white">
        {/* The destination band. A name where A puts a rupiah figure — and the
            same 48-week fraction underneath, because the path is identical.
            Once she is already Juara the band states the standing instead, and
            the bar becomes what keeps it. */}
        <div className="bg-gradient-to-br from-primary-400 to-primary-600 px-16 pb-24 pt-16">
          <div className="flex items-start gap-12">
            <span className="flex h-48 w-48 shrink-0 items-center justify-center rounded-12 bg-primary-700 text-neutral-white">
              <Medal size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-14 text-neutral-white">{juara ? 'Status Ibu' : 'Menuju'}</p>
              <p className="mt-2 text-24 font-bold text-neutral-white">{TIER_GOAL}</p>
            </div>
            <p className="shrink-0 text-right text-14 text-neutral-white">
              {goodWeeks(s)} dari {TOTAL_WEEKS}
              <br />
              minggu lancar
            </p>
          </div>

          <span className="mt-16 block h-8 w-full overflow-hidden rounded-full bg-primary-700">
            <span
              className="block h-8 rounded-full bg-green-400"
              // Data-driven: the value IS the geometry.
              style={{ width: `${Math.max(journeyPercent(s), 2)}%` }}
            />
          </span>

          <p className="mt-8 text-12 text-neutral-200">
            {juara
              ? `Pertahankan sampai minggu ${TOTAL_WEEKS} untuk tetap ${TIER_GOAL}`
              : `Lancar sampai minggu ${TOTAL_WEEKS} untuk jadi ${TIER_GOAL}`}
          </p>
        </div>

        {/* The white sheet, overlapping the band's lower edge — same shape as A
            so the two options differ in argument, not in styling. */}
        <div className="-mt-12 rounded-t-20 bg-neutral-white px-16 pb-16 pt-20">
          {/* Why bother. Three lines, no figures: this is the block the rupiah
              headline used to do, and the only one allowed to describe what
              the status is worth. */}
          <h2 className="text-14 text-caption">
            {juara ? `Yang Ibu dapatkan sebagai ${TIER_GOAL}` : `Yang Ibu dapat jadi ${TIER_GOAL}`}
          </h2>
          <div className="mt-12 flex flex-col gap-12">
            {TIER_BENEFITS.map((benefit, i) => (
              <Benefit
                key={benefit.title}
                icon={BENEFIT_ICONS[i]}
                title={benefit.title}
                note={'note' in benefit ? benefit.note : undefined}
              />
            ))}
          </div>

          <div className="mt-20 border-t border-default pt-16">
            <ThisWeek />
          </div>
        </div>

        <LadderLink />
      </div>

      <MajelisCard />
    </HomeShell>
  )
}

/**
 * The whole near term, in one line. Everything the board on A shows — the
 * chapter, the tiles, the increment it pays — is on the detail page; home keeps
 * only the thing that is actually owed today.
 *
 * The three faces are the three real conditions of a week: not yet paid,
 * paid and waiting on the majelis (which records itself), and both halves in.
 * No progress figure appears here — the band above already carries the count,
 * and repeating it is what made this half of the card too heavy.
 */
function ThisWeek() {
  const flow = useFlow()
  const s = useApp()

  const pay = () => {
    store.pay()
    // Attendance arrives from the majelis a moment later, on its own.
    window.setTimeout(() => {
      store.attend()
      const next = store.get()
      if (next.paid && next.attended && store.stampWeek()) flow.go('milestone')
    }, 1400)
  }

  if (s.paid) {
    return (
      <div className="flex items-center gap-12">
        <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-500">
          <Check size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-14 text-default">Angsuran minggu {s.week} sudah dibayar</span>
          <span className="mt-2 block text-12 text-caption">
            Menunggu kehadiran kumpulan Kamis — dicatat otomatis
          </span>
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-12">
      <span className="min-w-0 flex-1">
        <span className="block text-14 text-default">Minggu {s.week} belum dibayar</span>
        <span className="mt-2 block text-16 font-bold text-default">{rupiah(112_000)}</span>
      </span>
      <button
        type="button"
        onClick={pay}
        className="shrink-0 rounded-full bg-primary-500 px-24 py-8 text-14 font-bold text-neutral-white"
      >
        Bayar
      </button>
    </div>
  )
}

// One tier benefit. The limit line carries the majelis note, which is the only
// place the group appears in the tier at all — as more of a benefit she has
// already earned, never as a condition on the status.
function Benefit({ icon, title, note }: { icon: ReactNode; title: string; note?: string }) {
  return (
    <div className="flex items-start gap-12">
      <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-8 bg-primary-50 text-primary-500">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-14 text-default">{title}</span>
        {note ? <span className="mt-2 block text-12 text-caption">{note}</span> : null}
      </span>
    </div>
  )
}
