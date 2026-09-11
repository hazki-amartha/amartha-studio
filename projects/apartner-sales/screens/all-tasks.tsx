'use client'

// All task — every Sales task in one place, reached from the alt board's
// "All task" header link. Unlike the board (today's due tasks only), this lists
// them all, across every date, with a search box and a task-type filter.

import { useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import {
  LeadTaskCard,
  PoiTaskCard,
  TASK_CATEGORY_LABEL,
  TASK_CATEGORY_ORDER,
  buildTasks,
  tallyByCategory,
  taskMatches,
  type SalesTask,
  type TaskCategory,
} from '../lib/tasks'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { usePois } from '../lib/poi-store'
import { store, useApp } from '../lib/store'
import { TabBar } from '../lib/tabs'
import { AppScreen, Chip, FilterBar, SearchField } from '../lib/ui'

export function AllTasksScreen() {
  const flow = useFlow()
  const { leads, order } = usePipeline()
  const { completedPois, role } = useApp()
  const pois = usePois()
  const isBM = role === 'BM'
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<TaskCategory | null>(null)

  const tasks = buildTasks(order.map((id) => leads[id]), pois)
  const tallies = tallyByCategory(tasks)
  const q = query.trim()

  function openTask(task: SalesTask) {
    if (task.kind === 'lead') {
      pipelineStore.open(task.id)
      flow.go('follow-up')
    } else {
      store.openSosialisasi(task.id)
      flow.go('sosialisasi')
    }
  }

  function renderCard(task: SalesTask) {
    if (task.kind === 'lead') {
      return (
        <LeadTaskCard key={task.id} lead={task.lead} showPetugas={isBM} onOpen={() => openTask(task)} />
      )
    }
    return (
      <PoiTaskCard
        key={task.id}
        event={task.event}
        completed={completedPois.includes(task.id)}
        showPetugas={isBM}
        onOpen={() => openTask(task)}
      />
    )
  }

  // Each visible category, its tasks narrowed by the search box.
  const sections = tallies
    .filter((cat) => filter === null || cat.category === filter)
    .map((cat) => ({ category: cat.category, rows: cat.tasks.filter((t) => taskMatches(t, q)) }))
    .filter((s) => s.rows.length > 0)

  const total = sections.reduce((n, s) => n + s.rows.length, 0)

  return (
    <AppScreen topBar={<NavigationHeader title="Semua Sales" onBack={() => flow.back()} />}>
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Cari nama lead atau POI"
        label="Cari nama lead atau POI"
      />

      <FilterBar>
        <Chip selected={filter === null} onClick={() => setFilter(null)}>
          Semua
        </Chip>
        {TASK_CATEGORY_ORDER.map((c) => (
          <Chip key={c} selected={filter === c} onClick={() => setFilter(c)}>
            {TASK_CATEGORY_LABEL[c]}
          </Chip>
        ))}
      </FilterBar>

      <div className="flex flex-col gap-8 pb-16">
        {total === 0 ? (
          <div className="flex flex-col items-center gap-12 rounded-12 bg-neutral-white p-24 text-center">
            <div className="flex flex-col gap-4">
              <span className="text-14 font-bold text-default">Tidak ada hasil</span>
              <span className="text-12 text-caption">
                {q
                  ? 'Lead ini mungkin sudah jadi mitra. Coba cari di daftar Mitra.'
                  : 'Belum ada tugas untuk filter ini.'}
              </span>
            </div>
            {q ? (
              <Button size="sm" variant="outline" onClick={() => {}}>
                Search in Mitra list
              </Button>
            ) : null}
          </div>
        ) : (
          sections.map((s) => (
            <div key={s.category} className="flex flex-col gap-8">
              <span className="pt-4 text-16 font-bold text-default">
                {TASK_CATEGORY_LABEL[s.category]}
              </span>
              {s.rows.map(renderCard)}
            </div>
          ))
        )}
      </div>

      <TabBar active="sales" />
    </AppScreen>
  )
}
