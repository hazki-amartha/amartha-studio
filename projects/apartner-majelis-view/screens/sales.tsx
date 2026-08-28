'use client'

// Sales — the BP's lead pipeline, as one filterable roster.
//
// Each row shows her single, flat status as the coloured badge on the right
// (Interested / Undecided / Not interested → Waiting for KYC → Underwriting
// ongoing → Approved / Rejected → Disbursed). Whether her data is complete is a
// TYPE, not a status: an unqualified lead (no KTP yet) is flagged on the card
// with "Data pribadi belum lengkap". Three filters: Status, Type, and Majelis.

import { useState } from 'react'
import { Badge, BottomSheet, Button, NavigationHeader, SelectableCard } from '@/design-system/components'
import { Plus } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { FU_TASK_FOR_LEAD, MAJELIS_DIRECTORY } from '../lib/schedule'
import {
  ACTIVE_STATUSES,
  INCOMPLETE_LABEL,
  MAJELIS_FILTER_NONE,
  POI_LIST,
  STATUS_META,
  STATUS_ORDER,
  TYPE_LABEL,
  leadType,
  majelisLine,
  matchesMajelis,
  newMajelisFilterValue,
  sourceDetail,
  statusBadge,
  type LeadStatus,
  type LeadType,
  type PipelineLead,
} from '../lib/pipeline'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { TabBar } from '../lib/tabs'
import {
  AppScreen,
  EmptyState,
  FilterBar,
  FilterChip,
  OptionSheet,
  ResetLink,
  SearchField,
  VisitTitle,
} from '../lib/ui'

type MenuId = 'status' | 'type' | 'sumber' | 'majelis' | null

// The Sumber filter: Referral, or any of the POIs. Value 'referral' or a POI name.
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

// The roster opens narrowed to the statuses a BP actively works — the closed
// ends (Approved / Rejected / Disbursed) are out of the default view.
const DEFAULT_STATUS: LeadStatus[] = ACTIVE_STATUSES

// Status is multi-select — an empty set means "all", so this list carries only
// the real values (no "Semua" row; the Reset link clears them).
// The filter spells out what a couple of statuses mean (the funnel phase they
// belong to) — clearer in the picker than on the compact card badge.
const STATUS_FILTER_LABEL: Partial<Record<LeadStatus, string>> = {
  'waiting-kyc': 'Waiting for KYC (Invited)',
  underwriting: 'Underwriting ongoing (Submitted)',
}
const STATUS_OPTIONS: { label: string; value: LeadStatus }[] = STATUS_ORDER.map((s) => ({
  label: STATUS_FILTER_LABEL[s] ?? STATUS_META[s].label,
  value: s,
}))

// How the roster is ordered: most advanced status first, but the three New-phase
// statuses keep their natural interest order at the bottom (interested before
// undecided before not-interested) rather than the pure reverse of the funnel.
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

// Type is single-select, "All" plus the two types (with their meaning spelled out).
const TYPE_OPTIONS: { label: string; value: LeadType | null }[] = [
  { label: 'All', value: null },
  { label: `${TYPE_LABEL.qualified} (Data pribadi lengkap)`, value: 'qualified' },
  { label: `${TYPE_LABEL.unqualified} (Data pribadi belum lengkap)`, value: 'unqualified' },
]

/** Toggles a value in/out of a multi-select array. */
function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
}

/** The majelis filter options, from the leads on screen. */
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

