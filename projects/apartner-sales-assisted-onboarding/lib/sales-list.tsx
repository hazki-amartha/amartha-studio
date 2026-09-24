'use client'

// The Sales list — two related views over the same pipeline.
//
//   "Sales hari ini" (`today`) — a tabless sectioned board of what is due now:
//     Survey ongoing → Perkenalan majelis → POI visit → Follow up. Submitted and
//     approved surveys are NOT here — they carry no follow-up schedule, so they
//     live only on "Lihat semua". Each section is a panel with a grey header that
//     expands inline ("Lihat semua (N)" ⇄ "Tutup").
//
//   "Lihat semua" (`all`) — the full roster, on every date, behind a Leads ↔ POI
//     visit switch, with the Leads list filtered by funnel section (chips).

import { useState, type ReactNode } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { Plus } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  LeadBoardCard,
  PoiBoardCard,
  PoiTaskCard,
  agendaDueDays,
  buildTasks,
  dueTasks,
  onLeadsList,
  type SalesTask,
} from './tasks'
import {
  LEADS_SECTION_LABEL,
  LEADS_SECTION_ORDER,
  leadsSection,
  sourceDetail,
  type LeadsSection,
  type PipelineLead,
} from './pipeline'
import { pipelineStore, setAddLeadEntry, usePipeline } from './pipeline-store'
import { canDisburse, useFormation } from './formation'
import { usePois } from './poi-store'
import { store, useApp } from './store'
import { SourceSheet } from './pipeline-ui'
import { TabBar } from './tabs'
import { AppScreen, Chip, EmptyState, FilterBar, SearchField, VisitTitle } from './ui'

type MainTab = 'leads' | 'poi'
type Scope = 'today' | 'all'
type PoiTask = Extract<SalesTask, { kind: 'poi' }>

