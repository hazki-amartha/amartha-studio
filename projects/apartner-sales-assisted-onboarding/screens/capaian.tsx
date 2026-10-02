'use client'

// Capaian hari ini — a full page (not a sheet) of the day's achievement
// categories. Each expands to the leads behind it; tapping a lead opens its
// record. A "Lihat capaian bulanan" card opens a monthly view (empty for now).

import { useState } from 'react'
import { ChevronRight } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { leadDetailTarget, sourceDetail } from '../lib/pipeline'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { TODAY_ACTIVITY } from '../lib/today-activity'
import { AppScreen, EmptyState } from '../lib/ui'

function CloseHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-default bg-neutral-white px-16 py-12">
      <span className="text-18 font-bold text-default">{title}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup"
        className="-mr-4 flex h-32 w-32 items-center justify-center text-default"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </header>
  )
}

export function CapaianScreen() {
  const flow = useFlow()
  const { leads } = usePipeline()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [view, setView] = useState<'harian' | 'bulanan'>('harian')

  const toggle = (k: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })

  function openLead(leadId: string) {
    const lead = leads[leadId]
    if (!lead) return
    pipelineStore.open(lead.id)
    flow.go(leadDetailTarget(lead))
  }

  // Monthly — a plain page for now.
  if (view === 'bulanan') {
    return (
      <AppScreen topBar={<CloseHeader title="Capaian bulanan" onClose={() => setView('harian')} />}>
        <EmptyState title="Belum ada data" body="Capaian bulanan akan segera hadir." />
      </AppScreen>
    )
  }

  return (
    <AppScreen topBar={<CloseHeader title="Capaian hari ini" onClose={() => flow.back()} />}>
      <div className="flex flex-col gap-12">
        {TODAY_ACTIVITY.map((cat) => {
          const isOpen = expanded.has(cat.key)
          return (
            <div
              key={cat.key}
              className="overflow-hidden rounded-12 border border-default bg-neutral-white"
            >
              <div className="flex items-center gap-12 p-12">
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="text-14 font-bold text-default">
                    {cat.label}: <span className="text-blue-600">{cat.items.length}</span>
                  </span>
                  {cat.target != null ? (
                    <span className="text-12 text-caption">Target: {cat.target}</span>
                  ) : null}
                </span>
                <button
                  type="button"
                  onClick={() => toggle(cat.key)}
                  className="shrink-0 text-12 font-bold text-link"
                >
                  {isOpen ? 'Tutup' : 'Lihat'}
                </button>
              </div>
              {isOpen ? (
                <div className="flex flex-col border-t border-default">
                  {cat.items.map((it) => {
                    const lead = leads[it.leadId]
                    return (
                      <button
                        key={`${it.leadId}-${it.name}`}
                        type="button"
                        onClick={() => openLead(it.leadId)}
                        className="flex items-center gap-8 border-b border-default px-12 py-8 text-left last:border-b-0 active:bg-neutral-50"
                      >
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="text-14 font-bold text-link underline">{it.name}</span>
                          <span className="text-12 text-caption">
                            {lead ? sourceDetail(lead) : ''}
                          </span>
                        </span>
                        <span className="shrink-0 text-disabled">
                          <ChevronRight size={16} />
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}

        <div className="border-t border-default pt-12">
          {/* Monthly capaian — opens its own (empty for now) page. */}
          <button
            type="button"
            onClick={() => setView('bulanan')}
            className="flex w-full items-center gap-8 rounded-12 border border-blue-200 bg-blue-50 p-12 text-left active:bg-blue-100"
          >
            <span className="min-w-0 flex-1 text-14 font-bold text-blue-600">
              Lihat capaian bulanan
            </span>
            <span className="shrink-0 text-blue-600">
              <ChevronRight size={20} />
            </span>
          </button>
        </div>
      </div>
    </AppScreen>
  )
}
