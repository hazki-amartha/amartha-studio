'use client'

// Mitra — every borrower the BP carries, across every group. In the spirit of the
// A-Partner BP New Concept Mitra tab: a name-first directory, searchable, each row
// carrying the majelis she is in. In this Sales prototype a "Mitra" is a lead who
// has cleared underwriting (status approved); tapping her opens her detail.

import { useState } from 'react'
import { Badge, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { majelisLine, type PipelineLead } from '../lib/pipeline'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { TabBar } from '../lib/tabs'
import { AppScreen, EmptyState, ProductBadge, SearchField, VisitTitle } from '../lib/ui'

function MitraCard({ mitra, onOpen }: { mitra: PipelineLead; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-12 rounded-12 border border-default bg-neutral-white p-12 text-left active:bg-neutral-50"
    >
      <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-14 font-bold text-caption">
        {mitra.name.charAt(0)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="truncate text-16 font-bold text-default">{mitra.name}</span>
        <span className="truncate text-12 text-caption">{majelisLine(mitra)}</span>
        {mitra.product ? (
          <span className="flex pt-2">
            <ProductBadge product={mitra.product} />
          </span>
        ) : null}
      </span>
      <Badge intent="green">Mitra</Badge>
    </button>
  )
}

export function MitraListScreen() {
  const flow = useFlow()
  const { leads, order } = usePipeline()
  const [query, setQuery] = useState('')

  const mitra = order.map((id) => leads[id]).filter((l) => l.status === 'approved')
  const q = query.trim().toLowerCase()
  const rows = mitra.filter((m) => !q || m.name.toLowerCase().includes(q))

  function openMitra(m: PipelineLead) {
    pipelineStore.open(m.id)
    flow.go('calon-mitra')
  }

  return (
    <AppScreen
      topBar={
        <NavigationHeader hideBack title={<VisitTitle title="Mitra" when={`${mitra.length} mitra`} />} />
      }
    >
      <SearchField value={query} onChange={setQuery} placeholder="Cari nama mitra" label="Cari mitra" />

      <div className="flex flex-col gap-8 pb-16">
        {rows.length === 0 ? (
          <EmptyState
            title="Mitra tidak ditemukan"
            body={q ? 'Coba nama lain.' : 'Belum ada mitra — lead yang lolos underwriting muncul di sini.'}
          />
        ) : (
          rows.map((m) => <MitraCard key={m.id} mitra={m} onOpen={() => openMitra(m)} />)
        )}
      </div>

      <TabBar active="mitra-list" />
    </AppScreen>
  )
}
