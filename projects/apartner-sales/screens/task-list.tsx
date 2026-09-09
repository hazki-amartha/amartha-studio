'use client'

// See all — the full list for one task category, reached from a "Lihat semua"
// link on the Sales board. It carries the same cards as the board, but every
// task in the category rather than a three-deep preview: the open ones first,
// then the ones already done. Its own search narrows the list by lead name.

import { useState } from 'react'
import { NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import {
  LeadTaskCard,
  PoiTaskCard,
  TASK_CATEGORY_LABEL,
  buildTasks,
  getSelectedCategory,
  tallyByCategory,
  taskMatches,
  type SalesTask,
} from '../lib/tasks'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { store } from '../lib/store'
import { TabBar } from '../lib/tabs'
import { AppScreen, SearchField, VisitTitle } from '../lib/ui'

export function TaskListScreen() {
  const flow = useFlow()
  const { leads, order } = usePipeline()
  const [query, setQuery] = useState('')

  const category = getSelectedCategory()
  const label = TASK_CATEGORY_LABEL[category]

  const tasks = buildTasks(order.map((id) => leads[id]))
  const cat = tallyByCategory(tasks).find((c) => c.category === category)
  // Every task in the category — today's first, later ones after (tally sorts).
  const ordered = cat ? cat.tasks : []

  const q = query.trim()
  const rows = q ? ordered.filter((t) => taskMatches(t, q)) : ordered

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
      return <LeadTaskCard key={task.id} lead={task.lead} onOpen={() => openTask(task)} />
    }
    return <PoiTaskCard key={task.id} event={task.event} onOpen={() => openTask(task)} />
  }

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          onBack={flow.back}
          title={<VisitTitle title={label} when={`${cat?.total ?? 0} tugas ${label.toLowerCase()}`} />}
        />
      }
    >
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Cari nama lead"
        label="Cari nama lead"
      />

      <div className="flex flex-col gap-8 pb-16">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-12 bg-neutral-white p-24 text-center">
            <span className="text-14 font-bold text-default">
              {q ? 'Tidak ada hasil' : 'Belum ada tugas'}
            </span>
            <span className="text-12 text-caption">
              {q ? 'Coba nama lead yang lain.' : 'Tugas kategori ini akan muncul di sini.'}
            </span>
          </div>
        ) : (
          rows.map(renderCard)
        )}
      </div>

      <TabBar active="sales" />
    </AppScreen>
  )
}
