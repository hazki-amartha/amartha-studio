'use client'

// The evening counterpart: the morning report asks what the BM will do, this one
// asks what actually happened to the number that missed.

import { useState } from 'react'
import { Button } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { BmShell } from '../lib/shell'
import { PageHeading, Panel, PanelHeading, Select, Textarea } from '../lib/ui'
import { EVENING_CAUSES } from '../lib/data'

export function EveningReportScreen() {
  const flow = useFlow()
  const [cause, setCause] = useState(EVENING_CAUSES[0].value)
  const [explanation, setExplanation] = useState('')
  const [followUp, setFollowUp] = useState('')

  return (
    <BmShell
      breadcrumbs={[
        { label: 'Home' },
        { label: 'Branches' },
        { label: 'Activity' },
        { label: 'Evening report', current: true },
      ]}
      header={<PageHeading title="Evening report" meta="Penjelasan untuk 27 Sep 2025" />}
    >
      <div className="pb-16">
        <Panel>
          <div className="flex items-center justify-between gap-16">
            <div className="flex flex-col gap-2">
              <span className="text-14 text-default">Repayment rate hari ini</span>
              <span className="text-12 text-caption">Target harian 95%</span>
            </div>
            <span className="text-24 font-bold text-red-500">20%</span>
          </div>
        </Panel>
      </div>

      <div className="pb-16">
        <Panel>
          <PanelHeading title="Apa yang terjadi?" />
          <div className="flex flex-col gap-12">
            <Select
              label="Penyebab utama"
              value={cause}
              onChange={setCause}
              options={EVENING_CAUSES}
            />
            <Textarea
              value={explanation}
              onChange={setExplanation}
              placeholder="Jelaskan singkat kondisi di lapangan hari ini…"
            />
          </div>
        </Panel>
      </div>

      <div className="pb-16">
        <Panel>
          <PanelHeading title="Tindak lanjut besok" />
          <Textarea
            value={followUp}
            onChange={setFollowUp}
            placeholder="Apa yang akan Anda dan BP lakukan besok…"
            rows={3}
          />
        </Panel>
      </div>

      <div className="flex items-center justify-end gap-8">
        <Button variant="ghost" onClick={() => flow.back()}>
          Batal
        </Button>
        <Button onClick={() => flow.go('branch-summary')}>Kirim report</Button>
      </div>
    </BmShell>
  )
}
