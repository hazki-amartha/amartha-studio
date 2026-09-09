'use client'

// Semua Leads — the whole pipeline as one list, reached from the top bar of the
// Sales Option B board.
//
// The board answers "what am I doing this afternoon". This screen answers the
// other question a BP has, less often but urgently: "where is she?" — a name
// she remembers, a lead she is being asked about, work that is not due today
// and so does not appear on the board at all. So the schedule is dropped: every
// task is here, in one stream, newest deadline first, whatever day it falls on.
//
// The filter is the task category, because that is the same dimension the board
// is built from — the two screens disagree about the order of the work, not
// about what the work is. Each chip carries its own count, so the filter row is
// also the pipeline's shape; "Semua" is the default and always present, because
// a filter you cannot leave is a trap.

import { useState } from 'react'
import { NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import {
  TASK_CATEGORY_LABEL,
  TASK_CATEGORY_ORDER,
  buildTasks,
  leadScheduleLabel,
  overdueDays,
  poiScheduleLabel,
  taskMatches,
  type SalesTask,
  type TaskCategory,
} from '../lib/tasks'
import { addressLine, sourceDetail } from '../lib/pipeline'
import { BoardLeadCard, BoardPoiCard } from '../lib/task-card'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { store } from '../lib/store'
import { TabBar } from '../lib/tabs'
import { AppScreen, Chip, FilterBar, SearchField, VisitTitle } from '../lib/ui'

/** "Semua" plus one per category — the filter is a single choice, never none. */
type Filter = TaskCategory | 'all'

export function AllLeadsScreen() {
  const flow = useFlow()
  const { leads, order } = usePipeline()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const tasks = buildTasks(order.map((id) => leads[id]))
    // One stream, by deadline: overdue first, then today, then upcoming. The
    // board's grouping is exactly what this screen is dropping.
    .sort((a, b) => a.dueDays - b.dueDays)

  const countOf = (f: Filter) =>
    f === 'all' ? tasks.length : tasks.filter((t) => t.category === f).length

  const q = query.trim()
  const rows = tasks
    .filter((t) => filter === 'all' || t.category === filter)
    .filter((t) => taskMatches(t, q))

  function openTask(task: SalesTask) {
    if (task.kind === 'lead') {
      pipelineStore.open(task.id)
      flow.go('follow-up')
    } else {
      store.openSosialisasi(task.id)
      flow.go('sosialisasi')
    }
  }

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          onBack={flow.back}
          title={<VisitTitle title="Semua Leads" when={`${tasks.length} tugas di pipeline`} />}
        />
      }
    >
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Cari nama lead atau POI"
        label="Cari nama lead atau POI"
      />

      {/* The row scrolls sideways rather than wrapping: five categories plus
          "Semua" will never fit a phone, and a wrapped filter bar re-flows
          under the search field every time a count changes. */}
      <FilterBar>
        <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>
          Semua · {countOf('all')}
        </Chip>
        {TASK_CATEGORY_ORDER.map((category) => (
          <Chip
            key={category}
            selected={filter === category}
            onClick={() => setFilter(category)}
          >
            {TASK_CATEGORY_LABEL[category]} · {countOf(category)}
          </Chip>
        ))}
      </FilterBar>

      <div className="flex flex-col gap-8 pb-16">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-12 bg-neutral-white p-24 text-center">
            <span className="text-14 font-bold text-default">
              {q ? 'Tidak ada hasil' : 'Belum ada tugas'}
            </span>
            <span className="text-12 text-caption">
              {q
                ? 'Coba nama lead atau POI yang lain.'
                : 'Tugas kategori ini akan muncul di sini.'}
            </span>
          </div>
        ) : (
          rows.map((task) =>
            task.kind === 'lead' ? (
              <BoardLeadCard
                key={task.id}
                name={task.lead.name}
                schedule={leadScheduleLabel(task.lead.agenda)}
                late={overdueDays(task.lead.agenda)}
                source={sourceDetail(task.lead)}
                address={addressLine(task.lead.address)}
                onOpen={() => openTask(task)}
              />
            ) : (
              <BoardPoiCard
                key={task.id}
                title={task.event.title}
                schedule={poiScheduleLabel(task.event.agenda)}
                poiType={task.event.poiType}
                place={task.event.place}
                onOpen={() => openTask(task)}
              />
            ),
          )
        )}
      </div>

      <TabBar active="sales" />
    </AppScreen>
  )
}
