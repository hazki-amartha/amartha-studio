'use client'

// Sales — the BP's lead pipeline, as one filterable roster.
//
// Every row carries the TWO statuses the concept splits: the main funnel status
// as the coloured badge on the right (Unqualified → … → Disbursed / Rejected),
// and — only while she is still being worked — the interest note as a small tag
// on her source line. Three filters mirror the model: main status, interest, and
// which majelis she is bound for.

import { useState } from 'react'
import { Badge, BottomSheet, Button, NavigationHeader, SelectableCard } from '@/design-system/components'
import { Plus } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { MAJELIS_DIRECTORY } from '../lib/schedule'
import {
  INTEREST_META,
  INTEREST_ORDER,
  MAJELIS_FILTER_NONE,
  STATUS_META,
  STATUS_ORDER,
  hasInterest,
  majelisLine,
  matchesMajelis,
  newMajelisFilterValue,
  statusBadge,
  subStateTag,
  type Interest,
  type MainStatus,
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

type MenuId = 'status' | 'interest' | 'majelis' | null

// The roster opens already narrowed to the statuses a BP actively works — the
// won/lost ends (Approved / Disbursed / Rejected) are out of the default view.
const DEFAULT_STATUS: MainStatus[] = ['unqualified', 'qualified', 'submitted']

// Status and Minat are multi-select — an empty set means "all", so these lists
// carry only the real values (no "Semua" row; the Reset link clears them).
const STATUS_OPTIONS: { label: string; value: MainStatus }[] = STATUS_ORDER.map((s) => ({
  label: STATUS_META[s].label,
  value: s,
}))

const INTEREST_OPTIONS: { label: string; value: Interest }[] = INTEREST_ORDER.map((i) => ({
  label: INTEREST_META[i].label,
  value: i,
}))

/** Toggles a value in/out of a multi-select array. */
function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
}

/** The chip label for a multi-select filter: the single choice, or "Name +n". */
function multiLabel<T>(selected: T[], label: (v: T) => string, fallback: string): string {
  if (selected.length === 0) return fallback
  if (selected.length === 1) return label(selected[0])
  return `${label(selected[0])} +${selected.length - 1}`
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

// The interest note as coloured text: green interested, blue undecided, red not.
const INTEREST_TEXT: Record<Interest, string> = {
  interested: 'text-green-600',
  undecided: 'text-blue-600',
  'not-interested': 'text-red-500',
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
  const interest = hasInterest(lead.status) && lead.interest ? lead.interest : null
  // For a Submitted lead the slot under the badge shows the system sub-state.
  const sub = subStateTag(lead)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-8 rounded-12 bg-neutral-white p-12 text-left active:bg-neutral-50"
    >
      {/* Left: name over majelis. */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <span className="truncate text-14 font-bold text-default">{lead.name}</span>
        <span className="truncate text-12 text-caption">{majelisLine(lead)}</span>
      </div>
      {/* Right: the main status, with the interest note (coloured, shown only
          while she is worked) centred beneath the badge. */}
      <div className="flex shrink-0 flex-col items-center gap-4">
        <Badge intent={badge.intent}>{badge.label}</Badge>
        {interest ? (
          <span className={`text-12 font-regular ${INTEREST_TEXT[interest]}`}>
            {INTEREST_META[interest].label}
          </span>
        ) : sub ? (
          <span className="text-12 font-regular text-caption">{sub}</span>
        ) : null}
      </div>
    </button>
  )
}

export function SalesScreen() {
  const flow = useFlow()
  const { leads, order } = usePipeline()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<MainStatus[]>(DEFAULT_STATUS)
  const [interest, setInterest] = useState<Interest[]>([])
  const [majelis, setMajelis] = useState<string | null>(null)
  const [menu, setMenu] = useState<MenuId>(null)

  const all = order.map((id) => leads[id])
  const q = query.trim().toLowerCase()

  const majelisOpts = majelisOptions(all)
  const majelisChipLabel = (value: string): string =>
    majelisOpts.find((o) => o.value === value)?.label ?? 'Majelis'

  const rows = all
    .filter((lead) => {
      if (q && !lead.name.toLowerCase().includes(q)) return false
      if (status.length > 0 && !status.includes(lead.status)) return false
      if (interest.length > 0 && !(lead.interest && interest.includes(lead.interest))) return false
      if (majelis && !matchesMajelis(lead, majelis)) return false
      return true
    })
    .sort(
      (a, b) =>
        STATUS_META[a.status].order - STATUS_META[b.status].order || a.name.localeCompare(b.name),
    )

  const filtered = status.length > 0 || interest.length > 0 || Boolean(majelis)

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
          label={multiLabel(status, (s) => STATUS_META[s].label, 'Status')}
          active={status.length > 0}
          open={menu === 'status'}
          onClick={() => setMenu('status')}
        />
        <FilterChip
          label={multiLabel(interest, (i) => INTEREST_META[i].label, 'Minat')}
          active={interest.length > 0}
          open={menu === 'interest'}
          onClick={() => setMenu('interest')}
        />
        <FilterChip
          label={majelis ? majelisChipLabel(majelis) : 'Majelis'}
          active={Boolean(majelis)}
          open={menu === 'majelis'}
          onClick={() => setMenu('majelis')}
        />
        {filtered ? (
          <ResetLink
            onClick={() => {
              setStatus([])
              setInterest([])
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
          <EmptyState title="Lead tidak ditemukan" body="Coba nama, status, minat, atau majelis lain." />
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
      <MultiOptionSheet
        open={menu === 'interest'}
        title="Minat"
        name="sales-interest"
        options={INTEREST_OPTIONS}
        values={interest}
        onToggle={(v) => setInterest((prev) => toggle(prev, v))}
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
