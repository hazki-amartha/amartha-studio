'use client'

// One task group, opened off the Sales page — the flat list, but only of the
// work the BP just said she was doing.
//
// The cards are the same ones the roster used to show, and they keep the four
// facts that earned their place: the slot it is due, the status top-right, where
// she came from, and how long she has been waiting. What is gone is the sort by
// status: inside a group every row is the same KIND of work, so the only
// ordering that helps is the one that says who has been waiting longest.
//
// POI Visit is the exception, and it has to be: its rows are places, not people.

import { useState } from 'react'
import { NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { EVENTS, type SosialisasiEvent } from '../lib/events'
import {
  AGING_BUCKETS,
  STATUS_META,
  SURVEY_MODE_LABEL,
  TASK_META,
  ageLabel,
  agendaLine,
  inAgingBucket,
  sourceDetail,
  taskOf,
  type PipelineLead,
} from '../lib/pipeline'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { store } from '../lib/store'
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

const AGING_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'Semua umur', value: null },
  ...AGING_BUCKETS.map((b) => ({ label: b.label, value: b.value as string | null })),
]

/**
 * The status colour, as text rather than a badge. A badge on every row turns the
 * column into a strip of pills that all shout equally; plain coloured text still
 * reads as a word first.
 */
const STATUS_TONE: Record<string, string> = {
  blue: 'text-blue-500',
  green: 'text-green-500',
  orange: 'text-orange-500',
  red: 'text-red-500',
  yellow: 'text-orange-500',
}

function Row({ onOpen, children }: { onOpen: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-8 overflow-hidden rounded-12 border border-default bg-neutral-white p-12 text-left active:bg-neutral-50"
    >
      {children}
    </button>
  )
}

function LeadCard({ lead, onOpen }: { lead: PipelineLead; onOpen: () => void }) {
  const meta = STATUS_META[lead.status]
  // The survey mode rides UNDER the status rather than beside it: "Survey
  // created (Assisted)" is one fact with a qualifier, and putting the qualifier
  // on its own line keeps the status word scannable down a column.
  const mode =
    lead.status === 'survey-created' && lead.surveyMode
      ? `(${SURVEY_MODE_LABEL[lead.surveyMode]})`
      : null

  return (
    <Row onOpen={onOpen}>
      <div className="flex w-full items-start gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="truncate text-12 text-caption">
            {lead.agenda ? agendaLine(lead.agenda) : 'Belum dijadwalkan'}
          </span>
          <span className="truncate text-16 font-bold text-default">{lead.name}</span>
          <span className="truncate text-12 text-caption">{sourceDetail(lead)}</span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 pl-8">
          <span className={`text-right text-12 font-bold ${STATUS_TONE[meta.intent]}`}>
            {meta.label}
          </span>
          {mode ? <span className="text-right text-12 text-caption">{mode}</span> : null}
        </div>
      </div>
      {/* A real footer: pulled to the card's edges (negating the p-12) so it
          seats flush against the corners. */}
      <span className="-mx-12 -mb-12 border-t border-default px-12 py-8 text-12 text-caption">
        leads age: {ageLabel(lead.ageDays)}
      </span>
    </Row>
  )
}

function PoiCard({ event, onOpen }: { event: SosialisasiEvent; onOpen: () => void }) {
  return (
    <Row onOpen={onOpen}>
      <div className="flex w-full min-w-0 flex-col gap-2">
        <span className="truncate text-12 text-caption">
          {event.agenda ? agendaLine(event.agenda) : 'Belum dijadwalkan'}
        </span>
        <span className="truncate text-16 font-bold text-default">{event.title}</span>
        <span className="truncate text-12 text-caption">POI Type: {event.poiType}</span>
      </div>
    </Row>
  )
}

export function TaskGroupScreen() {
  const flow = useFlow()
  const { leads, order, openTask } = usePipeline()
  const [query, setQuery] = useState('')
  const [aging, setAging] = useState<string | null>(null)
  const [menu, setMenu] = useState<'aging' | null>(null)

  const meta = TASK_META[openTask]
  const q = query.trim().toLowerCase()
  const isPoi = openTask === 'poi-visit'

  const rows = order
    .map((id) => leads[id])
    .filter((lead) => {
      if (taskOf(lead) !== openTask) return false
      if (q && !lead.name.toLowerCase().includes(q) && !sourceDetail(lead).toLowerCase().includes(q))
        return false
      if (aging && !inAgingBucket(lead.ageDays, aging)) return false
      return true
    })
    // Longest-waiting first. Inside one kind of work, age is the only thing that
    // separates two rows — and the oldest is the one about to be lost.
    .sort((a, b) => b.ageDays - a.ageDays)

  const poiRows = EVENTS.filter((e) => e.agenda).filter(
    (e) => !q || e.title.toLowerCase().includes(q),
  )

  const count = isPoi ? poiRows.length : rows.length

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title={
            <VisitTitle
              title={meta.label}
              when={isPoi ? `${count} kunjungan` : `${count} lead`}
            />
          }
          onBack={() => flow.go('sales-b')}
        />
      }
    >
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder={isPoi ? 'Cari titik POI' : 'Cari nama atau sumber'}
        label={isPoi ? 'Cari POI' : 'Cari lead'}
      />

      {/* Aging is the only filter left in here. Status, source and task type are
          all either fixed by the group or nearly so, and a filter bar full of
          controls that cannot change the result is worse than no bar at all. */}
      {isPoi ? null : (
        <FilterBar>
          <FilterChip
            label="Aging"
            active={Boolean(aging)}
            open={menu === 'aging'}
            onClick={() => setMenu('aging')}
          />
          {aging ? <ResetLink onClick={() => setAging(null)} /> : null}
        </FilterBar>
      )}

      <span className="text-12 text-caption">{meta.flow}</span>

      <div className="flex flex-col gap-8 pb-16">
        {count === 0 ? (
          <EmptyState
            title="Tidak ada tugas di sini"
            body={
              aging || q
                ? 'Coba umur lead lain, atau kosongkan pencarian.'
                : 'Semua tugas di grup ini sudah dikerjakan.'
            }
          />
        ) : null}

        {isPoi
          ? poiRows.map((e) => (
              <PoiCard
                key={e.id}
                event={e}
                onOpen={() => {
                  store.openSosialisasi(e.id)
                  flow.go('sosialisasi')
                }}
              />
            ))
          : rows.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onOpen={() => {
                  pipelineStore.open(lead.id)
                  flow.go('lead-detail')
                }}
              />
            ))}
      </div>

      <OptionSheet
        open={menu === 'aging'}
        title="Aging"
        name="group-aging"
        options={AGING_OPTIONS}
        value={aging}
        onPick={(v) => {
          setAging(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
    </AppScreen>
  )
}
