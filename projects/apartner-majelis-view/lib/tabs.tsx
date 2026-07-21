'use client'

// The app's three destinations — the L0 surfaces this direction sits on top of.
//
//   Jadwal  — what to do now. The entry screen, and where a pelayanan starts.
//   Majelis — every group the BP carries, reachable off-schedule. This is the
//             way IN to the Majelis View roster: a BM asks about a group, or a
//             visit moves, and the schedule is not the thing sending her there.
//   KPI     — the four daily targets, checked rather than handed over.
//
// The bar shows on those three screens ONLY. Inside a pelayanan it is hidden: a
// visit is a three-stage sequence with its own sticky CTA, and offering "jump to
// KPI" mid-collection is how focused work turns back into browsing.

import { NavigationBar } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { IconCalendar, IconChart, IconUsers } from './icons'

export type TabId = 'today' | 'majelis-list' | 'kpi'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'today', label: 'Jadwal', icon: <IconCalendar /> },
  { id: 'majelis-list', label: 'Majelis', icon: <IconUsers /> },
  { id: 'kpi', label: 'KPI', icon: <IconChart /> },
]

export function TabBar({ active }: { active: TabId }) {
  const flow = useFlow()

  return (
    // Pinned to the bottom of the scrollport, edge to edge — the Screen
    // primitive owns the 16px page padding, so the bar negates it.
    <div className="sticky bottom-0 -mx-16 mt-auto">
      <NavigationBar
        items={TABS.map((tab) => ({
          id: tab.id,
          label: tab.label,
          icon: tab.icon,
          active: tab.id === active,
          onClick: () => {
            if (tab.id !== active) flow.go(tab.id)
          },
        }))}
      />
    </div>
  )
}
