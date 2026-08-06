'use client'

// One BP, in the same three panels and the same order as the board's three
// column groups. The board said WHO is off; this page says AT WHAT, and its task
// rows are the only way further down — the reason a mitra did not pay lives on
// the task, not here.

import { useFlow } from '@/platform/runtime'
import { Badge } from '@/design-system/components'
import { ChevronRight } from '@/design-system/icons'
import {
  BRANCH,
  BUCKETS,
  MONTH,
  PROGRESS_LABEL,
  TODAY,
  WEEK,
  bpById,
  n,
  onTarget,
  prevRate,
  progress,
  rate,
  rp,
  taskTotals,
} from '../lib/data'
import { kindLabel, tasksOf } from '../lib/tasks'
import { openTask, useSelection } from '../lib/store'
import {
  GapCell,
  MisShell,
  PageHeading,
  Panel,
  PanelHeading,
  RateCell,
  SimpleTable,
  TaskCell,
} from '../lib/ui'

export function BpScreen() {
  const flow = useFlow()
  const { bpId } = useSelection()
  const bp = bpById(bpId ?? '')

  const tasks = tasksOf(bp)
  const totals = taskTotals(bp.tasks)
  const verdict = progress(bp)

  return (
    <MisShell
      breadcrumbs={[
        { label: 'Branches' },
        { label: `Monitoring BP — ${BRANCH}`, onClick: () => flow.go('board') },
        { label: bp.name },
      ]}
      header={
        <PageHeading
          title={bp.name}
          meta={`${bp.majelis} majelis · ${TODAY}${bp.konteks ? ` · ${bp.konteks}` : ''}`}
          actions={
            <Badge
              intent={verdict === 'on-target' ? 'green' : verdict === 'progressing' ? 'yellow' : 'red'}
              variant="subtle"
            >
              {PROGRESS_LABEL[verdict]}
            </Badge>
          }
        />
      }
    >
      {/* --- Tugas hari ini --- */}
      <Panel>
        <PanelHeading
          title="Tugas hari ini"
          subtitle="Dari A-Partner. Klik kunjungan majelis atau kunjungan rumah untuk melihat hasilnya per mitra."
          action={
            <span className="w-40 shrink-0">
              <TaskCell done={totals.done} total={totals.total} />
            </span>
          }
        />
        <SimpleTable
          columns={[
            { id: 'jenis', header: 'Jenis' },
            { id: 'nama', header: 'Tugas' },
            { id: 'tempat', header: 'Tempat' },
            { id: 'jam', header: 'Jam' },
            { id: 'status', header: 'Status' },
            { id: 'go', header: '', align: 'right' },
          ]}
          rows={tasks.map((task) => {
            const drillable = task.kind === 'MV' || task.kind === 'HV'
            return {
              id: task.id,
              onClick: drillable
                ? () => {
                    openTask(task.id)
                    flow.go(task.kind === 'MV' ? 'task-majelis' : 'task-home')
                  }
                : undefined,
              cells: {
                jenis: (
                  <span className="flex items-center gap-8">
                    <span className="flex size-24 items-center justify-center rounded-8 bg-neutral-50 text-10 font-bold text-caption">
                      {task.kind}
                    </span>
                    <span className="text-12 text-caption">{kindLabel(task.kind)}</span>
                  </span>
                ),
                nama: <span className="text-14 font-bold text-default">{task.title}</span>,
                tempat: <span className="text-14 text-caption">{task.place}</span>,
                jam: <span className="text-14 text-caption">{task.time}</span>,
                status: (
                  <Badge intent={task.done ? 'green' : 'red'} variant="subtle" size="sm">
                    {task.done ? 'Selesai' : 'Belum'}
                  </Badge>
                ),
                go: drillable ? (
                  <span className="flex justify-end text-caption">
                    <ChevronRight size={16} />
                  </span>
                ) : null,
              },
            }
          })}
        />
      </Panel>

      {/* --- Repayment minggu ini --- */}
      <Panel>
        <PanelHeading
          title="Repayment minggu ini"
          subtitle={`${WEEK}. Setiap bucket dinilai atas targetnya sendiri, dengan tiga minggu sebelumnya sebagai pembanding.`}
        />
        <SimpleTable
          columns={[
            { id: 'bucket', header: 'Bucket' },
            { id: 'loan', header: 'Total loan', align: 'right' },
            { id: 'paid', header: 'Terbayar', align: 'right' },
            { id: 'rr', header: '% RR minggu ini', align: 'right' },
            { id: 'target', header: 'Target', align: 'right' },
            { id: 'history', header: '3 minggu sebelumnya', align: 'right' },
          ]}
          rows={BUCKETS.map((bucket) => {
            const pair = bp.week[bucket.id]
            return {
              id: bucket.id,
              cells: {
                bucket: <span className="text-14 font-bold text-default">{bucket.label}</span>,
                loan: <span className="text-14 text-default">{n(pair[0])}</span>,
                paid: <span className="text-14 text-default">{n(pair[1])}</span>,
                rr: (
                  <RateCell
                    rate={rate(pair)}
                    delta={rate(pair) - prevRate(bp, bucket.id)}
                    onTarget={onTarget(bp, bucket.id)}
                    muted={bucket.target === null}
                  />
                ),
                target:
                  bucket.target === null ? (
                    <span className="text-14 text-caption">tanpa target</span>
                  ) : (
                    <span className="text-14 text-default">≥ {bucket.target}%</span>
                  ),
                history: (
                  <span className="text-14 text-caption">
                    {bp.history[bucket.id].map((r) => `${r}%`).join(' · ')}
                  </span>
                ),
              },
            }
          })}
        />
      </Panel>

      {/* --- Disbursement bulan ini --- */}
      <Panel>
        <PanelHeading title="Disbursement bulan ini" subtitle={MONTH} />
        <div className="flex flex-wrap gap-24">
          <Figure label="Sudah cair" value={rp(bp.disb.cair)} />
          <Figure label="Target bulan ini" value={rp(bp.disb.target)} />
          <Figure
            label="Selisih"
            value={<GapCell value={bp.disb.cair - bp.disb.target} format={rp} />}
          />
          <Figure
            label="Mitra baru"
            value={`${bp.disb.mitraBaru} dari ${bp.disb.targetMitraBaru}`}
          />
        </div>
      </Panel>
    </MisShell>
  )
}

function Figure({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <span className="flex flex-col gap-4">
      <span className="text-12 text-caption">{label}</span>
      <span className="text-20 font-bold text-default">{value}</span>
    </span>
  )
}
