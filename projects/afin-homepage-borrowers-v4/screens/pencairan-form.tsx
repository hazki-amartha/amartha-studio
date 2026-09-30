'use client'

// Ajukan pencairan — Figma node 2910:142433 ("Disbursement Form"). Reached
// from "Cairkan Sekarang" on Home Var D's Minggu 48 card.

import { useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { Warning } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ASSET, RadioMark } from '../lib/pencairan-ui'

const TENORS = [
  { months: 12, payments: 48, weekly: 'Rp135.000' },
  { months: 9, payments: 36, weekly: 'Rp180.000' },
  { months: 6, payments: 24, weekly: 'Rp270.000' },
  { months: 3, payments: 12, weekly: 'Rp540.000' },
]

const PURPOSES = ['Pembelian bahan baku produksi', 'Pembelian alat penunjang usaha', 'Renovasi tempat usaha']

export function PencairanFormScreen() {
  const flow = useFlow()
  const [tenor, setTenor] = useState(12)
  const [purpose, setPurpose] = useState(PURPOSES[0])

  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Ajukan pencairan" onBack={flow.back} />}>
      <div className="-mx-16 -mt-16 flex flex-1 flex-col bg-canvas-blue">
        <div
          className="rounded-b-16 bg-neutral-white px-16 pb-16 pt-8"
          style={{ boxShadow: '0 1px 1px rgba(164, 172, 185, 0.24)' }}
        >
          <div className="flex flex-col gap-8 rounded-16 border border-default bg-neutral-white p-12">
            <p className="text-14 font-bold text-default">Nominal</p>
            <div className="flex items-center gap-4">
              <p className="flex-1 text-24 font-bold text-default">Rp5.000.000</p>
              <span className="flex h-20 w-20 items-center justify-center">
                <img src={`${ASSET}/edit-icon.svg`} alt="Ubah nominal" />
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-24 px-16 py-24">
          <section className="flex flex-col gap-12">
            <div className="flex flex-col gap-4">
              <p className="text-16 font-bold text-default">Pilih jangka waktu angsuran</p>
              <p className="text-12 text-caption">
                Batas angsuran per minggu: <span className="font-bold">Rp200.000</span>
              </p>
            </div>
            <div className="flex flex-col gap-8">
              {TENORS.map((t) => {
                const selected = tenor === t.months
                return (
                  <button
                    key={t.months}
                    type="button"
                    onClick={() => setTenor(t.months)}
                    className={`flex items-center gap-16 rounded-12 border px-16 py-12 text-left ${
                      selected ? 'border-primary-500 bg-primary-50' : 'border-default bg-neutral-white'
                    }`}
                  >
                    <span className="flex flex-1 flex-col">
                      <span className="text-14 font-bold text-default">{t.months} bulan</span>
                      <span className={`text-12 ${selected ? 'text-default' : 'text-caption'}`}>
                        {t.payments}x pembayaran
                      </span>
                    </span>
                    <span className="flex flex-col items-end text-right">
                      <span className="text-14 font-bold text-link">{t.weekly}</span>
                      <span className="text-12 text-caption">/minggu</span>
                    </span>
                    <RadioMark checked={selected} />
                  </button>
                )
              })}

              <div className="overflow-hidden rounded-12 border border-default bg-neutral-50">
                <div className="flex items-center gap-16 px-16 py-12">
                  <span className="flex flex-1 flex-col">
                    <span className="text-14 font-bold text-default">1 bulan</span>
                    <span className="text-12 text-disabled">4x pembayaran</span>
                  </span>
                  <span className="flex flex-col items-end text-right text-disabled">
                    <span className="text-14 font-bold">Rp1.620.000</span>
                    <span className="text-12">/minggu</span>
                  </span>
                  <RadioMark disabled />
                </div>
                <div className="flex items-center gap-4 bg-neutral-200 px-16 py-4">
                  <Warning size={16} className="text-caption" />
                  <p className="flex-1 text-12 text-caption">Melebihi batas angsuran per minggu</p>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-12">
            <p className="text-16 font-bold text-default">Pilih tujuan pencairan</p>
            <div className="flex flex-col gap-8">
              {PURPOSES.map((p) => {
                const selected = purpose === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPurpose(p)}
                    className={`flex items-center gap-16 rounded-12 border px-16 py-12 text-left ${
                      selected ? 'border-primary-500 bg-primary-50' : 'border-default bg-neutral-white'
                    }`}
                  >
                    <span className="flex-1 text-14 text-default">{p}</span>
                    <RadioMark checked={selected} />
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        <div
          className="sticky bottom-0 mt-auto bg-neutral-white px-16 pb-24 pt-12"
          style={{ boxShadow: '0 -2px 8px rgba(27, 36, 46, 0.08)' }}
        >
          <Button variant="primary" className="w-full" onClick={() => flow.go('pencairan-konfirmasi')}>
            Lanjut
          </Button>
        </div>
      </div>
    </Screen>
  )
}
