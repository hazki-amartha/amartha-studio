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
import { Check, Plus, Sort } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  LeadTaskCard,
  PoiTaskCard,
  TASK_CATEGORY_LABEL,
  buildTasks,
  dueTasks,
  setSelectedCategory,
  tallyByCategory,
  taskDistanceKm,
  taskMatches,
  type SalesTask,
} from '../lib/tasks'
import { BottomSheet, SelectableCard } from '@/design-system/components'
import { CURRENT_FO, FIELD_OFFICERS } from '../lib/pipeline'
import { pipelineStore, setAddLeadEntry, usePipeline } from '../lib/pipeline-store'
import { usePois } from '../lib/poi-store'
import { store, useApp } from '../lib/store'
import { SourceSheet } from '../lib/pipeline-ui'
import { TabBar } from '../lib/tabs'
import { AppScreen, FilterChip, SearchField, VisitTitle } from '../lib/ui'

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
  const { leads, order, flash, completedToday } = usePipeline()
  const { completedPois, salesVariant, role } = useApp()
  const pois = usePois()
  const alt = salesVariant === 'alt'
  const isBM = role === 'BM'
  const [query, setQuery] = useState('')
  // "Add lead" picks the source first, in a bottom sheet, then opens the form.
  const [addSourceOpen, setAddSourceOpen] = useState(false)
  // BM "Add" first asks Lead or POI.
  const [addChoiceOpen, setAddChoiceOpen] = useState(false)
  // Alt: group the board by task type or by distance.
  const [grouping, setGrouping] = useState<'type' | 'distance'>('type')
  const [groupOpen, setGroupOpen] = useState(false)
  // BM: filter the board to one petugas (null = all).
  const [assignee, setAssignee] = useState<string | null>(null)
  const [assigneeOpen, setAssigneeOpen] = useState(false)
  // Alt only: which sections the BP has expanded past the first three.
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const byDistance = alt && grouping === 'distance'

  // A confirmation banner raised by a submit / add / drop, shown once.
  useEffect(() => {
    if (flash) {
      const t = setTimeout(() => pipelineStore.clearFlash(), 4000)
      return () => clearTimeout(t)
    }
  }, [flash])

  const allTasks = buildTasks(order.map((id) => leads[id]), pois)
  const taskFo = (t: SalesTask) => (t.kind === 'lead' ? t.lead.fo : t.event.fo)
  // BM can narrow the board to one petugas; otherwise every task shows.
  const tasks = isBM && assignee ? allTasks.filter((t) => taskFo(t) === assignee) : allTasks
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
    const distanceKm = byDistance ? taskDistanceKm(task) : undefined
    if (task.kind === 'lead') {
      return (
        <LeadTaskCard
          key={task.id}
          lead={task.lead}
          showPetugas={isBM}
          distanceKm={distanceKm}
          onOpen={() => openTask(task)}
        />
      )
    }
    return (
      <PoiTaskCard
        key={task.id}
        event={task.event}
        completed={completedPois.includes(task.id)}
        showPetugas={isBM}
        distanceKm={distanceKm}
        onOpen={() => openTask(task)}
      />
    )
  }

  const matches = searching ? tasks.filter((t) => taskMatches(t, q)) : []

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          hideBack
          title={<VisitTitle title={alt ? 'Sales hari ini' : 'Sales'} when={`${due.length} tugas hari ini`} />}
          link={alt ? 'All task' : undefined}
          onLinkClick={alt ? () => flow.go('all-tasks') : undefined}
        />
      }
    >
      {flash ? (
        <div className="flex items-center gap-8 rounded-12 border border-green-500 bg-green-50 px-12 py-12">
          <span className="shrink-0 text-green-500">
            <Check size={20} />
          </span>
          <span className="text-12 font-bold text-green-600">{flash}</span>
        </div>
      ) : null}

      {/* Search, and (alt) a grouping toggle to its right. */}
      <div className="flex items-center gap-8">
        <div className="min-w-0 flex-1">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Cari nama lead atau POI"
            label="Cari nama lead atau POI"
          />
        </div>
        {alt ? (
          <button
            type="button"
            aria-label="Urutkan"
            onClick={() => setGroupOpen(true)}
            className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-8 border ${
              byDistance ? 'border-primary-500 text-primary-500' : 'border-default text-default'
            }`}
          >
            <Sort size={20} />
          </button>
        ) : null}
      </div>

      {/* BM: filter the board to one petugas. */}
      {isBM ? (
        <div className="flex">
          <FilterChip
            label={assignee ? `Petugas: ${assignee}` : 'Semua petugas'}
            active={Boolean(assignee)}
            open={assigneeOpen}
            onClick={() => setAssigneeOpen(true)}
          />
        </div>
      ) : null}

      {searching ? (
        // --- Search results: matches, grouped by their category --------------
        <div className="flex flex-col gap-8 pb-16">
          <span className="text-12 text-caption">
            {matches.length} hasil ditemukan
          </span>
          {matches.length === 0 ? (
            <div className="flex flex-col items-center gap-12 rounded-12 bg-neutral-white p-24 text-center">
              <div className="flex flex-col gap-4">
                <span className="text-14 font-bold text-default">Tidak ada hasil</span>
                <span className="text-12 text-caption">
                  Lead ini mungkin sudah jadi mitra. Coba cari di daftar Mitra.
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={() => {}}>
                Search in Mitra list
              </Button>
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
      ) : byDistance ? (
        // --- The board, one flat list sorted by distance (nearest first) -----
        <div className="flex flex-col gap-8 pb-16">
          {due.length === 0 ? (
            <div className="rounded-12 bg-neutral-white px-12 py-16 text-center text-12 text-caption">
              Tidak ada tugas hari ini
            </div>
          ) : (
            due
              .slice()
              .sort((a, b) => taskDistanceKm(a) - taskDistanceKm(b))
              .map(renderCard)
          )}
        </div>
      ) : (
        // --- The board: one section per category -----------------------------
        <div className="flex flex-col gap-12 pb-16">
          {tallies.map((cat) => {
            const label = TASK_CATEGORY_LABEL[cat.category]
            // The count on the board is today's; the see-all total is everything
            // in the category, which is why the link so often reveals more.
            const allInCat = totalByCategory.find((c) => c.category === cat.category)
            // POI-visit keeps its finished cards on the board (they read "Belum
            // ada jadwal"), so its "done" is those completed POIs and its total
            // is already the full set. Lead categories lose finished cards off
            // the board, so their done is tallied and added back to the total.
            const isPoi = cat.category === 'poi-visit'
            const done = isPoi
              ? cat.tasks.filter((t) => t.kind === 'poi' && completedPois.includes(t.id)).length
              : completedToday[cat.category] ?? 0
            const dayTotal = isPoi ? cat.total : done + cat.total
            // Alt expands the rest inline; default caps at three and links out.
            const isExpanded = expanded.has(cat.category)
            const shown = alt && isExpanded ? cat.tasks : cat.tasks.slice(0, 3)
            return (
              <div key={cat.category} className="flex flex-col gap-8">
                <div className="flex items-baseline justify-between gap-8">
                  <span className="text-16 font-bold text-default">{label}</span>
                  <span className="shrink-0 text-12 text-caption">
                    {done} dari {dayTotal} tugas selesai
                  </span>
                </div>
                {cat.tasks.length === 0 ? (
                  <div className="rounded-12 bg-neutral-white px-12 py-16 text-center text-12 text-caption">
                    {dayTotal > 0 ? 'Semua tugas hari ini selesai!' : 'Tidak ada jadwal hari ini'}
                  </div>
                ) : (
                  shown.map(renderCard)
                )}
                {alt ? (
                  // "See more" expands the rest of today's tasks inline (>3 only).
                  cat.tasks.length > 3 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((prev) => {
                          const next = new Set(prev)
                          if (next.has(cat.category)) next.delete(cat.category)
                          else next.add(cat.category)
                          return next
                        })
                      }
                      className="self-center py-4 text-12 font-bold text-link underline"
                    >
                      {isExpanded ? 'See less' : `See more (${cat.tasks.length - 3})`}
                    </button>
                  ) : null
                ) : (
                  <SeeAllLink
                    label={`${label}${allInCat && allInCat.total > 0 ? ` (${allInCat.total})` : ''}`}
                    onClick={() => {
                      setSelectedCategory(cat.category)
                      flow.go('task-list')
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* A floating action, bottom-right, above the nav. BP adds a lead; BM
          chooses lead or POI first. */}
      <TabBar
        active="sales"
        action={
          <Button
            size="sm"
            className="shadow-lg"
            onClick={() => (isBM ? setAddChoiceOpen(true) : setAddSourceOpen(true))}
          >
            <span className="flex items-center gap-4">
              <Plus size={16} />
              {isBM ? 'Add' : 'Add lead'}
            </span>
          </Button>
        }
      />

      {/* BM: add a lead or a POI. */}
      <BottomSheet open={addChoiceOpen} onClose={() => setAddChoiceOpen(false)} title="Tambah">
        <div className="flex flex-col gap-8">
          <button
            type="button"
            onClick={() => {
              setAddChoiceOpen(false)
              setAddSourceOpen(true)
            }}
            className="flex flex-col gap-2 rounded-12 border border-default bg-neutral-white p-16 text-left active:bg-neutral-50"
          >
            <span className="text-14 font-bold text-default">Add Lead</span>
            <span className="text-12 text-caption">Catat calon mitra baru</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAddChoiceOpen(false)
              flow.go('poi-new')
            }}
            className="flex flex-col gap-2 rounded-12 border border-default bg-neutral-white p-16 text-left active:bg-neutral-50"
          >
            <span className="text-14 font-bold text-default">Add POI</span>
            <span className="text-12 text-caption">Daftarkan titik sosialisasi baru</span>
          </button>
        </div>
      </BottomSheet>

      {/* Alt: sort the board by group (task type) or by distance (flat list). */}
      <BottomSheet open={groupOpen} onClose={() => setGroupOpen(false)} title="Urutkan berdasarkan">
        <div className="flex flex-col gap-8">
          <SelectableCard
            name="grouping"
            inputType="radio"
            title="Grup"
            description="Dikelompokkan per tipe tugas"
            checked={grouping === 'type'}
            onChange={() => {
              setGrouping('type')
              setExpanded(new Set())
              setGroupOpen(false)
            }}
          />
          <SelectableCard
            name="grouping"
            inputType="radio"
            title="Jarak"
            description="Satu daftar, terdekat lebih dulu"
            checked={grouping === 'distance'}
            onChange={() => {
              setGrouping('distance')
              setExpanded(new Set())
              setGroupOpen(false)
            }}
          />
        </div>
      </BottomSheet>

      {/* BM: pick which petugas to filter the board by. */}
      <BottomSheet open={assigneeOpen} onClose={() => setAssigneeOpen(false)} title="Pilih petugas">
        <div className="flex flex-col gap-8">
          <SelectableCard
            name="assignee"
            inputType="radio"
            title="Semua petugas"
            checked={assignee === null}
            onChange={() => {
              setAssignee(null)
              setAssigneeOpen(false)
            }}
          />
          {FIELD_OFFICERS.map((f) => (
            <SelectableCard
              key={f}
              name="assignee"
              inputType="radio"
              title={f === CURRENT_FO ? `${f} (saya)` : f}
              checked={assignee === f}
              onChange={() => {
                setAssignee(f)
                setAssigneeOpen(false)
              }}
            />
          ))}
        </div>
      </BottomSheet>

      {/* Source is picked here, before the form. POI Visit sends the BP to a
          dedicated page to choose which POI; the others go straight to the form. */}
      <SourceSheet
        open={addSourceOpen}
        onClose={() => setAddSourceOpen(false)}
        onDone={(data) => {
          setAddSourceOpen(false)
          setAddLeadEntry({ mode: 'save', source: data, returnTo: 'sales', draft: null })
          flow.go(data.source === 'poi' ? 'poi-select' : 'lead-new')
        }}
      />
    </AppScreen>
  )
}
