'use client'

// Sales — the BM's lead pipeline and the POIs behind it, on one page split by a
// segmented control:
//
//   • Leads — the flat-status roster ported from the BP concept, with one line
//     added: who it is assigned to (a BP, or the BM herself). A new Petugas
//     filter reads that field, on top of Status / Tipe / Sumber / Majelis.
//   • POI   — the points of interest the branch is working, each a card the BM
//     created and handed to a BP or kept for herself, carrying how many leads
//     have come from it. Same Petugas filter.
//
// Tambah is context-aware: on Leads it adds a lead, on POI it adds a POI.

import { useState } from 'react'
import { Badge, BottomSheet, Button, NavigationHeader, SelectableCard } from '@/design-system/components'
import { MapPin, Plus } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { MAJELIS_DIRECTORY } from '../lib/schedule'
import {
  ACTIVE_STATUSES,
  ASSIGNEE_FILTER_OPTIONS,
  INCOMPLETE_LABEL,
  MAJELIS_FILTER_NONE,
  POI_LIST,
  STATUS_META,
  STATUS_ORDER,
  assigneeLine,
  leadType,
  majelisLine,
  matchesMajelis,
  newMajelisFilterValue,
  sourceDetail,
  statusBadge,
  type LeadStatus,
  type LeadType,
  type PipelineLead,
  type PointOfInterest,
} from '../lib/pipeline'
import { leadsForPoi, pipelineStore, usePipeline } from '../lib/pipeline-store'
import { TabBar } from '../lib/tabs'
import {
  AppScreen,
  EmptyState,
  FilterBar,
  FilterChip,
  OptionSheet,
  ResetLink,
  SearchField,
} from '../lib/ui'

type MenuId = 'status' | 'type' | 'sumber' | 'majelis' | 'petugas' | null
type Tab = 'leads' | 'poi'

const SUMBER_REFERRAL = '__referral__'
const SUMBER_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'Semua sumber', value: null },
  { label: 'Referral', value: SUMBER_REFERRAL },
  ...POI_LIST.map((p) => ({ label: `POI ${p}`, value: p as string | null })),
]

function matchesSumber(lead: PipelineLead, value: string): boolean {
  if (value === SUMBER_REFERRAL) return lead.source === 'referral'
  return lead.source === 'poi' && lead.poi === value
}

const DEFAULT_STATUS: LeadStatus[] = ACTIVE_STATUSES

const STATUS_FILTER_LABEL: Partial<Record<LeadStatus, string>> = {
  'waiting-kyc': 'Waiting for KYC (Invited)',
  underwriting: 'Underwriting ongoing (Submitted)',
}
const STATUS_OPTIONS: { label: string; value: LeadStatus }[] = STATUS_ORDER.map((s) => ({
  label: STATUS_FILTER_LABEL[s] ?? STATUS_META[s].label,
  value: s,
}))

const SALES_SORT_ORDER: LeadStatus[] = [
  'disbursed',
  'rejected',
  'approved',
  'underwriting',
  'waiting-kyc',
  'interested',
  'undecided',
  'not-interested',
]
const salesRank = (s: LeadStatus): number => SALES_SORT_ORDER.indexOf(s)

const TYPE_OPTIONS: { label: string; value: LeadType | null }[] = [
  { label: 'All', value: null },
  { label: 'Sudah ada KTP', value: 'qualified' },
  { label: 'Belum ada KTP', value: 'unqualified' },
]

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
}

function majelisOptions(leads: PipelineLead[]): { label: string; value: string | null }[] {
  const newNames = Array.from(
    new Set(leads.flatMap((l) => (l.majelis.kind === 'new' ? [l.majelis.name] : []))),
  )
  return [
    { label: 'Semua majelis', value: null },
    ...MAJELIS_DIRECTORY.filter((g) => g.status === 'aktif').map((g) => ({
      label: g.name,
      value: g.id as string | null,
    })),
    ...newNames.map((name) => ({
      label: `${name} (Baru)`,
      value: newMajelisFilterValue(name) as string | null,
    })),
    { label: 'Tanpa majelis', value: MAJELIS_FILTER_NONE },
  ]
}

/** A multi-select filter sheet — checkboxes, toggled live; empty = all. */
function MultiOptionSheet<T extends string>({
  open,
  title,
  name,
  options,
  values,
  onToggle,
  onClose,
}: {
  open: boolean
  title: string
  name: string
  options: { label: string; value: T }[]
  values: T[]
  onToggle: (v: T) => void
  onClose: () => void
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-8">
        {options.map((o) => (
          <SelectableCard
            key={o.value}
            name={name}
            inputType="checkbox"
            title={o.label}
            checked={values.includes(o.value)}
            onChange={() => onToggle(o.value)}
          />
        ))}
      </div>
    </BottomSheet>
  )
}

