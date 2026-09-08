'use client'

// Sales — the BP's Sales work, as a schedule rather than a directory.
//
// The page opens on what she is doing at 14.00, not on an alphabetical roster of
// everyone she has ever met. So the list is her AGENDA: leads to work and POI
// visits to run, interleaved, grouped into Hari ini and Akan datang. The two
// kinds of card sit in the same stream because they compete for the same
// afternoon — a sosialisasi at 14.00 and a lead due at 14.00 are one decision.
//
// Each lead card carries four facts, and each earns its place:
//
//   the slot      when it is due — the reason the card is on today's list
//   the status    where she is in the funnel, top-right where the eye lands
//   the source    which POI or referral she came from, the BP's own shorthand
//   leads age     how long she has been waiting — the only number on the card
//                 that gets worse on its own, which is why it has its own filter
//
// Leads with nothing scheduled fall into a third group at the bottom rather than
// out of the list: an unscheduled lead is exactly the one that gets forgotten,
// so hiding it would make the page lie about the size of her pipeline.

import { useState } from 'react'
import { BottomSheet, Button, NavigationHeader, SelectableCard } from '@/design-system/components'
import { Plus } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { EVENTS, type SosialisasiEvent } from '../lib/events'
import {
  ACTIVE_STATUSES,
  AGING_BUCKETS,
  STATUS_META,
  STATUS_ORDER,
  SURVEY_MODE_LABEL,
  ageLabel,
  agendaLine,
  inAgingBucket,
  sourceDetail,
  type AgendaDay,
  type LeadStatus,
  type PipelineLead,
} from '../lib/pipeline'
import { pipelineStore, setAddLeadEntry, usePipeline } from '../lib/pipeline-store'
import { store } from '../lib/store'
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

type MenuId = 'jenis' | 'aging' | 'status' | 'schedule' | null

/** What kind of work a card is. The "Jenis tugas" filter picks between them. */
type Jenis = 'lead' | 'poi'

const JENIS_OPTIONS: { label: string; value: Jenis | null }[] = [
  { label: 'Semua tugas', value: null },
  { label: 'Lead', value: 'lead' },
  { label: 'Sosialisasi POI', value: 'poi' },
]

const AGING_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'Semua umur', value: null },
  ...AGING_BUCKETS.map((b) => ({ label: b.label, value: b.value as string | null })),
]

const SCHEDULE_OPTIONS: { label: string; value: AgendaDay | 'none' | null }[] = [
  { label: 'Semua jadwal', value: null },
  { label: 'Hari ini', value: 'today' },
  { label: 'Akan datang', value: 'upcoming' },
  { label: 'Belum dijadwalkan', value: 'none' },
]

// Status is multi-select — an empty set means "all", so this list carries only
// the real values (no "Semua" row; the Reset link clears them). The picker uses
// the LONG names from the model ("Contacted: Interested"); the card uses the
// short one, because a prefix repeated down ten rows is not information.
const STATUS_OPTIONS: { label: string; value: LeadStatus }[] = STATUS_ORDER.map((s) => ({
  label: STATUS_META[s].full,
  value: s,
}))

/** The roster opens narrowed to the statuses a BP actively works. */
const DEFAULT_STATUS: LeadStatus[] = ACTIVE_STATUSES

/** Toggles a value in/out of a multi-select array. */
function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
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

/** The shell both card kinds share: one tappable box, same padding, same edges. */
function AgendaCard({ onOpen, children }: { onOpen: () => void; children: React.ReactNode }) {
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
  // on its own line keeps the status word itself scannable down a column.
  const mode = lead.status === 'survey-created' && lead.surveyMode
    ? `(${SURVEY_MODE_LABEL[lead.surveyMode]})`
    : null

  return (
    <AgendaCard onOpen={onOpen}>
      <div className="flex w-full items-start gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* The slot first, in caption grey: it is the reason this card is on
              today's list, and it reads before the name the way a diary does. */}
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
      {/* A real footer: pulled to the card's edges (negating the p-12) and
          rounded only at the bottom so it seats flush against the corners. */}
      <span className="-mx-12 -mb-12 border-t border-default px-12 py-8 text-12 text-caption">
        leads age: {ageLabel(lead.ageDays)}
      </span>
    </AgendaCard>
  )
}

