'use client'

// The AmarthaLink counters, as one card of ruled rows.
//
// It lives in lib/ because TWO screens draw this list and they must not drift:
// the Setor Tunai via Agen page (where she is choosing a desk to walk the cash
// to) and the Agen Terdekat page (where the list IS the page). Those are the
// same object seen from two distances, and when they were two separate blocks
// of JSX the ETA chip and the contact buttons were already diverging.
//
// One card with border-t between rows rather than a card per agent: this is a
// list to scan DOWN, nearest first, not a set of things to compare side by
// side. The rule is what makes "the next one" read as the next one.
//
// Nothing here leaves the prototype (CLAUDE.md §3). Whatsapp draws its own sent
// state on the row; the map is the caller's problem, and both callers hand it
// somewhere inside the flow rather than to a maps app the demo laptop may not
// have installed.

import { useState } from 'react'
import { Badge, Button } from '@/design-system/components'
import { ChevronDown, ChevronUp, MapPin, WhatsappLogo } from '@/design-system/icons'
import { type AgentLocation, NEAREST_AGENTS, kmShort } from './schedule'

export function AgentList({ onMap }: { onMap: (agent: AgentLocation) => void }) {
  return (
    <div className="rounded-16 border border-default bg-neutral-white">
      {NEAREST_AGENTS.map((agent, i) => (
        <AgentRow key={agent.id} agent={agent} first={i === 0} onMap={() => onMap(agent)} />
      ))}
    </div>
  )
}

function AgentRow({
  agent,
  first,
  onMap,
}: {
  agent: AgentLocation
  /** The top row carries no rule — the card's own edge is already there. */
  first: boolean
  onMap: () => void
}) {
  // The sent state, drawn ON the row rather than handing off to WhatsApp: a
  // real deep link throws the viewer out of the device frame mid-demo with no
  // way back, and the result is what the designer is reviewing anyway.
  const [sent, setSent] = useState(false)
  // The address truncates to one line and opens on the chevron. A kampung
  // address runs to three lines on a 360px phone, and five of them stacked
  // pushes the counter she actually wants off the bottom of the card.
  const [open, setOpen] = useState(false)

  return (
    <div className={`flex flex-col gap-12 p-12 ${first ? '' : 'border-t border-default'}`}>
      <div className="flex flex-col gap-2">
        {/* The subsidy label leads the row, above the name, because it is the
            one fact that can send her PAST a nearer counter — it has to be
            readable before she has finished reading which counter this is. */}
        {agent.freeAdmin ? (
          <span className="flex">
            <Badge intent="red">Gratis admin</Badge>
          </span>
        ) : null}
        <span className="text-16 font-bold text-default">{agent.place}</span>
        {/* How recently the till moved. The hours say when it is SUPPOSED to be
            open; this says whether anyone is actually behind it, and only one
            of those two survives contact with a Tuesday afternoon. */}
        <span className="text-14 text-caption">Aktif {agent.lastActive}</span>
      </div>

      <div className="flex flex-col gap-4">
        <span className="flex">
          <span className="rounded-8 bg-neutral-100 px-8 py-4 text-12 font-bold text-default">
            {agent.eta} ({kmShort(agent.distanceKm)})
          </span>
        </span>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex items-start gap-8 text-left"
        >
          <span className={`min-w-0 flex-1 text-14 text-default ${open ? '' : 'truncate'}`}>
            {agent.address}
          </span>
          <span className="shrink-0 pt-2 text-caption">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-8">
        <Button variant="outline" size="xs" onClick={() => setSent(true)}>
          <span className="flex items-center gap-4">
            <span className="text-green-500">
              <WhatsappLogo size={16} />
            </span>
            {sent ? 'Pesan terkirim' : 'Whatsapp'}
          </span>
        </Button>
        <Button variant="outline" size="xs" onClick={onMap}>
          <span className="flex items-center gap-4">
            <MapPin size={16} />
            Buka Peta
          </span>
        </Button>
      </div>
    </div>
  )
}
