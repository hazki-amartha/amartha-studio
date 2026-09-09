'use client'

// Sales — the BP's day as a board of task categories.
//
// The page opens on the KINDS of work waiting for her — Reactivation, POI
// Visit, 2nd Follow-up, Referral, 1st Follow-up — not on an alphabetical roster
// of everyone she has ever met. Each category names how many of its tasks are
// done against how many there are, shows a short stack of the ones still open,
// and offers "Lihat semua" for the full list. Search cuts across every category
// at once: type a name and the board collapses to just the matches, still
// grouped by the category each one belongs to.

import { useEffect, useState, type ReactNode } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { Check, Plus } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  LeadTaskCard,
  PoiTaskCard,
  TASK_CATEGORY_LABEL,
  buildTasks,
  dueTasks,
  setSelectedCategory,
  tallyByCategory,
  taskMatches,
  type SalesTask,
} from '../lib/tasks'
import { pipelineStore, setAddLeadEntry, usePipeline } from '../lib/pipeline-store'
import { store } from '../lib/store'
import { SourceSheet } from '../lib/pipeline-ui'
import { TabBar } from '../lib/tabs'
import { AppScreen, SearchField, VisitTitle } from '../lib/ui'

function SectionHeading({ children }: { children: ReactNode }) {
  return <span className="pt-4 text-16 font-bold text-default">{children}</span>
}

function SeeAllLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="self-center py-4 text-12 font-bold text-link underline"
    >
      Lihat semua {label}
    </button>
  )
}

export function SalesScreen() {
  const flow = useFlow()
  const { leads, order, flash } = usePipeline()
  const [query, setQuery] = useState('')
  // "Add lead" picks the source first, in a bottom sheet, then opens the form.
  const [addSourceOpen, setAddSourceOpen] = useState(false)

  // A confirmation banner raised by a submit / add / drop, shown once.
  useEffect(() => {
    if (flash) {
      const t = setTimeout(() => pipelineStore.clearFlash(), 4000)
      return () => clearTimeout(t)
    }
  }, [flash])

  const tasks = buildTasks(order.map((id) => leads[id]))
  // The board opens on what is due — today's tasks plus anything overdue; search
  // and "Lihat semua" reach across every task whatever its date.
  const due = dueTasks(tasks)
  const tallies = tallyByCategory(due)
  const totalByCategory = tallyByCategory(tasks)

  const q = query.trim()
  const searching = q.length > 0

  // One tap-target per task — a lead opens her follow-up, a POI opens its brief.
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

  const matches = searching ? tasks.filter((t) => taskMatches(t, q)) : []

  return (
    <AppScreen
      topBar={<NavigationHeader hideBack title={<VisitTitle title="Sales" when={`${due.length} tugas hari ini`} />} />}
    >
      {flash ? (
        <div className="flex items-center gap-8 rounded-12 border border-green-500 bg-green-50 px-12 py-12">
          <span className="shrink-0 text-green-500">
            <Check size={20} />
          </span>
          <span className="text-12 font-bold text-green-600">{flash}</span>
        </div>
      ) : null}

      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Cari nama lead atau POI"
        label="Cari nama lead atau POI"
      />

      {searching ? (
        // --- Search results: matches, grouped by their category --------------
        <div className="flex flex-col gap-8 pb-16">
          <span className="text-12 text-caption">
            {matches.length} hasil ditemukan
          </span>
          {matches.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-12 bg-neutral-white p-24 text-center">
              <span className="text-14 font-bold text-default">Tidak ada hasil</span>
              <span className="text-12 text-caption">Coba nama lead atau POI yang lain.</span>
            </div>
          ) : null}
          {tallies.map((cat) => {
            const inCat = matches.filter((t) => t.category === cat.category)
            if (inCat.length === 0) return null
            return (
              <div key={cat.category} className="flex flex-col gap-8">
                <SectionHeading>{TASK_CATEGORY_LABEL[cat.category]}</SectionHeading>
                {inCat.map(renderCard)}
              </div>
            )
          })}
        </div>
      ) : (
        // --- The board: one section per category -----------------------------
        <div className="flex flex-col gap-12 pb-16">
          {tallies.map((cat) => {
            const label = TASK_CATEGORY_LABEL[cat.category]
            // The count on the board is today's; the see-all total is everything
            // in the category, which is why the link so often reveals more.
            const allInCat = totalByCategory.find((c) => c.category === cat.category)
            return (
              <div key={cat.category} className="flex flex-col gap-8">
                <div className="flex items-baseline justify-between gap-8">
                  <span className="text-16 font-bold text-default">{label}</span>
                  <span className="shrink-0 text-12 text-caption">{cat.total} hari ini</span>
                </div>
                {cat.tasks.length === 0 ? (
                  <div className="rounded-12 bg-neutral-white px-12 py-16 text-center text-12 text-caption">
                    Tidak ada jadwal hari ini
                  </div>
                ) : (
                  cat.tasks.map(renderCard)
                )}
                <SeeAllLink
                  label={`${label}${allInCat && allInCat.total > 0 ? ` (${allInCat.total})` : ''}`}
                  onClick={() => {
                    setSelectedCategory(cat.category)
                    flow.go('task-list')
                  }}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Add lead is a floating action, bottom-right, above the nav. */}
      <TabBar
        active="sales"
        action={
          <Button size="sm" className="shadow-lg" onClick={() => setAddSourceOpen(true)}>
            <span className="flex items-center gap-4">
              <Plus size={16} />
              Add lead
            </span>
          </Button>
        }
      />

      {/* Source is picked here, before the form. */}
      <SourceSheet
        open={addSourceOpen}
        onClose={() => setAddSourceOpen(false)}
        onDone={(data) => {
          setAddSourceOpen(false)
          setAddLeadEntry({ mode: 'save', source: data, returnTo: 'sales', draft: null })
          flow.go('lead-new')
        }}
      />
    </AppScreen>
  )
}
