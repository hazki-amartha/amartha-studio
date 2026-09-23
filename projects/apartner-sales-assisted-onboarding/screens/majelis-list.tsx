'use client'

// Majelis — the directory, the Majelis tab's front door. Ported from the
// A-Partner BP New Concept prototype: it answers "who is Majelis Seruni, and when
// does it meet?" — a look-up, not a dashboard. Search finds a group by name;
// the day/status filters narrow the set. Tapping a group opens its Majelis page.

import { useState } from 'react'
import { Badge, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import {
  KUMPULAN_DAYS,
  MAJELIS_DIRECTORY,
  shortfallOf,
  type MajelisEntry,
  type MajelisStatus,
} from '../lib/schedule'
import { isCalonMitra } from '../lib/pipeline'
import { usePipeline } from '../lib/pipeline-store'
import { store, useApp } from '../lib/store'
import { TabBar } from '../lib/tabs'
import {
  AppScreen,
  EmptyState,
  FilterBar,
  FilterChip,
  OptionSheet,
  ProductBadge,
  ResetLink,
  SearchField,
  VisitTitle,
} from '../lib/ui'

type MenuId = 'day' | 'status' | null

const DAY_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'Semua hari', value: null },
  ...KUMPULAN_DAYS.map((d) => ({ label: d, value: d })),
]

const STATUS_OPTIONS: { label: string; value: MajelisStatus | null }[] = [
  { label: 'Semua status', value: null },
  { label: 'Aktif', value: 'aktif' },
  { label: 'Draft', value: 'draft' },
]

const DRAFT_PREFIX = 'draft:'

export function MajelisListScreen() {
  const flow = useFlow()
  const s = useApp()
  const { leads, order } = usePipeline()
  const [query, setQuery] = useState('')
  const [menu, setMenu] = useState<MenuId>(null)

  // New (draft) majelis being formed from onboarding leads — one per new-majelis
  // name, synthesized so the directory shows groups that aren't in the registry
  // yet. Each carries how many calon mitra are gathering under it.
  const draftCounts = new Map<string, number>()
  order
    .map((id) => leads[id])
    .filter((l) => isCalonMitra(l) && l.majelis.kind === 'new')
    .forEach((l) => {
      const name = l.majelis.kind === 'new' ? l.majelis.name : ''
      draftCounts.set(name, (draftCounts.get(name) ?? 0) + 1)
    })
  const draftEntries: MajelisEntry[] = [...draftCounts].map(([name, members]) => ({
    id: `${DRAFT_PREFIX}${name}`,
    name,
    place: 'Majelis baru — belum aktif',
    day: '-',
    time: '-',
    members,
    menunggak: 0,
    type: 'Modal',
    status: 'draft',
  }))
  const allGroups = [...draftEntries, ...MAJELIS_DIRECTORY]

  const q = query.trim().toLowerCase()
  const groups = allGroups.filter((m) => {
    if (q && !m.name.toLowerCase().includes(q) && !m.place.toLowerCase().includes(q)) return false
    if (s.majelisDay && m.day !== s.majelisDay) return false
    if (s.majelisStatus && m.status !== s.majelisStatus) return false
    return true
  })

  const filtered = Boolean(s.majelisDay || s.majelisStatus)

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          hideBack
          title={<VisitTitle title="Majelis" when={`${allGroups.length} majelis`} />}
        />
      }
    >
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Cari majelis atau lokasi"
        label="Cari majelis"
      />

      <FilterBar>
        <FilterChip
          label={s.majelisDay ?? 'Hari kumpulan'}
          active={Boolean(s.majelisDay)}
          open={menu === 'day'}
          onClick={() => setMenu('day')}
        />
        <FilterChip
          label={s.majelisStatus === 'draft' ? 'Draft' : s.majelisStatus ? 'Aktif' : 'Status'}
          active={Boolean(s.majelisStatus)}
          open={menu === 'status'}
          onClick={() => setMenu('status')}
        />
        {filtered ? <ResetLink onClick={() => store.resetMajelisFilters()} /> : null}
      </FilterBar>

      {q || filtered ? (
        <span className="text-12 text-caption">
          {groups.length} dari {allGroups.length} majelis
        </span>
      ) : null}

      {groups.length === 0 ? (
        <EmptyState title="Tidak ada majelis" body="Coba kata kunci atau filter lain." />
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((m) => (
            <Row
              key={m.id}
              entry={m}
              onOpen={() => {
                store.openMajelisPage(
                  m.id.startsWith(DRAFT_PREFIX)
                    ? { kind: 'draft', name: m.name }
                    : { kind: 'existing', id: m.id },
                )
                flow.go('majelis-page')
              }}
            />
          ))}
        </div>
      )}

      <TabBar active="majelis-list" />

      <OptionSheet
        open={menu === 'day'}
        title="Hari kumpulan"
        name="majelis-day"
        options={DAY_OPTIONS}
        value={s.majelisDay}
        onPick={(v) => {
          store.setMajelisDay(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'status'}
        title="Status majelis"
        name="majelis-status"
        options={STATUS_OPTIONS}
        value={s.majelisStatus}
        onPick={(v) => {
          store.setMajelisStatus(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
    </AppScreen>
  )
}

/** The directory row: name, place, when it meets, then what it is. */
function Row({ entry, onOpen }: { entry: MajelisEntry; onOpen: () => void }) {
  const draft = entry.status === 'draft'
  const short = shortfallOf(entry)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-4 rounded-12 border border-default bg-neutral-white p-12 text-left active:bg-neutral-50"
    >
      <span className="flex items-start gap-8">
        <span className="min-w-0 flex-1 text-16 font-bold text-default">{entry.name}</span>
        <span className="flex shrink-0">
          <StatusBadge entry={entry} />
        </span>
      </span>
      <span className="line-clamp-2 text-14 font-regular text-default">{entry.place}</span>
      <span className="text-14 font-regular text-caption">
        {entry.day}, {entry.time} · {entry.members} mitra
      </span>
      <span className="flex flex-wrap items-center gap-4 pt-2">
        <ProductBadge product={entry.type} />
      </span>
      {draft ? (
        <span className="text-12 font-bold text-orange-500">Kurang {short} mitra untuk aktif</span>
      ) : null}
    </button>
  )
}

/** One badge, three states, in priority order. */
function StatusBadge({ entry }: { entry: MajelisEntry }) {
  if (entry.status === 'draft') return <Badge intent="yellow">Draft</Badge>
  if (entry.menunggak > 0) return <Badge intent="orange">{entry.menunggak} Mitra DPD</Badge>
  return <Badge intent="green">Lancar</Badge>
}
