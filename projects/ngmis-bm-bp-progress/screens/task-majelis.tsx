'use client'

// The bottom of the drill-down: one majelis visit, mitra by mitra.
//
// The reason column is the point of the whole prototype. It is not something the
// BM types after the fact — it is what the BP picked from a fixed list standing
// in front of the mitra, in A-Partner, at the moment the money did not arrive.
// A fixed list is also the only version anyone can count: five reasons across a
// branch is a finding, five hundred sentences is not.

import { useFlow } from '@/platform/runtime'
import { Badge } from '@/design-system/components'
import { BRANCH, bpById, n, rp } from '../lib/data'
import { kindLabel, majelisOutcome, taskById, tasksOf } from '../lib/tasks'
import { useSelection } from '../lib/store'
import { MisShell, PageHeading, Panel, PanelHeading, SimpleTable } from '../lib/ui'

export function TaskMajelisScreen() {
  const flow = useFlow()
  const { bpId, taskId } = useSelection()
  const bp = bpById(bpId ?? '')
  const task = taskById(bp.id, taskId ?? '') ?? tasksOf(bp).find((t) => t.kind === 'MV')

  if (!task) return null

  const room = majelisOutcome(task)
  const belum = room.mitra.filter((m) => m.bayar < m.tagihan)
  const tertagih = room.mitra.reduce((s, m) => s + m.bayar, 0)
  const tagihan = room.mitra.reduce((s, m) => s + m.tagihan, 0)

  return (
    <MisShell
      breadcrumbs={[
        { label: `Monitoring BP — ${BRANCH}`, onClick: () => flow.go('board') },
        { label: bp.name, onClick: () => flow.go('bp') },
        { label: task.title },
      ]}
      header={
        <PageHeading
          title={task.title}
          meta={`${kindLabel(task.kind)} · ${task.place} · ${task.time} · ${bp.name}`}
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
          <Figure label="Hadir" value={`${room.hadir} dari ${room.total} mitra`} />
          <Figure label="Tertagih" value={rp(tertagih)} />
          <Figure label="Tagihan minggu ini" value={rp(tagihan)} />
          <Figure label="Belum lunas" value={`${belum.length} mitra`} tone="text-red-500" />
        </div>
      </Panel>

      <Panel>
        <PanelHeading
          title="Mitra di majelis ini"
          subtitle="Alasan dan janji bayar diambil dari yang dicatat BP di A-Partner saat kunjungan, bukan dari laporan lisan."
        />
        <SimpleTable
          columns={[
            { id: 'nama', header: 'Mitra' },
            { id: 'tagihan', header: 'Tagihan', align: 'right' },
            { id: 'bayar', header: 'Dibayar', align: 'right' },
            { id: 'alasan', header: 'Alasan belum bayar' },
            { id: 'janji', header: 'Janji bayar' },
          ]}
          rows={room.mitra.map((m, i) => {
            const lunas = m.bayar >= m.tagihan
            return {
              id: `${m.name}-${i}`,
              cells: {
                nama: <span className="text-14 font-bold text-default">{m.name}</span>,
                tagihan: <span className="text-14 text-caption">Rp{n(m.tagihan)}</span>,
                bayar: (
                  <span className={`text-14 font-bold ${lunas ? 'text-default' : 'text-red-500'}`}>
                    {m.bayar > 0 ? `Rp${n(m.bayar)}` : '—'}
                  </span>
                ),
                alasan: lunas ? (
                  <Badge intent="green" variant="subtle" size="sm">
                    Lunas
                  </Badge>
                ) : (
                  <span className="text-14 text-default">{m.reason}</span>
                ),
                janji: lunas ? (
                  <span className="text-14 text-caption">—</span>
                ) : m.janji ? (
                  <span className="text-14 text-default">{m.janji}</span>
                ) : (
                  // A missing promise is the finding, not a blank: nobody
                  // agreed a next step, so nothing is scheduled to happen.
                  <span className="text-14 font-bold text-red-500">Tidak ada janji</span>
                ),
              },
            }
          })}
        />
      </Panel>
    </MisShell>
  )
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <span className="flex flex-col gap-4">
      <span className="text-12 text-caption">{label}</span>
      <span className={`text-20 font-bold ${tone ?? 'text-default'}`}>{value}</span>
    </span>
  )
}