function PoiCard({ event, onOpen }: { event: SosialisasiEvent; onOpen: () => void }) {
  return (
    <AgendaCard onOpen={onOpen}>
      <div className="flex w-full min-w-0 flex-col gap-2">
        <span className="truncate text-12 text-caption">
          {event.agenda ? agendaLine(event.agenda) : 'Belum dijadwalkan'}
        </span>
        <span className="truncate text-16 font-bold text-default">{event.title}</span>
        <span className="truncate text-12 text-caption">POI Type: {event.poiType}</span>
      </div>
    </AgendaCard>
  )
}

/**
 * The status colour, as text rather than a badge. The wireframe puts the status
 * top-right as plain type, and it is right to: a badge on every row turns the
 * column into a strip of coloured pills that all shout equally, where plain
 * coloured text still reads as a word first.
 */
const STATUS_TONE: Record<string, string> = {
  blue: 'text-blue-500',
  green: 'text-green-500',
  orange: 'text-orange-500',
  red: 'text-red-500',
  yellow: 'text-orange-500',
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <span className="pt-4 text-16 font-bold text-default">{children}</span>
}

export function SalesScreen() {
  const flow = useFlow()
  const { leads, order } = usePipeline()
  const [query, setQuery] = useState('')
  const [jenis, setJenis] = useState<Jenis | null>(null)
  const [aging, setAging] = useState<string | null>(null)
  const [status, setStatus] = useState<LeadStatus[]>(DEFAULT_STATUS)
  const [schedule, setSchedule] = useState<AgendaDay | 'none' | null>(null)
  const [menu, setMenu] = useState<MenuId>(null)

  const all = order.map((id) => leads[id])
  const pois = EVENTS.filter((e) => e.agenda)
  const q = query.trim().toLowerCase()
  // The page opens with the active statuses pre-selected, so "the BP has cut by
  // status" means she has moved OFF that default — not merely that a set exists.
  const statusNarrowed =
    status.length !== DEFAULT_STATUS.length || status.some((s) => !DEFAULT_STATUS.includes(s))

  const leadRows = all.filter((lead) => {
    if (jenis === 'poi') return false
    if (q && !lead.name.toLowerCase().includes(q) && !sourceDetail(lead).toLowerCase().includes(q))
      return false
    if (status.length > 0 && !status.includes(lead.status)) return false
    if (aging && !inAgingBucket(lead.ageDays, aging)) return false
    if (schedule === 'none' && lead.agenda) return false
    if (schedule && schedule !== 'none' && lead.agenda?.day !== schedule) return false
    return true
  })

  // Status and aging are properties of a LEAD; a POI visit has neither. Rather
  // than pretend a sosialisasi qualifies under "Interested", either filter takes
  // the POI cards off the list — the BP has asked a question about leads.
  const poiRows = pois.filter((e) => {
    if (jenis === 'lead') return false
    if (aging !== null) return false
    if (statusNarrowed) return false
    if (q && !e.title.toLowerCase().includes(q)) return false
    if (schedule === 'none') return false
    if (schedule && e.agenda?.day !== schedule) return false
    return true
  })

  // One stream, sorted by slot, then split into the two days plus the unscheduled.
  type Row = { key: string; day: AgendaDay | 'none'; order: number; node: React.ReactNode }
  const rows: Row[] = [
    ...poiRows.map((e) => ({
      key: `poi-${e.id}`,
      day: e.agenda?.day ?? ('none' as const),
      order: e.agenda?.order ?? 99,
      node: (
        <PoiCard
          event={e}
          onOpen={() => {
            store.openSosialisasi(e.id)
            flow.go('sosialisasi')
          }}
        />
      ),
    })),
    ...leadRows.map((lead) => ({
      key: `lead-${lead.id}`,
      day: lead.agenda?.day ?? ('none' as const),
      order: lead.agenda?.order ?? 99,
      node: (
        <LeadCard
          lead={lead}
          onOpen={() => {
            pipelineStore.open(lead.id)
            flow.go('lead-detail')
          }}
        />
      ),
    })),
  ].sort((a, b) => a.order - b.order)

  const groups: { day: AgendaDay | 'none'; title: string }[] = [
    { day: 'today', title: 'Hari ini' },
    { day: 'upcoming', title: 'Akan datang' },
    { day: 'none', title: 'Belum dijadwalkan' },
  ]

  const filtered =
    Boolean(jenis) || Boolean(aging) || Boolean(schedule) || status.length !== DEFAULT_STATUS.length

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          hideBack
          title={<VisitTitle title="Sales" when={`${all.length} leads & ${EVENTS.length} POI`} />}
        />
      }
    >
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Cari tugas, leads"
        label="Cari tugas atau lead"
      />

      <FilterBar>
        <FilterChip
          label="Jenis tugas"
          active={Boolean(jenis)}
          open={menu === 'jenis'}
          onClick={() => setMenu('jenis')}
        />
        <FilterChip
          label="Aging"
          active={Boolean(aging)}
          open={menu === 'aging'}
          onClick={() => setMenu('aging')}
        />
        <FilterChip
          label={status.length > 0 ? `Leads Status (${status.length})` : 'Leads Status'}
          active={status.length > 0}
          open={menu === 'status'}
          onClick={() => setMenu('status')}
        />
        <FilterChip
          label="Schedule"
          active={Boolean(schedule)}
          open={menu === 'schedule'}
          onClick={() => setMenu('schedule')}
        />
        {filtered ? (
          <ResetLink
            onClick={() => {
              setJenis(null)
              setAging(null)
              setStatus(DEFAULT_STATUS)
              setSchedule(null)
            }}
          />
        ) : null}
      </FilterBar>

      <div className="flex flex-col gap-8 pb-16">
        {rows.length === 0 ? (
          <EmptyState title="Tidak ada tugas" body="Coba ubah jenis tugas, status, umur lead, atau jadwal." />
        ) : null}
        {groups.map((g) => {
          const inGroup = rows.filter((r) => r.day === g.day)
          if (inGroup.length === 0) return null
          return (
            <div key={g.day} className="flex flex-col gap-8">
              <SectionHeading>{g.title}</SectionHeading>
              {inGroup.map((r) => (
                <div key={r.key}>{r.node}</div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Add lead is a floating action, bottom-right, above the nav. */}
      <TabBar
        active="sales"
        action={
          <Button
            size="sm"
            className="shadow-lg"
            onClick={() => {
              setAddLeadEntry({ mode: 'save', draft: null })
              flow.go('lead-new')
            }}
          >
            <span className="flex items-center gap-4">
              <Plus size={16} />
              Add lead
            </span>
          </Button>
        }
      />

      <OptionSheet
        open={menu === 'jenis'}
        title="Jenis tugas"
        name="sales-jenis"
        options={JENIS_OPTIONS}
        value={jenis}
        onPick={(v) => {
          setJenis(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'aging'}
        title="Aging"
        name="sales-aging"
        options={AGING_OPTIONS}
        value={aging}
        onPick={(v) => {
          setAging(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
      <MultiOptionSheet
        open={menu === 'status'}
        title="Leads Status"
        name="sales-status"
        options={STATUS_OPTIONS}
        values={status}
        onToggle={(v) => setStatus((prev) => toggle(prev, v))}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'schedule'}
        title="Schedule"
        name="sales-schedule"
        options={SCHEDULE_OPTIONS}
        value={schedule}
        onPick={(v) => {
          setSchedule(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
    </AppScreen>
  )
}
