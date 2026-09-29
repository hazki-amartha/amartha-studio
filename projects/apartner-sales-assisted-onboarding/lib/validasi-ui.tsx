'use client'

// Shared pieces of the Validasi Mitra flow — pulled out once they were
// needed on more than one screen (§4).

import { Card } from '@/design-system/components'
import { Camera, Check, ChevronDown, FileCheck } from '@/design-system/icons'
import type { SoftRejectCase } from './validasi'

/** Who this review is about — kept on every screen of the flow (not just
 *  step 1) so the BM never loses track of whose case she's looking at
 *  partway through a 4-step review. */
export function MitraCard({ case: c }: { case: SoftRejectCase }) {
  return (
    <Card>
      <div className="flex flex-col gap-4">
        <span className="text-16 font-bold text-default">{c.name}</span>
        <span className="text-12 text-caption">
          {c.majelisName} · {c.amount}
        </span>
      </div>
    </Card>
  )
}

/** The dropdown-trigger pattern already used for "Alasan" on Keputusan —
 *  reused for every single-choice field on the BM's own verification steps
 *  so the pages read as one form. `hint` surfaces the BP's own answer to the
 *  same question (BP Feedback) so the BM is checking against it, not
 *  guessing blind. */
export function PickerField({
  label,
  value,
  hint,
  onClick,
}: {
  label: string
  value: string
  /** The BP's own answer to the same question, if there is one to compare. */
  hint?: string
  onClick: () => void
}) {
  return (
    <div className="flex flex-col gap-8">
      <span className="text-14 font-bold text-default">{label}</span>
      <button
        type="button"
        onClick={onClick}
        className="flex items-center justify-between gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-left text-14"
      >
        <span className={`min-w-0 truncate ${value ? 'text-default' : 'text-disabled'}`}>
          {value || 'Pilih jawaban'}
        </span>
        <span className="shrink-0 text-disabled">
          <ChevronDown size={20} />
        </span>
      </button>
      {hint ? <span className="text-12 text-caption">Menurut BP Feedback: {hint}</span> : null}
    </div>
  )
}

/** A square box, not SelectableCard's round radio dot — the design system's
 *  SelectableCard draws the same circular indicator for `inputType="radio"`
 *  and `"checkbox"` alike, which reads as "pick one" even when several can be
 *  picked. Used for the one genuinely multi-select field in this flow (Aset
 *  yang dimiliki mitra), so ticking two doesn't look like it un-ticks one. */
export function CheckboxRow({
  label,
  checked,
  onToggle,
}: {
  label: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onToggle}
      className={`flex items-center gap-8 rounded-8 border px-12 py-8 text-left text-14 font-bold ${
        checked ? 'border-primary-500 bg-primary-50 text-primary-500' : 'border-default bg-neutral-white text-default'
      }`}
    >
      <span
        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-4 border ${
          checked ? 'border-primary-500 bg-primary-500 text-neutral-white' : 'border-default bg-neutral-white'
        }`}
      >
        {checked ? <Check size={16} /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  )
}

/** Tap-to-capture — same dashed-box / "Foto terlampir" pair lead-new.tsx uses
 *  for its own bukti foto. The prototype takes no real photo (§3), only
 *  records that the BM did. */
export function PhotoCapture({
  label,
  captured,
  onToggle,
}: {
  label: string
  captured: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex flex-col gap-8">
      <span className="text-14 font-bold text-default">{label}</span>
      {captured ? (
        <div className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-12">
          <span className="text-green-500">
            <FileCheck size={20} />
          </span>
          <span className="flex-1 text-default">Foto tersimpan</span>
          <button type="button" onClick={onToggle} className="shrink-0 text-12 font-bold text-link">
            Ambil ulang
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full flex-col items-center gap-4 rounded-8 border border-dashed border-default bg-canvas-blue p-16 text-caption"
        >
          <Camera size={24} />
          <span className="text-14 text-default">Ambil foto</span>
        </button>
      )}
    </div>
  )
}

