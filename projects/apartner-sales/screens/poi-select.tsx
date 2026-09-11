'use client'

// Pilih POI — the dedicated page shown when a new lead's source is POI Visit.
// The BP searches the POI roster and picks one; the choice fills the source and
// opens the New lead form.

import { useState } from 'react'
import { NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { POI_LIST } from '../lib/pipeline'
import { getAddLeadEntry, setAddLeadEntry } from '../lib/pipeline-store'
import { ChevronRow } from '../lib/pipeline-ui'
import { AppScreen, SearchField } from '../lib/ui'

export function PoiSelectScreen() {
  const flow = useFlow()
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const rows = POI_LIST.filter((p) => !q || p.toLowerCase().includes(q))

  function pick(poi: string) {
    const entry = getAddLeadEntry()
    setAddLeadEntry({
      ...entry,
      source: { source: 'poi', poi, referredBy: '', referrerKind: null },
    })
    flow.go('lead-new')
  }

  return (
    <AppScreen topBar={<NavigationHeader title="Pilih POI" onBack={() => flow.back()} />}>
      <SearchField value={query} onChange={setQuery} placeholder="Cari POI" label="Cari POI" />

      <div className="flex flex-col gap-8 pb-16">
        {rows.map((p) => (
          <ChevronRow key={p} title={p} onClick={() => pick(p)} />
        ))}
        {rows.length === 0 ? (
          <span className="px-4 py-8 text-12 text-caption">POI tidak ditemukan.</span>
        ) : null}
      </div>
    </AppScreen>
  )
}
