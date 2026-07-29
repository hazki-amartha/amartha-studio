'use client'

// Agen terdekat — the counters she can walk cash to, reachable from the agent
// road on the settlement screen.
//
// The agent method reconciles against a kode unik she reads out at a desk, so
// it only helps if she knows WHERE a desk is. This is that answer: the two or
// three AmarthaLink counters near today's route, nearest first, each saying how
// far and how late it stays open.
//
// The map is a PLACEHOLDER, not a live map. A prototype that dropped a real
// Google Map here would throw the viewer out of the device frame and can't be
// shown on a laptop with no maps app — so it draws the affordance (a mini-map
// band with pins) and lets the list below it carry the real information. The
// handoff to a real map is the engineer's problem, not the prototype's.

import { Badge, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { AGENT, NEAREST_AGENTS, kmShort } from '../lib/schedule'
import { IconInfo, IconPin, IconStore } from '../lib/icons'
import { SectionTitle } from '../lib/ui'

export function AgentLocatorScreen() {
  const flow = useFlow()

  return (
    <Screen
      topBar={<NavigationHeader title={`Agen ${AGENT.name} terdekat`} onBack={() => flow.back()} />}
    >
      {/* What the list is FOR, said once. She lands here mid-settlement, so the
          line is the instruction, not a description. */}
      <div className="flex items-start gap-8 rounded-8 border border-blue-200 bg-blue-50 px-12 py-8">
        <span className="shrink-0 text-blue-500">
          <IconInfo size={16} />
        </span>
        <span className="min-w-0 flex-1 text-12 text-default">
          Datangi salah satu agen di bawah, tunjukkan kode unik, lalu serahkan uang tunainya.
        </span>
      </div>

      {/* The map, drawn not embedded. Height comes from the band's own padding;
          the roads and pins sit on top of it, so it reads as a location without
          pretending to BE one. */}
      <div className="relative overflow-hidden rounded-12 bg-neutral-100 py-48">
        <span className="absolute left-0 right-0 top-20 h-2 bg-neutral-200" />
        <span className="absolute bottom-16 left-0 right-0 h-2 bg-neutral-200" />
        <span className="absolute bottom-0 left-24 top-0 w-2 bg-neutral-200" />
        <span className="absolute bottom-0 right-32 top-0 w-2 bg-neutral-200" />
        <span className="absolute left-16 top-12 text-primary-500">
          <IconPin size={20} />
        </span>
        <span className="absolute right-24 top-24 text-primary-500">
          <IconPin size={16} />
        </span>
        <span className="absolute bottom-8 left-40 text-primary-500">
          <IconPin size={16} />
        </span>
        <span className="absolute bottom-8 right-8 rounded-full bg-neutral-white px-8 py-2 text-10 text-caption">
          Ilustrasi peta
        </span>
      </div>

      <SectionTitle>Agen terdekat</SectionTitle>
      <div className="flex flex-col gap-8">
        {NEAREST_AGENTS.map((agent, i) => (
          <div
            key={agent.id}
            className="flex items-center gap-12 rounded-12 border border-default bg-neutral-white p-12"
          >
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-primary-50 text-primary-500">
              <IconStore size={20} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-8">
                <span className="truncate text-14 font-bold text-default">Agen · {agent.place}</span>
                {i === 0 ? <Badge intent="primary">Terdekat</Badge> : null}
              </span>
              <span className="truncate text-12 text-caption">{agent.address}</span>
              <span className="mt-2 text-12 text-caption">
                {kmShort(agent.distanceKm)} · Buka s/d {agent.closes}
              </span>
            </div>
            <Badge intent={agent.open ? 'green' : 'neutral'}>{agent.open ? 'Buka' : 'Tutup'}</Badge>
          </div>
        ))}
      </div>
    </Screen>
  )
}
