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

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BottomSheet, Button, NavigationHeader } from '@/design-system/components'
import { Check, CheckCircle, Plus, Sliders } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  BmValidationCard,
  LeadBoardCard,
  PoiBoardCard,
  PoiTaskCard,
  agendaDueDays,
  buildTasks,
  dueTasks,
  onLeadsList,
  type CardNote,
  type SalesTask,
} from './tasks'
import {
  LEADS_SECTION_LABEL,
  detailScreen,
  leadsSection,
  sourceDetail,
  type LeadsSection,
  type PipelineLead,
} from './pipeline'
import { pipelineStore, setAddLeadEntry, usePipeline } from './pipeline-store'
import { canDisburse, useFormation } from './formation'
import { usePois } from './poi-store'
import { store, useApp } from './store'
import { SOFT_REJECT_CASES, type SoftRejectCase } from './validasi'
import { useValidasiAll, validasiStore } from './validasi-store'
import { SourceSheet } from './pipeline-ui'
import { TabBar } from './tabs'
import { AppScreen, EmptyState, SearchField, VisitTitle } from './ui'

type MainTab = 'leads' | 'poi'
type Scope = 'today' | 'all'
type PoiTask = Extract<SalesTask, { kind: 'poi' }>

// Sales hari ini regroups the detailed sections into a few groups; a per-lead
// note differentiates the sub-types that share one group.
const TODAY_GROUPS: { key: string; label: string; secs: LeadsSection[] }[] = [
  {
    key: 'ready-to-disburse',
    label: 'Ready to disburse',
    secs: ['ready-for-disbursement', 'survey-approved'],
  },
  {
    key: 'waiting-approval',
    label: 'Waiting for approval',
    secs: ['need-resubmit', 'pending-bm-validation', 'survey-submitted'],
  },
  { key: 'survey-ongoing', label: 'Complete onboarding', secs: ['survey-ongoing'] },
  { key: 'reactivation', label: 'Reaktivasi & lanjutan', secs: ['reactivation'] },
  { key: 'starting-onboarding', label: 'Start onboarding', secs: ['starting-onboarding'] },
  { key: 'follow-up', label: 'Follow up', secs: ['follow-up'] },
]

const CARD_NOTE: Partial<Record<LeadsSection, CardNote>> = {
  'survey-approved': { text: 'Waiting for group formation', tone: 'orange' },
  'need-resubmit': { text: 'Need to resubmit UK', tone: 'orange' },
  'pending-bm-validation': { text: 'Need BM Review', tone: 'orange' },
  'survey-submitted': { text: 'Application in process', tone: 'blue' },
}

// "Jenis tugas" filter order — the lead's journey top-to-bottom, then the
// needs-attention exceptions grouped at the end (distinct from the board's
// funnel order, which leads with what's closest to disbursing).
const JENIS_ORDER: LeadsSection[] = [
  'follow-up',
  'starting-onboarding',
  'survey-ongoing',
  'reactivation',
  'survey-submitted',
  'survey-approved',
  'ready-for-disbursement',
  'need-resubmit',
  'pending-bm-validation',
  'survey-rejected',
]

// "Sumber" filter — where the lead came from (a cold reactivation counts too).
type Sumber = 'sosialisasi' | 'reaktivasi' | 'rujukan' | 'pencarian'
const SUMBER_OPTIONS: { key: Sumber; label: string }[] = [
  { key: 'sosialisasi', label: 'Sosialisasi' },
  { key: 'reaktivasi', label: 'Reaktivasi' },
  { key: 'rujukan', label: 'Rujukan' },
  { key: 'pencarian', label: 'Pencarian sendiri' },
]
function sumberOf(lead: PipelineLead): Sumber {
  // A reactivating ex-mitra counts as her own source, whatever brought her back.
  if (lead.reactivation) return 'reaktivasi'
  return lead.source === 'referral' ? 'rujukan' : lead.source === 'canvassing' ? 'pencarian' : 'sosialisasi'
}

