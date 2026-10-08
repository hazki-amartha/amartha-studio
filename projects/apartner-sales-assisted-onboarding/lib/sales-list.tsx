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
import { Check, CheckCircle, ChevronDown, Plus, Sliders, Sort } from '@/design-system/icons'
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
  FIELD_OFFICERS,
  LEADS_SECTION_LABEL,
  foLabel,
  leadDetailTarget,
  leadsSection,
  sourceDetail,
  type LeadsSection,
  type PipelineLead,
} from './pipeline'
import { pipelineStore, setAddLeadEntry, usePipeline } from './pipeline-store'
import { canDisburse, setFormation, useFormation } from './formation'
import { usePois } from './poi-store'
import { store, useApp } from './store'
import { SOFT_REJECT_CASES, type SoftRejectCase } from './validasi'
import { useValidasiAll, validasiStore } from './validasi-store'
import { ChevronRow, SourceSheet } from './pipeline-ui'
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
  // Start onboarding + Complete onboarding are one "Onboarding" bucket.
  { key: 'onboarding', label: 'Onboarding', secs: ['starting-onboarding', 'survey-ongoing'] },
  { key: 'reactivation', label: 'Reaktivasi', secs: ['reactivation'] },
  { key: 'follow-up', label: 'Follow up', secs: ['follow-up'] },
]

// Members a new majelis needs before its activation can start.
const MIN_ACTIVATION = 5

const CARD_NOTE: Partial<Record<LeadsSection, CardNote>> = {
  'survey-approved': { text: 'Waiting for group activation', tone: 'orange' },
  'need-resubmit': { text: 'Need to resubmit UK', tone: 'orange' },
  'pending-bm-validation': { text: 'Need BM Review', tone: 'orange' },
  'survey-submitted': { text: 'Application in process', tone: 'blue' },
}

