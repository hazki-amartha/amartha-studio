'use client'

// Project-local pieces for the Modal Usaha onboarding — the 6-step journey that
// turns Modal from inactive into active. Built only from FunDS tokens and
// design-system components (CLAUDE.md §4). The KYC sub-steps reuse the existing
// ob-* screens; what lives here is the Modal-specific chrome: the step bar, the
// "Data pengajuan" hub rows, and the shared photo-capture guide.

import { type ReactNode } from 'react'
import { Button, Input } from '@/design-system/components'
import { CheckCircleFill, ChevronDown, CrossCircleFill } from '@/design-system/icons'
import { BottomAction, PageTitle, RuleList } from './ui'

// The six sections of the application, in order. `hub` is the row label on the
// "Data pengajuan Anda" checklist; `step` is the number shown on the home card.
export const MODAL_STEPS = [
  { id: 'pribadi', step: 1, hub: 'Data pribadi', note: 'KTP, selfie & alamat' },
  { id: 'bank-usaha', step: 2, hub: 'Data bank dan usaha', note: 'Rekening & pekerjaan' },
  { id: 'penanggung', step: 3, hub: 'Data penanggung jawab', note: 'Majelis & penjamin' },
  { id: 'keluarga', step: 4, hub: 'Data keluarga', note: 'Kartu Keluarga' },
  { id: 'rumah', step: 5, hub: 'Foto rumah tinggal', note: 'Foto tempat tinggal' },
  { id: 'usaha', step: 6, hub: 'Foto tempat usaha', note: 'Foto lokasi usaha' },
] as const

export type ModalStepId = (typeof MODAL_STEPS)[number]['id']

export const TOTAL_STEPS = MODAL_STEPS.length

/**
 * The slim continuous progress bar at the top of each onboarding step —
 * "Langkah N dari 6" with the current section named. Matches the single-fill
 * bar the Figma uses (not the 4-segment bank StepHeader).
 */
export function ModalStepBar({ step, label }: { step: number; label: string }) {
  const pct = Math.round((step / TOTAL_STEPS) * 100)
  return (
    <div>
      <div className="h-4 w-full overflow-hidden rounded-full bg-neutral-200">
        <span className="block h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-8 text-12 text-caption">
        Langkah {step} dari {TOTAL_STEPS} · <span className="font-bold text-default">{label}</span>
      </p>
    </div>
  )
}

/**
 * The shared photo-rule guide used by the KTP, Kartu Keluarga, rumah tinggal and
 * tempat usaha steps: a good/bad example pair, the capture rules, and the CTA.
 * `example` is schematic art (no real photos exist in the repo).
 */
export function PhotoGuide({
  title,
  example,
  rules,
  cta = 'Mulai Ambil Foto',
  onStart,
}: {
  title: ReactNode
  example: ReactNode
  rules: ReactNode[]
  cta?: string
  onStart: () => void
}) {
  return (
    <>
      <PageTitle title={title} />
      <div className="flex gap-8">
        <div className="relative flex-1 rounded-12 border-2 border-green-500 p-4">
          {example}
          <CheckCircleFill size={24} className="absolute -bottom-8 -right-8 rounded-full bg-neutral-white text-green-500" />
        </div>
        <div className="relative flex-1 rounded-12 border-2 border-red-500 p-4">
          <span className="opacity-60">{example}</span>
          <CrossCircleFill size={24} className="absolute -bottom-8 -right-8 rounded-full bg-neutral-white text-red-500" />
        </div>
      </div>
      <RuleList rules={rules} />
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={onStart}>
          {cta}
        </Button>
      </BottomAction>
    </>
  )
}

/** Schematic stand-in for a captured photo, tinted by subject. */
export function PhotoArt({ icon, tone = 'blue' }: { icon: ReactNode; tone?: 'blue' | 'orange' | 'green' }) {
  const bg = tone === 'orange' ? 'bg-orange-50 text-orange-500' : tone === 'green' ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-blue-500'
  return (
    <div className={`flex h-120 w-full items-center justify-center rounded-12 ${bg}`}>
      {icon}
    </div>
  )
}

/** The address fields shared by the rumah-tinggal and tempat-usaha location
 * forms — province through postal code. When `filled`, they carry example
 * values instead of placeholders (the completed-application state). */
export function LocationFields({ filled = false }: { filled?: boolean }) {
  const select = <ChevronDown size={16} />
  const v = (value: string) => (filled ? { defaultValue: value } : undefined)
  return (
    <>
      <Input label="Alamat lengkap" placeholder="Nama jalan, nomor, blok" {...v('Jl. Melati No. 12')} />
      <Input label="Provinsi" placeholder="Pilih provinsi" readOnly suffix={select} {...v('Jawa Timur')} />
      <Input label="Kota / Kabupaten" placeholder="Pilih kota" readOnly suffix={select} {...v('Kabupaten Malang')} />
      <Input label="Kecamatan" placeholder="Pilih kecamatan" readOnly suffix={select} {...v('Pakisaji')} />
      <Input label="Kelurahan / Desa" placeholder="Pilih kelurahan" readOnly suffix={select} {...v('Karangpandan')} />
      <div className="flex gap-12">
        <Input label="RT" placeholder="000" {...v('003')} />
        <Input label="RW" placeholder="000" {...v('002')} />
        <Input label="Kode pos" placeholder="00000" {...v('65162')} />
      </div>
    </>
  )
}
