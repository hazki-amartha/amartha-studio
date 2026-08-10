'use client'

// A past (or just-submitted) briefing, read-only: the same scorecard, the
// commentary the BM left filled into the Komentar column, and the proof photo.
// Which briefing to show comes from the store; a direct visit with nothing
// selected falls back to today's morning briefing.

import { useFlow } from '@/platform/runtime'
import { Badge, Button } from '@/design-system/components'
import { Camera } from '@/design-system/icons'
import { BmShell } from '../lib/shell'
import { Scorecard } from '../lib/scorecard'
import { Panel, PanelHeading, PageHeading, SunGlyph, MoonGlyph } from '../lib/ui'
import {
  BRANCH_LABEL,
  BRIEFING_LABEL,
  REPORT_DATE,
  SAMPLE_COMMENTS,
  sectionsForBriefing,
} from '../lib/data'
import { useFlowState } from '../lib/store'

export function BriefingDetailScreen() {
  const flow = useFlow()
  const { viewing } = useFlowState()
  const kind = viewing?.kind ?? 'morning'
  const date = viewing?.date ?? REPORT_DATE
  const label = BRIEFING_LABEL[kind]
  const author = viewing?.own ? 'Rina Marlina (Anda)' : 'Rina Marlina'

  return (
    <BmShell
      breadcrumbs={[
        { label: 'Home' },
        { label: 'Branches' },
        { label: BRANCH_LABEL },
        { label: `${label} · ${date}`, current: true },
      ]}
      header={
        <PageHeading
          title={`${label} — ${date}`}
          meta={`${BRANCH_LABEL} · Dikirim oleh ${author}`}
          actions={
            <Button variant="outline" size="sm" onClick={() => flow.go('dashboard')}>
              Kembali
            </Button>
          }
        />
      }
    >
      <div className="flex flex-wrap items-center gap-8 pb-16">
        <span className={kind === 'morning' ? 'text-orange-500' : 'text-primary-500'}>
          {kind === 'morning' ? <SunGlyph /> : <MoonGlyph />}
        </span>
        <Badge intent="green" variant="subtle" size="sm">
          Terkirim
        </Badge>
        <span className="text-12 text-caption">Briefing telah dilakukan dan dikirim.</span>
      </div>

      <Scorecard sections={sectionsForBriefing(kind)} comment={{ kind: 'read', comments: SAMPLE_COMMENTS }} />

      <div className="pt-16">
        <Panel>
          <PanelHeading title="Foto bukti briefing" subtitle="Bukti briefing telah dilakukan." />
          <div className="flex items-center gap-16 rounded-12 border border-default bg-neutral-50 p-16">
            <span className="flex size-48 shrink-0 items-center justify-center rounded-12 bg-primary-50 text-primary-500">
              <Camera size={24} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="text-14 font-bold text-default">briefing-{date}.jpg</span>
              <span className="truncate text-12 text-caption">Diunggah bersama briefing</span>
            </span>
          </div>
        </Panel>
      </div>
    </BmShell>
  )
}
