'use client'

// The KPI tab — the four daily targets, and the whole argument for where they
// live.
//
// This direction's founding claim is that the BP should not be HANDED a score.
// That was never "targets don't exist": a BP carries four simultaneous daily
// targets and is measured on them (Day in a Life of a Field Officer). The claim
// is about placement. A number on the working surface makes the BP synthesise
// before she can move; a number behind a tab is something she checks when she
// wants to know how the day is going.
//
// So this page is deliberately READ-ONLY. There is no "kerjakan sekarang"
// button next to a lagging metric, because that is exactly the KPI-spine model
// `apartner-homepage-ia` explores — hang a task off a score and the score
// becomes the way you navigate work. Here the schedule owns the work, and this
// page ends by pointing back at it.

import { Card } from '@/design-system/components'
import { Screen, TopBar } from '@/platform/primitives'
import { rupiah, TASKS } from '../lib/data'
import { doneTasks, useApp } from '../lib/store'
import { TabBar } from '../lib/tabs'
import { Overline } from '../lib/ui'

interface Kpi {
  label: string
  /** What the number means in one line — never left to interpretation. */
  note: string
  value: string
  target: string
  /** 0–100. */
  progress: number
}

const KPIS: Kpi[] = [
  {
    label: 'Penagihan',
    note: 'Angsuran terkumpul hari ini',
    value: rupiah(2_450_000),
    target: rupiah(3_200_000),
    progress: 77,
  },
  {
    label: 'Pencairan',
    note: 'Pinjaman cair minggu ini',
    value: '4 mitra',
    target: '6 mitra',
    progress: 67,
  },
  {
    label: 'Pemulihan PAR',
    note: 'Mitra menunggak yang sudah bayar',
    value: '2 mitra',
    target: '5 mitra',
    progress: 40,
  },
  {
    label: 'Digitalisasi',
    note: 'Mitra bayar lewat aplikasi',
    value: '9 mitra',
    target: '12 mitra',
    progress: 75,
  },
]

function Meter({ progress }: { progress: number }) {
  return (
    <div className="h-8 w-full rounded-full bg-neutral-200">
      <div
        className={`h-8 rounded-full ${progress >= 75 ? 'bg-green-500' : progress >= 50 ? 'bg-primary-500' : 'bg-orange-500'}`}
        // A data-driven width is the one dimension a progress meter cannot take
        // from a token — the value IS the geometry. Every colour and height
        // around it is still a token.
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export function KpiScreen() {
  const s = useApp()
  const done = doneTasks(s)

  return (
    <Screen
      topBar={
        <TopBar>
          <span className="flex-1">KPI</span>
          <span className="text-12 font-regular text-caption">Selasa, 21 Juli</span>
        </TopBar>
      }
    >
      <Overline>Target hari ini</Overline>

      <div className="flex flex-col gap-8">
        {KPIS.map((kpi) => (
          <Card key={kpi.label}>
            <div className="flex flex-col gap-8">
              <div className="flex items-start gap-12">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-14 font-bold text-default">{kpi.label}</span>
                  <span className="truncate text-12 text-caption">{kpi.note}</span>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span className="text-16 font-bold text-default">{kpi.value}</span>
                  <span className="text-12 text-caption">dari {kpi.target}</span>
                </div>
              </div>
              <Meter progress={kpi.progress} />
            </div>
          </Card>
        ))}
      </div>

      <Overline>Kunjungan</Overline>
      <Card>
        <div className="flex items-center gap-12">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-14 font-bold text-default">Tugas selesai</span>
            <span className="text-12 text-caption">
              Semua target di atas bergerak dari kunjungan di Jadwal.
            </span>
          </div>
          <span className="shrink-0 text-20 font-bold text-default">
            {done.length}/{TASKS.length}
          </span>
        </div>
      </Card>

      <TabBar active="kpi" />
    </Screen>
  )
}
