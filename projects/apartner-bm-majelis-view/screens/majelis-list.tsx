'use client'

// Majelis — the directory, and this direction's front door to the roster.
//
// The schedule answers "what now?". This tab answers "who is Majelis Anggrek,
// and when does it meet?" — the question a BM asks, or a moved visit forces.
// Tapping a group opens the Majelis View roster, NOT the pelayanan: reaching a
// group off-schedule is looking something up, and the roster is the screen that
// answers a look-up (who is in it, who is behind, what each one owes). Starting
// the work is still one deliberate button away, on the roster itself.
//
// That is the whole split this direction makes at L0: schedule → work, directory
// → record. Neither route hides the other; each just opens on what it is for.
//
// It stays a DIRECTORY, not a dashboard — no portfolio percentages, since those
// are BM monitoring numbers and keeping them off the BP's surfaces is a standing
// decision here.
//
// Two ways in, because they answer two different questions. Search is for a
// group the BP can NAME. The filters are for a set she can only describe: "what
// am I doing Kamis", "which ones am I still building". Drafts are the reason
// the second one earns its space — a group being assembled has no kumpulan to
// send her anywhere, so without a filter it only ever surfaces by scrolling.

import { useState } from 'react'
import { NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { BUSINESS_PARTNERS, findBP } from '../lib/bp'
import { MajelisCard } from '../lib/majelis-card'
import { KUMPULAN_DAYS, MAJELIS_DIRECTORY, type MajelisStatus } from '../lib/schedule'
import { store, useApp } from '../lib/store'
import { TabBar } from '../lib/tabs'
import { AppScreen, EmptyState, FilterBar, FilterChip, OptionSheet, ResetLink, SearchField, VisitTitle } from '../lib/ui'

type MenuId = 'day' | 'status' | 'bp' | null

// The BM's filter, and the reason this tab is not the BP's directory: she reads
// eight majelis across three books, and "how is Dewi doing" is a question the
// day filter cannot ask.
const BP_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'Semua BP', value: null },
  ...BUSINESS_PARTNERS.map((bp) => ({ label: bp.name, value: bp.id })),
]

const DAY_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'Semua hari', value: null },
  ...KUMPULAN_DAYS.map((d) => ({ label: d, value: d })),
]

const STATUS_OPTIONS: { label: string; value: MajelisStatus | null }[] = [
  { label: 'Semua status', value: null },
  { label: 'Aktif', value: 'aktif' },
  { label: 'Draft', value: 'draft' },
]

export function MajelisListScreen() {
  const flow = useFlow()
  const s = useApp()
  const [query, setQuery] = useState('')
  const [menu, setMenu] = useState<MenuId>(null)

  const q = query.trim().toLowerCase()
  const groups = MAJELIS_DIRECTORY.filter((m) => {
    if (q && !m.name.toLowerCase().includes(q) && !m.place.toLowerCase().includes(q)) return false
    if (s.majelisDay && m.day !== s.majelisDay) return false
    if (s.majelisStatus && m.status !== s.majelisStatus) return false
    if (s.majelisBp && m.bpId !== s.majelisBp) return false
    return true
  })

  const filtered = Boolean(s.majelisDay || s.majelisStatus || s.majelisBp)

  return (
    <AppScreen
      topBar={
        // The count reads as a subtitle rather than as a figure pinned to the
        // far edge: it is what the title is ABOUT — how many groups she carries
        // — not a second, competing fact.
        <NavigationHeader
          hideBack
          title={<VisitTitle title="Majelis" when={`${MAJELIS_DIRECTORY.length} majelis`} />}
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
          label={s.majelisBp ? findBP(s.majelisBp).name : 'BP'}
          active={Boolean(s.majelisBp)}
          open={menu === 'bp'}
          onClick={() => setMenu('bp')}
        />
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
          {groups.length} dari {MAJELIS_DIRECTORY.length} majelis
        </span>
      ) : null}

      {/* One flat list. It was split into "Hari ini" and "Majelis lain", which
          made the directory answer a question the schedule already owns — and a
          BP who opens this tab is looking a group UP, on whatever day. */}
      {groups.length === 0 ? (
        <EmptyState title="Tidak ada majelis" body="Coba kata kunci atau filter lain." />
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((m) => (
            <MajelisCard
              key={m.id}
              entry={m}
              onOpen={() => {
                store.openMajelisPage(m.id)
                flow.go('majelis')
              }}
            />
          ))}
        </div>
      )}

      <TabBar active="majelis-list" />

      <OptionSheet
        open={menu === 'bp'}
        title="Business Partner"
        name="majelis-bp"
        options={BP_OPTIONS}
        value={s.majelisBp}
        onPick={(v) => {
          store.setMajelisBp(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
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
