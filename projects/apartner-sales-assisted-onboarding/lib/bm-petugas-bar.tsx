'use client'

// BmPetugasBar — the strip the BM sees under the header on a lead that belongs to
// a BP (everything past Follow up). It blends into the header chrome: same white
// ground, a bottom hairline, the petugas name, and a switcher to reassign.
//
// It renders nothing in the BP view, and nothing on a lead the BM owns herself
// (her Follow up leads), so it is safe to drop into any lead-detail screen's top
// bar — it only appears where the "this is a BP's work" bar belongs.

import { useState } from 'react'
import { BottomSheet, SelectableCard } from '@/design-system/components'
import { ChevronDown } from '@/design-system/icons'
import { BM_FO, FIELD_OFFICERS, foLabel } from './pipeline'
import { pipelineStore, usePipeline } from './pipeline-store'
import { useApp } from './store'

/** True when the BM is viewing a lead that belongs to a BP — the page is then
 *  read-only (no CTA but Ganti petugas). Same condition as the bar's visibility. */
export function useBmReadOnly(): boolean {
  const { role } = useApp()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  return role === 'BM' && !!lead && lead.fo !== BM_FO
}

export function BmPetugasBar() {
  const { role } = useApp()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  const [open, setOpen] = useState(false)

  // Only in the BM view, and only on a lead a BP owns (not the BM's own Follow up).
  if (role !== 'BM' || !lead || lead.fo === BM_FO) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-8 border-b border-default bg-neutral-white px-16 py-8 text-left"
      >
        <span className="text-12 text-caption">Petugas</span>
        <span className="min-w-0 flex-1 truncate text-12 font-bold text-default">{foLabel(lead.fo)}</span>
        <span className="flex shrink-0 items-center gap-2 text-12 font-bold text-primary-500">
          Ganti
          <ChevronDown size={16} />
        </span>
      </button>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Ganti petugas"
        description="Pilih BP yang menangani lead ini."
      >
        <div className="flex flex-col gap-8">
          {FIELD_OFFICERS.map((fo) => (
            <SelectableCard
              key={fo}
              name="bm-petugas-bar"
              inputType="radio"
              title={foLabel(fo)}
              checked={lead.fo === fo}
              onChange={() => {
                pipelineStore.setFo(lead.id, fo)
                setOpen(false)
              }}
            />
          ))}
        </div>
      </BottomSheet>
    </>
  )
}