/** A checkbox row for the Filter sheet. */
function CheckRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="flex items-center gap-12 py-8 text-left">
      <span
        className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-8 border-2 ${
          checked ? 'border-primary-500 bg-primary-500 text-neutral-white' : 'border-neutral-200'
        }`}
      >
        {checked ? <Check size={16} /> : null}
      </span>
      <span className="text-16 text-default">{label}</span>
    </button>
  )
}

/** A radio row for the Filter sheet. */
function RadioRow({ label, checked, onSelect }: { label: string; checked: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className="flex items-center gap-12 py-8 text-left">
      <span
        className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 ${
          checked ? 'border-primary-500' : 'border-neutral-200'
        }`}
      >
        {checked ? <span className="h-12 w-12 rounded-full bg-primary-500" /> : null}
      </span>
      <span className="text-16 text-default">{label}</span>
    </button>
  )
}

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
    { id: 'poi', label: 'Sosialisasi', count: poiCount },
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
  const { leads, order, flash } = usePipeline()
  const { completedPois, role } = useApp()
  const validasiAll = useValidasiAll()
  const formation = useFormation()
  const pois = usePois()

  // The Sales snackbar auto-dismisses; tapping its action opens the mitra's
  // Majelis page.
  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => pipelineStore.clearFlash(), 8000)
    return () => clearTimeout(t)
  }, [flash])

  function openMajelisFromFlash(leadId: string) {
    const lead = leads[leadId]
    pipelineStore.open(leadId)
    if (lead?.majelis.kind === 'existing') store.openMajelisPage({ kind: 'existing', id: lead.majelis.id })
    else if (lead?.majelis.kind === 'new') store.openMajelisPage({ kind: 'draft', name: lead.majelis.name })
    else store.openMajelisPage(null)
    pipelineStore.clearFlash()
    flow.go('majelis-page')
  }

  const snackbar = flash ? (
    <div
      className={`sticky bottom-16 z-10 mx-4 flex items-center gap-8 rounded-12 px-12 py-12 shadow-lg ${
        flash.tone === 'success' ? 'bg-green-500 text-neutral-white' : 'bg-neutral-800 text-neutral-white'
      }`}
    >
      {flash.tone === 'success' ? (
        <span className="shrink-0">
          <CheckCircle size={20} />
        </span>
      ) : null}
      <span className="min-w-0 flex-1 text-12">
        {flash.text}
        {flash.action ? (
          <>
            {' '}
            <button
              type="button"
              onClick={() => {
                if (!flash.action) return
                const { leadId, view } = flash.action
                if (view === 'lead') {
                  const l = leads[leadId]
                  pipelineStore.clearFlash()
                  if (l) openLead(l)
                } else openMajelisFromFlash(leadId)
              }}
              className="font-bold underline"
            >
              {flash.action.label}
            </button>
          </>
        ) : null}
      </span>
    </div>
  ) : null
  const [mainTab, setMainTab] = useState<MainTab>('leads')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  // Lihat semua filter/sort — applied values + the sheet's draft.
  const [filterOpen, setFilterOpen] = useState(false)
  const [jenis, setJenis] = useState<Set<LeadsSection>>(new Set())
  const [sumber, setSumber] = useState<Set<Sumber>>(new Set())
  const [sortDir, setSortDir] = useState<'akhir' | 'awal'>('awal')
  const [jenisDraft, setJenisDraft] = useState<Set<LeadsSection>>(new Set())
  const [sumberDraft, setSumberDraft] = useState<Set<Sumber>>(new Set())
  const [sortDraft, setSortDraft] = useState<'akhir' | 'awal'>('awal')
  // POI tab filter/sort — "Belum ada jadwal" + date sort.
  const [poiNoSched, setPoiNoSched] = useState(false)
  const [poiSort, setPoiSort] = useState<'akhir' | 'awal'>('awal')
  const [poiNoSchedDraft, setPoiNoSchedDraft] = useState(false)
  const [poiSortDraft, setPoiSortDraft] = useState<'akhir' | 'awal'>('awal')
  // The filter drawer's active left-rail category (follows the right scroll).
  const [filterCat, setFilterCat] = useState('jenis')
  const rightPaneRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
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
    // Still finalising the persetujuan — reopen that flow.
    if (lead.startingOnboarding) {
      flow.go('onboarding-start')
      return
    }
    // A reactivating ex-mitra: a plain reactivation starts at the registration
    // approval (Persetujuan pendaftaran) and then flows into the survey; a renewal
    // lands straight on Complete onboarding (her majelis is already settled).
    if (lead.reactivation) {
      flow.go(lead.reactivation.kind === 'renewal' ? detailScreen(lead) : 'onboarding-start')
      return
    }
    // A survey-ongoing lead (survey-created, -submitted) or an approved one opens
    // the Calon Mitra detail directly (survey ongoing → 'calon-mitra', a result →
    // 'onboarding-outcome'); only a pre-survey lead goes through follow-up triage.
    const inDetail =
      lead.status === 'survey-created' ||
      lead.status === 'survey-submitted' ||
      lead.status === 'approved'
    flow.go(inDetail ? detailScreen(lead) : 'follow-up')
  }

  function openPoi(t: PoiTask) {
    store.openSosialisasi(t.id)
    flow.go('sosialisasi')
  }

  function openBmValidation(c: SoftRejectCase) {
    validasiStore.open(c.id)
    flow.go('validasi-mitra')
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
      const sec = displaySection(l)
      // A hard reject is not today's work — it waits on "Lihat semua".
      if (sec === 'survey-rejected') return false
      // Survey ongoing / reactivation / follow-up are date-managed: only the ones
      // due now show.
      if (sec === 'follow-up' || sec === 'survey-ongoing' || sec === 'reactivation')
        return agendaDueDays(l.agenda) <= 0
      // Everything else (Ready to disburse + Waiting for approval groups) is an
      // open task for today.
      return true
    })
    const poiToday = dueTasks(allPoiTasks) as PoiTask[]

    // Rows for a group — all its sub-sections, kept in the group's own order.
    const groupRows = (secs: LeadsSection[]) =>
      leadsToday
        .filter((l) => secs.includes(displaySection(l)) && matchesQuery(l))
        .sort(
          (a, b) =>
            secs.indexOf(displaySection(a)) - secs.indexOf(displaySection(b)) ||
            (a.agenda?.dueDays ?? 0) - (b.agenda?.dueDays ?? 0),
        )
    const poiRows = poiToday.filter(poiMatchesQuery)
    // BM only, and only the ones she hasn't decided yet — a second entry point
    // onto the same 3-step flow the Tugas card opens (see validasi.ts /
    // validasi-store). Each case leaves the board independently once decided.
    const bmRows =
      role === 'BM'
        ? SOFT_REJECT_CASES.filter(
            (c) => !validasiAll[c.id]?.submitted && (!q || c.name.toLowerCase().includes(q)),
          )
        : []

    type Section =
      | { key: string; label: string; kind: 'lead'; rows: PipelineLead[] }
      | { key: string; label: string; kind: 'poi'; rows: PoiTask[] }
      | { key: string; label: string; kind: 'bm-validation'; rows: typeof bmRows }
    const group = (key: string) => TODAY_GROUPS.find((g) => g.key === key)!
    const readyGroup = group('ready-to-disburse')
    const waitingGroup = group('waiting-approval')
    const surveyGroup = group('survey-ongoing')
    const reactivationGroup = group('reactivation')
    const startingGroup = group('starting-onboarding')
    const followGroup = group('follow-up')
    const sections: Section[] = [
      { key: 'bm-validation', label: 'BM Validation', kind: 'bm-validation', rows: bmRows },
      { key: readyGroup.key, label: readyGroup.label, kind: 'lead', rows: groupRows(readyGroup.secs) },
      { key: waitingGroup.key, label: waitingGroup.label, kind: 'lead', rows: groupRows(waitingGroup.secs) },
      { key: surveyGroup.key, label: surveyGroup.label, kind: 'lead', rows: groupRows(surveyGroup.secs) },
      { key: reactivationGroup.key, label: reactivationGroup.label, kind: 'lead', rows: groupRows(reactivationGroup.secs) },
      { key: startingGroup.key, label: startingGroup.label, kind: 'lead', rows: groupRows(startingGroup.secs) },
      { key: followGroup.key, label: followGroup.label, kind: 'lead', rows: groupRows(followGroup.secs) },
      { key: 'poi', label: 'Sosialisasi', kind: 'poi', rows: poiRows },
    ]
    const visible = sections.filter((s) => s.rows.length > 0)
    const total = leadsToday.length + poiToday.length + bmRows.length

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
                          note={CARD_NOTE[displaySection(lead)]}
                          onOpen={() => openLead(lead)}
                        />
                      ))
                    : s.kind === 'poi'
                      ? (isOpen ? s.rows : s.rows.slice(0, 1)).map((t, i) => (
                          <PoiBoardCard
                            key={t.id}
                            event={t.event}
                            completed={completedPois.includes(t.id)}
                            divider={i > 0}
                            onOpen={() => openPoi(t)}
                          />
                        ))
                      : (isOpen ? s.rows : s.rows.slice(0, 1)).map((c, i) => (
                          <BmValidationCard
                            key={c.id}
                            case={c}
                            divider={i > 0}
                            onOpen={() => openBmValidation(c)}
                          />
                        ))}
                </SectionPanel>
              )
            })
          )}
        </div>

        {snackbar}
        <TabBar active="sales" action={addLead} />
        {sourceSheet}
      </AppScreen>
    )
  }

  // ------------------------------------------------------------------ all ---
  const poiVisible = allPoiTasks
    .filter((t) => poiMatchesQuery(t) && (!poiNoSched || !t.event.agenda))
    .sort((a, b) => {
      const d = agendaDueDays(a.event.agenda) - agendaDueDays(b.event.agenda)
      return poiSort === 'awal' ? d : -d
    })
  const filterCount =
    mainTab === 'leads' ? jenis.size + sumber.size : poiNoSched ? 1 : 0
  const flatLeads = leadsAll
    .filter(
      (l) =>
        (jenis.size === 0 || jenis.has(displaySection(l))) &&
        (sumber.size === 0 || sumber.has(sumberOf(l))) &&
        matchesQuery(l),
    )
    .sort((a, b) => {
      const d = (a.agenda?.dueDays ?? 0) - (b.agenda?.dueDays ?? 0)
      return sortDir === 'awal' ? d : -d
    })

  function openFilter() {
    if (mainTab === 'leads') {
      setJenisDraft(new Set(jenis))
      setSumberDraft(new Set(sumber))
      setSortDraft(sortDir)
      setFilterCat('jenis')
    } else {
      setPoiNoSchedDraft(poiNoSched)
      setPoiSortDraft(poiSort)
      setFilterCat('jadwal')
    }
    setFilterOpen(true)
  }
  function applyFilter() {
    if (mainTab === 'leads') {
      setJenis(new Set(jenisDraft))
      setSumber(new Set(sumberDraft))
      setSortDir(sortDraft)
    } else {
      setPoiNoSched(poiNoSchedDraft)
      setPoiSort(poiSortDraft)
    }
    setFilterOpen(false)
  }
  // Reset — clear the drafts back to defaults; the sheet stays open.
  function resetFilter() {
    if (mainTab === 'leads') {
      setJenisDraft(new Set())
      setSumberDraft(new Set())
      setSortDraft('awal')
    } else {
      setPoiNoSchedDraft(false)
      setPoiSortDraft('awal')
    }
  }
  const toggleIn = <T,>(set: Set<T>, v: T) => {
    const next = new Set(set)
    if (next.has(v)) next.delete(v)
    else next.add(v)
    return next
  }

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

      <div className="flex items-center gap-8">
        <div className="min-w-0 flex-1">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder={mainTab === 'leads' ? 'Cari nama lead' : 'Cari POI'}
            label={mainTab === 'leads' ? 'Cari nama lead' : 'Cari POI'}
          />
        </div>
        <button
          type="button"
          onClick={openFilter}
          className="flex shrink-0 items-center gap-8 rounded-12 border border-default bg-neutral-white px-16 py-12 active:bg-neutral-50"
        >
          <span className="flex items-center gap-8 text-14 font-bold text-default">
            <Sliders size={20} />
            Filter &amp; Urut
          </span>
          {filterCount > 0 ? (
            <span className="flex h-24 items-center justify-center rounded-full bg-primary-500 px-8 text-12 font-bold text-neutral-white">
              {filterCount}
            </span>
          ) : null}
        </button>
      </div>

      {mainTab === 'poi' ? (
        <span className="text-12 text-caption">
          {poiVisible.length} hasil untuk semua lokasi sosialisasi
        </span>
      ) : null}

      {mainTab === 'leads' ? (
        <>
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

      <BottomSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter dan urutkan"
        secondaryAction={
          <Button variant="outline" size="lg" className="w-full" onClick={resetFilter}>
            Reset
          </Button>
        }
        primaryAction={
          <Button size="lg" className="w-full" onClick={applyFilter}>
            Terapkan
          </Button>
        }
      >
        {(() => {
          const cats =
            mainTab === 'leads'
              ? [
                  { id: 'jenis', label: 'Jenis tugas' },
                  { id: 'sumber', label: 'Sumber' },
                  { id: 'urut', label: 'Tanggal tugas' },
                ]
              : [
                  { id: 'jadwal', label: 'Jadwal' },
                  { id: 'urut', label: 'Tanggal tugas' },
                ]
          const sortVal = mainTab === 'leads' ? sortDraft : poiSortDraft
          const setSort = (v: 'akhir' | 'awal') =>
            mainTab === 'leads' ? setSortDraft(v) : setPoiSortDraft(v)
          const setSection = (el: HTMLDivElement | null, id: string) => {
            sectionRefs.current[id] = el
          }
          // Left rail jumps the right panel to a section.
          const jumpTo = (id: string) => {
            setFilterCat(id)
            sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          // Scroll-spy — highlight the rail item whose section is at the top.
          const onRightScroll = () => {
            const container = rightPaneRef.current
            if (!container) return
            if (container.scrollTop + container.clientHeight >= container.scrollHeight - 4) {
              setFilterCat(cats[cats.length - 1].id)
              return
            }
            const cTop = container.getBoundingClientRect().top
            let current = cats[0].id
            for (const c of cats) {
              const el = sectionRefs.current[c.id]
              if (el && el.getBoundingClientRect().top <= cTop + 8) current = c.id
            }
            setFilterCat(current)
          }
          return (
            <div className="flex min-h-0 flex-1 gap-12">
              {/* Left rail — jump between the sections on the right. */}
              <div className="flex w-1/4 shrink-0 flex-col gap-4 overflow-y-auto border-r border-default pr-8">
                {cats.map((c) => {
                  const active = filterCat === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => jumpTo(c.id)}
                      className={`rounded-8 border px-12 py-12 text-left text-14 font-bold ${
                        active
                          ? 'border-primary-200 bg-primary-50 text-primary-500'
                          : 'border-transparent text-default'
                      }`}
                    >
                      {c.label}
                    </button>
                  )
                })}
              </div>

              {/* Right panel — all sections, scrollable; the rail scrolls to each. */}
              <div
                ref={rightPaneRef}
                onScroll={onRightScroll}
                className="flex min-w-0 flex-1 flex-col gap-16 overflow-y-auto"
              >
                {mainTab === 'leads' ? (
                  <>
                    <div ref={(el) => setSection(el, 'jenis')} className="flex flex-col gap-8">
                      <span className="text-14 font-bold text-default">Jenis tugas</span>
                      {JENIS_ORDER.map((section) => (
                        <CheckRow
                          key={section}
                          label={LEADS_SECTION_LABEL[section]}
                          checked={jenisDraft.has(section)}
                          onToggle={() => setJenisDraft((s) => toggleIn(s, section))}
                        />
                      ))}
                    </div>
                    <div ref={(el) => setSection(el, 'sumber')} className="flex flex-col gap-8">
                      <span className="text-14 font-bold text-default">Sumber</span>
                      {SUMBER_OPTIONS.map((o) => (
                        <CheckRow
                          key={o.key}
                          label={o.label}
                          checked={sumberDraft.has(o.key)}
                          onToggle={() => setSumberDraft((s) => toggleIn(s, o.key))}
                        />
                      ))}
                    </div>
                    <div ref={(el) => setSection(el, 'urut')} className="flex flex-col gap-8">
                      <span className="text-14 font-bold text-default">Urutkan</span>
                      <RadioRow
                        label="Paling akhir"
                        checked={sortVal === 'akhir'}
                        onSelect={() => setSort('akhir')}
                      />
                      <RadioRow
                        label="Paling awal"
                        checked={sortVal === 'awal'}
                        onSelect={() => setSort('awal')}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div ref={(el) => setSection(el, 'jadwal')} className="flex flex-col gap-8">
                      <span className="text-14 font-bold text-default">Jadwal</span>
                      <CheckRow
                        label="Belum ada jadwal"
                        checked={poiNoSchedDraft}
                        onToggle={() => setPoiNoSchedDraft((v) => !v)}
                      />
                    </div>
                    <div ref={(el) => setSection(el, 'urut')} className="flex flex-col gap-8">
                      <span className="text-14 font-bold text-default">Urutkan</span>
                      <RadioRow
                        label="Paling akhir"
                        checked={sortVal === 'akhir'}
                        onSelect={() => setSort('akhir')}
                      />
                      <RadioRow
                        label="Paling awal"
                        checked={sortVal === 'awal'}
                        onSelect={() => setSort('awal')}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })()}
      </BottomSheet>
    </AppScreen>
  )
}
