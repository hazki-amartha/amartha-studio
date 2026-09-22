'use client'

// Home option B — one 48-week axis, two lanes.
//
// Option A stacks two identically-styled purple cards, so "whose reward is
// this" only reads from the copy, and both progress bars fill the same width
// even though one counts to 48 weeks and the other to 12. Here each driver
// gets its own hue (purple = Ibu, blue = majelis) and its own lane on a shared
// week scale, so the three majelis payouts are visibly inside the span of her
// single limit increase — and the reward tiles under the lanes inherit the
// same two hues, which is what says who earns what.

import type { ReactNode } from 'react'
import { Badge, Card } from '@/design-system/components'
import {
  CheckCircleFill,
  ChevronRight,
  Majelis,
  User,
  WarningCircle,
} from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  BONUS,
  GROUP_SIZE,
  KONDISI,
  MAJELIS_KONDISI,
  MILESTONES,
  STRETCH,
  TOTAL_WEEKS,
  bonusState,
  eligible,
  kondisiOf,
  majelisOf,
  milestoneStatus,
  short,
  type MilestoneStatus,
} from '../lib/data'
import { useApp, type AppState } from '../lib/store'
import { HomeShell } from '../lib/ui'

export function HomeBScreen() {
  return (
    <HomeShell>
      <TimelineCard />
      <BonusDetail />
    </HomeShell>
  )
}

// --- The shared axis ---------------------------------------------------------

/** Weeks 1–48 as four 12-week blocks: three majelis payouts, then hers. */
const BLOCKS = [1, 2, 3, 4]

/** How much of block `b` is already behind her, as a percentage of its 12 weeks. */
function blockFill(s: AppState, b: number): number {
  const done = Math.min(Math.max(s.weeksDone - (b - 1) * STRETCH, 0), STRETCH)
  return (done / STRETCH) * 100
}

const MILESTONE_TONE: Record<MilestoneStatus, { tile: string; note: string }> = {
  cair: { tile: 'border-blue-200 bg-blue-50 text-blue-500', note: 'Cair' },
  siap: { tile: 'border-green-200 bg-green-50 text-green-500', note: 'Siap' },
  lewat: { tile: 'border-default bg-neutral-50 text-disabled', note: 'Lewat' },
  berjalan: { tile: 'border-blue-500 bg-neutral-white text-blue-500', note: 'Berjalan' },
  nanti: { tile: 'border-default bg-neutral-white text-caption', note: 'Nanti' },
}

/** Her own late payment doesn't stop the streak — it stops her sharing it. */
const HELD = { tile: 'border-orange-200 bg-orange-50 text-orange-500', note: 'Tertahan' }

function TimelineCard() {
  const s = useApp()
  const cap = KONDISI[kondisiOf(s)].cap

  return (
    <Card>
      <div className="flex items-center gap-8">
        <p className="min-w-0 flex-1 text-16 font-bold text-default">Dua sumber keuntungan</p>
        <Badge intent="neutral" size="sm">
          Minggu {s.weeksDone}
        </Badge>
      </div>

      <div className="mt-16">
        <LaneLabel
          chip="bg-primary-50 text-primary-500"
          icon={<User size={16} />}
          title="Hasil Ibu sendiri"
          note={`Di minggu ${TOTAL_WEEKS}`}
        />
        <span className="mt-8 block h-16 w-full overflow-hidden rounded-full bg-primary-200">
          <span
            className="block h-16 rounded-full bg-primary-500"
            // Data-driven: the value IS the geometry.
            style={{ width: `${Math.max((s.weeksDone / TOTAL_WEEKS) * 100, 2)}%` }}
          />
        </span>
      </div>

      <div className="mt-16">
        <LaneLabel
          chip="bg-blue-50 text-blue-500"
          icon={<Majelis size={16} />}
          title="Bersama majelis"
          note={`Tiap ${STRETCH} minggu`}
        />
        <div className="mt-8 grid grid-cols-4 gap-8">
          {BLOCKS.map((b) => (
            <span key={b} className="block h-16 overflow-hidden rounded-full bg-blue-200">
              <span
                className="block h-16 rounded-full bg-blue-500"
                style={{ width: `${blockFill(s, b)}%` }}
              />
            </span>
          ))}
        </div>
      </div>

      {/* The reward row sits on the same four columns, so each prize lands
          under the block that earns it — and takes its hue from the lane. */}
      <div className="mt-8 grid grid-cols-4 gap-8">
        {MILESTONES.map((m) => {
          const status = milestoneStatus(s, m)
          const tone = status === 'berjalan' && !eligible(s) ? HELD : MILESTONE_TONE[status]
          return (
            <Prize key={m} week={m * STRETCH} amount={short(BONUS)} note={tone.note} tile={tone.tile} />
          )
        })}
        <Prize
          week={TOTAL_WEEKS}
          amount={cap ? short(cap) : '—'}
          note="Limit"
          tile="border-primary-200 bg-primary-50 text-primary-500"
        />
      </div>
    </Card>
  )
}

