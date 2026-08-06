'use client'

// Where a counter is — the destination behind "Buka Peta" on an agent row.
//
// The map is a PLACEHOLDER, and deliberately so. A real embedded map throws the
// viewer out of the device frame and cannot be shown at all on a laptop with no
// maps app, so this draws the affordance — a band with roads and pins — and
// lets the address underneath carry the information that actually gets her
// there. Handing off to a real map is the engineer's problem, not the
// prototype's (CLAUDE.md §3).
//
// It carries no single agent's name because the row that opened it does not
// travel: screens take no props and remount on navigation, and parking a
// selected counter in the store to label an illustration would be real state
// bought for a caption.

import { NavigationHeader } from '@/design-system/components'
import { MapPin } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { AGENT, NEAREST_AGENTS, kmShort } from '../lib/schedule'
import { AppScreen, SectionTitle } from '../lib/ui'

export function AgentMapScreen() {
  const flow = useFlow()

  return (
    <AppScreen
      topBar={<NavigationHeader title={`Peta Agen ${AGENT.name}`} onBack={() => flow.back()} />}
    >
      {/* Drawn, not embedded. Height comes from the band's own padding; the
          roads and pins sit on top, so it reads as a location without
          pretending to BE one. */}
      <div className="relative overflow-hidden rounded-12 bg-neutral-100 py-48">
        <span className="absolute left-0 right-0 top-20 h-2 bg-neutral-200" />
        <span className="absolute bottom-16 left-0 right-0 h-2 bg-neutral-200" />
        <span className="absolute bottom-0 left-24 top-0 w-2 bg-neutral-200" />
        <span className="absolute bottom-0 right-32 top-0 w-2 bg-neutral-200" />
        <span className="absolute left-16 top-12 text-primary-500">
          <MapPin size={20} />
        </span>
        <span className="absolute right-24 top-24 text-primary-500">
          <MapPin size={16} />
        </span>
        <span className="absolute bottom-8 left-40 text-primary-500">
          <MapPin size={16} />
        </span>
        <span className="absolute bottom-8 right-8 rounded-full bg-neutral-white px-8 py-2 text-10 text-caption">
          Ilustrasi peta
        </span>
      </div>

      {/* The addresses in full, unabbreviated. This is the page she reads out
          to someone giving directions, so nothing here truncates. */}
      <SectionTitle>Alamat agen</SectionTitle>
      <div className="rounded-12 bg-neutral-white">
        {NEAREST_AGENTS.map((agent, i) => (
          <div
            key={agent.id}
            className={`flex flex-col gap-2 px-12 py-12 ${i === 0 ? '' : 'border-t border-default'}`}
          >
            <span className="text-14 font-bold text-default">{agent.place}</span>
            <span className="text-12 text-caption">{agent.address}</span>
            <span className="text-12 text-caption">
              {kmShort(agent.distanceKm)} · Buka {agent.hours}
            </span>
          </div>
        ))}
      </div>
    </AppScreen>
  )
}
