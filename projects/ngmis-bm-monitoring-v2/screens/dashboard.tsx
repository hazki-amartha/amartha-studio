'use client'

// The BM's landing screen: the branch monitoring scorecard. There are no tabs.
// When a briefing is scheduled to start (morning or evening — the `scheduled`
// store field, driven by the `states` controls beside the device), a full-width
// banner prompts it at the top; the full list lives behind the "Riwayat briefing"
// entry point in the filter row.

import { useState } from 'react'
import { useFlow } from '@/platform/runtime'
import { Button } from '@/design-system/components'
import { History } from '@/design-system/icons'
import { BmShell } from '../lib/shell'
import { Scorecard, ClosedDayPanel } from '../lib/scorecard'
import {
  DateFilter,
  LockedFilter,
  MoonGlyph,
  PageHeading,
  SunGlyph,
} from '../lib/ui'
import { BRIEFING_LABEL, LOCATION, REPORT_DATE, type BriefingKind } from '../lib/data'
import { useFlowState } from '../lib/store'

/** When each briefing is scheduled to start — shown in the banner copy. */
const SCHEDULED_TIME: Record<BriefingKind, string> = {
  morning: '07.00 WIB',
  evening: '17.00 WIB',
}

export function DashboardScreen() {
  const flow = useFlow()
  const { scheduled, submitted } = useFlowState()
  const [day, setDay] = useState('2026-08-07')

  // The banner only appears while the scheduled briefing is due and unsent.
  const showBanner = !submitted[scheduled]

  return (
    <BmShell
      breadcrumbs={[
        { label: 'Home' },
        { label: 'Branches' },
        { label: 'Monitoring', current: true },
      ]}
      header={
        <PageHeading
          title="Daily Monitoring"
          meta={`Diperbarui hari ini, ${REPORT_DATE}, 16.20 WIB`}
        />
      }
    >
      {showBanner ? (
        <div className="pb-16">
          <BriefingBanner kind={scheduled} onStart={() => flow.go(`briefing-${scheduled}`)} />
        </div>
      ) : null}

      {/* Filter row, right below the title — the fixed location cascade (disabled)
          on the left, the Riwayat briefing entry point on the right. */}
      <div className="flex flex-wrap items-center gap-8 pb-16">
        <DateFilter label="Tanggal" value={day} onChange={setDay} />
        <LockedFilter label="Region" value={LOCATION.region} />
        <LockedFilter label="Provinsi" value={LOCATION.provinsi} />
        <LockedFilter label="Kota" value={LOCATION.kota} />
        <LockedFilter label="Branch" value={LOCATION.branch} />
        <div className="flex flex-1 flex-wrap items-center justify-end gap-8">
          <button
            type="button"
            onClick={() => flow.go('briefing-history')}
            className="flex items-center gap-4 text-14 font-bold text-link active:opacity-70"
          >
            <History size={16} /> Riwayat briefing
          </button>
        </div>
      </div>

      <Scorecard />
      <div className="pt-16">
        <ClosedDayPanel />
      </div>
    </BmShell>
  )
}

/** The full-width call-to-action banner for the briefing scheduled to start now.
 *  Tinted by kind (orange = morning, primary = evening); the CTA stays the brand
 *  primary, the only allowed action colour. */
function BriefingBanner({ kind, onStart }: { kind: BriefingKind; onStart: () => void }) {
  const morning = kind === 'morning'
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-16 rounded-16 border p-16 ${
        morning ? 'border-orange-200 bg-orange-50' : 'border-primary-200 bg-primary-50'
      }`}
    >
      <div className="flex items-center gap-12">
        <span
          className={`flex size-48 shrink-0 items-center justify-center rounded-full text-neutral-white ${
            morning ? 'bg-orange-500' : 'bg-primary-500'
          }`}
        >
          {morning ? <SunGlyph /> : <MoonGlyph />}
        </span>
        <div className="flex flex-col gap-2">
          <span className="text-16 font-bold text-default">Saatnya {BRIEFING_LABEL[kind]}</span>
          <span className="text-12 text-caption">
            Dijadwalkan mulai pukul {SCHEDULED_TIME[kind]}. Mulai briefing bersama BP sekarang.
          </span>
        </div>
      </div>
      <Button variant="primary" size="md" onClick={onStart}>
        Mulai {BRIEFING_LABEL[kind]}
      </Button>
    </div>
  )
}
