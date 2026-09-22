'use client'

// Home — two cards, two drivers. The top card is hers alone and pays out at
// week 48; the bottom card is the majelis's and pays out every 12 weeks.

import type { ReactNode } from 'react'
import { CheckCircleFill, ChevronRight, MoneyBag, WarningCircle } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  ABSENCE_OK,
  BONUS,
  CURRENT_LIMIT,
  GROUP_SIZE,
  KONDISI,
  STRETCH,
  TOTAL_WEEKS,
  attended,
  bonusState,
  kondisiOf,
  onTime,
  short,
  stretchWeeks,
} from '../lib/data'
import { useApp } from '../lib/store'
import { HomeShell } from '../lib/ui'

export function HomeScreen() {
  return (
    <HomeShell>
      <LimitCard />
      <BonusCard />
    </HomeShell>
  )
}

// --- Individual: limit increase at week 48 ----------------------------------

function LimitCard() {
  const s = useApp()
  const flow = useFlow()
  const info = KONDISI[kondisiOf(s)]

  return (
    <RewardCard
      title="Dapatkan limit lebih besar"
      caption={`${s.weeksDone} dari ${TOTAL_WEEKS} minggu`}
      panel={
        <Checklist title="Pertahankan kelancaran pinjaman" onClick={() => flow.go('riwayat')}>
          <CheckRow warn={s.late.length > 0}>
            Bayar lancar {onTime(s)} dari {TOTAL_WEEKS} minggu
          </CheckRow>
          <CheckRow warn={s.absent.length > ABSENCE_OK}>
            Hadir kumpulan {attended(s)} dari {TOTAL_WEEKS} minggu
          </CheckRow>
        </Checklist>
      }
    >
      <span className="block h-12 w-full overflow-hidden rounded-full bg-primary-700">
        <span
          className="block h-12 rounded-full bg-green-400"
          // Data-driven: the value IS the geometry.
          style={{ width: `${Math.max((s.weeksDone / TOTAL_WEEKS) * 100, 2)}%` }}
        />
      </span>

      <div className="mt-16 flex items-start gap-12 text-neutral-white">
        <div className="min-w-0 flex-1">
          <p className="text-14">Limit saat ini</p>
                  <p className="mt-4 text-20">{short(CURRENT_LIMIT)}</p>
        </div>
        <div className="min-w-0 flex-1 text-right">
          <p className="text-14">Naik limit hingga</p>
                  <p className="mt-4 text-20 font-bold">
                    {info.cap ? `Rp6-${short(info.cap).replace('Rp', '')}` : 'Belum pasti'}
                  </p>
        </div>
      </div>
    </RewardCard>
  )
}

// --- Group: extra disbursement every 12 weeks -------------------------------

function BonusCard() {
  const s = useApp()
  const flow = useFlow()
  const state = bonusState(s)
  const done = state.kind === 'ready' || state.kind === 'over' ? STRETCH : stretchWeeks(s)

  return (
    <RewardCard
      title="Dapatkan pencairan tambahan"
      caption={`${done} dari ${STRETCH} minggu`}
      panel={
        <Checklist
          title="Pertahankan kelancaran majelis"
          onClick={() => flow.go(state.kind === 'ready' ? 'cair' : 'majelis')}
        >
          <CheckRow warn={s.groupShort > 0}>
            {s.groupShort > 0
              ? `${s.groupShort} anggota belum bayar`
              : `${GROUP_SIZE} anggota bayar lancar`}
          </CheckRow>
          {state.kind === 'blocked' ? <CheckRow warn>Angsuran Ibu ada yang telat</CheckRow> : null}
          {state.kind === 'ready' ? <CheckRow>{short(BONUS)} siap dicairkan</CheckRow> : null}
        </Checklist>
      }
    >
      <div className="flex gap-8">
        {Array.from({ length: STRETCH }, (_, i) => (
          <span
            key={i}
            className={`h-12 min-w-0 flex-1 rounded-full ${i < done ? 'bg-green-400' : 'bg-primary-700'}`}
          />
        ))}
      </div>

      <div className="mt-16 flex items-center gap-12 text-neutral-white">
        <p className="min-w-0 flex-1 text-14">Pencairan tambahan</p>
        <p className="text-20 font-bold">{short(BONUS)}</p>
      </div>
    </RewardCard>
  )
}

// --- Card pieces -------------------------------------------------------------

function RewardCard({
  title,
  caption,
  panel,
  children,
}: {
  title: string
  caption: string
  panel: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-24 bg-gradient-to-b from-primary-400 to-primary-600 p-4">
      <div className="flex items-center gap-12 p-12">
        <span className="flex size-48 shrink-0 items-center justify-center rounded-12 bg-primary-700 text-neutral-white">
          <MoneyBag size={24} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-16 font-bold text-neutral-white">{title}</span>
          <span className="block text-14 text-neutral-white">{caption}</span>
        </span>
      </div>
      <div className="px-12 pb-16 pt-4">{children}</div>
      {panel}
    </div>
  )
}

function Checklist({
  title,
  onClick,
  children,
}: {
  title: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-12 rounded-20 bg-neutral-white p-16 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-16 font-bold text-default">{title}</span>
        <span className="mt-8 flex flex-col gap-8">{children}</span>
      </span>
      <ChevronRight size={20} className="shrink-0 text-neutral-500" />
    </button>
  )
}

function CheckRow({ warn = false, children }: { warn?: boolean; children: ReactNode }) {
  return (
    <span className="flex items-center gap-8">
      {warn ? (
        <WarningCircle size={20} className="shrink-0 text-orange-500" />
      ) : (
        <CheckCircleFill size={20} className="shrink-0 text-green-500" />
      )}
      <span className="min-w-0 flex-1 text-16 text-default">{children}</span>
    </span>
  )
}
