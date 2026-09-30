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
