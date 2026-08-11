'use client'

// The BM's landing screen: the branch monitoring scorecard. There are no tabs —
// briefings are reached from two controls that sit in line with the filters: a
// "Mulai briefing" button (opens a dialog to pick morning or evening) and a
// "Riwayat briefing" text button (the list of past briefings, its own screen).

import { useState } from 'react'
import { useFlow } from '@/platform/runtime'
import { Button, Modal } from '@/design-system/components'
import { ChevronRight, History } from '@/design-system/icons'
import { BmShell } from '../lib/shell'
import { Scorecard, ClosedDayPanel } from '../lib/scorecard'
import {
  DateFilter,
  LockedFilter,
  MoonGlyph,
  PageHeading,
  Select,
  SunGlyph,
} from '../lib/ui'
import {
  BPS,
  BRIEFING_INTRO,
  BRIEFING_LABEL,
  LOCATION,
  REPORT_DATE,
  type BriefingKind,
} from '../lib/data'

const BP_OPTIONS = [{ value: 'all', label: 'Semua BP' }, ...BPS.map((b) => ({ value: b.id, label: b.name }))]

export function DashboardScreen() {
  const flow = useFlow()
  const [bpFilter, setBpFilter] = useState('all')
  const [day, setDay] = useState('2026-08-07')
  const [pickerOpen, setPickerOpen] = useState(false)

  const bps = bpFilter === 'all' ? BPS : BPS.filter((b) => b.id === bpFilter)

  const openBriefing = (kind: BriefingKind) => {
    setPickerOpen(false)
    flow.go(`briefing-${kind}`)
  }

  return (
    <BmShell
      breadcrumbs={[
        { label: 'Home' },
        { label: 'Branches' },
        { label: 'Monitoring', current: true },
      ]}
      header={
        <PageHeading
          title="Branch Monitoring"
          meta={`Diperbarui hari ini, ${REPORT_DATE}, 16.20 WIB`}
        />
      }
    >
      {/* Filter row, right below the title — the fixed location cascade (disabled)
          and the BP filter (the only live control) on the left, the two briefing
          entry points on the right, all on one line. */}
      <div className="flex flex-wrap items-center gap-8 pb-16">
        <DateFilter label="Tanggal" value={day} onChange={setDay} />
        <LockedFilter label="Region" value={LOCATION.region} />
        <LockedFilter label="Provinsi" value={LOCATION.provinsi} />
        <LockedFilter label="Kota" value={LOCATION.kota} />
        <LockedFilter label="Branch" value={LOCATION.branch} />
        <Select label="Business Partner" value={bpFilter} onChange={setBpFilter} options={BP_OPTIONS} />
        <div className="flex flex-1 flex-wrap items-center justify-end gap-8">
          <button
            type="button"
            onClick={() => flow.go('briefing-history')}
            className="flex items-center gap-4 text-14 font-bold text-link active:opacity-70"
          >
            <History size={16} /> Riwayat briefing
          </button>
          <Button variant="primary" size="sm" onClick={() => setPickerOpen(true)}>
            Mulai briefing
          </Button>
        </div>
      </div>

      <Scorecard bps={bps} />
      <div className="pt-16">
        <ClosedDayPanel bps={bps} />
      </div>

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        size="sm"
        title="Mulai briefing"
        description="Pilih briefing yang ingin dimulai hari ini."
        slot={
          <div className="flex flex-col gap-8">
            <BriefingChoice kind="morning" onSelect={openBriefing} />
            <BriefingChoice kind="evening" onSelect={openBriefing} />
          </div>
        }
      />
    </BmShell>
  )
}

/** One row in the "Mulai briefing" dialog: the briefing's glyph, its name and
 *  one-line intro, and a chevron. The whole row is the button. */
function BriefingChoice({
  kind,
  onSelect,
}: {
  kind: BriefingKind
  onSelect: (kind: BriefingKind) => void
}) {
  const morning = kind === 'morning'
  return (
    <button
      type="button"
      onClick={() => onSelect(kind)}
      className="flex items-center gap-12 rounded-12 border border-default p-12 text-left hover:bg-neutral-50 active:opacity-70"
    >
      <span
        className={`flex size-40 shrink-0 items-center justify-center rounded-full ${
          morning ? 'bg-orange-50 text-orange-500' : 'bg-primary-50 text-primary-500'
        }`}
      >
        {morning ? <SunGlyph /> : <MoonGlyph />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-14 font-bold text-default">{BRIEFING_LABEL[kind]}</span>
        <span className="text-12 text-caption">{BRIEFING_INTRO[kind]}</span>
      </span>
      <ChevronRight size={20} className="shrink-0 text-caption" />
    </button>
  )
}
