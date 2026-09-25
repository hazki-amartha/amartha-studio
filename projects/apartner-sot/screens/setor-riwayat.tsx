'use client'

// Riwayat — what she has already put down today.
//
// A page rather than the sheet the older flow used, because this journey ENDS
// here: confirming a handover lands on it, and the first thing a BP wants after
// paying is to see the payment on a list with the earlier ones. It is also
// reachable from the header icon on every screen of the journey, for the same
// question asked mid-flow — "how much did I already settle?".
//
// Read-only. It is a record, not a step.

import { Button, NavigationHeader } from '@/design-system/components'
import { CheckCircleFill } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { AGENT } from '../lib/schedule'
import { useApp } from '../lib/store'
import { AppScreen, EmptyState, SectionTitle, StickyBar } from '../lib/ui'

/** How each road reads back on the record — the road, not the number. */
const VIA: Record<string, string> = {
  va: 'Melalui BRI Virtual Account',
  agent: `Melalui Agen ${AGENT.name}`,
}

export function SetorRiwayatScreen() {
  const flow = useFlow()
  const s = useApp()

  return (
    <AppScreen topBar={<NavigationHeader title="Riwayat" onBack={() => flow.back()} />}>
      <SectionTitle>Hari ini</SectionTitle>
      {s.settlements.length === 0 ? (
        <EmptyState
          title="Belum ada setoran hari ini"
          body="Setoran yang sudah dikirim akan tercatat di sini."
        />
      ) : (
        <div className="rounded-16 bg-neutral-white">
          {/* Newest first: the handover she just made is the one she came to
              check. */}
          {[...s.settlements].reverse().map((x, i) => (
            <div
              key={x.no}
              className={`flex items-center gap-12 p-12 ${i === 0 ? '' : 'border-t border-default'}`}
            >
              <span className="shrink-0 text-green-500">
                <CheckCircleFill size={20} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="truncate text-14 font-bold text-default">Setoran ke-{x.no}</span>
                <span className="truncate text-12 text-caption">{VIA[x.method]}</span>
                <span className="text-12 text-caption">{x.at}</span>
              </div>
              <span className="shrink-0 text-14 font-bold text-default">{rupiah(x.amount)}</span>
            </div>
          ))}
        </div>
      )}

      <StickyBar>
        <Button size="lg" className="w-full" onClick={() => flow.go('today')}>
          Selesai
        </Button>
      </StickyBar>
    </AppScreen>
  )
}