// "Jenis tugas" filter options — the lead's journey top-to-bottom, then the
// needs-attention exceptions grouped at the end (distinct from the board's
// funnel order, which leads with what's closest to disbursing). Each option maps
// to one or more sections; "Onboarding" covers both Start and Complete onboarding.
const JENIS_FILTER_OPTIONS: { label: string; sections: LeadsSection[] }[] = [
  { label: LEADS_SECTION_LABEL['follow-up'], sections: ['follow-up'] },
  { label: 'Onboarding', sections: ['starting-onboarding', 'survey-ongoing'] },
  { label: LEADS_SECTION_LABEL['reactivation'], sections: ['reactivation'] },
  { label: LEADS_SECTION_LABEL['survey-submitted'], sections: ['survey-submitted'] },
  { label: LEADS_SECTION_LABEL['survey-approved'], sections: ['survey-approved'] },
  { label: LEADS_SECTION_LABEL['ready-for-disbursement'], sections: ['ready-for-disbursement'] },
  { label: LEADS_SECTION_LABEL['need-resubmit'], sections: ['need-resubmit'] },
  { label: LEADS_SECTION_LABEL['pending-bm-validation'], sections: ['pending-bm-validation'] },
  { label: LEADS_SECTION_LABEL['survey-rejected'], sections: ['survey-rejected'] },
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

/** The day's progress banner above the Sales hari ini search — a full-width blue
 *  strip with two counters (follow-up selesai, pencairan hari ini) and a chevron
 *  that opens the detail page.
 *
 *  Removed from the board for now (see the commented render in the today scope);
 *  kept here so it can be pulled back by uncommenting both and re-adding the
 *  `ChevronRight` icon import.
// function DaySummaryBox({ onOpen }: { onOpen: () => void }) {
//   return (
//     <button
//       type="button"
//       onClick={onOpen}
//       className="-mx-16 -mt-16 flex items-center gap-8 border-b border-blue-200 bg-blue-50 px-16 py-12 text-left active:bg-blue-100"
//     >
//       <span className="min-w-0 flex-1 text-14 font-bold text-blue-600">
//         Lihat capaian hari ini
//       </span>
//       <span className="shrink-0 text-blue-600">
//         <ChevronRight size={24} />
//       </span>
//     </button>
//   )
// }
*/


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
  // Lihat semua filter/sort — applied values + the sheet's draft. Filter and Sort
  // are two separate sheets, opened from two buttons.
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
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
  // BM view: "Tambah Prospek" first asks what kind — a calon mitra (the lead
  // flow) or a new lokasi sosialisasi (the Add Sosialisasi form).
  const [jenisOpen, setJenisOpen] = useState(false)
  // BM view — a Petugas filter (both scopes); non-follow-up leads open the BP
  // page with a petugas bar (BmPetugasBar) rather than a read-only sheet.
  const isBM = role === 'BM'
  // Single-select petugas filter (null = all), shown as a dropdown that opens a
  // "Filter petugas" radio sheet — shared by both scopes.
  const [petugasFilter, setPetugasFilter] = useState<string | null>(null)
  const [petugasSheetOpen, setPetugasSheetOpen] = useState(false)
  const [petugasDraft, setPetugasDraft] = useState<string | null>(null)

  const q = query.trim().toLowerCase()
  const matchesQuery = (lead: PipelineLead) =>
    !q || lead.name.toLowerCase().includes(q) || sourceDetail(lead).toLowerCase().includes(q)
  const poiMatchesQuery = (t: PoiTask) =>
    !q || t.event.title.toLowerCase().includes(q) || t.event.poiType.toLowerCase().includes(q)

  const leadsAll = order.map((id) => leads[id]).filter(onLeadsList)
  const allPoiTasks = buildTasks([], pois).filter((t): t is PoiTask => t.kind === 'poi')

  // The section a lead shows in — approved splits into "Ready for disbursement"
  // (majelis settled) and "Waiting for group activation" (new majelis not formed).
  const displaySection = (l: PipelineLead): LeadsSection =>
    l.status === 'approved' && canDisburse(formation, l) ? 'ready-for-disbursement' : leadsSection(l)

  // The card note — a "Waiting for group activation" lead splits by whether her
  // new majelis has enough members to start the activation.
  const noteFor = (l: PipelineLead): CardNote | undefined => {
    if (displaySection(l) === 'survey-approved' && l.majelis.kind === 'new') {
      const name = l.majelis.name
      const members = Object.values(leads).filter(
        (x) => x.majelis.kind === 'new' && x.majelis.name === name,
      ).length
      return members < MIN_ACTIVATION
        ? { text: 'Waiting for group activation (still waiting for members)', tone: 'orange' }
        : { text: 'Waiting for group activation', tone: 'orange' }
    }
    return CARD_NOTE[displaySection(l)]
  }

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function openLead(lead: PipelineLead) {
    // BM view: every stage past Follow up belongs to a BP, so the BM opens the
    // same page the BP would — read-only, with a petugas bar under the header to
    // see and reassign who owns it (BmPetugasBar, injected on those screens).
    pipelineStore.open(lead.id)
    // "Waiting for group activation" — open the formation (ketua + jadwal) directly.
    if (
      lead.status === 'approved' &&
      lead.majelis.kind === 'new' &&
      !canDisburse(formation, lead)
    ) {
      setFormation({
        mode: 'form',
        phase: 'majelis',
        majelisName: lead.majelis.name,
        memberCount: 0,
        returnTo: leadDetailTarget(lead),
      })
      flow.go('group-formation')
      return
    }
    flow.go(leadDetailTarget(lead))
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
    <Button size="sm" className="shadow-lg" onClick={() => (isBM ? setJenisOpen(true) : setAddSourceOpen(true))}>
      <span className="flex items-center gap-4">
        <Plus size={16} />
        {isBM ? 'Tambah Prospek' : 'Add lead'}
      </span>
    </Button>
  )

  // BM view: the "Pilih jenis prospek" step — a calon mitra, or a new sosialisasi
  // location (the Add Sosialisasi form).
  const jenisSheet = isBM ? (
    <BottomSheet open={jenisOpen} onClose={() => setJenisOpen(false)} title="Pilih jenis prospek">
      <div className="flex flex-col gap-8">
        <ChevronRow
          title="Calon mitra"
          description="Tambahkan calon mitra baru"
          onClick={() => {
            setJenisOpen(false)
            setAddSourceOpen(true)
          }}
        />
        <ChevronRow
          title="Lokasi sosialisasi"
          description="Tambahkan lokasi baru untuk sosialisasi"
          onClick={() => {
            setJenisOpen(false)
            flow.go('poi-new')
          }}
        />
      </div>
    </BottomSheet>
  ) : null
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

  // BM view: the Petugas filter — a dropdown opening a single-select sheet.
  const petugasControl = isBM ? (
    <button
      type="button"
      onClick={() => {
        setPetugasDraft(petugasFilter)
        setPetugasSheetOpen(true)
      }}
      className="flex w-1/2 items-center justify-between gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-left text-14"
    >
      <span className={`truncate ${petugasFilter ? 'text-default' : 'text-caption'}`}>
        {petugasFilter ? foLabel(petugasFilter) : 'Semua petugas'}
      </span>
      <span className="shrink-0 text-disabled">
        <ChevronDown size={20} />
      </span>
    </button>
  ) : null

  const petugasSheet = isBM ? (
    <BottomSheet
      open={petugasSheetOpen}
      onClose={() => setPetugasSheetOpen(false)}
      title="Filter petugas"
      secondaryAction={
        <Button variant="outline" size="lg" className="w-full" onClick={() => setPetugasSheetOpen(false)}>
          Batal
        </Button>
      }
      primaryAction={
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            setPetugasFilter(petugasDraft)
            setPetugasSheetOpen(false)
          }}
        >
          Simpan
        </Button>
      }
    >
      <div className="flex flex-col gap-8">
        <RadioRow label="Lihat semua" checked={petugasDraft === null} onSelect={() => setPetugasDraft(null)} />
        {FIELD_OFFICERS.map((fo) => (
          <RadioRow key={fo} label={foLabel(fo)} checked={petugasDraft === fo} onSelect={() => setPetugasDraft(fo)} />
        ))}
      </div>
    </BottomSheet>
  ) : null

  // ---------------------------------------------------------------- today ---
  if (scope === 'today') {
    // Only the active stages appear today; submitted and approved surveys have
    // no follow-up to do, so they wait on "Lihat semua". A follow-up must be due.
    const leadsToday = leadsAll.filter((l) => {
      // BM view: the Petugas filter narrows the board to one BP's leads.
      if (petugasFilter && l.fo !== petugasFilter) return false
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
    const onboardingGroup = group('onboarding')
    const reactivationGroup = group('reactivation')
    const followGroup = group('follow-up')
    const sections: Section[] = [
      { key: 'bm-validation', label: 'BM Validation', kind: 'bm-validation', rows: bmRows },
      { key: readyGroup.key, label: readyGroup.label, kind: 'lead', rows: groupRows(readyGroup.secs) },
      { key: waitingGroup.key, label: waitingGroup.label, kind: 'lead', rows: groupRows(waitingGroup.secs) },
      { key: onboardingGroup.key, label: onboardingGroup.label, kind: 'lead', rows: groupRows(onboardingGroup.secs) },
      { key: reactivationGroup.key, label: reactivationGroup.label, kind: 'lead', rows: groupRows(reactivationGroup.secs) },
      { key: followGroup.key, label: followGroup.label, kind: 'lead', rows: groupRows(followGroup.secs) },
      { key: 'poi', label: 'Sosialisasi', kind: 'poi', rows: poiRows },
    ]
    const visible = sections.filter((s) => s.rows.length > 0)

    return (
      <AppScreen
        topBar={
          <NavigationHeader
            hideBack
            title="Sales hari ini"
            link="Lihat semua"
            onLinkClick={() => flow.go('all-tasks')}
          />
        }
      >
        {/* "Lihat capaian hari ini" removed for now — re-enable by uncommenting
            this and the DaySummaryBox component above.
        <DaySummaryBox onOpen={() => flow.go('capaian')} /> */}

        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Cari nama lead atau POI"
          label="Cari nama lead atau POI"
        />

        {petugasControl}

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
                          note={noteFor(lead)}
                          showPetugas={isBM}
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
        {jenisSheet}

        {petugasSheet}
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
  // One filter per selected Jenis OPTION (Onboarding covers two sections but counts once).
  const jenisCount = JENIS_FILTER_OPTIONS.filter((o) => o.sections.every((x) => jenis.has(x))).length
  const filterCount =
    mainTab === 'leads'
      ? jenisCount + sumber.size + (isBM && petugasFilter ? 1 : 0)
      : poiNoSched
        ? 1
        : 0
  const flatLeads = leadsAll
    .filter(
      (l) =>
        (jenis.size === 0 || jenis.has(displaySection(l))) &&
        (sumber.size === 0 || sumber.has(sumberOf(l))) &&
        (!petugasFilter || l.fo === petugasFilter) &&
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
      setPetugasDraft(petugasFilter)
      setFilterCat('jenis')
    } else {
      setPoiNoSchedDraft(poiNoSched)
      setFilterCat('jadwal')
    }
    setFilterOpen(true)
  }
  function applyFilter() {
    if (mainTab === 'leads') {
      setJenis(new Set(jenisDraft))
      setSumber(new Set(sumberDraft))
      setPetugasFilter(petugasDraft)
    } else {
      setPoiNoSched(poiNoSchedDraft)
    }
    setFilterOpen(false)
  }
  // Reset — clear the filter drafts back to defaults; the sheet stays open.
  function resetFilter() {
    if (mainTab === 'leads') {
      setJenisDraft(new Set())
      setSumberDraft(new Set())
      setPetugasDraft(null)
    } else {
      setPoiNoSchedDraft(false)
    }
  }
  // Sort is its own sheet now — seed its draft on open, apply on Terapkan.
  function openSort() {
    if (mainTab === 'leads') setSortDraft(sortDir)
    else setPoiSortDraft(poiSort)
    setSortOpen(true)
  }
  function applySort() {
    if (mainTab === 'leads') setSortDir(sortDraft)
    else setPoiSort(poiSortDraft)
    setSortOpen(false)
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
            Filter
          </span>
          {filterCount > 0 ? (
            <span className="flex h-24 items-center justify-center rounded-full bg-primary-500 px-8 text-12 font-bold text-neutral-white">
              {filterCount}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={openSort}
          className="flex shrink-0 items-center gap-8 rounded-12 border border-default bg-neutral-white px-16 py-12 text-14 font-bold text-default active:bg-neutral-50"
        >
          <Sort size={20} />
          Sort
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
                  <LeadBoardCard lead={lead} showPetugas={isBM} onOpen={() => openLead(lead)} />
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
      {jenisSheet}

      <BottomSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter"
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
                  ...(isBM ? [{ id: 'petugas', label: 'Petugas' }] : []),
                ]
              : [{ id: 'jadwal', label: 'Jadwal' }]
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
                      {JENIS_FILTER_OPTIONS.map((opt) => (
                        <CheckRow
                          key={opt.label}
                          label={opt.label}
                          checked={opt.sections.every((x) => jenisDraft.has(x))}
                          onToggle={() =>
                            setJenisDraft((s) => {
                              const next = new Set(s)
                              const allIn = opt.sections.every((x) => next.has(x))
                              opt.sections.forEach((x) => (allIn ? next.delete(x) : next.add(x)))
                              return next
                            })
                          }
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
                    {isBM ? (
                      <div ref={(el) => setSection(el, 'petugas')} className="flex flex-col gap-8">
                        <span className="text-14 font-bold text-default">Petugas</span>
                        <RadioRow
                          label="Semua petugas"
                          checked={petugasDraft === null}
                          onSelect={() => setPetugasDraft(null)}
                        />
                        {FIELD_OFFICERS.map((fo) => (
                          <RadioRow
                            key={fo}
                            label={foLabel(fo)}
                            checked={petugasDraft === fo}
                            onSelect={() => setPetugasDraft(fo)}
                          />
                        ))}
                      </div>
                    ) : null}
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
                  </>
                )}
              </div>
            </div>
          )
        })()}
      </BottomSheet>

      <BottomSheet
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        title="Urutkan"
        primaryAction={
          <Button size="lg" className="w-full" onClick={applySort}>
            Terapkan
          </Button>
        }
      >
        <div className="flex flex-col gap-8">
          <RadioRow
            label="Tugas paling awal"
            checked={(mainTab === 'leads' ? sortDraft : poiSortDraft) === 'awal'}
            onSelect={() => (mainTab === 'leads' ? setSortDraft('awal') : setPoiSortDraft('awal'))}
          />
          <RadioRow
            label="Tugas paling akhir"
            checked={(mainTab === 'leads' ? sortDraft : poiSortDraft) === 'akhir'}
            onSelect={() => (mainTab === 'leads' ? setSortDraft('akhir') : setPoiSortDraft('akhir'))}
          />
        </div>
      </BottomSheet>
    </AppScreen>
  )
}