/** The Leads / POI tabs, part of the pinned header (an underline, not a chip). */
function HeaderTabs({
  tab,
  onTab,
  leadCount,
  poiCount,
}: {
  tab: Tab
  onTab: (t: Tab) => void
  leadCount: number
  poiCount: number
}) {
  const item = (id: Tab, label: string) => {
    const active = tab === id
    return (
      <button
        type="button"
        onClick={() => onTab(id)}
        aria-selected={active}
        className={`-mb-px flex-1 border-b-2 py-12 text-center text-14 font-bold ${
          active ? 'border-primary-500 text-primary-500' : 'border-transparent text-caption'
        }`}
      >
        {label}
      </button>
    )
  }
  return (
    <div className="flex border-b border-default bg-neutral-white px-16">
      {item('leads', `Leads (${leadCount})`)}
      {item('poi', `POI (${poiCount})`)}
    </div>
  )
}

function SalesRow({ lead, onOpen }: { lead: PipelineLead; onOpen: () => void }) {
  const badge = statusBadge(lead)
  const unqualified = leadType(lead) === 'unqualified'

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-8 overflow-hidden rounded-12 border border-default bg-neutral-white p-12 text-left active:bg-neutral-50"
    >
      <div className="flex w-full items-start gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="truncate text-14 font-bold text-default">{lead.name}</span>
          <span className="truncate text-12 text-caption">{majelisLine(lead)}</span>
          <span className="truncate text-12 text-caption">{sourceDetail(lead)}</span>
          {/* The BM axis: who works her. */}
          <span className="truncate text-12 text-caption">{assigneeLine(lead.assignedTo)}</span>
          {unqualified ? (
            <span className="truncate text-12 text-orange-600">{INCOMPLETE_LABEL}</span>
          ) : null}
        </div>
        <Badge intent={badge.intent}>{badge.label}</Badge>
      </div>
    </button>
  )
}

function PoiRow({ poi, leadCount, onOpen }: { poi: PointOfInterest; leadCount: number; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-8 overflow-hidden rounded-12 border border-default bg-neutral-white p-12 text-left active:bg-neutral-50"
    >
      <span className="mt-2 shrink-0 text-primary-500">
        <MapPin size={20} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="truncate text-14 font-bold text-default">{poi.name}</span>
        <span className="truncate text-12 text-caption">{poi.area}</span>
        <span className="truncate text-12 text-caption">{assigneeLine(poi.assignedTo)}</span>
      </div>
      <Badge intent={leadCount > 0 ? 'primary' : 'neutral'}>{leadCount} lead</Badge>
    </button>
  )
}

