'use client'

// Tugas — the BP's task page (the "Tugas" bottom-nav tab), structured after the
// A-Partner BP New Concept schedule: a two-line date header, "Tipe / Status"
// filter chips, and a single flat list split only by "Belum selesai / Selesai"
// — no per-task-type section headings. A colour-coded 40px tile leads each card
// (GF group formation, PA penerimaan anggota), the kind + clock over a status
// badge, then the title and a subtitle.
//
// Group Formation tapping asks the gate question first ("Semua calon mitra sudah
// berkumpul?"): yes opens the formation wizard; not yet reschedules to next
// week. Penerimaan Anggota opens the acceptance flow directly.

import { useState, type ReactNode } from 'react'
import { Badge, BottomSheet, Button } from '@/design-system/components'
import { ChevronDown } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { dateFromToday } from '../lib/pipeline'
import {
  GROUP_FORMATION_TASKS,
  PENERIMAAN_TASKS,
  groupTaskStore,
  useGroupTasks,
  type GroupFormationTask,
  type PenerimaanTask,
} from '../lib/group-tasks'
import { isLeadAccepted, isMajelisActivated, setFormation, useFormation } from '../lib/formation'
import { store } from '../lib/store'
import { TabBar } from '../lib/tabs'
import { AppScreen, EmptyState, FilterBar, FilterChip, OptionSheet } from '../lib/ui'

// The prototype's "today" is a fixed demo date (21 Juli 2026 — see pipeline.ts).
const HEADER_DATE = 'Selasa, 21 Juli'

type BadgeIntent = 'orange' | 'neutral' | 'blue'

/** One task, flattened so group-formation and penerimaan render as one list. */
interface TaskRow {
  id: string
  code: string
  /** The task type, for the "Tipe tugas" filter. */
  kind: string
  /** The caption line: "Group Formation · 10.00". */
  kindLine: string
  title: string
  subtitle?: string
  status: string
  statusIntent: BadgeIntent
  done: boolean
  /** Undefined for a rescheduled or finished task — the card is not tappable. */
  onOpen?: () => void
}

/** The small caps section label — the BP New Concept "Overline". */
function Overline({ children }: { children: ReactNode }) {
  return <div className="text-10 font-bold uppercase text-caption">{children}</div>
}