function LaneLabel({
  chip,
  icon,
  title,
  note,
}: {
  chip: string
  icon: ReactNode
  title: string
  note: string
}) {
  return (
    <div className="flex items-center gap-8">
      <span className={`flex size-24 shrink-0 items-center justify-center rounded-8 ${chip}`}>
        {icon}
      </span>
      <p className="min-w-0 flex-1 text-12 font-bold text-default">{title}</p>
      <p className="text-10 text-caption">{note}</p>
    </div>
  )
}

function Prize({
  week,
  amount,
  note,
  tile,
}: {
  week: number
  amount: string
  note: string
  tile: string
}) {
  return (
    <span className={`flex flex-col items-center rounded-8 border p-4 text-center ${tile}`}>
      <span className="text-10 text-caption">mgg {week}</span>
      <span className="text-12 font-bold">{amount}</span>
      <span className="text-10">{note}</span>
    </span>
  )
}

// --- Group: extra disbursement every 12 weeks -------------------------------

function BonusDetail() {
  const s = useApp()
  const flow = useFlow()
  const state = bonusState(s)
  const kondisi = MAJELIS_KONDISI[majelisOf(s)]

  const sub =
    state.kind === 'ready'
      ? `Tambahan ke-${state.index} siap dicairkan ke Poket.`
      : state.kind === 'over'
        ? `Semua tambahan majelis sudah lewat minggu ${MILESTONES.length * STRETCH}.`
        : state.kind === 'blocked'
          ? `Angsuran Ibu ada yang telat, jadi tambahan ke-${state.index} tidak bisa Ibu ikuti.`
          : state.kind === 'watch'
            ? `${state.unpaid} anggota belum bayar minggu ini — ${state.left} minggu lagi ke tambahan ke-${state.index}.`
            : `${state.left} minggu lagi ke tambahan ke-${state.index}. Tidak menumpuk kalau terlewat.`

  return (
    <RewardDetail
      chip="bg-blue-50 text-blue-500"
      icon={<Majelis size={20} />}
      owner="Bersama majelis"
      badge={<Badge intent={kondisi.intent}>{kondisi.label}</Badge>}
      headline={`Pencairan tambahan ${short(BONUS)}`}
      sub={sub}
      action={state.kind === 'ready' ? `Cairkan ${short(BONUS)}` : 'Lihat majelis'}
      onAction={() => flow.go(state.kind === 'ready' ? 'cair' : 'majelis')}
    >
      <Row warn={s.groupShort > 0}>
        {s.groupShort > 0
          ? `${s.groupShort} dari ${GROUP_SIZE} anggota belum bayar`
          : `${GROUP_SIZE} anggota bayar lancar`}
      </Row>
      <Row warn={!eligible(s)}>
        {eligible(s) ? 'Angsuran Ibu tidak ada yang telat' : 'Angsuran Ibu ada yang telat'}
      </Row>
    </RewardDetail>
  )
}

// --- Card pieces -------------------------------------------------------------

function RewardDetail({
  chip,
  icon,
  owner,
  badge,
  headline,
  sub,
  action,
  onAction,
  children,
}: {
  chip: string
  icon: ReactNode
  owner: string
  badge: ReactNode
  headline: string
  sub: string
  action: string
  onAction: () => void
  children: ReactNode
}) {
  return (
    <Card flush>
      <div className="p-12">
        <div className="flex items-center gap-8">
          <span className={`flex size-32 shrink-0 items-center justify-center rounded-8 ${chip}`}>
            {icon}
          </span>
          <p className="min-w-0 flex-1 text-12 text-caption">{owner}</p>
          {badge}
        </div>
        <p className="mt-12 text-16 font-bold text-default">{headline}</p>
        <p className="mt-4 text-12 text-caption">{sub}</p>
      </div>

      <div className="flex flex-col gap-8 border-t border-default p-12">{children}</div>

      <button
        type="button"
        onClick={onAction}
        className="flex w-full items-center gap-8 border-t border-default p-12 text-left"
      >
        <span className="min-w-0 flex-1 text-14 font-bold text-primary-500">{action}</span>
        <ChevronRight size={20} className="shrink-0 text-primary-500" />
      </button>
    </Card>
  )
}

function Row({ warn = false, children }: { warn?: boolean; children: ReactNode }) {
  return (
    <span className="flex items-center gap-8">
      {warn ? (
        <WarningCircle size={20} className="shrink-0 text-orange-500" />
      ) : (
        <CheckCircleFill size={20} className="shrink-0 text-green-500" />
      )}
      <span className="min-w-0 flex-1 text-14 text-default">{children}</span>
    </span>
  )
}
