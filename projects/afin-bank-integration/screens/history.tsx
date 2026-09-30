'use client'

// PRD D: account and AmarthaFin activity in one list, with a tag for which
// balance each row touched. Filters open a sheet; picking one only changes
// the chips, since five rows don't need real filtering to be judged.

import { useState, type ReactNode } from 'react'
import { BottomSheet, Button, NavigationHeader, SelectableCard } from '@/design-system/components'
import { ArrowDown, ArrowUp, CalendarDots, Sliders } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah, TRANSACTIONS } from '../lib/data'
import { ACCOUNT_NAME } from '../lib/ui'

const TYPES = ['Semua', 'Uang masuk', 'Uang keluar'] as const
const PERIODS = ['30 hari terakhir', '3 bulan terakhir', '12 bulan terakhir'] as const

export function HistoryScreen() {
  const flow = useFlow()
  const [type, setType] = useState<(typeof TYPES)[number]>('Semua')
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('30 hari terakhir')
  const [sheet, setSheet] = useState(false)

  const rows = TRANSACTIONS.filter((t) =>
    type === 'Semua' ? true : type === 'Uang masuk' ? t.amount > 0 : t.amount < 0,
  )
  const dates = [...new Set(rows.map((r) => r.date))]

  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Riwayat Transaksi" onBack={flow.back} />}>
      <div className="-mx-16 flex gap-8 overflow-x-auto px-16">
        <Chip onClick={() => setSheet(true)} active={false}>
          <Sliders size={16} /> Filter
        </Chip>
        <Chip onClick={() => setSheet(true)} active>
          <CalendarDots size={16} /> {period}
        </Chip>
        {TYPES.map((t) => (
          <Chip key={t} active={type === t} onClick={() => setType(t)}>
            {t}
          </Chip>
        ))}
      </div>

      {dates.map((d) => (
        <div key={d}>
          <p className="py-8 text-12 font-bold text-caption">{d}</p>
          {rows
            .filter((r) => r.date === d)
            .map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => flow.go('history-detail')}
                className="flex w-full items-center gap-12 border-b border-default py-12 text-left"
              >
                <span
                  className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-full ${
                    r.amount > 0 ? 'bg-green-50 text-green-500' : 'bg-neutral-100 text-default'
                  }`}
                >
                  {r.amount > 0 ? <ArrowDown size={20} /> : <ArrowUp size={20} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-14 font-bold text-default">{r.title}</span>
                  <span className="block truncate text-12 text-caption">{r.subtitle}</span>
                </span>
                <span className="flex flex-col items-end gap-4">
                  <span className={`text-14 font-bold ${r.amount > 0 ? 'text-green-500' : 'text-default'}`}>
                    {rupiah(r.amount)}
                  </span>
                  <span className="text-10 text-caption">{r.source === 'rekening' ? ACCOUNT_NAME : 'Poket'}</span>
                </span>
              </button>
            ))}
        </div>
      ))}

      <p className="py-16 text-center text-12 text-caption">Riwayat tersimpan hingga 12 bulan.</p>

      <BottomSheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Filter transaksi"
        slot={
          <div className="flex flex-col gap-8">
            <p className="text-14 font-bold text-default">Periode</p>
            {PERIODS.map((p) => (
              <SelectableCard
                key={p}
                name="period"
                title={p}
                checked={period === p}
                onChange={() => setPeriod(p)}
              />
            ))}
            <SelectableCard name="period" title="Pilih tanggal sendiri" description="Maksimal 12 bulan ke belakang" />
            <p className="mt-8 text-14 font-bold text-default">Sumber saldo</p>
            <div className="flex gap-8">
              <Chip active>Semua</Chip>
              <Chip active={false}>{ACCOUNT_NAME}</Chip>
              <Chip active={false}>Poket</Chip>
            </div>
          </div>
        }
        primaryAction={
          <Button variant="primary" size="lg" className="w-full" onClick={() => setSheet(false)}>
            Terapkan
          </Button>
        }
      />
    </Screen>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-4 rounded-full border px-12 py-8 text-12 ${
        active ? 'border-primary-500 bg-primary-50 font-bold text-primary-500' : 'border-default text-default'
      }`}
    >
      {children}
    </button>
  )
}
