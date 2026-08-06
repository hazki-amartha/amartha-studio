'use client'

// Sizing the extra disbursement.
//
// The orange block at the bottom is the reason this screen is not just a slider:
// taking extra capital raises the weekly obligation she is already meeting, and
// the number that actually decides whether she can afford it is the COMBINED
// weekly figure — existing instalment plus new one — not the amount she is
// borrowing. Showing it live, as the slider moves, is the point of the screen.

import { useMemo, useState } from 'react'
import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { WEEKLY_BILL, rupiah } from '../lib/data'
import { store, useApp } from '../lib/store'
import { Chip, FullWidthButton, StatRow, StickyBar } from '../lib/ui'

// Flat admin fee held back from a pelunasan-dini disbursement, matched to the
// confirmation the live app shows.
const ADMIN_FEE = 120000

export function DisburseAmountScreen() {
  const flow = useFlow()
  const { disburseCap: cap, disburseFloor: floor, disbursePayoff: payoff } = useApp()
  const [amount, setAmount] = useState(cap)
  const [tenor, setTenor] = useState<3 | 6>(3)

  // A pelunasan dini spends the new loan on clearing the old one first, so the
  // screen shows what she nets rather than her combined weekly load.
  const isPelunasan = payoff > 0
  const received = amount - payoff - ADMIN_FEE

  const { weekly, total } = useMemo(() => {
    const weeks = tenor === 3 ? 12 : 24
    const rate = tenor === 3 ? 0.08 : 0.15
    const t = Math.round(amount * (1 + rate))
    // Rounded to the nearest Rp500 — a weekly instalment nobody can hand over
    // in cash is a number the prototype should never print.
    return { weekly: Math.round(t / weeks / 500) * 500, total: t }
  }, [amount, tenor])

  return (
    <Screen
      topBar={
        <NavigationHeader title="Cairkan modal tambahan" onBack={() => flow.back()} />
      }
    >
      <div className="flex items-center gap-12 rounded-12 bg-primary-50 p-12">
        <span className="flex-1 text-12 text-primary-400">Modal yang bisa dicairkan</span>
        <span className="text-16 font-bold text-primary-500">{rupiah(cap)}</span>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex items-baseline gap-8">
          <span className="flex-1 text-12 font-bold text-caption">Pilih jumlah</span>
          <span className="text-12 text-caption">Maks. {rupiah(cap)}</span>
        </div>
        <p className="text-24 font-bold text-default">{rupiah(amount)}</p>
        <input
          type="range"
          aria-label="Jumlah pencairan"
          min={floor}
          max={cap}
          step={50000}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full accent-primary-500"
        />
        <div className="flex text-12 text-caption">
          <span className="flex-1">{rupiah(floor)}</span>
          <span>{rupiah(cap)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <span className="text-12 font-bold text-caption">Pilih tenor</span>
        <div className="flex gap-8">
          <Chip selected={tenor === 3} onClick={() => setTenor(3)}>
            3 bulan
          </Chip>
          <Chip selected={tenor === 6} onClick={() => setTenor(6)}>
            6 bulan
          </Chip>
        </div>
      </div>

      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <StatRow label="Angsuran mingguan" value={rupiah(weekly)} border />
        <StatRow label="Total angsuran" value={rupiah(total)} border />
        <StatRow label="Pembayaran pertama" value="08/05/2026" />
      </div>

      {isPelunasan ? (
        // The new loan pays off the old one first — so the breakdown is what she
        // receives after the pelunasan, not her combined weekly obligation.
        <div className="rounded-12 border border-default bg-neutral-white p-16">
          <p className="mb-8 text-14 font-bold text-default">Detail pencairan</p>
          <StatRow label="Pokok pinjaman" value={rupiah(amount)} border />
          <StatRow label="Pelunasan Dini (15x)" value={`-${rupiah(payoff)}`} border />
          <StatRow label="Biaya admin" value={`-${rupiah(ADMIN_FEE)}`} border />
          <StatRow
            label="Anda terima"
            value={rupiah(received)}
            tone={received < 0 ? 'red' : 'default'}
            strong
          />
        </div>
      ) : (
        <div className="rounded-12 bg-orange-50 p-16">
          <p className="mb-8 text-12 font-bold text-orange-700">
            Total kewajiban mingguan Ibu setelah ini
          </p>
          <div className="flex py-2 text-12">
            <span className="flex-1 text-caption">Angsuran pinjaman saat ini</span>
            <span className="text-default">{rupiah(WEEKLY_BILL)}</span>
          </div>
          <div className="flex py-2 text-12">
            <span className="flex-1 text-caption">Angsuran modal tambahan</span>
            <span className="text-default">{rupiah(weekly)}</span>
          </div>
          <div className="mt-8 flex items-center border-t border-orange-200 pt-8">
            <span className="flex-1 text-12 font-bold text-orange-700">Total per minggu</span>
            <span className="text-18 font-bold text-orange-700">
              {rupiah(WEEKLY_BILL + weekly)}
            </span>
          </div>
        </div>
      )}

      <p className="text-center text-12 text-disabled">*Simulasi, angka bukan final</p>

      <StickyBar>
        <FullWidthButton
          disabled={isPelunasan && received <= 0}
          onClick={() => {
            store.disburse(amount)
            flow.go('disburse-success')
          }}
        >
          Cairkan sekarang
        </FullWidthButton>
      </StickyBar>
    </Screen>
  )
}
