'use client'

// Small controls for the three "Onboarding page after disbursement" screens
// (Figma section 2937:31006): the 20px radio and checkbox the Figma cards use,
// and the label/value row every detail list repeats.

import type { ReactNode } from 'react'
import { Check } from '@/design-system/icons'

export const ASSET = '/prototypes/afin-homepage-borrowers-v4'

export function RadioMark({ checked, disabled }: { checked?: boolean; disabled?: boolean }) {
  const ring = disabled ? 'border-neutral-200' : checked ? 'border-primary-500' : 'border-neutral-500'
  return (
    <span className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 bg-neutral-white ${ring}`}>
      {checked ? <span className="h-8 w-8 rounded-full bg-primary-500" /> : null}
    </span>
  )
}

export function CheckboxMark({ checked }: { checked?: boolean }) {
  return checked ? (
    <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-4 bg-primary-500 text-neutral-white">
      <Check size={16} />
    </span>
  ) : (
    <span className="h-20 w-20 shrink-0 rounded-4 border-2 border-neutral-500 bg-neutral-white" />
  )
}

export function DetailRow({
  label,
  value,
  size = 14,
}: {
  label: ReactNode
  value: ReactNode
  size?: 12 | 14
}) {
  return (
    <div className={`flex items-start gap-8 ${size === 12 ? 'text-12' : 'text-14'}`}>
      <p className="shrink-0 text-caption">{label}</p>
      <p className="flex-1 text-right text-default">{value}</p>
    </div>
  )
}

// The two disbursements the Pencairan screens can show. Proteksi Keluarga
// (Rp200.000) and the admin fee (Rp5.000) are the same for both.
/** `over`: above the weekly limit — greyed out with "Melebihi batas angsuran per minggu". */
export type Tenor = { months: number; payments: number; weekly: string; over?: boolean }

export const PENCAIRAN = {
  awal: {
    nominal: 'Rp5.000.000',
    terima: 'Rp4.795.000',
    batas: 'Rp200.000',
    tenors: [
      { months: 12, payments: 48, weekly: 'Rp135.000' },
      { months: 9, payments: 36, weekly: 'Rp180.000' },
      { months: 6, payments: 24, weekly: 'Rp270.000' },
      { months: 3, payments: 12, weekly: 'Rp540.000' },
      { months: 1, payments: 4, weekly: 'Rp1.620.000', over: true },
    ] as Tenor[],
  },
  lanjutan: {
    nominal: 'Rp7.200.000',
    terima: 'Rp6.995.000',
    batas: 'Rp300.000',
    tenors: [
      { months: 12, payments: 48, weekly: 'Rp195.000' },
      { months: 9, payments: 36, weekly: 'Rp260.000' },
      { months: 6, payments: 24, weekly: 'Rp390.000', over: true },
      { months: 3, payments: 12, weekly: 'Rp780.000', over: true },
      { months: 1, payments: 4, weekly: 'Rp2.335.000', over: true },
    ] as Tenor[],
  },
}
