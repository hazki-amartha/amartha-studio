'use client'

// Cairkan modal tambahan - alt — sizing the draw. The slider starts at
// Rp800.000, never the ceiling: taking less than the max is a real, expected
// choice, and a slider parked at 100% suggests it isn't. Every figure below —
// weekly instalment, total, the rollover line, the combined weekly load —
// recalculates live as the slider moves.

import { useMemo, useState } from 'react'
import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { LOAN, simulate, type TenorMonths } from '../lib/revolving'
import { Chip, FullWidthButton, StatRow, StickyBar } from '../lib/ui'

export function CairkanAltScreen() {
  const flow = useFlow()
  const [amount, setAmount] = useState<number>(LOAN.default)
  const [tenor, setTenor] = useState<TenorMonths>(3)

  const sisa = LOAN.ceiling - amount
  const { weekly, total, combined, zone } = useMemo(() => simulate(amount, tenor), [amount, tenor])

  const zoneCopy =
    zone === 'green'
      ? 'Masih di zona aman untuk kemampuan bayar Ibu'
      : zone === 'orange'
        ? 'Mendekati batas kemampuan bayar Ibu'
        : 'Di atas batas aman kemampuan bayar Ibu'
  const zoneBar = zone === 'green' ? 'bg-green-500' : zone === 'orange' ? 'bg-orange-500' : 'bg-red-500'
  const zoneText =
    zone === 'green' ? 'text-green-600' : zone === 'orange' ? 'text-orange-700' : 'text-red-500'
  const zonePercent = Math.min(100, Math.round((combined / (LOAN.zone.amberMax + 60000)) * 100))

  return (
    <Screen topBar={<NavigationHeader title="Cairkan modal tambahan" onBack={() => flow.back()} />}>
      <div className="flex flex-col gap-8">
        <p className="text-12 font-bold text-caption">Pilih jumlah</p>
        <p className="text-24 font-bold text-default">{rupiah(amount)}</p>
        <p className="text-12 text-caption">dari maksimal {rupiah(LOAN.ceiling)}</p>
        <input
          type="range"
          aria-label="Jumlah pencairan"
          min={LOAN.floor}
          max={LOAN.ceiling}
          step={LOAN.step}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full accent-primary-500"
        />
        <div className="flex text-12 text-caption">
          <span className="flex-1">{rupiah(LOAN.floor)}</span>
          <span>{rupiah(LOAN.ceiling)}</span>
        </div>

        <div className="flex gap-8">
          <Chip selected={amount === 500000} onClick={() => setAmount(500000)}>
            {rupiah(500000)}
          </Chip>
          <Chip selected={amount === 800000} onClick={() => setAmount(800000)}>
            {rupiah(800000)}
          </Chip>
          <Chip selected={amount === LOAN.ceiling} onClick={() => setAmount(LOAN.ceiling)}>
            Maksimal
          </Chip>
        </div>
      </div>

      {sisa > 0 ? (
        <div className="rounded-12 bg-green-50 p-12 text-12 text-green-700">
          → Sisa {rupiah(sisa)} digabung ke pencairan berikutnya, {LOAN.rolloverDate}
        </div>
      ) : null}

      <div className="flex flex-col gap-8">
        <p className="text-12 font-bold text-caption">Pilih tenor</p>
        <div className="flex gap-8">
          <Chip selected={tenor === 3} onClick={() => setTenor(3)}>
            {LOAN.tenors[3].label}
          </Chip>
          <Chip selected={tenor === 6} onClick={() => setTenor(6)}>
            {LOAN.tenors[6].label}
          </Chip>
        </div>
      </div>

      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <StatRow label="Angsuran mingguan" value={rupiah(weekly)} border />
        <StatRow label="Total angsuran" value={rupiah(total)} border />
        <StatRow label="Pembayaran pertama" value="21 Jul 2026" />
      </div>

      <div className="rounded-12 border border-orange-200 p-16">
        <p className="mb-8 text-12 font-bold text-orange-700">Total kewajiban Ibu per minggu</p>
        <StatRow label="Angsuran pinjaman saat ini" value={rupiah(LOAN.existingWeekly)} border />
        <StatRow label="Angsuran modal tambahan" value={rupiah(weekly)} border />
        <div className="flex items-center gap-12 py-8">
          <span className="flex-1 text-12 font-bold text-default">Total per minggu</span>
          <span className="text-18 font-bold text-default">{rupiah(combined)}</span>
        </div>
        <div className="mt-4 h-8 w-full rounded-full bg-neutral-200">
          <div className={`h-8 rounded-full ${zoneBar}`} style={{ width: `${zonePercent}%` }} />
        </div>
        <p className={`mt-8 text-12 font-bold ${zoneText}`}>{zoneCopy}</p>
      </div>

      <p className="text-center text-12 text-disabled">Angka dibulatkan ke ratusan rupiah terdekat</p>

      <StickyBar>
        <FullWidthButton onClick={() => flow.go('home-alt')}>Cairkan {rupiah(amount)}</FullWidthButton>
      </StickyBar>
    </Screen>
  )
}