/** The Leads ↔ POI visit segmented switch — "Lihat semua" only. */
function SegmentedTabs({
  value,
  onChange,
  leadsCount,
  poiCount,
}: {
  value: MainTab
  onChange: (t: MainTab) => void
  leadsCount: number
  poiCount: number
}) {
  const items: { id: MainTab; label: string; count: number }[] = [
    { id: 'leads', label: 'Leads', count: leadsCount },
    { id: 'poi', label: 'POI visit', count: poiCount },
  ]
  return (
    <div className="flex gap-4 rounded-8 bg-neutral-200 p-4">
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-pressed={active}
            className={`flex flex-1 items-center justify-center gap-4 rounded-8 py-8 text-14 font-bold ${
              active ? 'bg-neutral-white text-primary-500 shadow-sm' : 'text-caption'
            }`}
          >
            <span>{item.label}</span>
            <span className={`text-12 ${active ? 'text-primary-500' : 'text-disabled'}`}>
              {item.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** One section panel: grey header (+ inline expand) over its rows. */
function SectionPanel({
  label,
  count,
  open,
  onToggle,
  children,
}: {
  label: string
  count: number
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-16 border border-default bg-neutral-white">
      <div className="flex items-center justify-between border-b border-default bg-neutral-50 px-12 py-12">
        <span className="text-16 font-bold text-default">{label}</span>
        {count > 1 ? (
          <button type="button" onClick={onToggle} className="shrink-0 text-12 font-bold text-link">
            {open ? 'Tutup' : `Lihat semua (${count})`}
          </button>
        ) : null}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}

export function SalesList({ scope }: { scope: Scope }) {
  const flow = useFlow()
  const { leads, order } = usePipeline()
  const { completedPois } = useApp()
  const formation = useFormation()
  const pois = usePois()
  const [mainTab, setMainTab] = useState<MainTab>('leads')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<LeadsSection | 'all'>('all')
  const [query, setQuery] = useState('')
  const [addSourceOpen, setAddSourceOpen] = useState(false)

  const q = query.trim().toLowerCase()
  const matchesQuery = (lead: PipelineLead) =>
    !q || lead.name.toLowerCase().includes(q) || sourceDetail(lead).toLowerCase().includes(q)
  const poiMatchesQuery = (t: PoiTask) =>
    !q || t.event.title.toLowerCase().includes(q) || t.event.poiType.toLowerCase().includes(q)

  const leadsAll = order.map((id) => leads[id]).filter(onLeadsList)
  const allPoiTasks = buildTasks([], pois).filter((t): t is PoiTask => t.kind === 'poi')

  // The section a lead shows in — approved splits into "Ready for disbursement"
  // (majelis settled) and "Waiting for group formation" (new majelis not formed).
  const displaySection = (l: PipelineLead): LeadsSection =>
    l.status === 'approved' && canDisburse(formation, l) ? 'ready-for-disbursement' : leadsSection(l)

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function openLead(lead: PipelineLead) {
    pipelineStore.open(lead.id)
    // Submitted / approved surveys are past follow-up management — they open the
    // Calon Mitra detail directly. Everyone else (including a Survey ongoing
    // lead) goes through the follow-up triage first: continue survey, ask for
    // more time, or drop.
    const direct = lead.status === 'survey-submitted' || lead.status === 'approved'
    flow.go(direct ? 'calon-mitra' : 'follow-up')
  }

  function openPoi(t: PoiTask) {
    store.openSosialisasi(t.id)
    flow.go('sosialisasi')
  }

  const addLead = (
    <Button size="sm" className="shadow-lg" onClick={() => setAddSourceOpen(true)}>
      <span className="flex items-center gap-4">
        <Plus size={16} />
        Add lead
      </span>
    </Button>
  )
  const sourceSheet = (
    <SourceSheet
      open={addSourceOpen}
      onClose={() => setAddSourceOpen(false)}
      onDone={(data) => {
        setAddSourceOpen(false)
        setAddLeadEntry({ mode: 'save', source: data, returnTo: 'sales', draft: null })
        flow.go(data.source === 'poi' ? 'poi-select' : 'lead-new')
      }}
    />
  )

  // ---------------------------------------------------------------- today ---
  if (scope === 'today') {
    // Only the active stages appear today; submitted and approved surveys have
    // no follow-up to do, so they wait on "Lihat semua". A follow-up must be due.
    const leadsToday = leadsAll.filter((l) => {
      const sec = leadsSection(l)
      // Submitted surveys are in underwriting — no BP action, so not on the board.
      if (sec === 'survey-submitted') return false
      // Survey ongoing is follow-up-managed too: only the ones due now show
      // today, so a "Butuh waktu lebih" reschedule moves her off the board.
      if (sec === 'follow-up' || sec === 'survey-ongoing') return agendaDueDays(l.agenda) <= 0
      // Survey approved (Ready for disbursement) is always an open task.
      return true
    })
    const poiToday = dueTasks(allPoiTasks) as PoiTask[]

    const leadRows = (sec: LeadsSection) =>
      leadsToday
        .filter((l) => displaySection(l) === sec && matchesQuery(l))
        .sort((a, b) => (a.agenda?.dueDays ?? 0) - (b.agenda?.dueDays ?? 0))
    const poiRows = poiToday.filter(poiMatchesQuery)

    type Section =
      | { key: string; label: string; kind: 'lead'; rows: PipelineLead[] }
      | { key: string; label: string; kind: 'poi'; rows: PoiTask[] }
    const sections: Section[] = [
      { key: 'ready-for-disbursement', label: LEADS_SECTION_LABEL['ready-for-disbursement'], kind: 'lead', rows: leadRows('ready-for-disbursement') },
      { key: 'survey-approved', label: LEADS_SECTION_LABEL['survey-approved'], kind: 'lead', rows: leadRows('survey-approved') },
      { key: 'survey-ongoing', label: LEADS_SECTION_LABEL['survey-ongoing'], kind: 'lead', rows: leadRows('survey-ongoing') },
      { key: 'poi', label: 'POI visit', kind: 'poi', rows: poiRows },
      { key: 'follow-up', label: LEADS_SECTION_LABEL['follow-up'], kind: 'lead', rows: leadRows('follow-up') },
    ]
    const visible = sections.filter((s) => s.rows.length > 0)
    const total = leadsToday.length + poiToday.length

    return (
      <AppScreen
        topBar={
          <NavigationHeader
            hideBack
            title={<VisitTitle title="Sales hari ini" when={`Total ${total} tugas hari ini`} />}
            link="Lihat semua"
            onLinkClick={() => flow.go('all-tasks')}
          />
        }
      >
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Cari nama lead atau POI"
          label="Cari nama lead atau POI"
        />

        <div className="flex flex-col gap-12 pb-16">
          {visible.length === 0 ? (
            <EmptyState
              title="Tidak ada tugas hari ini"
              body={q ? 'Tidak ada yang cocok dengan pencarian.' : 'Semua tugas hari ini sudah selesai.'}
            />
          ) : (
            visible.map((s) => {
              const isOpen = expanded.has(s.key)
              return (
                <SectionPanel
                  key={s.key}
                  label={s.label}
                  count={s.rows.length}
                  open={isOpen}
                  onToggle={() => toggle(s.key)}
                >
                  {s.kind === 'lead'
                    ? (isOpen ? s.rows : s.rows.slice(0, 1)).map((lead, i) => (
                        <LeadBoardCard
                          key={lead.id}
                          lead={lead}
                          divider={i > 0}
                          onOpen={() => openLead(lead)}
                        />
                      ))
                    : (isOpen ? s.rows : s.rows.slice(0, 1)).map((t, i) => (
                        <PoiBoardCard
                          key={t.id}
                          event={t.event}
                          completed={completedPois.includes(t.id)}
                          divider={i > 0}
                          onOpen={() => openPoi(t)}
                        />
                      ))}
                </SectionPanel>
              )
            })
          )}
        </div>

        <TabBar active="sales" action={addLead} />
        {sourceSheet}
      </AppScreen>
    )
  }

  // ------------------------------------------------------------------ all ---
  const poiVisible = allPoiTasks.filter(poiMatchesQuery)
  const sectionRank = (l: PipelineLead) => LEADS_SECTION_ORDER.indexOf(displaySection(l))
  const flatLeads = leadsAll
    .filter((l) => (filter === 'all' || displaySection(l) === filter) && matchesQuery(l))
    .sort((a, b) => sectionRank(a) - sectionRank(b) || (a.agenda?.dueDays ?? 0) - (b.agenda?.dueDays ?? 0))

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title={<VisitTitle title="Lihat semua" when={`${leadsAll.length} lead · ${allPoiTasks.length} POI`} />}
          onBack={() => flow.back()}
        />
      }
    >
      <SegmentedTabs
        value={mainTab}
        onChange={setMainTab}
        leadsCount={leadsAll.length}
        poiCount={allPoiTasks.length}
      />

      <SearchField
        value={query}
        onChange={setQuery}
        placeholder={mainTab === 'leads' ? 'Cari nama lead' : 'Cari POI'}
        label={mainTab === 'leads' ? 'Cari nama lead' : 'Cari POI'}
      />

      {mainTab === 'leads' ? (
        <>
          <FilterBar>
            <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>
              Semua
            </Chip>
            {LEADS_SECTION_ORDER.map((section) => (
              <Chip key={section} selected={filter === section} onClick={() => setFilter(section)}>
                {LEADS_SECTION_LABEL[section]}
              </Chip>
            ))}
          </FilterBar>
          <div className="flex flex-col gap-8 pb-16">
            {flatLeads.length === 0 ? (
              <EmptyState
                title="Belum ada lead"
                body={q ? 'Tidak ada lead yang cocok dengan pencarian.' : 'Belum ada lead untuk filter ini.'}
              />
            ) : (
              flatLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="overflow-hidden rounded-16 border border-default bg-neutral-white"
                >
                  <LeadBoardCard lead={lead} onOpen={() => openLead(lead)} />
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-8 pb-16">
          {poiVisible.length === 0 ? (
            <EmptyState
              title="Tidak ada POI"
              body={q ? 'Tidak ada POI yang cocok dengan pencarian.' : 'Belum ada sosialisasi terjadwal.'}
            />
          ) : (
            poiVisible.map((t) => (
              <PoiTaskCard
                key={t.id}
                event={t.event}
                completed={completedPois.includes(t.id)}
                onOpen={() => openPoi(t)}
              />
            ))
          )}
        </div>
      )}

      <TabBar active="sales" action={addLead} />
      {sourceSheet}
    </AppScreen>
  )
}
