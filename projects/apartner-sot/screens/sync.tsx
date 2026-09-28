'use client'

// Sinkronisasi — the full-screen sync from Profil's log-out flow (BP APP 2026
// Figma "Sync page"). Counts to 100%, sends what was waiting, and returns her
// to Profil still logged in.

import { useEffect, useState } from 'react'
import { ArrowsClockwise } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BP } from '../lib/schedule'
import { store } from '../lib/store'
import { Meter } from '../lib/ui'

export function SyncScreen() {
  const flow = useFlow()
  const [pct, setPct] = useState(0)

  useEffect(() => {
    if (pct >= 100) {
      store.sendPending()
      const t = setTimeout(() => flow.back(), 400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setPct((p) => Math.min(100, p + 10)), 200)
    return () => clearTimeout(t)
  }, [pct, flow])

  return (
    <Screen statusBar="none" chromeClassName="bg-primary-500" className="!bg-primary-500">
      <div className="flex flex-1 flex-col items-center justify-center gap-12 text-neutral-white">
        <span className="relative flex h-120 w-120 items-center justify-center">
          <span className="absolute inset-0 animate-spin rounded-full border-8 border-neutral-white border-t-transparent" />
          <span className="text-14 font-bold">{pct}%</span>
        </span>
        <span className="flex items-center gap-4 text-14 font-bold">
          <ArrowsClockwise size={16} />
          Sinkronisasi...
        </span>
      </div>
      <div className="flex flex-col items-center gap-8 pb-16 text-neutral-white">
        <span className="text-16 font-bold">amartha</span>
        <span className="text-12">{BP.version}</span>
        <span className="w-full">
          <Meter progress={pct} tone="muted" />
        </span>
      </div>
    </Screen>
  )
}
