'use client'

// Where "Isi sekarang" on the morning tile lands. The BM is not asked to type a
// report from scratch: the system already knows which majelis are behind, so the
// screen states them and asks only for the action the BM will take on each.

import { useState } from 'react'
import { Button } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { BmShell } from '../lib/shell'
import { PageHeading, Panel, PanelHeading, Select, Textarea } from '../lib/ui'
import { FLAGGED_MAJELIS, MORNING_ACTIONS } from '../lib/data'

export function MorningReportScreen() {
  const flow = useFlow()
  const [actions, setActions] = useState<Record<string, string>>(() =>
    Object.fromEntries(FLAGGED_MAJELIS.map((m) => [m.id, MORNING_ACTIONS[0].value])),
  )
  const [note, setNote] = useState('')

  return (
    <BmShell
      breadcrumbs={[
        { label: 'Home' },
        { label: 'Branches' },
        { label: 'Activity' },
        { label: 'Morning report', current: true },
      ]}
    >
      <PageHeading title="Morning report" meta="Rencana aksi untuk 27 Sep 2025" />

      <div className="pb-16">
        <Panel>
          <PanelHeading
            title="3 majelis perlu perhatian"
            subtitle="Repayment rate dan attendance rate di bawah target minggu ini."
          />
          <div className="flex flex-col gap-12">
            {FLAGGED_MAJELIS.map((majelis) => (
              <div
                key={majelis.id}
                className="flex items-center justify-between gap-16 rounded-12 border border-default p-12"
              >
                <div className="flex min-w-0 flex-col gap-2">
                  <span className="truncate text-14 font-bold text-default">{majelis.name}</span>
                  <span className="text-12 text-caption">BP {majelis.bp}</span>
                </div>
                <div className="flex shrink-0 items-center gap-24">
                  <span className="flex flex-col gap-2">
                    <span className="text-10 text-caption">Repayment</span>
                    <span className="text-14 font-bold text-red-500">
                      {majelis.repaymentRate}%
                    </span>
                  </span>
                  <span className="flex flex-col gap-2">
                    <span className="text-10 text-caption">Attendance</span>
                    <span className="text-14 font-bold text-red-500">
                      {majelis.attendanceRate}%
                    </span>
                  </span>
                  <Select
                    label={`Aksi untuk ${majelis.name}`}
                    value={actions[majelis.id]}
                    onChange={(value) => setActions((prev) => ({ ...prev, [majelis.id]: value }))}
                    options={MORNING_ACTIONS}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="pb-16">
        <Panel>
          <PanelHeading title="Catatan tambahan" subtitle="Opsional." />
          <Textarea
            value={note}
            onChange={setNote}
            placeholder="Hal lain yang perlu diketahui Area Manager hari ini…"
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
