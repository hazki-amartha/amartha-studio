'use client'

// Progress limit detail ("Ibu Siti") — Figma section 2967:34429. Opened from
// the "Progress limit Anda" card on Home Var D and mirrors its current Minggu.

import { Button, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { Banner, TrendCapsule } from '../lib/progress-card'
import { ASSET, HistoryCard, WeekCard, elapsedWeeks, weekDate } from '../lib/riwayat'
import { useHomeVarD } from '../lib/store'

function Todo({ icon, children }: { icon: string; children: string }) {
  return (
    <div className="flex items-center gap-12">
      <img src={`${ASSET}/${icon}.svg`} alt="" className="shrink-0" />
      <p className="flex-1 text-14 text-default">{children}</p>
    </div>
  )
}

export function ProgressLimitScreen() {
  const flow = useFlow()
  const { main } = useHomeVarD()
  if (main.kind !== 'progress') return null
  const data = main.data

  const weeks = elapsedWeeks(data.segments)
  const next = weeks.length + 1
  // Late: the most recent week went unpaid — the to-do list asks for the
  // arrears and offers the pay button the homepage card already shows.
  const late = weeks[weeks.length - 1] === 'missed'
  const lateAmount = data.buttonLabel?.replace('Bayar Angsuran ', '') ?? ''

  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Ibu Siti" onBack={flow.back} />}>
      <div className="-mx-16 -mt-16 flex flex-1 flex-col">
        <div className="flex flex-col gap-16 p-16">
          <div className="relative flex items-start justify-between gap-8">
            <TrendCapsule tone={data.tone} />
            <div className="relative flex flex-col gap-2">
              <p className="text-12 text-caption">{data.leftLabel}</p>
              <p className="text-16 font-bold text-default">{data.leftValue}</p>
            </div>
            <div className="relative flex flex-col items-end gap-2 text-right">
              <p className="text-12 text-caption">{data.rightLabel}</p>
              <p className={`text-16 font-bold text-default ${data.rightStrike ? 'line-through' : ''}`}>
                {data.rightValue}
              </p>
            </div>
          </div>

          <Banner tone={data.tone} title={data.bannerTitle} description={data.bannerDescription} />

          <div className="flex flex-col gap-16 rounded-12 border border-default bg-neutral-white p-12">
            <p className="text-16 font-bold text-default">Yang Perlu Anda lakukan</p>
            <Todo icon="emoji-money">
              {late ? `Bayar Angsuran telat sebesar ${lateAmount}` : 'Bayar Rp135.000 tepat waktu setiap minggu'}
            </Todo>
            <Todo icon="emoji-raise-hand">Hadir kumpulan setiap minggu</Todo>
            <Todo icon="emoji-timer">Jaga kelancaran selama 48 minggu</Todo>
            {late && data.buttonLabel ? (
              <Button variant="primary" size="sm" className="w-full">
                {data.buttonLabel}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-16 bg-neutral-50 p-16">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-12">
              <p className="flex-1 text-16 font-bold text-default">Riwayat pembayaran</p>
              <button
                type="button"
                onClick={() => flow.go('jadwal-pembayaran')}
                className="shrink-0 text-12 font-bold text-link"
              >
                Lihat semua tanggal
              </button>
            </div>
            <p className="text-12 text-caption">{weeks.length} dari 48 Minggu</p>
          </div>

          {next <= 48 ? (
            <WeekCard title={`Berikutnya: Minggu ${next}`} date={weekDate(next)}>
              <p className="text-14 text-caption">Belum ada data pembayaran</p>
            </WeekCard>
          ) : null}
          {weeks
            .map((tone, i) => ({ tone, week: i + 1 }))
            .reverse()
            .map(({ tone, week }) =>
              tone === 'upcoming' ? null : (
                <HistoryCard
                  key={week}
                  week={week}
                  tone={tone}
                  amountOverride={week === 11 ? 'Rp810.000' : undefined}
                />
              ),
            )}
        </div>
      </div>
    </Screen>
  )
}
