'use client'

// Her own 48 weeks, week by week — the evidence behind the limit card.

import { Badge, Card, NavigationHeader } from '@/design-system/components'
import { Check, CreditCard, Users } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  ABSENCE_OK,
  CURRENT_LIMIT,
  KONDISI,
  TOTAL_WEEKS,
  attended,
  kondisiOf,
  onTime,
  short,
} from '../lib/data'
import { useApp, type AppState } from '../lib/store'
import { Stat } from '../lib/ui'

export function RiwayatScreen() {
  const flow = useFlow()
  const s = useApp()
  const info = KONDISI[kondisiOf(s)]

  return (
    <Screen topBar={<NavigationHeader title="Riwayat angsuran" onBack={flow.back} />}>
      <Card>
        <div className="flex items-center gap-8">
          <p className="min-w-0 flex-1 text-14 text-caption">Kondisi pinjaman</p>
          <Badge intent={info.intent}>{info.label}</Badge>
        </div>
        <p className="mt-8 text-16 font-bold text-default">
          {info.cap
            ? `${short(CURRENT_LIMIT)} → s/d ${short(info.cap)}`
            : `Limit ${short(CURRENT_LIMIT)}, belum pasti naik`}
        </p>
        <p className="mt-2 text-12 text-caption">Limit baru di minggu {TOTAL_WEEKS}</p>

        <div className="mt-12 grid grid-cols-2 gap-8">
          <Stat
            icon={<CreditCard size={16} />}
            label="Bayar tepat waktu"
            value={onTime(s)}
            warn={s.late.length > 0}
          />
          <Stat
            icon={<Users size={16} />}
            label="Hadir kumpulan"
            value={attended(s)}
            warn={s.absent.length > ABSENCE_OK}
          />
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-8">
          <p className="min-w-0 flex-1 text-14 font-bold text-default">{TOTAL_WEEKS} minggu</p>
          <p className="text-12 text-caption">
            {s.weeksDone} dari {TOTAL_WEEKS} selesai
          </p>
        </div>
        <div className="mt-12 grid grid-cols-6 gap-8">
          {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => (
            <WeekTile key={w} week={w} s={s} />
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap gap-16">
          <Legend tile="bg-green-50 text-green-500" label="Tepat waktu" />
          <Legend tile="bg-orange-50 text-orange-500" label="Telat" />
          <span className="flex items-center gap-4 text-12 text-caption">
            <span className="h-8 w-8 rounded-full bg-red-500" />
            Tidak hadir
          </span>
        </div>
      </Card>

      <div className="pb-16" />
    </Screen>
  )
}

function WeekTile({ week, s }: { week: number; s: AppState }) {
  const past = week <= s.weeksDone
  const now = week === s.weeksDone + 1
  const late = s.late.includes(week)

  const tile = past
    ? late
      ? 'bg-orange-50 text-orange-500'
      : 'bg-green-50 text-green-500'
    : now
      ? 'border-2 border-primary-500 bg-neutral-white text-primary-500'
      : 'border border-default bg-neutral-white text-disabled'

  return (
    <span
      className={`relative flex h-40 flex-col items-center justify-center rounded-8 text-12 font-bold ${tile}`}
    >
      {past ? <Check size={16} /> : null}
      <span className={past ? 'text-10' : ''}>{week}</span>
      {s.absent.includes(week) ? (
        <span className="absolute right-4 top-4 h-8 w-8 rounded-full bg-red-500" />
      ) : null}
    </span>
  )
}

function Legend({ tile, label }: { tile: string; label: string }) {
  return (
    <span className="flex items-center gap-4 text-12 text-caption">
      <span className={`flex h-20 w-20 items-center justify-center rounded-4 ${tile}`}>
        <Check size={16} />
      </span>
      {label}
    </span>
  )
}
