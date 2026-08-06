'use client'

// The other bottom of the drill-down: a home visit is one mitra, so it is a
// record rather than a table. Same fields as the majelis register — what was
// due, what was handed over, the reason, the promise — because a BM comparing
// "she did the visits but nothing moved" against "she never went" needs the two
// to be the same shape.

import { useFlow } from '@/platform/runtime'
import { Badge } from '@/design-system/components'
import { BRANCH, bpById, n, rp } from '../lib/data'
import { homeOutcome, kindLabel, taskById, tasksOf } from '../lib/tasks'
import { useSelection } from '../lib/store'
import { MisShell, PageHeading, Panel, PanelHeading } from '../lib/ui'

export function TaskHomeScreen() {
  const flow = useFlow()
  const { bpId, taskId } = useSelection()
  const bp = bpById(bpId ?? '')
  const task = taskById(bp.id, taskId ?? '') ?? tasksOf(bp).find((t) => t.kind === 'HV')

  if (!task) return null

  const visit = homeOutcome(task)
  const lunas = visit.bayar >= visit.tagihan

  return (
    <MisShell
      breadcrumbs={[
        { label: `Monitoring BP — ${BRANCH}`, onClick: () => flow.go('board') },
        { label: bp.name, onClick: () => flow.go('bp') },
        { label: visit.name },
      ]}
      header={
        <PageHeading
          title={visit.name}
          meta={`${kindLabel(task.kind)} · ${visit.alamat} · ${task.time} · ${bp.name}`}
          actions={
            <Badge intent={task.done ? 'green' : 'red'} variant="subtle">
              {task.done ? 'Selesai' : 'Belum dikerjakan'}
            </Badge>
          }
        />
      }
    >
      <Panel>
        <div className="flex flex-wrap gap-32">
          <Field label="Tagihan tertunggak" value={`Rp${n(visit.tagihan)}`} />
          <Field
            label="Dibayar saat kunjungan"
            value={visit.bayar > 0 ? `Rp${n(visit.bayar)}` : 'Tidak bayar'}
            tone={lunas ? 'text-default' : 'text-red-500'}
          />
          <Field label="Sisa setelah kunjungan" value={rp(visit.tagihan - visit.bayar)} />
        </div>
      </Panel>

      <Panel>
        <PanelHeading
          title="Yang dicatat BP di lapangan"
          subtitle="Dipilih dari daftar tetap di A-Partner saat kunjungan, bukan ditulis ulang kemudian."
        />
        <div className="flex flex-col gap-16">
          <Field
            label="Alasan belum bayar"
            value={visit.reason ?? 'Tidak ada — mitra membayar'}
            tone={visit.reason ? 'text-default' : 'text-caption'}
          />
          <Field
            label="Janji bayar"
            value={visit.janji ?? (lunas ? 'Tidak perlu' : 'Tidak ada janji')}
            tone={!lunas && !visit.janji ? 'text-red-500' : 'text-default'}
          />
          <span className="flex flex-col gap-4">
            <span className="text-12 text-caption">Bukti kunjungan</span>
            <span className="flex items-center gap-8">
              <Badge intent={task.done ? 'green' : 'neutral'} variant="subtle" size="sm">
                {task.done ? 'Foto terkirim' : 'Belum ada'}
              </Badge>
              <span className="text-12 text-caption">
                {task.done ? `Diunggah ${task.time} WITA` : 'Kunjungan belum dikerjakan'}
              </span>
            </span>
          </span>
        </div>
      </Panel>
    </MisShell>
  )
}

function Field({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <span className="flex flex-col gap-4">
      <span className="text-12 text-caption">{label}</span>
      <span className={`text-20 font-bold ${tone ?? 'text-default'}`}>{value}</span>
    </span>
  )
}