function TaskCard({ row }: { row: TaskRow }) {
  const body = (
    <>
      <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-primary-50 text-12 font-bold text-primary-500">
        {row.code}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <span className="flex items-center gap-8">
          <span className="min-w-0 flex-1 truncate text-14 font-regular text-caption">
            {row.kindLine}
          </span>
          <Badge intent={row.done ? 'blue' : row.statusIntent}>
            {row.done ? 'Selesai' : row.status}
          </Badge>
        </span>
        <span className="text-16 font-bold text-default">{row.title}</span>
        {row.subtitle ? (
          <span className="truncate text-12 font-regular text-caption">{row.subtitle}</span>
        ) : null}
      </div>
    </>
  )

  // A rescheduled or finished task is a record, not an action — dashed & flat.
  if (!row.onOpen) {
    return (
      <div className="flex w-full items-start gap-12 rounded-12 border border-dashed border-default bg-neutral-white p-12">
        {body}
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={row.onOpen}
      className="flex w-full items-start gap-12 rounded-12 border border-default bg-neutral-white p-12 text-left active:bg-neutral-50"
    >
      {body}
    </button>
  )
}

export function TugasScreen() {
  const flow = useFlow()
  const { rescheduled } = useGroupTasks()
  const formation = useFormation()
  const [gate, setGate] = useState<GroupFormationTask | null>(null)
  const [filter, setFilter] = useState<'type' | 'status' | null>(null)
  const [typeF, setTypeF] = useState('all')
  const [statusF, setStatusF] = useState('all')

  function startActivation(task: GroupFormationTask) {
    setGate(null)
    setFormation({ mode: 'form', majelisName: `Majelis ${task.majelisName}`, memberCount: task.memberCount })
    flow.go('group-formation')
  }

  function skipTask(task: GroupFormationTask) {
    setGate(null)
    groupTaskStore.reschedule(task.id, dateFromToday(7))
  }

  // Accepting new members runs the acceptance flow (group-formation in `accept`
  // mode). Point the majelis page at this group so the finish lands on it.
  function openPenerimaan(task: PenerimaanTask) {
    store.openMajelisPage({ kind: 'existing', id: task.majelisId })
    setFormation({
      mode: 'accept',
      majelisName: task.majelisName,
      memberIds: task.memberIds,
      memberNames: task.memberNames,
    })
    flow.go('group-formation')
  }

  // Flatten both task kinds into one list of rows.
  const rows: TaskRow[] = [
    ...GROUP_FORMATION_TASKS.map((task): TaskRow => {
      const movedTo = rescheduled[task.id]
      const done = isMajelisActivated(formation, `Majelis ${task.majelisName}`)
      return {
        id: task.id,
        code: 'GF',
        kind: 'Pembentukan Majelis',
        kindLine: `Group Formation · ${task.time}`,
        title: `Majelis ${task.majelisName}`,
        subtitle: movedTo ? `Dipindah ke ${movedTo}` : `${task.memberCount} anggota disetujui`,
        status: movedTo ? 'Dijadwalkan ulang' : 'Belum mulai',
        statusIntent: movedTo ? 'neutral' : 'orange',
        done,
        onOpen: done || movedTo ? undefined : () => setGate(task),
      }
    }),
    ...PENERIMAAN_TASKS.map((task): TaskRow => {
      const done = task.memberIds.every((id) => isLeadAccepted(formation, id))
      return {
        id: task.id,
        code: 'PA',
        kind: 'Penerimaan Anggota',
        kindLine: `Penerimaan anggota · ${task.time}`,
        title: task.majelisName,
        subtitle: `${task.memberNames.length} anggota baru: ${task.memberNames.join(', ')}`,
        status: 'Belum mulai',
        statusIntent: 'orange',
        done,
        onOpen: done ? undefined : () => openPenerimaan(task),
      }
    }),
  ]

  const doneCount = rows.filter((r) => r.done).length
  const byType = (r: TaskRow) => typeF === 'all' || r.kind === typeF
  const byStatus = (r: TaskRow) => statusF === 'all' || r.status === statusF
  const openRows = rows.filter((r) => !r.done && byType(r) && byStatus(r))
  const doneRows = rows.filter((r) => r.done && byType(r))

  const TYPE_OPTIONS = [
    { label: 'Semua tipe', value: 'all' },
    { label: 'Pembentukan Majelis', value: 'Pembentukan Majelis' },
    { label: 'Penerimaan Anggota', value: 'Penerimaan Anggota' },
  ]
  const STATUS_OPTIONS = [
    { label: 'Semua status', value: 'all' },
    { label: 'Belum mulai', value: 'Belum mulai' },
    { label: 'Dijadwalkan ulang', value: 'Dijadwalkan ulang' },
  ]

  const header = (
    <header className="flex shrink-0 items-center gap-8 bg-neutral-white px-16 py-8">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-4 text-16 font-bold text-default">
          {HEADER_DATE}
          <ChevronDown size={20} />
        </span>
        <span className="text-12 font-regular text-caption">
          {doneCount} dari {rows.length} selesai
        </span>
      </div>
    </header>
  )

  return (
    <AppScreen topBar={header}>
      <FilterBar>
        <FilterChip
          label={typeF === 'all' ? 'Tipe tugas' : typeF}
          active={typeF !== 'all'}
          open={filter === 'type'}
          onClick={() => setFilter(filter === 'type' ? null : 'type')}
        />
        <FilterChip
          label={statusF === 'all' ? 'Status tugas' : statusF}
          active={statusF !== 'all'}
          open={filter === 'status'}
          onClick={() => setFilter(filter === 'status' ? null : 'status')}
        />
      </FilterBar>

      {openRows.length === 0 && doneRows.length === 0 ? (
        <EmptyState title="Tidak ada tugas" body="Tidak ada tugas untuk filter ini." />
      ) : (
        <>
          {openRows.length > 0 ? (
            <>
              <Overline>Belum selesai</Overline>
              <div className="flex flex-col gap-8">
                {openRows.map((row) => (
                  <TaskCard key={row.id} row={row} />
                ))}
              </div>
            </>
          ) : null}
          {doneRows.length > 0 ? (
            <>
              <Overline>Selesai</Overline>
              <div className="flex flex-col gap-8 pb-16">
                {doneRows.map((row) => (
                  <TaskCard key={row.id} row={row} />
                ))}
              </div>
            </>
          ) : null}
        </>
      )}

      {/* The gate: is the group actually here? */}
      <BottomSheet
        open={Boolean(gate)}
        onClose={() => setGate(null)}
        title="Semua calon mitra sudah berkumpul?"
      >
        <div className="flex flex-col gap-8">
          <Button size="lg" className="w-full" onClick={() => gate && startActivation(gate)}>
            Ya, mulai aktifkan majelis
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => gate && skipTask(gate)}
          >
            Belum, lewati tugas
          </Button>
          <span className="text-center text-12 text-caption">
            Tugas akan dijadwalkan ulang otomatis ke minggu depan.
          </span>
        </div>
      </BottomSheet>

      <OptionSheet
        open={filter === 'type'}
        title="Tipe tugas"
        name="tugas-tipe"
        options={TYPE_OPTIONS}
        value={typeF}
        onPick={(v) => {
          setTypeF(v)
          setFilter(null)
        }}
        onClose={() => setFilter(null)}
      />
      <OptionSheet
        open={filter === 'status'}
        title="Status tugas"
        name="tugas-status"
        options={STATUS_OPTIONS}
        value={statusF}
        onPick={(v) => {
          setStatusF(v)
          setFilter(null)
        }}
        onClose={() => setFilter(null)}
      />

      <TabBar active="today" />
    </AppScreen>
  )
}