function SalesRow({ lead, onOpen }: { lead: PipelineLead; onOpen: () => void }) {
  const badge = statusBadge(lead)
  const unqualified = leadType(lead) === 'unqualified'
  const fuToday = Boolean(FU_TASK_FOR_LEAD[lead.id])

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-8 overflow-hidden rounded-12 border border-default bg-neutral-white p-12 text-left active:bg-neutral-50"
    >
      <div className="flex w-full items-start gap-8">
        {/* Left: name over majelis, with the "data incomplete" flag when unqualified. */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="truncate text-14 font-bold text-default">{lead.name}</span>
          <span className="truncate text-12 text-caption">{majelisLine(lead)}</span>
          <span className="truncate text-12 text-caption">{sourceDetail(lead)}</span>
          {unqualified ? (
            <span className="truncate text-12 text-orange-600">{INCOMPLETE_LABEL}</span>
          ) : null}
        </div>
        {/* Right: her flat status. */}
        <Badge intent={badge.intent}>{badge.label}</Badge>
      </div>
      {fuToday ? (
        // A real footer: pulled to the card's edges (negating the p-12) and
        // rounded only at the bottom so it seats flush against the card corners.
        <span className="-mx-12 -mb-12 rounded-b-12 bg-canvas-blue px-12 py-8 text-12 font-regular text-blue-500">
          Follow up dijadwalkan hari ini
        </span>
      ) : null}
    </button>
  )
}

export function SalesScreen() {
  const flow = useFlow()
  const { leads, order } = usePipeline()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<LeadStatus[]>(DEFAULT_STATUS)
  const [type, setType] = useState<LeadType | null>(null)
  const [sumber, setSumber] = useState<string | null>(null)
  const [majelis, setMajelis] = useState<string | null>(null)
  const [menu, setMenu] = useState<MenuId>(null)

  const all = order.map((id) => leads[id])
  const q = query.trim().toLowerCase()

  const majelisOpts = majelisOptions(all)

  const rows = all
    .filter((lead) => {
      if (q && !lead.name.toLowerCase().includes(q)) return false
      if (status.length > 0 && !status.includes(lead.status)) return false
      if (type && leadType(lead) !== type) return false
      if (sumber && !matchesSumber(lead, sumber)) return false
      if (majelis && !matchesMajelis(lead, majelis)) return false
      return true
    })
    // Most advanced status first (see SALES_SORT_ORDER), name A→Z within a status.
    .sort((a, b) => salesRank(a.status) - salesRank(b.status) || a.name.localeCompare(b.name))

  const filtered = status.length > 0 || Boolean(type) || Boolean(sumber) || Boolean(majelis)

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          hideBack
          title={<VisitTitle title="Sales" when={`${all.length} lead`} />}
        />
      }
    >
      <SearchField value={query} onChange={setQuery} placeholder="Cari nama lead" label="Cari lead" />

      <FilterBar>
        <FilterChip
          label={status.length > 0 ? `Status (${status.length})` : 'Status'}
          active={status.length > 0}
          open={menu === 'status'}
          onClick={() => setMenu('status')}
        />
        <FilterChip
          label="Tipe"
          active={Boolean(type)}
          open={menu === 'type'}
          onClick={() => setMenu('type')}
        />
        <FilterChip
          label="Sumber"
          active={Boolean(sumber)}
          open={menu === 'sumber'}
          onClick={() => setMenu('sumber')}
        />
        <FilterChip
          label="Majelis"
          active={Boolean(majelis)}
          open={menu === 'majelis'}
          onClick={() => setMenu('majelis')}
        />
        {filtered ? (
          <ResetLink
            onClick={() => {
              setStatus([])
              setType(null)
              setSumber(null)
              setMajelis(null)
            }}
          />
        ) : null}
      </FilterBar>

      {q || filtered ? (
        <span className="text-12 text-caption">
          {rows.length} dari {all.length} lead
        </span>
      ) : null}

      <div className="flex flex-col gap-8 pb-16">
        {rows.length === 0 ? (
          <EmptyState title="Lead tidak ditemukan" body="Coba nama, status, tipe, atau majelis lain." />
        ) : null}
        {rows.map((lead) => (
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

      {/* Tambah is a floating action, bottom-right, above the nav. */}
      <TabBar
        active="sales"
        action={
          <Button size="sm" className="shadow-lg" onClick={() => flow.go('lead-new')}>
            <span className="flex items-center gap-4">
              <Plus size={16} />
              Tambah
            </span>
          </Button>
        }
      />

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
    </AppScreen>
  )
}