export function SalesScreen() {
  const flow = useFlow()
  const stateSnap = usePipeline()
  const { leads, order, pois, poiOrder } = stateSnap
  const [tab, setTab] = useState<Tab>('leads')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<LeadStatus[]>(DEFAULT_STATUS)
  const [type, setType] = useState<LeadType | null>(null)
  const [sumber, setSumber] = useState<string | null>(null)
  const [majelis, setMajelis] = useState<string | null>(null)
  const [petugas, setPetugas] = useState<string | null>(null)
  const [menu, setMenu] = useState<MenuId>(null)

  const allLeads = order.map((id) => leads[id])
  const allPois = poiOrder.map((id) => pois[id])
  const q = query.trim().toLowerCase()
  const majelisOpts = majelisOptions(allLeads)

  const leadRows = allLeads
    .filter((lead) => {
      if (q && !lead.name.toLowerCase().includes(q)) return false
      if (status.length > 0 && !status.includes(lead.status)) return false
      if (type && leadType(lead) !== type) return false
      if (sumber && !matchesSumber(lead, sumber)) return false
      if (majelis && !matchesMajelis(lead, majelis)) return false
      if (petugas && lead.assignedTo !== petugas) return false
      return true
    })
    .sort((a, b) => salesRank(a.status) - salesRank(b.status) || a.name.localeCompare(b.name))

  const poiRows = allPois.filter((poi) => {
    if (q && !poi.name.toLowerCase().includes(q)) return false
    if (petugas && poi.assignedTo !== petugas) return false
    return true
  })

  const leadsFiltered =
    status.length > 0 || Boolean(type) || Boolean(sumber) || Boolean(majelis) || Boolean(petugas)
  const poiFiltered = Boolean(petugas)

  function resetLeads() {
    setStatus([])
    setType(null)
    setSumber(null)
    setMajelis(null)
    setPetugas(null)
  }

  return (
    <AppScreen
      topBar={
        <div className="bg-neutral-white">
          <NavigationHeader hideBack title="Sales" />
          <HeaderTabs tab={tab} onTab={setTab} leadCount={allLeads.length} poiCount={allPois.length} />
        </div>
      }
    >
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder={tab === 'leads' ? 'Cari nama lead' : 'Cari POI'}
        label={tab === 'leads' ? 'Cari lead' : 'Cari POI'}
      />

      {tab === 'leads' ? (
        <>
          <FilterBar>
            <FilterChip
              label={status.length > 0 ? `Status (${status.length})` : 'Status'}
              active={status.length > 0}
              open={menu === 'status'}
              onClick={() => setMenu('status')}
            />
            <FilterChip label="Tipe" active={Boolean(type)} open={menu === 'type'} onClick={() => setMenu('type')} />
            <FilterChip label="Sumber" active={Boolean(sumber)} open={menu === 'sumber'} onClick={() => setMenu('sumber')} />
            <FilterChip label="Petugas" active={Boolean(petugas)} open={menu === 'petugas'} onClick={() => setMenu('petugas')} />
            <FilterChip label="Majelis" active={Boolean(majelis)} open={menu === 'majelis'} onClick={() => setMenu('majelis')} />
            {leadsFiltered ? <ResetLink onClick={resetLeads} /> : null}
          </FilterBar>

          {q || leadsFiltered ? (
            <span className="text-12 text-caption">
              {leadRows.length} dari {allLeads.length} lead
            </span>
          ) : null}

          <div className="flex flex-col gap-8 pb-16">
            {leadRows.length === 0 ? (
              <EmptyState title="Lead tidak ditemukan" body="Coba nama, status, tipe, majelis, atau petugas lain." />
            ) : null}
            {leadRows.map((lead) => (
              <SalesRow
                key={lead.id}
                lead={lead}
                onOpen={() => {
                  pipelineStore.open(lead.id)
                  flow.go('lead-detail')
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <FilterBar>
            <FilterChip label="Petugas" active={Boolean(petugas)} open={menu === 'petugas'} onClick={() => setMenu('petugas')} />
            {poiFiltered ? <ResetLink onClick={() => setPetugas(null)} /> : null}
          </FilterBar>

          {q || poiFiltered ? (
            <span className="text-12 text-caption">
              {poiRows.length} dari {allPois.length} POI
            </span>
          ) : null}

          <div className="flex flex-col gap-8 pb-16">
            {poiRows.length === 0 ? (
              <EmptyState title="POI tidak ditemukan" body="Coba nama atau petugas lain, atau tambah POI baru." />
            ) : null}
            {poiRows.map((poi) => (
              <PoiRow
                key={poi.id}
                poi={poi}
                leadCount={leadsForPoi(stateSnap, poi.name).length}
                onOpen={() => {
                  pipelineStore.openPoi(poi.id)
                  flow.go('poi-detail')
                }}
              />
            ))}
          </div>
        </>
      )}

      <TabBar
        active="sales"
        action={
          <Button
            size="sm"
            className="shadow-lg"
            onClick={() => flow.go(tab === 'leads' ? 'lead-new' : 'poi-new')}
          >
            <span className="flex items-center gap-4">
              <Plus size={16} />
              {tab === 'leads' ? 'Tambah lead' : 'Tambah POI'}
            </span>
          </Button>
        }
      />

      {/* Leads filters */}
      <MultiOptionSheet
        open={menu === 'status'}
        title="Status lead"
        name="sales-status"
        options={STATUS_OPTIONS}
        values={status}
        onToggle={(v) => setStatus((prev) => toggle(prev, v))}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'type'}
        title="Tipe lead"
        name="sales-type"
        options={TYPE_OPTIONS}
        value={type}
        onPick={(v) => {
          setType(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'sumber'}
        title="Sumber lead"
        name="sales-sumber"
        options={SUMBER_OPTIONS}
        value={sumber}
        onPick={(v) => {
          setSumber(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'majelis'}
        title="Majelis"
        name="sales-majelis"
        options={majelisOpts}
        value={majelis}
        onPick={(v) => {
          setMajelis(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
      {/* Shared by both tabs: filter by who it is assigned to. */}
      <OptionSheet
        open={menu === 'petugas'}
        title="Petugas"
        name="sales-petugas"
        options={ASSIGNEE_FILTER_OPTIONS}
        value={petugas}
        onPick={(v) => {
          setPetugas(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
    </AppScreen>
  )
}
