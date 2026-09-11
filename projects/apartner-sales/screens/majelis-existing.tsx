'use client'

// Pilih Majelis Existing — reached from the Continue application / Change majelis
// sheet when the BP picks "Majelis existing". She searches the active majelis and
// taps one; that creates the "Perkenalan" follow-up task and returns to the
// Sales board with a confirmation snackbar.

import { useState } from 'react'
import { NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { MAJELIS_DIRECTORY } from '../lib/schedule'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { ChevronRow } from '../lib/pipeline-ui'
import { AppScreen, SearchField } from '../lib/ui'

export function MajelisExistingScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  const [query, setQuery] = useState('')

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Pilih Majelis" onBack={() => flow.back()} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const q = query.trim().toLowerCase()
  const majelis = MAJELIS_DIRECTORY.filter(
    (g) => g.status === 'aktif' && g.name.toLowerCase().includes(q),
  )

  function pick(id: string) {
    pipelineStore.createKumpulanFollowUp(lead.id, { kind: 'existing', id })
    pipelineStore.setFlash('Task to Follow up for Kumpulan Day has been created')
    flow.go('sales')
  }

  return (
    <AppScreen topBar={<NavigationHeader title="Pilih Majelis" onBack={() => flow.back()} />}>
      <div className="flex flex-col gap-12">
        <SearchField value={query} onChange={setQuery} placeholder="Cari majelis" label="Cari majelis" />
        <div className="flex flex-col gap-8">
          {majelis.map((g) => (
            <ChevronRow key={g.id} title={g.name} description={g.place} onClick={() => pick(g.id)} />
          ))}
          {majelis.length === 0 ? (
            <span className="px-4 py-8 text-12 text-caption">Majelis tidak ditemukan.</span>
          ) : null}
        </div>
      </div>
    </AppScreen>
  )
}
