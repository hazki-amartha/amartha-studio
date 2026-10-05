'use client'

// "Shall we write off this mitra" — the form (it fills the drawer's right panel, no pop-up) a higher field officer fills in to
// SUGGEST a write-off for a DPD 90+ mitra. It only suggests; approving is
// someone else's step, so Submit just flags the mitra as proposed.
//
// The three requirements are read off her own history, not typed: she is 90+,
// her BP has tried to reach her, and her BM has too. Submit stays off until all
// three are met and a reason is picked.

import { useState, type ReactNode } from 'react'
import { Badge, Button } from '@/design-system/components'
import { CheckCircleFill, ChevronLeft, CrossCircleFill, Image as ImageIcon } from '@/design-system/icons'
import { Select } from './ui'
import type { DrawerMitra } from './drawer-data'

const REASONS = [
  { value: 'meninggal', label: 'Mitra meninggal dunia' },
  { value: 'pindah', label: 'Mitra pindah dan tidak ditemukan' },
  { value: 'usaha', label: 'Usaha bangkrut' },
  { value: 'tidak-mampu', label: 'Tidak mampu membayar' },
  { value: 'lainnya', label: 'Lainnya' },
]

const FORM_W = 520

/** Attempts that actually went out — a cancelled tindakan never reached her. */
const attempts = (m: DrawerMitra, who: (p: string) => boolean) =>
  m.tindakan.filter((t) => t.ok !== null && who(t.pelaku))

export function writeOffChecks(m: DrawerMitra) {
  const bp = attempts(m, (p) => p === 'BP' || p === 'DC')
  const calls = bp.filter((t) => t.jenis === 'Telepon').length
  const visits = bp.filter((t) => t.jenis === 'Home visit').length
  const bmVisits = attempts(m, (p) => p === 'BM').length
  return {
    items: [
      { label: 'DPD 90+', detail: 'Requirement met', met: true },
      { label: 'BP contacted', detail: `${calls} calls · ${visits} Home Visit`, met: calls + visits > 0 },
      { label: 'BM contacted', detail: `${bmVisits} home visit`, met: bmVisits > 0 },
    ],
  }
}

function Label({ children }: { children: ReactNode }) {
  return <span className="text-14 font-bold text-default">{children}</span>
}

export interface WriteOffAnswer {
  reason: string
  note: string
}

export function WriteOffForm({
  mitra,
  submitted,
  onSubmit,
  onClose,
}: {
  mitra: DrawerMitra
  /** Set once sent: the same page, filled in and locked, to read back. */
  submitted?: WriteOffAnswer
  onSubmit: (answer: WriteOffAnswer) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState(submitted?.reason ?? '')
  const [note, setNote] = useState(submitted?.note ?? '')
  const locked = submitted !== undefined
  const { items } = writeOffChecks(mitra)
  const metCount = items.filter((i) => i.met).length
  const allMet = metCount === items.length
  const ready = allMet && reason !== ''

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-24 overflow-y-auto p-24" style={{ maxWidth: FORM_W }}>
      <button type="button" onClick={onClose} className="flex items-center gap-4 self-start text-14 text-link">
        <ChevronLeft size={16} />
        Kembali
      </button>
      <h2 className="text-20 font-bold text-default">
          {locked ? 'Write off proposal' : 'Shall we write off this mitra'}
        </h2>

      {/* Requirements are facts about her, not choices — shown as a status
          card with a verdict, never as checkboxes someone could untick. */}
      <div className="flex shrink-0 flex-col overflow-hidden rounded-12 border border-default">
        <div className="flex items-center justify-between gap-12 bg-neutral-50 px-16 py-12">
          <span className="text-14 font-bold text-default">Requirements</span>
          <Badge intent={allMet ? 'green' : 'red'} variant="subtle" size="sm">
            {allMet ? 'All requirements met' : `${metCount} of ${items.length} met`}
          </Badge>
        </div>
        {items.map((i) => (
          <div key={i.label} className="flex items-center justify-between gap-12 border-t border-default px-16 py-12">
            <span className="flex items-center gap-12">
              <span className={i.met ? 'text-green-500' : 'text-red-500'}>
                {i.met ? <CheckCircleFill size={20} /> : <CrossCircleFill size={20} />}
              </span>
              <span className="text-14 font-bold text-default">{i.label}</span>
            </span>
            <span className="text-14 text-caption">{i.detail}</span>
          </div>
        ))}
      </div>

      <div className="flex shrink-0 flex-col gap-8">
        <Label>Reason for write off</Label>
        <Select
          label="Reason for write off"
          value={reason}
          onChange={setReason}
          disabled={locked}
          options={[{ value: '', label: 'Select' }, ...REASONS]}
          fullWidth
        />
      </div>

      <div className="flex shrink-0 flex-col gap-8">
        <Label>Catatan</Label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={locked}
          placeholder="Placeholder"
          rows={4}
          className="w-full resize-none rounded-8 border border-default bg-neutral-white p-12 text-14 text-default"
        />
      </div>

      {locked ? null : (
      <div className="flex shrink-0 flex-col gap-8">
        <Label>Evidence (Optional)</Label>
        <div className="flex items-center justify-center gap-12 rounded-12 border border-dashed border-default bg-neutral-50 py-32">
          <span className="text-primary-500">
            <ImageIcon size={24} />
          </span>
          <span className="flex flex-col gap-2">
            <span className="text-12 text-link">Upload files</span>
            <span className="text-12 text-caption">File could be photos, docs, etc.</span>
          </span>
        </div>
      </div>
      )}

      {locked ? null : (
        <div className="flex shrink-0 justify-end">
          <Button disabled={!ready} onClick={() => onSubmit({ reason, note })}>
            Submit
          </Button>
        </div>
      )}
    </div>
  )
}
