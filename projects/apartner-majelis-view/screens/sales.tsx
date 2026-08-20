'use client'

// Sales — the BP's lead pipeline, as one filterable roster.
//
// This is the record side of selling: every prospect she is carrying toward a
// first loan, at whatever point in the line she left them. The list leads with
// STATUS because the status is the next thing she has to do about a lead —
// "Baru" means call her, "Tertarik" means submit within two days, "Diajukan"
// means wait. Colour carries it before the word does.
//
// Two filters, the same split as the Mitra tab: by status (where a lead is in
// the pipeline) and by majelis (which group she is bound for — an existing one,
// a new one being formed, or none yet). Search is for a woman she can name.

import { useState } from 'react'
import { Badge, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { MAJELIS_DIRECTORY } from '../lib/schedule'
import {
  MAJELIS_FILTER_NONE,
  SOURCE_LABEL,
  STATUS_FILTERS,
  STATUS_META,
  majelisLine,
  matchesMajelis,
  matchesStatusFilter,
  newMajelisFilterValue,
  statusBadge,
  type PipelineLead,
  type StatusFilter,
} from '../lib/pipeline'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { TabBar } from '../lib/tabs'
import {
  AppScreen,
  Avatar,
  EmptyState,
  FilterBar,
  FilterChip,
  OptionSheet,
  ResetLink,
  SearchField,
  VisitTitle,
} from '../lib/ui'

type MenuId = 'status' | 'majelis' | null

const STATUS_OPTIONS: { label: string; value: StatusFilter | null }[] = [
  { label: 'Semua status', value: null },
  ...STATUS_FILTERS,
]

const statusChipLabel = (value: StatusFilter): string =>
  STATUS_FILTERS.find((o) => o.value === value)?.label ?? 'Status'

/**
 * The majelis filter options, from the leads on screen: every active group,
 * then one entry per NEW majelis (by its own name, marked "(Baru)"), then the
 * unassigned bucket. New majelis are listed individually rather than under one
 * "Majelis baru" bucket so each forming group filters like a real one.
 */
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

function SalesRow({ lead, onOpen }: { lead: PipelineLead; onOpen: () => void }) {
  const badge = statusBadge(lead)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-12 rounded-12 bg-neutral-white p-12 text-left active:bg-neutral-50"
    >
      <Avatar name={lead.name} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="truncate text-14 font-bold text-default">{lead.name}</span>
        {/* Three stacked lines: name, the majelis she is bound for (a forming
            one reads "… (Baru)"), then where she came from on its own line. */}
        <span className="truncate text-12 text-caption">{majelisLine(lead)}</span>
        <span className="truncate text-12 text-caption">{SOURCE_LABEL[lead.source]}</span>
      </div>
      {/* Status pinned to the right edge, like the DPD badge on a mitra card.
          A finished lead reads as its result — "Berhasil" or "Gagal". */}
      <div className="flex shrink-0">
        <Badge intent={badge.intent}>{badge.label}</Badge>
      </div>
    </button>
  )
}

export function SalesScreen() {
  const flow = useFlow()
  const { leads, order } = usePipeline()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter | null>(null)
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
      if (status && !matchesStatusFilter(lead, status)) return false
      if (majelis && !matchesMajelis(lead, majelis)) return false
      return true
    })
    // Actionable first: Baru and Tertarik up top, closed leads at the bottom;
    // name breaks ties within a status.
    .sort(
      (a, b) =>
        STATUS_META[a.status].order - STATUS_META[b.status].order ||
        a.name.localeCompare(b.name),
    )

  const filtered = Boolean(status || majelis)

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          hideBack
          title={<VisitTitle title="Sales" when={`${all.length} lead`} />}
        />
      }
    >
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Cari nama lead"
        label="Cari lead"
      />

      <FilterBar>
        <FilterChip
          label={status ? statusChipLabel(status) : 'Status'}
          active={Boolean(status)}
          open={menu === 'status'}
          onClick={() => setMenu('status')}
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
              setStatus(null)
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
          <EmptyState title="Lead tidak ditemukan" body="Coba nama, status, atau majelis lain." />
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

      <TabBar active="sales" />

      <OptionSheet
        open={menu === 'status'}
        title="Status lead"
        name="sales-status"
        options={STATUS_OPTIONS}
        value={status}
        onPick={(v) => {
          setStatus(v)
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
