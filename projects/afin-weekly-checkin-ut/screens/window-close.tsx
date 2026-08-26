'use client'

// The window closes. B's beat, and the reason B needed its own celebration
// screen instead of borrowing A's four-week one: under this model four clean
// weeks buy rhythm and nothing else, so there is nothing to announce at week 4.
// The moment worth a screen is the twelfth week, when the decision is made.
//
// Three faces, and the split between them is exactly the model:
//
//   · full     — twelve weeks, all on time. The amount is quoted in full.
//   · reduced  — everything paid, some of it late. Still eligible, smaller
//                number, and ONE lever named: pay on time.
//   · failed   — a week went unpaid to the close, or the kumpulan fell below
//                10 of 12. No disbursement, standing dropped, and a route back.
//
// The amount on the first two faces is the only rupiah figure B ever prints,
// and it is printed as a QUOTE — what the engine offers today — never as
// something she could have computed. That is why there is no "you lost Rpx"
// line anywhere on the reduced face: the difference between the two numbers is
// not ours to explain, and a mitra cannot act on it. What she can act on is the
// sentence underneath.

import { NavigationHeader } from '@/design-system/components'
import { ArrowRight, CheckCircleFill, LockKey, Warning } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  KUMPULAN_REQUIRED,
  QUOTE_FULL,
  QUOTE_REDUCED,
  STATUS_NAME,
  gradeInfo,
  gradeOfOutcome,
  WINDOWS_IN_TENOR,
  WINDOW_LENGTH,
  absencesIn,
  lateIn,
  rupiah,
  windowEnd,
  windowOf,
  windowStart,
} from '../lib/data'
import { useApp } from '../lib/store'

export function WindowCloseScreen() {
  const flow = useFlow()
  const s = useApp()

  // The window that just closed is the one the previous week belonged to — the
  // cursor has already moved into the next.
  const index = windowOf(Math.max(s.week - 1, 1))
  const outcome = s.windowLog[index - 1] ?? 'full'
  const late = lateIn(s, index).length
  const absent = absencesIn(s, index).length
  const onTime = WINDOW_LENGTH - late

  return (
    <Screen topBar={<NavigationHeader title={`Minggu ${windowEnd(index)}`} onBack={flow.back} />}>
      {/* The verdict. One icon, one sentence, and — when there is one — one
          number. Nothing above it competes. */}
      <div className="rounded-16 border border-default bg-neutral-white p-16">
        <div className="flex flex-col items-center pb-8 pt-8 text-center">
          {outcome === 'failed' ? (
            <span className="flex h-48 w-48 items-center justify-center rounded-full bg-neutral-200 text-caption">
              <LockKey size={24} />
            </span>
          ) : (
            <span className="flex h-48 w-48 items-center justify-center rounded-full bg-green-50 text-green-500">
              <CheckCircleFill size={24} />
            </span>
          )}

          <h1 className="mt-12 text-18 font-bold text-default">
            {outcome === 'failed'
              ? 'Jumlah pencairan tidak bertambah'
              : 'Jumlah pencairan Ibu bertambah'}
          </h1>

          {outcome === 'failed' ? (
            <p className="mt-4 text-14 text-caption">
              Ada minggu yang belum dibayar sampai minggu {windowEnd(index)}. {STATUS_NAME} Ibu:{' '}
              {gradeInfo(gradeOfOutcome(outcome)).label}.
            </p>
          ) : (
            <>
              <p className="mt-12 text-24 font-bold text-primary-500">
                +{rupiah(outcome === 'full' ? QUOTE_FULL : QUOTE_REDUCED)}
              </p>
              <p className="mt-4 text-12 text-caption">
                {STATUS_NAME} Ibu: {gradeInfo(gradeOfOutcome(outcome)).label}
              </p>
            </>
          )}
        </div>
      </div>

      {/* What the twelve weeks looked like. Facts about her own behaviour, which
          is the register B is allowed to be concrete in — as opposed to the
          payout, which it is not. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <p className="text-14 font-bold text-default">
          Minggu {windowStart(index)}–{windowEnd(index)}
        </p>
        <div className="mt-12 flex flex-col gap-8">
          <Tally label="Dibayar tepat waktu" value={`${onTime} minggu`} />
          {late > 0 ? <Tally label="Dibayar terlambat" value={`${late} minggu`} warn /> : null}
          <Tally
            label="Hadir kumpulan"
            value={`${WINDOW_LENGTH - absent} dari ${WINDOW_LENGTH}`}
            warn={WINDOW_LENGTH - absent < KUMPULAN_REQUIRED}
          />
        </div>
      </div>

      {/* The one lever, stated once. On the failed face it is a route back
          rather than an improvement — but it is still exactly one thing. */}
      <div
        className={`rounded-12 p-16 ${
          outcome === 'failed' ? 'bg-neutral-white border border-default' : 'bg-primary-50'
        }`}
      >
        {outcome === 'full' ? (
          <p className="text-14 text-default">
            Dua belas minggu tepat waktu, jadi penambahannya penuh. Jaga sampai minggu 48 supaya
            limit Ibu naik.
          </p>
        ) : outcome === 'reduced' ? (
          <p className="text-14 text-default">
            Semua angsuran lunas, jadi status modal Ibu tetap Baik. Ada yang dibayar terlambat,
            jadi penambahannya belum penuh — <span className="font-bold">bayar tepat waktu</span>{' '}
            untuk naik ke Sangat Baik di 12 minggu berikutnya.
          </p>
        ) : (
          <div className="flex items-start gap-12">
            <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <Warning size={16} />
            </span>
            <p className="min-w-0 flex-1 text-14 text-default">
              Setelah tunggakan lunas, status modal Ibu naik lagi dan jumlah pencairan bisa
              bertambah di minggu {windowEnd(Math.min(index + 1, WINDOWS_IN_TENOR))}. Yang sudah
              lancar tidak hilang.
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => flow.go('progress-tier')}
        className="flex w-full items-center justify-center gap-8 rounded-12 border border-default bg-neutral-white p-16 text-14 font-bold text-primary-500"
      >
        Lihat {STATUS_NAME.toLowerCase()} Ibu
        <ArrowRight size={16} />
      </button>

      <button
        type="button"
        onClick={() => flow.go('home-b')}
        className="w-full rounded-full bg-primary-500 py-12 text-16 font-bold text-neutral-white"
      >
        Kembali ke beranda
      </button>

      <div className="pb-16" />
    </Screen>
  )
}

function Tally({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline gap-8">
      <span className="min-w-0 flex-1 text-12 text-caption">{label}</span>
      <span className={`shrink-0 text-12 font-bold ${warn ? 'text-orange-500' : 'text-default'}`}>
        {value}
      </span>
    </div>
  )
}
